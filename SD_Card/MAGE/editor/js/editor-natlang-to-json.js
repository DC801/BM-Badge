// TODO: parse string into tokens

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
