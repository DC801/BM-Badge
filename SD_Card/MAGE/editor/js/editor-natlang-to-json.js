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
		// always "matches";
		// returns first position that isn't matched by whitespace
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
		// finding some small chunk of a "modest" string
		commentLabelObject = patternParse.miniString(inputString, pos);
		if (!commentLabelObject) {
			return false;
		}
		pos = commentLabelObject.newPosition;
		// skipping over white space
		pos = patternParse.eatWS(inputString, pos);
		// matching :
		if (inputString.substring(pos).match(/^:/)) {
			pos += 1;
		} else {
			return false;
		}
		// skipping over white space
		pos = patternParse.eatWS(inputString, pos);
		// finding literally everything except the next *
		var commentBody = inputString.substring(pos).match(/^[^\*]+/);
		if (commentBody[0].length > 0) {
			pos += commentBody[0].length;
		} else {
			return false;
		}
		// skipping over white space
		if (inputString.substring(pos).match(/^\*\//)) {
			pos += 2;
		} else {
			return false;
		}
		// WRAP UP
		var commentLabel = commentLabelObject.value;
		return {
			startPosition: startPos,
			newPosition: pos,
			matchedText: inputString.substring(startPos, pos),
			type: 'comment',
			value: {
				commentLabel: commentLabel,
				commentBody: commentBody[0],
			},
		}
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
			type: 'scriptName',
			value: scriptNameObject.value,
		}
	},
	miniString: function (inputString, pos) {
		pos = pos || 0;
		var startPos = pos;
		pos = patternParse.eatWS(inputString, pos);
		var resultArray = inputString.substring(pos)
			.match(/^[-A-Za-z_<>=#!0-9]+/);
		if (resultArray) {
			return {
				startPosition: startPos,
				newPosition: pos + resultArray[0].length,
				type: 'miniString',
				matchedValue: resultArray[0],
				value: resultArray[0].slice(),
			}
		} else {
			return false;
		}
	},
	quotedString: function (inputString, pos) {
		// TODO: are inside quotes gonna be escaped or what??
		// (this is set to "lazy" for now -- the '?' after the '+')
		pos = pos || 0;
		var startPos = pos;
		pos = patternParse.eatWS(inputString, pos);
		var resultArray = inputString.substring(pos)
			.match(/^("|')[-A-Za-z_<>=#!0-9 "']+?\1/);
		if (resultArray) {
			return {
				startPosition: startPos,
				newPosition: pos + resultArray[0].length,
				type: 'quotedString',
				matchedValue: resultArray[0],
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

var parseNatlangBlock = function (inputString) {
	var oldPos = null;
	var pos = pos = patternParse.eatWS(inputString, pos);
	var result = [];
	while (
		oldPos !== pos
		&& pos < inputString.length
	) {
		var match = patternParse.text(inputString, pos)
		if (match) {
			result.push(match);
			oldPos = pos;
			pos = pos = patternParse.eatWS(inputString, match.newPosition);
		} else {
			oldPos = pos;
			console.error('no match found I guess')
		}
	}
	console.log(`Natlang block (length: ${inputString.length}) parsed to ${pos}`)
	return result;
}

var testNatlangBlock = `
test-script:
	block 1ms
	close hex editor
	erase slot 2
	if button ANY
		then goto "script-do-if-button"
		/* comment: blablablalh */
	if button ANY is pressed then goto "script-do-if-button-state"
	if button ANY is not pressed then goto "script-do-if-button-state"

test-script-2:
    goto "script-to-run"
    loop entity "Entity Name" along geometry "geometry-name-loop" over 1000ms
    open hex editor
    rotate entity "Entity Name" 1
    save slot
    shake camera 1000ms 30px for 4000ms
    wait 100000ms
        /* doop: doop */`;

var testNatlangStream = parseNatlangBlock(testNatlangBlock);

var testNatlangStream2 = testNatlangStream.map(function (item) {
	return {type:item.type,value:item.value}
})

var parseNatlangStream = function (stream) {
	var scripts = [];
	// relevant: { type: "miniString", value: "hex" }
	var insertName = '';
	var insertBody = [];
	var tempTokens = [];
	stream.forEach(function (token, index) {
		if (token.type === 'scriptName') {
			if (insertName.length > 0) {
				scripts.push( {
					[insertName]: insertBody
				})
			}
			insertName = token.value;
			insertBody = [];
		} else if (token.type !== 'comment') {
			var keyword = natlangVerbs
				.filter(function (item) { return item !== 'then'})
				.includes(token.value);
			var isLinkedGoto =
				token.value === 'goto'
				&& stream[index-1].value === 'then'
			if (keyword && !isLinkedGoto) {
				if (tempTokens.length > 0) {
					insertBody.push(translateTokensToJSON.action(tempTokens));
				}
				tempTokens = [ token.value ];
			} else {
				tempTokens.push(token.value)
			}
		} else {
			insertBody[insertBody.length - 1][token.value.commentLabel] = token.value.commentBody.trim();
		}
	})
	scripts.push( {
		[insertName]: insertBody
	});
	return scripts;
}

var getDictionaryItemFromTokens = function (tokens) {
	var sameLengthPatterns = natlangDictionary.filter(function (pattern) {
		var patternSplits = pattern.pattern.split(' ');
		if (patternSplits.length !== tokens.length) {
			return false;
		} else {
			return true;
		}
	})
	var matches = sameLengthPatterns.filter(function (pattern) {
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
		console.warn('multiple dictionary matches found!')
		console.warn(matches)
		return matches.length;
	} else {
		return null;
	}
};

var getActionNameFromTokens = function (tokens) {
	var dictionaryItem = getDictionaryItemFromTokens(tokens);
	return dictionaryItem.action;
};

var translateTokensToJSON = {
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
	bool: function (string) {
		return Object.keys(boolMap).includes(string);
	},
	int: function (string) {
		var test = string * 1;
		return !isNaN(test);
	},
	duration: function (string) {
		var px = string.includes('ms');
		var int = parseInt(string.replace('ms',''),10);
		return px && natlangVariableValidate.int(int);
	},
	pixels: function (string) {
		var px = string.includes('px');
		var int = parseInt(string.replace('px',''),10);
		return px && natlangVariableValidate.int(int);
	},
	string: function (string) {
		var last = string.length - 1;
		var equal = string[0] === string[last];
		var quotes = string [0] === '"' || string [0] === "'";
		return equal && quotes;
	},
	qty: function (string) {
		var px = string.includes('x');
		var int = parseInt(string.replace('x',''),10);
		var xVersion = px && natlangVariableValidate.int(int);
		var synonyms = ['once', 'twice', 'thrice'];
		return synonyms.includes(string) || xVersion;
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

var testBidirectionalConversion = function (tokens) {
	var ao = translateTokensToJSON.action(tokens);
	var newString = makeNatLangAction(ao);
	var origString = tokens.join(' ');
	if (newString === origString) {
		return true;
	} else {
		console.log({newString, origString, ao, tokens})
		return false;
	}
}
