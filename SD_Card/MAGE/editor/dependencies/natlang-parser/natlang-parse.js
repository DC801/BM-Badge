// "use strict";

// low budget module system, go! -SB
var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;
if (typeof module === 'object') {
	natlang.lex = require('./natlang-lex.js');
}

var log = false;

natlang.findLineAndCharNumbers = function (inputString, pos) {
	var substring = inputString.substring(0,pos);
	var splits = substring.split('\n')
	var lineNumber = splits.length;
	var charCount = splits[lineNumber - 1].length;
	var wholeString = inputString.split('\n')
	return {
		row: lineNumber,
		col: charCount+1,
		lineString: wholeString[lineNumber - 1],
		char: inputString[pos]
	};
};
natlang.getPosContext = function (inputString, pos, message) {
	var errorCoords = natlang.findLineAndCharNumbers(inputString, pos);
	var arrow = '~'.repeat(errorCoords.col) + '^';
	var lineString = errorCoords.lineString.replace(/\t/g,' ');
	var message
		= `\n╓ Line ${errorCoords.row}:${errorCoords.col}: ${message}`
		+ '\n║ ' + `${lineString}`
		+ '\n╙' + arrow
	return message;
};
natlang.printParseMessage = function (inputString, pos, message, messageType) {
	var fancyMessage = natlang.getPosContext(inputString, pos, message);
	var print;
	if (messageType === "error") {
		print = console.error;
	} else if (messageType === "warning") {
		print = console.warn;
	} else {
		print = console.log;
	}
	print(fancyMessage);
};

natlang.makeParseTrees = function (flatTrees) {
	flatTrees = flatTrees || {};
	var result = {};
	Object.keys(flatTrees).forEach(function (treeName) {
		flatTrees[treeName].forEach(function (branch) {
			result[treeName] = result[treeName] || {
				treeName: treeName
			};
			var refs = [ result[treeName] ];
			var newRefs = [];
			var patternWords = branch.pattern.split(' ');
			var whatDo = branch.onMatch;
			// DO IT
			patternWords.forEach(function (word) {
				var captureType;
				var captureLabel;
				var value;
				if (word[0] === "$" && word.includes(":")) {
					var wordSplits = word.split(':')
					captureType = wordSplits[1];
					captureLabel = wordSplits[0].substring(1);
				} else if (word[0] === "?") {
					newRefs = refs.slice();
					value = word.substring(1);
				} else {
					value = word;
				}
				refs.forEach(function (ref) {
					ref.next = ref.next || [];
					var foundRef = ref.next.find(function (item) {
						var literal = item.value && item.value === value;
						var capture = item.capture
							&& item.capture.type === captureType
							&& item.capture.label === captureLabel;
						return literal || capture;
					})
					if (!foundRef) {
						var insert = { next: [] };
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
						var nextRef = ref.next.find(function (item) {
							var literal = item.value && item.value === value;
							var capture = item.capture
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
			refs.forEach(function (ref) {
				ref.function = whatDo;
			})
			
		})
	})
	return result;
};

natlang.prepareConfig = function (config) {
	if (!config.trees) {
		throw new Error("Parser config: Config object missing \"trees\" entry!");
	}
	if (!config.blocks) {
		throw new Error("Parser config: Config object missing \"blocks\" entry!");
	}
	if (!config.capture) {
		throw new Error("Parser config: Config object missing \"capture\" entry!");
	}
	var parseTrees = natlang.makeParseTrees(config.trees);
	var macros = config.macros || [];
	var flatMacros = [];
	if (Array.isArray(macros)) {
		flatMacros = macros.map(function (item, index) {
			if (!item.name) {
				item.name = "macro" + index;
			}
			return item;
		})
	} else {
		flatMacros = Object.keys(macros).map(function (name) {
				macros[name].name = name;
				return macros[name];
			})
	}
	return {
		parseTrees: parseTrees,
		blocks: config.blocks,
		capture: config.capture,
		macros: flatMacros
	};
};

natlang.opLookup = {
	'SET': "SET",
	'set': "SET",
	'=': "SET",
	'ADD': "ADD",
	'add': "ADD",
	'+': "ADD",
	'SUB': "SUB",
	'sub': "SUB",
	'-': "SUB",
	'DIV': "DIV",
	'div': "DIV",
	'/': "DIV",
	'MUL': "MUL",
	'mul': "MUL",
	'*': "MUL",
	'MOD': "MOD",
	'mod': "MOD",
	'%': "MOD",
	'RNG': "RNG",
	'rng': "RNG",
	'?': "RNG",
};

natlang.decayTo = {
	bareword: function (token) {
		if (token.type === "bareword") {
			return token.value;
		} else if (token.barewordValue) {
			return token.barewordValue;
		} else { return undefined; }
	},
	operator: function (token) {
		var result = token.type === "operator" ? token.value : undefined;
		if (!result) {
			result = natlang.opLookup[token.value]; // ???
		}
		return result;
	},
	color: function (token) {
		return token.type === "color" ? token.value : undefined;
	},
	boolean: function (token) {
		return token.type === "boolean" ? token.value : undefined;
	},
	quotedString: function (token) {
		return token.type === "quotedString" ? token.value : undefined;
	},
	number: function (token) {
		return token.type === "number" ? token.value : undefined;
	},
	duration: function (token) {
		return token.type === "duration" || token.type === "number"
			? token.value : undefined;
	},
	distance: function (token) {
		return token.type === "distance" || token.type === "number"
			? token.value : undefined;
	},
	quantity: function (token) {
		return token.type === "quantity" || token.type === "number"
			? token.value : undefined;
	},
	string: function (token) {
		var bareWord = natlang.decayTo.bareword(token);
		if (bareWord) {
			return bareWord;
		}
		if (token.type === "quotedString") {
			return token.value;
		}
		return undefined;
	},
	
};

natlang.tryBranch = function (tokens, tokenPos, branch) {
	var report = {
		success: false,
		captures: {},
		thenDo: null,
		tokenCount: 0
	};
	var reportCheckpoint;
	var ref = branch;
	while (ref.next && ref.next.length) {
		var foundTwigMatch = false;
		var token = tokens[tokenPos];
		if (!token) {
			if (!reportCheckpoint) {
				if (log) { console.log('Attempted to parse token out of bounds.'); }
			}
			break;
		}
		// LITERAL VALUE PASS (can't Array.filter; this changes index!!)
		for (var index = 0; index < ref.next.length; index++) {
			var testTwig = ref.next[index];
			if (testTwig.value !== undefined) { // (value might be literally `false`)??
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
			for (var index = 0; index < ref.next.length; index++) {
				var testTwig = ref.next[index];
				if (testTwig.capture) { // then its type is variable
					var captureType = testTwig.capture.type;
					var captureMatch = null;
					if (token.type === captureType) {
						captureMatch = token.value;
					}
					if (captureMatch === null) {
						var decayedValue = natlang.decayTo[captureType](token);
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
			var expected = ref.next
				.map(function (item) {
					if (item.value) {
						return item.value;
					}
					if (item.capture) {
						return `$${item.capture.label}:${item.capture.type}`;
					}
					throw new Error("Your AST probably has a null word in it! (HINT: patterns are split by spaces (lazily) when added to the tree, so make sure there are no double spaces in there!!");
				}).map(function (item) {
					return `"${item}"`;
				})
			report.currentTwig = ref;
			report.currentToken = token;
			report.found = token.value;
			var cutOff = 10
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

var regexish = {
	"*": { multipleOkay: true, zeroOkay: true},
	"+": { multipleOkay: true, zeroOkay: false},
	"?": { multipleOkay: false, zeroOkay: true},
	"literal": { multipleOkay: false, zeroOkay: false},
};

natlang.parse = function (rawConfig, inputString, fileName) {
	// obj for branch patterns and their behavior when matched with input
	var config = natlang.prepareConfig(rawConfig);

	/* ----------------- STATE OBJECT ----------------- */

	var state = {
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

	state.makeAutoIdentifierName = function () {
		// for anonymous dialogs and serial dialogs
		var pos = state.tokens[state.curTokenIndex].pos;
		var coords = natlang.findLineAndCharNumbers(state.inputString, pos);
		return state.fileName+':'+coords.row +':'+coords.col;
	};

	// captures
	state.clearCaptures = function () {
		state.captures = {};
	};
	state.processCaptures = function (captureType, args) {
		if (!config.capture[captureType]) {
			var message = natlang.getPosContext(
				state.inputString,
				state.tokens[state.curTokenIndex].pos,
				"Parser: No 'capture' function found for " + captureType
			)
			throw new Error(message);
		}
		config.capture[captureType](state, args);
	};

	// inserts + final
	state.replaceValue = function (type, prop, value) {
		state[type][prop] = state[type][prop] || value;
		state[type][prop] = value;
		return state[type][prop];
	};
	state.replaceValueDeep = function (type, prop, subprop, value) {
		state[type][prop] = state[type][prop] || {};
		state[type][prop][subprop] = value;
		return state[type][prop][subprop];
	};
	state.applyProperties = function (type, prop, args) {
		state[type][prop] = state[type][prop] || {};
		Object.assign(
			state[type][prop],
			args
		);
		return state[type][prop];
	},
	state.pushNew = function (type, prop, value) {
		state[type][prop] = state[type][prop] || [];
		state[type][prop].push(value);
		return state[type][prop];
	};
	state.clearInserts = function (prop) { // string or array ok
		// will zero the contents of the insert while preserving the value type (=> {}, not undefined)
		var names = typeof prop === "string"
			? [ prop ]
			: prop
		names.forEach(function (name) {
			if (typeof state.inserts[name] === "string") {
				state.inserts[name] = null;
			} else if (Array.isArray(state.inserts[name])) {
				state.inserts[name] = [];
			} else if (typeof state.inserts[name] === "object") {
				state.inserts[name] = {};
			} else {
				// undefined should do nothing
			}
		})
	}

	// block management
	state.startBlock = function (blockName) {
		if (log) { console.log("state.startBlock: Starting the block named " + blockName); }
		if (config.blocks[blockName].onOpen) {
			config.blocks[blockName].onOpen(state);
		}
		state.blockStack.unshift(blockName);
		state.blockPos = 0;
		state.blockLooping = false;
	};
	state.endBlock = function () {
		var blockName = state.blockStack.shift();
		var blockLabel = blockName ? blockName : "[block name missing]";
		if (log) { console.log("Closing block '" + blockLabel + "'..."); }
		state.blockPos = 0;
		state.blockLooping = false;
		state.bestTry = null;
		state.bestTryLength = 0,
		state.lastMatch = {
			blockName: '',
			blockPos: 0,
		};
		var blockInfo = config.blocks[blockName];
		if (blockInfo) {
			if (blockInfo.onClose) {
				if (log) { console.log(blockLabel + "'s onClose function found! Doing it now..."); }
				blockInfo.onClose(state);
			} else {
				console.warn("Parser: Was I supposed to find a block 'onClose' function for " + blockLabel + "? Because I didn't! (Maybe you didn't want one for this block?) Proceeding anyway....");
			}
		} else {
			var message = natlang.getPosContext(
				state.inputString,
				state.tokens[state.curTokenIndex].pos,
				"Parser: Could not find block info for a block named " + blockLabel
			)
			throw new Error(message);
		}
	};

	/* ----------------- TOKEN PREP ----------------- */

	// Acquire tokens
	var lex = natlang.lex(inputString);
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
	config.macros.forEach(function (macro) {
		try {
			var processedTokens = macro.process(state.tokens);
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
		var blockName = state.blockStack[0];
		var blockInfo = config.blocks[blockName];
		if (!blockInfo) {
			var message = natlang.getPosContext(
				state.inputString,
				state.tokens[state.curTokenIndex].pos,
				`Parser: No block info found for: "${blockName}"`
			)
			throw new Error(message);
		}
		var blockBranches = blockInfo.branches;
		if (!blockBranches) {
			var message = natlang.getPosContext(
				state.inputString,
				state.tokens[state.curTokenIndex].pos,
				`Parser: No branches found for: "${blockName}"`
			)
			throw new Error(message);
		}
		if (log) { console.log(`Processing block "${blockName}" ...`); }
		if (
			blockInfo.closeChar
			&& blockInfo.closeChar === state.tokens[state.curTokenIndex].value
				// TODO: check for "operator" type specifically?
		) {
			if (log) { console.log("But wait! We've hit its end char: " + blockInfo.closeChar); }
			state.curTokenIndex += 1;
			state.endBlock();
			continue bigloop;
		}
		var curBlockBranch = blockBranches[state.blockPos];
		if (!curBlockBranch) { // if there's no branch at this branch index
			if (blockInfo.branchesLoop) { // if branches can loop...
				if (state.blockLooping) { // ...avoid infinite loop
					break bigloop;
				} else { // ...otherwise try to loop
					if (log) { console.log("Trying a loop (ONCE)"); }
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
		var curBranchName = curBlockBranch.branch;
		var tryBranch = natlang.tryBranch(
			state.tokens,
			state.curTokenIndex,
			config.parseTrees[curBranchName]
		);
		// Figuring out how many times it must occur, and if it's okay to skip
		var count = curBlockBranch.count ? curBlockBranch.count : "literal";
		var multipleOkay = regexish[count].multipleOkay;
		var zeroOkay = regexish[count].zeroOkay;
		if (tryBranch && tryBranch.success) { // branch matched
			if (log) {
				var contextMessage = natlang.getPosContext(
					state.inputString,
					state.tokens[state.curTokenIndex].pos,
					`Parsing as '${curBranchName}' (in block '${blockName}')`
				)
				console.log(contextMessage);
			}
			state.captures = tryBranch.captures;
			if (log) { console.log("Branch success! Doing its 'thenDo'"); }
			tryBranch.thenDo(state);
			if (log) { console.log("(Did the state change? I hope it did:)"); }
			if (log) { console.log({
				final: state.final,
				inserts: state.inserts,
				captures: state.captures
			}); }
			state.blockLooping = false; // because this loop was successful
			state.bestTry = null;
			state.bestTryLength = 0;
			state.lastMatch.blockName = blockName;
			state.lastMatch.blockPos = state.blockPos;
			// state.matchCheckpoint = null;
			state.curTokenIndex += tryBranch.tokenCount;
			if (!multipleOkay) {
				state.blockPos += 1;
				if (log) { console.log(`This branch (${curBranchName}) can't repeat. Moving on to the next branch index in the block....`); }
				continue bigloop
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
				if (log) { console.log(`This branch (${curBranchName}) didn't match, but it's okay to skip it. Moving from ${state.blockPos} -> ${state.blockPos +1}`); }
				state.blockPos += 1;
				continue bigloop;
			} else if (
				state.lastMatch.blockName === blockName
				&& state.lastMatch.blockPos === state.blockPos
			) {
				if (log) { console.log(`This branch (${curBranchName}) isn't okay to skip outright, but we did match it already so we can move on. Moving from ${state.blockPos} -> ${state.blockPos + 1}`); }
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
		if (log) { console.log("FINAL STATE:"); }
		return state.final;
	}
	
	// failure
	if (state.bestTry) {
		var blockInfo = config.blocks[state.blockStack[0]];
		var branchInfo = blockInfo.branches[state.blockPos];
		var message
			= branchInfo && branchInfo.failMessage
			? branchInfo.failMessage
			: "Parser: Unexpected token "
				+ state.bestTry.found
				+ " (expected "
				+ state.bestTry.expected
				+ ")";

		var errorToken = state.tokens[state.curTokenIndex + state.bestTry.tokenCount];
		var contextMessage = natlang.getPosContext(
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
		var message = `Parser: Unable to identify branch! (Block: '${state.blockStack[0]}')`;
		var contextMessage = natlang.getPosContext(
			state.inputString,
			state.tokens[state.curTokenIndex].pos,
			message
		)
		throw new Error(contextMessage);
	}
};

if (typeof module === 'object') {
	module.exports = natlang
}
