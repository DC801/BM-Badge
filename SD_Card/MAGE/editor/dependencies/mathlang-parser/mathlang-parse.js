// `captures` and `unlabeledCaptures` use shift/unshift! Everything else uses pop/push!

const exampleLex = {
	completed: true,
	warnings: [],
	errors: [],
	tokens: [
		{ type: "bareword", rawValue: "include", value: "include", pos: 0, },
		{ type: "operator", rawValue: "!", value: "!", pos: 7, },
		{ type: "operator", rawValue: "(", value: "(", pos: 8,},
		// { type: "quoted_string", rawValue: "\"header.mgs\"", value: "header.mgs", pos: 9, },
		{ type: "operator", rawValue: ")", value: ")", pos: 21, },
		{ type: "newline", rawValue: "\n\n", value: "\n\n", pos: 22, ignorable: true, },
		{ type: "constant", rawValue: "$trombones", value: "$trombones", pos: 24, },
		{ type: "operator", rawValue: "=", value: "=", pos: 35, },
		{ type: "number", rawValue: "76", value: 76, pos: 37, },
		{ type: "operator", rawValue: ";", value: ";", pos: 39, },
		{ type: "newline", rawValue: "\n", value: "\n", pos: 40, ignorable: true, },
		{ type: "constant", rawValue: "$player", value: "$player", pos: 41, },
		{ type: "operator", rawValue: "=", value: "=", pos: 49, },
		{ type: "quoted_string", rawValue: "\"%PLAYER%\"", value: "%PLAYER%", pos: 51, },
		{ type: "operator", rawValue: ";", value: ";", pos: 61, },
		{ type: "EOF", rawValue: "EOF", value: "EOF", pos: 62, },
	],
};

const exampleTree = {
	document: [
		[
			{ rep: "*", type: "lookup", value: "root", original: "@root*", },
			{ rep: "", type: "capture", value: "EOF", original: "$EOF", },
		],
	],
	root: [
		[
			{ rep: "", type: "lookup", value: "include_macro", original: "@include_macro", },
		],
		[
			{ rep: "", type: "lookup", value: "constant_assignment", original: "@constant_assignment", },
		],
	],
	include_macro: [
		[
			{ rep: "", type: "literal", value: "include", original: "'include'", },
			{ rep: "", type: "literal", value: "!", original: "'!'", },
			{ rep: "", type: "literal", value: "(", original: "'('", },
			{ rep: "?", type: "capture", value: "quoted_string", label: "fileName", original: "$quoted_string:fileName?", },
			{ rep: "", type: "literal", value: ")", original: "')'", },
		],
	],
	constant_assignment: [
		[
			{ rep: "", type: "capture", value: "constant", label: "constantName", toCollection: "constantNames", original: 	"$constant:constantName>constantNames", },
			{ rep: "", type: "literal", value: "=", original: "'='", },
			{ rep: "", type: "lookup", value: "constant_value", label: "constantValue", original: 	"@constant_value:constantValue", },
			{ rep: "", type: "literal", value: ";", original: "';'", },
		],
	],
	constant_value: [
		[
			{ rep: "", type: "capture", value: "constant", autoComplete: "constantNames", original: "$constant<constantNames", },
		],
		[
			{ rep: "", type: "capture", value: "boolean", original: "$boolean", },
		],
		[
			{ rep: "", type: "capture", value: "quoted_string", original: "$quoted_string", },
		],
		[
			{ rep: "", type: "capture", value: "bareword", original: "$bareword", },
		],
		[
			{ rep: "", type: "capture", value: "number", original: "$number", },
		],
		[
			{ rep: "", type: "capture", value: "duration", original: "$duration", },
		],
		[
			{ rep: "", type: "capture", value: "distance", original: "$distance", },
		],
		[
			{ rep: "", type: "capture", value: "color", original: "$color", },
		],
		[
			{ rep: "", type: "capture", value: "quantity", original: "$quantity", },
		],
		[
			{ rep: "", type: "lookup", value: "enum_alignment", original: "@enum_alignment", },
		],
	],
	enum_alignment: [
		[
			{ rep: "", type: "literal", value: "TR", original: "'TR'", },
		],
		[
			{ rep: "", type: "literal", value: "BR", original: "'BR'", },
		],
		[
			{ rep: "", type: "literal", value: "TL", original: "'TL'", },
		],
		[
			{ rep: "", type: "literal", value: "BL", original: "'BL'", },
		],
		[
			{ rep: "", type: "literal", value: "TOP_RIGHT", original: "'TOP_RIGHT'", },
		],
		[
			{ rep: "", type: "literal", value: "BOTTOM_RIGHT", original: "'BOTTOM_RIGHT'", },
		],
		[
			{ rep: "", type: "literal", value: "TOP_LEFT", original: "'TOP_LEFT'", },
		],
		[
			{ rep: "", type: "literal", value: "BOTTOM_LEFT", original: "'BOTTOM_LEFT'", },
		],
	],
};
const onMatch = {
	document: state => {
		const capture = state.unlabeledCaptures.shift();
		if (capture?.value !== 'EOF') throw new Error("No EOF at end of file");
	},
	include_macro: (state, startPos) => {
		if (
			state.captures[0]?.pattern === 'include_macro'
			&& state.captures[0]?.label === 'fileName'
		) {
			const capture = state.captures.shift();
			state.nodes.push({
				node: 'include_macro',
				value: capture.value,
				tokenPos: capture.pos,
				ignorable: false,
			})
		} else {
			// Looks like there wasn't a filename to include. Should be a warning, not an error.
			state.warnings.push({
				value: 'Include macro lacks a filename',
				message: 'Nothing will break, but this is useless in practice. Maybe put a file name in there!',
				pos: state.pos,
			});
			// including it as an ignorable node makes it easier (probably?) to involve in suggestions and red squiglies
			state.nodes.push({
				node: 'include_macro',
				value: '',
				tokenPos: startPos,
				ignorable: true,
			})

		}
	},
}

const exampleTwig = { rep: "", type: "literal", value: "include", original: "'include'", };
const exampleToken = { type: "bareword", rawValue: "include", value: "include", pos: 0, };

const tryBranchReturns =  {
	matched: true, // whether the branch pattern matched the tokens
	expected: '', // if no match, the token the branch wanted next
	startPos: NaN, // token index where the branch tried to start matching
	pos: NaN, // if no match, the non-match token index
	nextPos: NaN, // where the tokens are to pick up again with the subsequent branch match attempt
	// in the event of an error, this'll be the same as `pos`, but this still means trying from here, since this token may belong to a different pattern and the previous one just wasn't finished being typed yet or something
}
const tryBranch = (state, startPos, branchName, branchIndex) => {
	const tokens = state.tokens;
	const captures = state.captures;
	const unlabeledCaptures = state.unlabeledCaptures;
	const branch = state.tree[branchName]?.[branchIndex];
	let twigPos = 0;
	let tokenPos = startPos;
	let repeated = false;
	const advanceTwig = () => {
		twigPos += 1;
		repeated = false;
	}
	const advanceToken = () => {
		tokenPos += 1;
	}
	while (twigPos < branch.length && tokenPos < tokens.length) {
		const token = tokens[tokenPos];
		const twig = branch[twigPos];
		if (token.ignorable) {
			// keeping track of these may make error handling easier, as it'll be more clear when certain kinds of broken things have terminated to try starting a fresh pattern
			state.nodes.push({
				node: token.type,
				value: token.value,
				tokenPos,
				ignorable: true,
			});
			advanceToken();
			continue;
		}
		const rep = twig.rep;
		const zeroOkay = rep === '*' || rep === '?';
		const multipleOkay = rep === '*' || rep === '+';
		if (twig.type === 'literal') {
			if (twig.value === token.value) {
				if (twig.label) {
					captures.unshift({
						pattern: branchName,
						label: twig.label,
						value: twig.value,
						pos: tokenPos,
					});
				}
				advanceToken();
				advanceTwig();
			} else {
				if (
					(multipleOkay && repeated)
					|| zeroOkay
				) {
					advanceTwig();
				} else {
					return {
						matched: false,
						expected: twig.value,
						startPos,
						pos: tokenPos,
						nextPos: tokenPos,
					};
				}
			}
			continue;
		}
		if (twig.type === 'capture') {
			if (twig.value === token.type) {
				if (twig.label) {
					captures.unshift({
						pattern: branchName,
						label: twig.label,
						value: token.value,
						pos: tokenPos,
					});
				} else {
					unlabeledCaptures.unshift({
						value: token.value,
						pos: tokenPos,
					});
				}
				advanceToken();
				advanceTwig();
			} else {
				if (
					(multipleOkay && repeated)
					|| zeroOkay
				) {
					advanceTwig();
				} else {
					return {
						matched: false,
						expected: `'${twig.value}'`,
						startPos,
						pos: tokenPos,
						nextPos: tokenPos,
					};
				}
			}
			continue;
		}
		if (twig.type === 'lookup') {
			let lookedUp = tryBranches(
				state,
				tokenPos,
				twig.value,
			);
			if (lookedUp.matched) {
				if (unlabeledCaptures?.length && twig.label) {
					const uncaptured = unlabeledCaptures.shift();
					captures.unshift({
						pattern: lookedUp.pattern,
						label: twig.label,
						value: uncaptured.value,
						pos: uncaptured.pos,
					});
				}
				tokenPos = lookedUp.nextPos;
				if (multipleOkay) {
					repeated = true;
					// no twigPos advance
				} else {
					advanceTwig();
				}
				continue;
			}
			if (
				(multipleOkay && repeated)
				|| zeroOkay
			) {
				advanceTwig();
			} else {
				return {
					matched: false,
					startPos,
					expected: lookedUp.expected.join(', '),
					pos: lookedUp.pos,
					nextPos: lookedUp.nextPos,
				};
			}
		}
	}
	return {
		matched: true,
		expected: '',
		startPos,
		pos: tokenPos,
		nextPos: tokenPos,
	};
};

const tryBranchesReturn = {
	pattern: '', // name of the pattern as it appears in the tree
	matched: false, // whether one of the branches matched the tokens
	expected: [], // if no matches, a collection of the expected tokens for all the longest matches
	startPos: NaN, // token index where the branch tried to start matching
	pos: NaN, // if no matches, the best non-match token index
	nextPos: NaN, // where the tokens are to pick up again with the subsequent branches match attempt
	// in the event of an error, this'll be the same as `pos`, but this still means trying from here, since this token may belong to a different pattern and the previous one just wasn't finished being typed yet or something
}
const tryBranches = (state, startPos, branchName) => {
	const tree = state.tree;
	const branches = tree[branchName];
	const successes = [];
	const fails = [];
	for (let i = 0; i < branches.length; i++) {
		const triedBranch = tryBranch(state, startPos, branchName, i);
		if (triedBranch.matched) {
			successes.push(triedBranch);
			break; // don't waste time trying matches after you've got one from the set; mathlang patterns should be mutually exclusive, whereas in the original natlang they could be subsets of each other
			// keep it an array just in case though
		} else {
			fails.push(triedBranch);
		}
	}
	if (successes.length === 0) {
		fails.sort((a,b)=>b.nextPos - a.nextPos);
		const maxPos = fails[0];
		const expected = fails
			.filter(item=>item.nextPos === maxPos)
			.map(item=>item.expected);
		return { // keeping the succeed/fail return values uniform for sanity's sake
			pattern: branchName,
			matched: false,
			expected,
			startPos,
			pos: maxPos,
			nextPos: maxPos, // ...otherwise this one makes no sense to include
		};
	}
	if (successes.length > 1) {
		throw new Error ("Handle multiple matching patterns please!");
	} else {
		const success = successes[0];
		if (onMatch[branchName]) {
			onMatch[branchName](state, startPos);
		}
		return {
			pattern: branchName,
			matched: true,
			expected: [], // ...or this
			startPos,
			pos: success.pos, // ...or this
			nextPos: success.nextPos,
		};
	}
};

const parseFile = (tokens, tree, givenFileName) => {
	const fileName = givenFileName ? givenFileName : 'auto' + Math.floor(Math.random()*10000000000);
	const state = { // state == file info
		fileName,
		success: false, // whether the file parsing succeeded
		nodes: [], // the file nodes discovered
		// these will have no actual effect yet, and are still per-file, but now files can reference each other and build into more interdependent things
		collections: [], // definitions are collected here to populate autocomplete (TODO)
		warnings: [], // good things to know but non-breaking
		errors: [], // parsing might have still finished if there are errors, but some nodes will be broken so the scenario might be wonky
		tokens, // still useful for error handling; you can get a token by its index (from a node) and look at the token pos within the file (char) to get the line/col to make error messages
		tree, // doesn't hurt to keep
		captures: [], // there shouldn't be anything left in here, but generate an error if there is
		unlabeledCaptures: [], // there shouldn't be anything left in here, but generate an error if there is
	};

	// do the thing
	const triedAll = tryBranches(state, 0, 'document');
	state.success = triedAll.matched;

	// smooth things out
	state.nodes.forEach(node=>{
		node.fileName = fileName;
	});

	// review errors and warnings
	state.captures.forEach(capture => { // won't run if empty
		state.errors.push({
			value: 'Orphaned capture',
			message: `Found orphaned capture at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
			pos: capture.pos,
		});
	});
	state.unlabeledCaptures.forEach(capture => { // won't run if empty
		state.errors.push({
			value: 'Orphaned capture (without label)',
			message: `Found orphaned (unlabeled) capture at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
			pos: capture.pos,
		});
	});

	// done!
	return state;
};

const testFile = parseFile(exampleLex.tokens, exampleTree);
console.log(testFile);

console.log('break');
