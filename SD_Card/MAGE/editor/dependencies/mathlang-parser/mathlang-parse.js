// `captures` and `unusedLabels` use shift/unshift! Everything else uses pop/push!

const exampleLex = {
	completed: true,
	warnings: [],
	errors: [],
	tokens: [
		{ type: "bareword", rawValue: "include", value: "include", pos: 0, },
		{ type: "operator", rawValue: "!", value: "!", pos: 7, },
		{ type: "operator", rawValue: "(", value: "(", pos: 8,},
		{ type: "quoted_string", rawValue: "\"header.mgs\"", value: "header.mgs", pos: 9, },
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
	// document: (state, crawlState) => {
	// 	const capture = crawlState.unlabeledCaptures.shift();
	// 	if (capture?.value !== 'EOF') throw new Error("No EOF at end of file");
	// },
	constant_assignment: (state, crawlState) => {
		if (crawlState.captures.length < 2) {
			state.warnings.push({
				value: 'Constant assignment error',
				message: 'A constant name or a constant value (or both) is missing!',
				pos: state.pos,
			});
		}
		const value = crawlState.captures.shift();
		const label = crawlState.captures.shift();
		if (value.pattern !== 'constant_value') throw new Error('constant_assignment capture error');
		if (label.pattern !== 'constant_assignment') throw new Error('constant_assignment capture error');
		state.nodes.push({
			node: 'constant_assignment',
			label: label.value,
			value: value.value,
			tokenPos: label.pos,
			ignorable: false,
		});
	},
	include_macro: (state, crawlState, startPos) => {
		if (
			crawlState.captures[0]?.pattern === 'include_macro'
			&& crawlState.captures[0]?.label === 'fileName'
		) {
			const capture = crawlState.captures.shift();
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

const tryBranch = (state, origCrawlState, branchName, branchIndex) => {
	const tokens = state.tokens;
	let crawlState = JSON.parse(JSON.stringify(origCrawlState)); 
	const branch = state.tree[branchName]?.[branchIndex];
	let twigPos = 0;
	let tokenPos = crawlState.tokenPos;
	let repeated = false;
	const advanceTwig = () => {
		twigPos += 1;
		repeated = false;
	}
	const advanceToken = () => {
		tokenPos += 1;
		crawlState.tokenPos += 1;
	}
	while (twigPos < branch.length && tokenPos < tokens.length) {
		const token = tokens[tokenPos];
		const twig = branch[twigPos];
		if (token.ignorable) {
			// keeping track of these may make error handling easier, as it'll be more clear when certain kinds of broken things have terminated to try starting a fresh pattern
			crawlState.nodes.push({
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
					crawlState.captures.unshift({
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
						crawlState,
					};
				}
			}
			continue;
		}
		if (twig.type === 'capture') {
			if (twig.value === token.type) {
				if (twig.label) {
					crawlState.captures.unshift({
						pattern: branchName,
						label: twig.label,
						value: token.value,
						pos: tokenPos,
					});
				} else if (crawlState.unusedLabels.length > 0) {
					crawlState.captures.unshift({
						pattern: branchName,
						label: crawlState.unusedLabels.shift(),
						value: token.value,
						pos: tokenPos,
					});
				} else if (token.type === 'EOF') {

				} else {
					throw new Error ('Capture found without label');
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
						crawlState,
					};
				}
			}
			continue;
		}
		if (twig.type === 'lookup') {
			if (twig.label) {
				crawlState.unusedLabels.push(twig.label);
			}
			let lookedUp = tryBranches(
				state,
				crawlState,
				twig.value,
			);
			if (lookedUp.matched) {
				crawlState = lookedUp.crawlState;
				tokenPos = crawlState.tokenPos;
				if (multipleOkay) {
					repeated = true;
					// no advanceTwig() here
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
					expected: lookedUp.expected.join(', '),
					crawlState,
				};
			}
		}
	}
	return {
		matched: true,
		expected: '',
		crawlState,
	};
};

const tryBranches = (state, origCrawlState, branchName) => {
	const tree = state.tree;
	const branches = tree[branchName];
	const startPos = origCrawlState.tokenPos;
	const crawlState = JSON.parse(JSON.stringify(origCrawlState)); 
	const successes = [];
	const fails = [];
	for (let i = 0; i < branches.length; i++) {
		const triedBranch = tryBranch(state, crawlState, branchName, i);
		if (triedBranch.matched) {
			successes.push(triedBranch);
			break; // don't waste time trying matches after you've got one from the set; mathlang patterns should be mutually exclusive, whereas in the original natlang they could be subsets of each other
			// keep it an array just in case though
		} else {
			fails.push(triedBranch);
		}
	}
	if (successes.length === 0) {
		fails.sort((a,b)=>b.crawlState.tokenPos - a.crawlState.tokenPos);
		const maxPos = fails[0];
		const expected = fails
			.filter(item=>item.crawlState.tokenPos === maxPos)
			.map(item=>item.expected);
		return { // keeping the succeed/fail return values uniform for sanity's sake
			matched: false,
			pattern: branchName,
			expected,
			crawlState: {
				tokenPos: maxPos,
				captures: [],
				unusedLabels: [],
				nodes: [],
			},
		};
	}
	if (successes.length > 1) {
		throw new Error ("Handle multiple matching patterns please!");
	} else {
		const success = successes[0];
		const newCrawlState = success.crawlState;
		newCrawlState.nodes.forEach(node=>{
			state.nodes.push(node); // or is concat more efficient?
		})
		newCrawlState.nodes = [];
		if (onMatch[branchName]) {
			onMatch[branchName](state, newCrawlState, startPos);
		}
		return {
			matched: true,
			pattern: branchName,
			expected: [],
			crawlState: newCrawlState,
		};
	}
};

const parseFile = (tokens, tree, givenFileName) => {
	const fileName = givenFileName ? givenFileName : 'auto' + Math.floor(Math.random()*10000000000);
	let crawlState = {
		tokenPos: 0,
		// these should be empty when we're done:
		captures: [],
		unusedLabels: [],
		nodes: [],
	};
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
	};

	// do the thing
	const triedAll = tryBranches(state, crawlState, 'document');
	state.success = triedAll.matched;
	state.crawlState = triedAll.crawlState;

	// smooth things out
	state.nodes.forEach(node=>{
		node.fileName = fileName;
	});

	// review errors and warnings
	triedAll.crawlState.captures.forEach(capture => { // won't run if empty
		state.errors.push({
			value: 'Orphaned capture',
			message: `Found orphaned capture at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
			pos: capture.pos,
		});
	});
	triedAll.crawlState.unusedLabels.forEach(capture => { // won't run if empty
		state.errors.push({
			value: 'Unused capture label',
			message: `Found unused capture label at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
			pos: capture.pos,
		});
	});

	// done!
	return state;
};

const testFile = parseFile(exampleLex.tokens, exampleTree);
console.log(testFile);

console.log('break');
