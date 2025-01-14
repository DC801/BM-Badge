// "use strict";

// low budget module system, go! -SB
var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;
if (typeof module === 'object') {
	natlang.lex = require('./natlang-lex.js');
}

const verboseLog = false;
const debugLog = (message) => { if (verboseLog) console.log(message); }

natlang.findLineAndCharNumbers = (input, pos) => {
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
natlang.getPosContext = (input, pos, message) => {
	const errorCoords = natlang.findLineAndCharNumbers(input, pos);
	const arrow = '~'.repeat(errorCoords.col) + '^';
	const lineString = errorCoords.lineString.replace(/\t/g,' ');
	const newMessage
		= `\n╓ Line ${errorCoords.row}:${errorCoords.col}: ${message}`
		+ '\n║ ' + `${lineString}`
		+ '\n╙' + arrow
	return newMessage;
};
natlang.printParseMessage = (inputString, pos, message, messageType) => {
	const fancyMessage = natlang.getPosContext(inputString, pos, message);
	if (messageType === "error") {
		console.error(fancyMessage);
	} else if (messageType === "warning") {
		console.warn(fancyMessage);
	} else {
		console.log(fancyMessage);
	}
}

natlang.makeParseTrees = (flatTrees) => {
	flatTrees = flatTrees || {};
	const result = {};
	Object.keys(flatTrees).forEach(treeName => {
		flatTrees[treeName].forEach(branch => {
			result[treeName] = result[treeName] || {
				treeName: treeName
			};
			let refs = [ result[treeName] ];
			let newRefs = [];
			// DO IT
			branch.pattern.split(/\s+/g).forEach(rawWord => {
				const matches = rawWord.match(/(.+?)(<([a-z]+)>)?$/);
				const word = matches[1];
				// const colorType = matches[3];
				let captureType;
				let captureLabel;
				let value;
				if (word[0] === "$" && word.includes(":")) {
					const wordSplits = word.split(':')
					captureType = wordSplits[1];
					captureLabel = wordSplits[0].substring(1);
				} else if (word[0] === "?") {
					newRefs = refs.slice();
					value = word.substring(1);
				} else {
					value = word;
				}
				refs.forEach(ref => {
					ref.next = ref.next || [];
					const foundRef = ref.next.find(item => {
						const literal = item.value && item.value === value;
						const capture = item.capture
							&& item.capture.type === captureType
							&& item.capture.label === captureLabel;
						return literal || capture;
					})
					if (!foundRef) {
						const insert = { next: [] };
						if (captureType) {
							insert.capture = {
								label: captureLabel,
								type: captureType
							};
						} else if (value) {
							insert.value = value;
						}
						ref.next.push(insert)
						newRefs.push(insert);
					} else {
						const nextRef = ref.next.find(item => {
							const literal = item.value && item.value === value;
							const capture = item.capture
								&& item.capture.type === captureType
								&& item.capture.label === captureLabel;
							return literal || capture;
						})
						newRefs.push(nextRef);
					}
				})
				refs = newRefs;
				newRefs = [];
			})
			refs.forEach(ref => {
				ref.function = branch.onMatch // what do;
			})
			
		})
	})
	return result;
};

natlang.prepareConfig = config => {
	if (!config.trees) throw new Error("Parser config: Config object missing \"trees\" entry!");
	if (!config.blocks) throw new Error("Parser config: Config object missing \"blocks\" entry!");
	if (!config.capture) throw new Error("Parser config: Config object missing \"capture\" entry!");
	const parseTrees = natlang.makeParseTrees(config.trees);
	const macros = config.macros || [];
	let flatMacros = [];
	if (Array.isArray(macros)) {
		flatMacros = macros.map((item, i) => {
			if (!item.name) item.name = "macro" + i;
			return item;
		});
	} else {
		flatMacros = Object.keys(macros).map((name) => {
			macros[name].name = name;
			return macros[name];
		});
	}
	return {
		parseTrees,
		blocks: config.blocks,
		capture: config.capture,
		macros: flatMacros
	};
};

natlang.opLookup = {
	'SET': "SET", 'set': "SET", '=': "SET",
	'ADD': "ADD", 'add': "ADD", '+': "ADD",
	'SUB': "SUB", 'sub': "SUB", '-': "SUB",
	'DIV': "DIV", 'div': "DIV", '/': "DIV",
	'MUL': "MUL", 'mul': "MUL", '*': "MUL",
	'MOD': "MOD", 'mod': "MOD", '%': "MOD",
	'RNG': "RNG", 'rng': "RNG", '?': "RNG",
};

natlang.decayTo = {
	bareword: token => {
		if (token.type === "bareword") return token.value;
		if (token.barewordValue) return token.barewordValue;
		return undefined;
	},
	operator: token => {
		let result = token.type === "operator" ? token.value : undefined;
		if (!result) result = natlang.opLookup[token.value]; // ???
		return result;
	},
	color: token => token.type === "color" ? token.value : undefined,
	boolean: token => token.type === "boolean" ? token.value : undefined,
	quotedString: token => token.type === "quotedString" ? token.value : undefined,
	number: token => token.type === "number" ? token.value : undefined,
	duration: token => token.type === "duration" || token.type === "number" ? token.value : undefined,
	distance: token => token.type === "distance" || token.type === "number" ? token.value : undefined,
	quantity: token => token.type === "quantity" || token.type === "number" ? token.value : undefined,
	string: token => {
		const bareWord = natlang.decayTo.bareword(token);
		if (bareWord) return bareWord;
		if (token.type === "quotedString") return token.value;
		return undefined;
	},
	
};

natlang.tryBranch = (tokens, tokenPos, branch) => {
	const report = {
		success: false,
		captures: {},
		thenDo: null,
		tokenCount: 0
	};
	let reportCheckpoint;
	let ref = branch;
	while (ref.next && ref.next.length) {
		let foundTwigMatch = false;
		const token = tokens[tokenPos];
		if (!token) {
			if (!reportCheckpoint) debugLog('Attempted to parse token out of bounds.');
			break;
		}
		// LITERAL VALUE PASS (can't Array.filter; this changes index!!)
		for (let i = 0; i < ref.next.length; i++) {
			const testTwig = ref.next[i];
			if (testTwig.value !== undefined) {
				// then its type is literal
				if (testTwig.value === tokens[tokenPos].value) {
					// console.warn("  >>>> " + testTwig.value);
					ref = testTwig;
					report.tokenCount += 1;
					tokenPos += 1;
					foundTwigMatch = true;
					break;
				}
			}
		}
		// VARIABLE VALUE PASS (only if literal wasn't matched)
		if (!foundTwigMatch) {
			for (let i = 0; i < ref.next.length; i++) {
				const testTwig = ref.next[i];
				if (testTwig.capture) { // then its type is variable
					const captureType = testTwig.capture.type;
					let captureMatch = null;
					if (token.type === captureType) {
						captureMatch = token.value;
					}
					if (captureMatch === null) {
						const decayedValue = natlang.decayTo[captureType](token);
						if (decayedValue !== undefined) {
							captureMatch = decayedValue;
						}
					}
					if (captureMatch !== null) {
						// console.warn("  >>>> " + captureMatch);
						report.captures[testTwig.capture.label] = captureMatch;
						ref = testTwig;
						report.tokenCount += 1;
						tokenPos += 1;
						foundTwigMatch = true;
						break;
					}
				}
			}
		}
		// break if neither pass found a match
		if (!foundTwigMatch) {
			const expected = ref.next
				.map((item) => {
					if (item.value) return item.value;
					if (item.capture) return `$${item.capture.label}:${item.capture.type}`;
					throw new Error("Your AST probably has a null word in it!");
				})
				.map((item) => `"${item}"`);
			report.currentTwig = ref;
			report.currentToken = token;
			report.found = token.value;
			const cutOff = 10
			if (expected.length > cutOff) {
				expected = expected.slice(0,cutOff).concat(["…"]);
			}
			report.expected = expected.join(', ');
			break;
		}
		// at this point, a function means we're at a possible endpoint
		if (ref.function) {
			if (ref.next && ref.next.length) {
				// there's more possible twigs to try
				// so make a copy to fall back to if further twigs fail
				reportCheckpoint = JSON.parse(JSON.stringify(report));
				reportCheckpoint.success = true;
				reportCheckpoint.thenDo = ref.function;
			} else {
				// otherwise we win
				report.thenDo = ref.function;
				report.success = true;
			}
		}
		// loop continues if you've made it this far (and there's more twigs)
	}
	if (!report.success && reportCheckpoint) {
		return reportCheckpoint;
	}
	return report;
};

const regexish = {
	"*": { multipleOkay: true, zeroOkay: true},
	"+": { multipleOkay: true, zeroOkay: false},
	"?": { multipleOkay: false, zeroOkay: true},
	"literal": { multipleOkay: false, zeroOkay: false},
};

natlang.parse = (rawConfig, inputString, fileName) => {
	// obj for branch patterns and their behavior when matched with input
	const config = natlang.prepareConfig(rawConfig);

	/* ----------------- STATE OBJECT ----------------- */

	const state = {
		// input
		fileName: fileName || 'untitledFile',
		inputString: inputString,

		// token
		tokens: [],
		curTokenIndex: 0,

		// block state
		blockStack: [ "root" ],
		blockPos: 0,
		blockLooping: false,

		// other
		bestTry: null,
		bestTryLength: 0,
		lastMatch: {
			blockName: '',
			blockPos: 0,
		},

		// parsed / working data
		final: {},
		inserts: {},
		captures: {},
	};

	/* ----------------- STATE OBJECT MANAGEMENT ----------------- */

	state.makeAutoIdentifierName = () => {
		// for anonymous dialogs and serial dialogs
		const pos = state.tokens[state.curTokenIndex].pos;
		const coords = natlang.findLineAndCharNumbers(state.inputString, pos);
		return state.fileName+':'+coords.row +':'+coords.col;
	};

	// captures
	state.clearCaptures = () => {
		state.captures = {};
	};
	state.processCaptures = (captureType, args) => {
		if (!config.capture[captureType]) {
			const message = natlang.getPosContext(
				state.inputString,
				state.tokens[state.curTokenIndex].pos,
				"Parser: No 'capture' function found for " + captureType
			)
			throw new Error(message);
		}
		config.capture[captureType](state, args);
	};

	// inserts + final
	state.replaceValue = (type, prop, value) => {
		state[type][prop] = value;
		return state[type][prop];
	};
	state.replaceValueDeep = (type, prop, subprop, value) => {
		state[type][prop] = state[type][prop] || {};
		state[type][prop][subprop] = value;
		return state[type][prop][subprop];
	};
	state.applyProperties = (type, prop, args) => {
		state[type][prop] = state[type][prop] || {};
		Object.assign(
			state[type][prop],
			args
		);
		return state[type][prop];
	},
	state.pushNew = (type, prop, value) => {
		state[type][prop] = state[type][prop] || [];
		state[type][prop].push(value);
		return state[type][prop];
	};
	state.clearInserts = prop => { // string or array ok
		// will zero the contents of the insert while preserving the value type (=> {}, not undefined)
		const names = typeof prop === "string" ? [ prop ] : prop;
		names.forEach(name => {
			if (typeof state.inserts[name] === "string") {
				state.inserts[name] = null;
			} else if (Array.isArray(state.inserts[name])) {
				state.inserts[name] = [];
			} else if (typeof state.inserts[name] === "object") {
				state.inserts[name] = {};
			} else {
				// undefined should do nothing
			}
		});
	}

	// block management
	state.startBlock = (blockName) => {
		debugLog("state.startBlock: Starting the block named " + blockName);
		if (config.blocks[blockName].onOpen) {
			config.blocks[blockName].onOpen(state);
		}
		state.blockStack.unshift(blockName);
		state.blockPos = 0;
		state.blockLooping = false;
	};
	state.endBlock = () => {
		const blockName = state.blockStack.shift();
		const blockLabel = blockName ? blockName : "[block name missing]";
		debugLog("Closing block '" + blockLabel + "'...");
		state.blockPos = 0;
		state.blockLooping = false;
		state.bestTry = null;
		state.bestTryLength = 0,
		state.lastMatch = {
			blockName: '',
			blockPos: 0,
		};
		const blockInfo = config.blocks[blockName];
		if (blockInfo) {
			if (blockInfo.onClose) {
				debugLog(blockLabel + "'s onClose function found! Doing it now...");
				blockInfo.onClose(state);
			} else {
				console.warn("Parser: Was I supposed to find a block 'onClose' function for " + blockLabel + "? Because I didn't! (Maybe you didn't want one for this block?) Proceeding anyway....");
			}
		} else {
			const message = natlang.getPosContext(
				state.inputString,
				state.tokens[state.curTokenIndex].pos,
				"Parser: Could not find block info for a block named " + blockLabel
			)
			throw new Error(message);
		}
	};

	/* ----------------- TOKEN PREP ----------------- */

	// Acquire tokens
	const lex = natlang.lex(inputString);
	if (lex.success) {
		state.tokens = lex.tokens;
	} else {
		natlang.printParseMessage(
			inputString,
			lex.errors[0].pos,
			lex.errors[0].text,
			"error"
		)
		return lex;
	}

	// Macro passes
	config.macros.forEach(macro => {
		let processedTokens;
		try {
			processedTokens = macro.process(state.tokens);
		} catch (error) {
			error.macro = macro.name;
			throw error;
		}
		state.tokens = processedTokens;
		state.replaceValueDeep(
			"final",
			"passes",
			macro.name,
			macro.log(processedTokens)
		)
	});

	/* ----------------- THE REST OF THE OWL ----------------- */

	// THE THING
	bigloop: while (state.curTokenIndex < state.tokens.length) {
		const blockName = state.blockStack[0];
		const blockInfo = config.blocks[blockName];
		if (!blockInfo) {
			throw new Error(natlang.getPosContext(
				state.inputString,
				state.tokens[state.curTokenIndex].pos,
				`Parser: No block info found for: "${blockName}"`
			));
		}
		const blockBranches = blockInfo.branches;
		if (!blockBranches) {
			throw new Error(natlang.getPosContext(
				state.inputString,
				state.tokens[state.curTokenIndex].pos,
				`Parser: No branches found for: "${blockName}"`
			));
		}
		debugLog(`Processing block "${blockName}" ...`);
		if (
			blockInfo.closeChar
			&& blockInfo.closeChar === state.tokens[state.curTokenIndex].value
				// TODO: check for "operator" type specifically?
		) {
			debugLog("But wait! We've hit its end char: " + blockInfo.closeChar);
			state.curTokenIndex += 1;
			state.endBlock();
			continue bigloop;
		}
		const curBlockBranch = blockBranches[state.blockPos];
		if (!curBlockBranch) { // if there's no branch at this branch index
			if (blockInfo.branchesLoop) { // if branches can loop...
				if (state.blockLooping) { // ...avoid infinite loop
					break bigloop;
				} else { // ...otherwise try to loop
					debugLog("Trying a loop (ONCE)");
					state.blockLooping = true;
					state.blockPos = 0;
					if (blockInfo.onLoop) {
						blockInfo.onLoop(state);
					}
					continue bigloop;
				}
			} else { // if branches can't loop and we didn't hit the end char, IS END OF PARSE TIMES, END OF UNDERSTANDABLE INSTRUCTIONS IN INPUT
				break bigloop;
			}
		}
		// we have a legit branch to try
		const curBranchName = curBlockBranch.branch;
		const tryBranch = natlang.tryBranch(
			state.tokens,
			state.curTokenIndex,
			config.parseTrees[curBranchName]
		);
		// Figuring out how many times it must occur, and if it's okay to skip
		const count = curBlockBranch.count ? curBlockBranch.count : "literal";
		const multipleOkay = regexish[count].multipleOkay;
		const zeroOkay = regexish[count].zeroOkay;
		if (tryBranch?.success) { // branch matched
			debugLog(natlang.getPosContext(
				state.inputString,
				state.tokens[state.curTokenIndex].pos,
				`Parsing as '${curBranchName}' (in block '${blockName}')`
			));
			state.captures = tryBranch.captures;
			debugLog("Branch success! Doing its 'thenDo'");
			tryBranch.thenDo(state);
			debugLog("(Did the state change? I hope it did:)");
			debugLog({
				final: state.final,
				inserts: state.inserts,
				captures: state.captures
			});
			state.blockLooping = false; // because this loop was successful
			state.bestTry = null;
			state.bestTryLength = 0;
			state.lastMatch.blockName = blockName;
			state.lastMatch.blockPos = state.blockPos;
			// state.matchCheckpoint = null;
			state.curTokenIndex += tryBranch.tokenCount;
			if (!multipleOkay) {
				state.blockPos += 1;
				debugLog(`This branch (${curBranchName}) can't repeat. Moving on to the next branch index in the block....`);
				continue bigloop;
			}
			continue bigloop;
		} else { // branch didn't match
			if (tryBranch.tokenCount > state.bestTryLength || !state.bestTryLength) {
				// store the branch if it's better than nothing (or current)
				// (the text may have been trying to follow this pattern)
				state.bestTry = tryBranch;
				state.bestTryLength = tryBranch.tokenCount;
			}
			if (zeroOkay) {
				debugLog(`This branch (${curBranchName}) didn't match, but it's okay to skip it. Moving from ${state.blockPos} -> ${state.blockPos +1}`);
				state.blockPos += 1;
				continue bigloop;
			} else if (
				state.lastMatch.blockName === blockName
				&& state.lastMatch.blockPos === state.blockPos
			) {
				debugLog(`This branch (${curBranchName}) isn't okay to skip outright, but we did match it already so we can move on. Moving from ${state.blockPos} -> ${state.blockPos + 1}`);
				state.blockPos += 1;
				continue bigloop;
			} else if (!curBlockBranch.zeroOkay) {
				break bigloop;
			}
		}
	}

	/* ----------------- BIGLOOP OVER! ----------------- */

	// success
	if (state.curTokenIndex === state.tokens.length) { // success!
		debugLog("FINAL STATE:");
		return state.final;
	}
	
	// failure
	if (state.bestTry) {
		const blockInfo = config.blocks[state.blockStack[0]];
		const branchInfo = blockInfo.branches[state.blockPos];
		const message = branchInfo && branchInfo.failMessage
			? branchInfo.failMessage
			: `Parser: Unexpected token ${state.bestTry.found} (expected ${state.bestTry.expected})`;

		const errorToken = state.tokens[state.curTokenIndex + state.bestTry.tokenCount];
		const contextMessage = natlang.getPosContext(
			state.inputString,
			errorToken.pos,
			message
		)
		throw Object.assign(
			new Error(contextMessage),
			{
				pos: errorToken.pos,
				branch: curBranchName,
				fancyMessage: contextMessage,
			}
		);
	} else {
		const contextMessage = natlang.getPosContext(
			state.inputString,
			state.tokens[state.curTokenIndex].pos,
			`Parser: Unable to identify branch! (Block: '${state.blockStack[0]}')`
		)
		throw new Error(contextMessage);
	}
};

if (typeof module === 'object') {
	module.exports = natlang
}
