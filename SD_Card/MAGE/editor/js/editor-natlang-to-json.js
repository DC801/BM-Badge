// ws and eatWS return a position directly on success; all others return
// an object containing (at least) a newPosition property (or false
// upon failure)

patternParse = {
	ws: function (inputString, pos) {
		pos = pos || 0;
		if (
			inputString[pos] === " "
			|| inputString[pos] === "\t"
			|| inputString[pos] === "\n"
		) {
			return pos + 1;
		} else {
			return false; // no match
		}
	},
	// always "matches";
	// returns first position that isn't matched by whitespace
	eatWS: function (inputString, pos) {
		pos = pos || 0;
		while (true) {
			var newPos = patternParse.ws(inputString, pos);
			if (newPos === false) {
				break;
			} else {
				pos = newPos;
			}
		}
		return pos;
	},
	comment: function (inputString, pos) {
		pos = pos || 0;
		var startPos = pos;
		// skipping over white space
		pos = patternParse.eatWS(inputString, pos);
		// matching /*
		if (inputString.substring(pos).match(/^\/\*/)) {
			pos += 2;
		} else {
			return false;
		}
		// skipping over white space
		pos = patternParse.eatWS(inputString, pos);
		// finding literally everything except the next */
		var matches = inputString.substring(pos).match(/^(.*)\*\//);
		// TODO: PROBLEM: a pair of double quotes breaks this match!!
		if (matches[0].length > 0) {
			pos += matches[0].length;
		} else {
			return false;
		}
		// COMMENT LABEL DETECTION
		var commentString = matches[1].trim();
		var commentResult = {
			startPosition: startPos,
			newPosition: pos,
			// used only for debugging
			matchedText: inputString.substring(startPos, pos),
			charCoords: findLineAndCharNumbers(inputString, startPos),
			type: 'comment-unlabeled',
			value: commentString,
		};
		// finding some small chunk of a "modest" string
		commentLabelObject = patternParse.miniString(commentString, 0);
		if (commentLabelObject) {
			var labelPos = commentLabelObject.newPosition;
			if (commentString.substring(labelPos).match(/^:/)) {
				cutPos = labelPos + 1;
				commentResult.type = 'comment';
				commentResult.value = {
					commentLabel: commentString.substring(0,labelPos),
					commentBody: commentString.substring(cutPos).trim(),
				};
			}
		}
		return commentResult;
	},
	scriptName: function (inputString, pos) {
		pos = pos || 0;
		var startPos = pos;
		// skipping over white space
		pos = patternParse.eatWS(inputString, pos);
		// finding some small chunk of a "modest" string
		scriptNameObject = patternParse.miniString(inputString, pos);
		if (!scriptNameObject) {
			return false;
		}
		pos = scriptNameObject.newPosition;
		// matching :
		if (inputString.substring(pos).match(/^:/)) {
			pos += 1;
		} else {
			return false;
		}
		// WRAP UP
		return {
			startPosition: startPos,
			newPosition: pos,
			matchedText: inputString.substring(startPos, pos),
			charCoords: findLineAndCharNumbers(inputString, startPos),
			type: 'scriptName',
			value: scriptNameObject.value,
		}
	},
	miniString: function (inputString, pos) {
		pos = pos || 0;
		var startPos = pos;
		pos = patternParse.eatWS(inputString, pos);
		var resultArray = inputString.substring(pos)
			.match(/^[^'"\s:]+/);
		if (resultArray) {
			return {
				startPosition: startPos,
				newPosition: pos + resultArray[0].length,
				type: 'miniString',
				matchedValue: resultArray[0],
				charCoords: findLineAndCharNumbers(inputString, startPos),
				value: resultArray[0].slice(),
			}
		} else {
			return false;
		}
	},
	quotedString: function (inputString, pos) {
		// TODO: are inside quotes gonna be escaped or what??
		// (this is set to "lazy" for now -- the '?' after the '*')
		pos = pos || 0;
		var startPos = pos;
		pos = patternParse.eatWS(inputString, pos);
		var resultArray = inputString.substring(pos)
			.match(/^("|')[-A-Za-z_<>/?%\*+=#!0-9 "']*?\1/);
		if (resultArray) {
			return {
				startPosition: startPos,
				newPosition: pos + resultArray[0].length,
				type: 'quotedString',
				matchedValue: resultArray[0],
				charCoords: findLineAndCharNumbers(inputString, startPos),
				value: resultArray[0],
			}
		} else {
			return false;
		}
	},
	text: function (inputString, pos) {
		var match = patternParse.comment(inputString, pos);
		if (match) {
			return match;
		}
		match = patternParse.quotedString(inputString, pos);
		if (match) {
			return match;
		}
		match = patternParse.scriptName(inputString, pos);
		if (match) {
			return match;
		}
		match = patternParse.miniString(inputString, pos);
		if (match) {
			return match;
		}
		return false;
	}
};

var findLineAndCharNumbers = function (inputString, pos) { // `12345\n789AB`, 8
	// Turns a string and a char position into
	// a more reasonable line and col (plus bonus info)
	var substring = inputString.substring(0,pos); // `12345\n789`
	var splits = substring.split('\n') // [ '12345', '789' ]
	var lineNumber = splits.length; // 2
	var charCount = splits[lineNumber - 1].length; // 3
	var wholeString = inputString.split('\n')
	return {
		row: lineNumber,
		col: charCount,
		lineString: wholeString[lineNumber - 1],
		char: inputString[pos]
	};
};

var getDictionaryItemFromTokens = function (tokens) {
	// Turns a set of known-to-be-good tokens into a single dictionary item
	// (Returns false upon failure)
	var sameLengthPatterns = natlangDictionary
		.filter(function (pattern) {
			var patternSplits = pattern.pattern.split(' ');
			if (patternSplits.length !== tokens.length) {
				return false;
			} else {
				return true;
			}
		})
	var matches = sameLengthPatterns
		.filter(function (pattern) {
			var patternSplits = pattern.pattern.split(' ');
			var result = true;
			for (var index = 0; index < patternSplits.length; index++) {
				var patternWord = patternSplits[index];
				var testWord = tokens[index];
				var keyWord = patternWord[0] !== '$'
				if (keyWord) {
					if (patternWord !== testWord) {
						result = false;
						break
					}
				} else {
					var varType = patternWord.substring(1);
					var validVar = natlangVariableValidate[varType](testWord);
					if (!validVar) {
						result = false;
						break
					}
				}
			}
			return result;
		})
	if (matches.length === 1) {
		return matches[0];
	} else if (matches.length > 1) {
		// console.warn('multiple dictionary matches found!')
		// console.warn(matches)
		return matches.length;
	} else {
		return false;
	}
};

var getActionNameFromTokens = function (tokens) {
	// Turns a set of known-to-be-good tokens into an action name
	var dictionaryItem = getDictionaryItemFromTokens(tokens);
	return dictionaryItem.action;
};

var translateTokensToJSON = {
	// Use translateTokensToJSON.action() to turn a set of
	// known-to-be-good tokens into its equivalent JSON
	action: function (tokens) {
		var dictionary = getDictionaryItemFromTokens(tokens);
		if (!dictionary) {
			console.error(actionName + ' not in dictionary?? (Tokens below)');
			console.error(tokens);
		}
		var actionName = dictionary.action;
		if (!actionName) {
			console.error('Action name not found? (Tokens below)');
			console.error(tokens);
		}
		var result = {
			action: actionName
		};
		dictionary.fields.forEach(function (item, index) {
			if (item !== null) {
				var fieldName = item;
				var fieldValue;
				if (
					dictionary.values
					&& dictionary.values[index] !== null
				) {
					fieldValue = dictionary.values[index]
				} else {
					var fieldValueOrig = tokens[index];
					var fieldType = dictionary.pattern
						.split(' ')[index]
						.substring(1);
					if (!translateTokensToJSON[fieldType]) {
						console.error('translate function not found: ' + fieldType)
					}
					fieldValue = translateTokensToJSON[fieldType](fieldValueOrig);
				}
				result[fieldName] = fieldValue;
			}
		})
		return result;
	},
	// Everything below is used by the first function
	comment: function (string) {
		splits = string
			.replace('// ','')
			.split(': ');
		return {
			[splits[0]]: splits[1]
		}
	},
	bool: function (string) {
		return boolMap[string];
	},
	int: function (string) {
		return parseInt(string, 10);
	},
	duration: function (string) {
		var trimmed = string.replace('ms','');
		return parseInt(trimmed, 10);
	},
	pixels: function (string) {
		var trimmed = string.replace('px','');
		return parseInt(trimmed, 10);
	},
	string: function (string) {
		var last = string.length - 1;
		var equal = string[0] === string[last];
		var quotes = string [0] === '"' || string [0] === "'";
		if (equal && quotes) {
			return string.slice(1, -1);
		} else {
			return string;
		}
	},
	qty: function (string) {
		if (string[0] === 'x') {
			return parseInt(string.replace('x',''),10);
		} else if (string === 'once') {
			return 1;
		} else if (string === 'twice') {
			return 2;
		} else if (string === 'thrice') {
			return 3;
		} else {
			return 'QTY_ERROR';
		}
	},
	op: function (string) {
		return getOpOriginal(string);
	},
	color: function (string) {
		return string;
	},
	field: function (string) {
		return string;
	},
	button: function (string) {
		return string;
	},
	direction: function (string) {
		return string;
	},
	comparison: function (string) {
		return string;
	}
};

var boolMap = {
	'true': true,
	'false': false,
	'on': true,
	'off': false,
	'open': true,
	'close': false,
};

var natlangVariableValidate = {
	// Determines whether an input string qualifies as a specific
	// natlang variable; returns true or false
	bool: function (string) {
		return Object.keys(boolMap).includes(string);
	},
	int: function (string) {
		var test = string * 1;
		return !isNaN(test);
	},
	duration: function (string) {
		var test = string.replace('ms','');
		return natlangVariableValidate.int(test);
	},
	pixels: function (string) {
		var test = string.replace('px','');
		return natlangVariableValidate.int(test);
	},
	string: function (string) {
		var last = string.length - 1;
		var equal = string[0] === string[last];
		var quotes = string [0] === '"' || string [0] === "'";
		return equal && quotes;
	},
	qty: function (string) {
		var test = string.replace('x','');
		var int = natlangVariableValidate.int(test);
		var synonyms = ['once', 'twice', 'thrice'];
		return synonyms.includes(string) || int;
	},
	op: function (string) {
		var totalList = [];
		opLookup.forEach(function (item) {
			totalList = totalList.concat(item.synonyms);
		})
		return totalList.includes(string);
	},
	color: function (string) {
		return true // TODO do this for real maybe
	},
	field: function (string) {
		var list = Object.values(entitySpecificPropertyMap)
			.map(function (item) {
				return item.natLangProperty;
			})
		return list.includes(string);
	},
	button: function (string) {
		var list = Object.keys(buttonMap);
		return list.includes(string);
	},
	direction: function (string) {
		return ["north","east","south","west"].includes(string);
	},
	comparison: function (string) {
		var list = Object.keys(comparisonMap);
		return list.includes(string);
	}
};

var natlangVariableReport = function (variable) {
	// Takes a string and returns an array of all its
	// valid natlang variable types
	var result = [];
	var types = Object.keys(natlangVariableValidate);
	types.forEach(function (type) {
		if (natlangVariableValidate[type](variable)) {
			result.push(type);
		}
	})
	return result;
};

var parseNatlangBlock = function (inputString) {
	// Turns natlang plaintext into a stream of categorized tokens
	// (Returns false upon failure)
	var oldPos = null;
	var pos = pos = patternParse.eatWS(inputString, pos);
	var tokenStream = [];
	while (
		oldPos !== pos
		&& pos < inputString.length
	) {
		var match = patternParse.text(inputString, pos)
		if (match) {
			tokenStream.push(match);
			oldPos = pos;
			pos = pos = patternParse.eatWS(inputString, match.newPosition);
		} else {
			oldPos = pos;
			var errorCoords = findLineAndCharNumbers(inputString, pos);
			var arrow = '~'.repeat(errorCoords.col) + '^';
			console.error(`╓ Pattern parser failure! Line ${errorCoords.row}:${errorCoords.col}`);
			console.error('║ ' + `${errorCoords.lineString}`);
			console.error('╙~' + arrow);
			return false;
		}
	};
	return tokenStream;
};
var parseNatlangStream = function (tokenStream) {
	// Turns a natlang token stream into the actual JSON
	var json = {};
	var scriptName = '';
	var scriptBody = [];
	var workingTokens = [];
	var treeRef = natlangParseTree;
	for (var index = 0; index < tokenStream.length; index++) {
		var token = tokenStream[index];
		if (token.type === 'scriptName') {
			if (scriptName.length > 0) {
				json[scriptName] = scriptBody;
			}
			scriptName = token.value;
			scriptBody = [];
		} else if (token.type === 'comment') {
			var lastScript = scriptBody[scriptBody.length - 1];
			// TODO: break gracefully if a comment is above the first action
			lastScript[token.value.commentLabel] = token.value.commentBody.trim();
		} else if (token.type === 'comment-unlabeled') {
			// NOTHING LOL (or TODO make them generically and sequentially named)
		} else { // ['block','1ms','close','hex','editor']
			var currentBranches = Object.keys(treeRef); // [ "block", "make", "$bool", "erase", ...]
			var word = token.value; // 'block'
			var tokenPotential = natlangVariableReport(word)
				.map(function (item) {
					return '$' + item;
				})
				.concat([word]);
			var potentialBranches = tokenPotential
				.filter(function (item) {
					return currentBranches.includes(item);
				})
			if (potentialBranches.length === 0) {
				var coords = token.charCoords || null;
				var message = coords
					? `Natlang parse error at line ${coords.row}:${coords.col}`
					: `Natlang parse error at token index ${index}`;
				console.error(message);
				console.error(`    Token: ${token.value}`);
				console.error(`    Expected: ${currentBranches.join(', ')}`);
				json = null;
				break
			} else if (potentialBranches.length === 1) {
				var branch = potentialBranches[0];
				workingTokens.push(word);
				treeRef = treeRef[branch];
			}
		}
		if (Object.keys(treeRef).length === 1 && Object.keys(treeRef).includes("END")) {
			scriptBody.push(translateTokensToJSON.action(workingTokens));
			workingTokens = [];
			treeRef = natlangParseTree;
		}
	};
	json[scriptName] = scriptBody;
	return json;
}

// THE BELOW IS ALL THAT MATTERS FOR GENERAL PURPOSES:

var translateNatlangToJSON = function (natlangBlock) {
	// Insert natlang plaintext, receive JSON
	// (Returns false upon failure)
	var stream = parseNatlangBlock(natlangBlock);
	if (stream === false) {
		console.error('Translation aborted!');
		return false;
	}
	return parseNatlangStream(stream);
};
