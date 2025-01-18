import lex from "./mathlang-lex.mjs"
import language from "./mathlang-language.mjs"

const { tree, onMatch } = language;

const testInputString = `
include!("header.mgs")

$trombones = 76;
/* comment */
$player = "%PLAYER%";

add serial_dialog settings {
	wrap 88
}
add dialog settings {
	default {
		alignment BL
	}
	label PLAYER {
		alignment BR
		entity "%PLAYER%"
	}
	entity Bob {
		name "Real Bob"
		portrait old_man
	}
}
dialog restaurant {
	entity "%PLAYER%" "Hello!"
	Bob "Oh, um, hi."
	entity Dennis "What'll it be?"
	> "Oh, uh, let me take a look at the menu first." = scriptMenu
	> "I'll have the usual!" = scriptRegularCustomer
}
`;


const findLineAndCharNumbers = (input, pos) => {
	const splits = input.substring(0,pos).split('\n')
	const charCount = splits[splits.length - 1].length;
	const wholeString = input.split('\n')
	const lineNumber = splits.length;
	return {
		row: lineNumber,
		col: charCount+1,
		lineString: wholeString[lineNumber - 1],
		char: input[pos]
	};
};
const getPosContext = (inputString, pos, message) => {
	const errorCoords = findLineAndCharNumbers(inputString, pos);
	const arrow = '~'.repeat(errorCoords.col) + '^';
	const lineString = errorCoords.lineString.replace(/\t/g,' ');
	const newMessage
		= `\n╓ Line ${errorCoords.row}:${errorCoords.col}: ${message}`
		+ '\n║ ' + `${lineString}`
		+ '\n╙' + arrow
	return newMessage;
};
const printParseMessage = (inputString, pos, message, messageType) => {
	const fancyMessage = getPosContext(inputString, pos, message);
	if (messageType === "error") {
		console.error(fancyMessage);
	} else if (messageType === "warning") {
		console.warn(fancyMessage);
	} else {
		console.log(fancyMessage);
	}
};
const decayTo = {
	EOF: token => token.type === 'EOF',
	bareword: token => {
		if (token.type === "bareword") return token.value;
		if (token.barewordValue) return token.barewordValue;
		return false;
	},
	operator: token => token.type === "operator" ? token.value : false,
	color: token => token.type === "color" ? token.value : false,
	boolean: token => token.type === "boolean" ? token.value : false,
	quoted_string: token => token.type === "quoted_string" ? token.value : false,
	number: token => token.type === "number" ? token.value : false,
	duration: token => token.type === "duration" || token.type === "number" ? token.value : false,
	distance: token => token.type === "distance" || token.type === "number" ? token.value : false,
	quantity: token => token.type === "quantity" || token.type === "number" ? token.value : false,
	constant: token => token.type === "constant" ? token.value : false,
	string: token => {
		const bareWord = decayTo.bareword(token);
		if (bareWord) return bareWord;
		if (token.type === "quoted_string") return token.value;
		return false;
	},
};

const verbose = false;
const debugLog = (string) => { if (verbose) console.log(string); };



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
			// // keeping track of these may make error handling easier, as it'll be more clear when certain kinds of broken things have terminated to try starting a fresh pattern
			// crawlState.nodes.push({
			// 	node: token.type,
			// 	value: token.value,
			// 	tokenPos,
			// 	ignorable: true,
			// });
			// // never mind actually... if this ends up needing to happen, sorry about everything I did that will end up breaking it
			advanceToken();
			continue;
		}
		const rep = twig.rep;
		const zeroOkay = rep === '*' || rep === '?';
		const multipleOkay = rep === '*' || rep === '+';
		if (twig.toCollection) {
			const collex = crawlState.collections;
			collex[twig.toCollection] = collex[twig.toCollection] || {};
			collex[twig.toCollection][token.value] = true;
		}
		if (twig.type === 'literal') {
			if (twig.value === token.value) {
				const twigLabel = twig.label;
				const unusedLabelExists = crawlState.unusedLabels.length > 0;
				if (twigLabel || unusedLabelExists) {
					const label = twig.label
						? twig.label
						: crawlState.unusedLabels.pop();
					crawlState.captures.unshift({
						pattern: branchName,
						label: label,
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
						expected: `'${twig.value}'`,
						crawlState,
					};
				}
			}
			continue;
		}
		if (twig.type === 'capture') {
			const decayedValue = decayTo[twig.value](token);
			if (decayedValue) {
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
						expected: `${twig.value}`,
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

let printToken = '';
let printStack = [];
const tryBranches = (state, origCrawlState, branchName) => {
	const tree = state.tree;
	const branches = tree[branchName];
	const startPos = origCrawlState.tokenPos;
	const crawlState = JSON.parse(JSON.stringify(origCrawlState)); 
	const successes = [];
	const fails = [];
	const newPrintToken = state.tokens[startPos].value;
	if (newPrintToken !== printToken) {
		printToken = newPrintToken;
		debugLog (`\ttokens[${startPos}]: ${state.tokens[startPos].value}`);
	}
	printStack.push(branchName);
	debugLog(`${printStack.join(' > ')}`);
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
		// debugLog('...Failed!');
		printStack.pop();
		fails.sort((a,b)=>b.crawlState.tokenPos - a.crawlState.tokenPos);
		const maxPos = fails[0].crawlState.tokenPos;
		const expected = fails
			.filter(item=>item.crawlState.tokenPos === maxPos)
			.map(item=>item.expected);
		const crawlError = JSON.parse(JSON.stringify(state.crawlError));
		if (maxPos === crawlError.bestPos) {
			state.crawlError.expected = crawlError.expected.concat(expected);
		}
		if (maxPos > crawlError.bestPos) {
			crawlError.bestPos = maxPos;
			crawlError.expected = expected;
			crawlError.message = `Error at '${printStack.join(' > ')}'`
			state.crawlError = crawlError;
		}
		return { // keeping the succeed/fail return values uniform for sanity's sake
			matched: false,
			pattern: branchName,
			expected,
			crawlState: {
				tokenPos: maxPos,
				collections: {},
				captures: [],
				unusedLabels: [],
				nodes: [],
			},
		};
	}
	debugLog('...Succeeded at ' + printStack.pop());
	if (successes.length > 1) {
		throw new Error ("Handle multiple matching patterns please!");
	} else {
		const success = successes[0];
		const newCrawlState = success.crawlState;
		Object.entries(newCrawlState.collections).forEach(entry=>{
			const [name, dict] = entry;
			const collex = state.collections;
			collex[name] = collex[name] || {};
			Object.keys(dict).forEach(value => {
				collex[name][value] = true;
			});
		})
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

const parseFile = (lexObject, tree, givenFileName) => {
	const fileName = givenFileName ? givenFileName : 'anon' + Math.floor(Math.random()*10000000000);
	let crawlState = {
		tokenPos: 0,
		// these should be empty when we're done:
		collections: {},
		captures: [],
		unusedLabels: [],
		nodes: [],
	};
	const state = { // state == file info
		fileName,
		plaintext: lexObject.plaintext,
		success: false, // whether the file parsing succeeded
		nodes: [], // the file nodes discovered
		// these will have no actual effect yet, and are still per-file, but now files can reference each other and build into more interdependent things
		collections: {}, // definitions are collected here to populate autocomplete (TODO)
		warnings: [], // good things to know but non-breaking
		errors: [], // parsing might have still finished if there are errors, but some nodes will be broken so the scenario might be wonky
		tokens: lexObject.tokens, // still useful for error handling; you can get a token by its index (from a node) and look at the token pos within the file (char) to get the line/col to make error messages
		tree, // doesn't hurt to keep
		crawlError: {
			bestPos: 0,
			message: '',
			expected: [],
		},
	};

	// do the thing
	const triedAll = tryBranches(state, crawlState, 'document');
	state.success = triedAll.matched;
	state.crawlState = triedAll.crawlState;
	const crawlError = state.crawlError;
	const expected = [...new Set(state.crawlError.expected)];
	state.crawlError.message = `Expected: ${expected.join(', ')}`;
	if (!state.success) {
		state.errors.push({
			value: 'Parse error',
			message: crawlError.message,
			pos: crawlError.bestPos,
		});
	}

	// smooth things out
	state.nodes.forEach(node=>{
		// so that file nodes can be referenced and copypasta'd while preserving error messages
		node.fileName = fileName;
	});

	// review errors and warnings
	triedAll.crawlState.captures.forEach(capture => {
		state.errors.push({
			value: 'Orphaned capture',
			message: `Found orphaned capture at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
			pos: capture.pos,
		});
	});
	triedAll.crawlState.unusedLabels.forEach(capture => {
		state.errors.push({
			value: 'Unused capture label',
			message: `Found unused capture label at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
			pos: capture.pos,
		});
	});

	// done!
	return state;
};

const exampleLex = lex(testInputString);
const testFile = parseFile(exampleLex, tree);

if (testFile.success) {
	console.log(JSON.stringify(testFile.nodes, null, '  '));
} else {
	testFile.errors.forEach(error=>{
		const charPos = testFile.tokens[error.pos].pos;
		printParseMessage(testFile.plaintext, charPos, error.message);
	});
}

console.log('break');
