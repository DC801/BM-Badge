// NOTE: ao = actionObject

var getRequiredActionParams = function (actionName) {
	if (actionName === 'COPY_SCRIPT') {
		return ['script'];
	} else if (actionFieldsMap[actionName]) {
		return actionFieldsMap[actionName] // external
			.map(function (item) {
				return item.propertyName
			}) || [];
	} else {
		console.error(`Action name "${actionName}" not found in "actionFieldsMap"!`);
		return [];
	}
};

var getParamsReport = function (ao) {
	if (!ao.action) {
		console.error('Cannot attempt params report without an action name!');
		console.error(ao);
		return null;
	}
	var requiredParams = getRequiredActionParams(ao.action);
	var foundParams = Object.keys(ao)
		.filter(function (item) {
			return item !== 'action'
		});
	var extraParams = foundParams
		.filter(function (item) {
			return !requiredParams.includes(item);
		});
	var missingParams = requiredParams
		.filter(function (item) {
			return !foundParams.includes(item);
		});
	return {
		requiredParams: requiredParams,
		foundParams: foundParams,
		extraParams: extraParams,
		missingParams: missingParams,
	};
};

var reportMissingParams = function (ao, missingParams) {
	var message = ao.action + ' is missing 1 or more params!';
	console.error(message);
	console.error('   Missing: ' + missingParams.join (', '));
	console.error({ actionObject: ao });
	return 'ERROR: ' + message + '; ' + missingParams.join(', ');
}

var getDefaultDictionaryFields = function (dictionaryItem) {
	var setFields = {}
	if (dictionaryItem.values) {
		dictionaryItem.values.forEach(function (value, index) {
			if (value !== null) {
				var fieldName = dictionaryItem.fields[index];
				setFields[fieldName] = value;
			}
		})
	}
	return setFields;
};

var natlangBoolPrefs = {
	SET_HEX_EDITOR_STATE: [ 'open', 'close' ], // required due to keywords
	SET_PLAYER_CONTROL: [ 'on', 'off' ],
	SET_HEX_EDITOR_DIALOG_MODE: [ 'on', 'off' ],
	SET_HEX_EDITOR_CONTROL: [ 'on', 'off' ],
	SET_HEX_EDITOR_CONTROL_CLIPBOARD: [ 'on', 'off' ],
	// [ 'true', 'false' ] for everything else
};

var getPreferredBool = function (actionName, bool) {
	var preference = natlangBoolPrefs[actionName] || [ 'true', 'false' ];
	return bool ? preference[0] : preference[1];
};

var translateFieldToNatlang = {
	bool: function (input) {
		// TODO collect preferences for action names
		return input + '';
	},
	int: function (input) {
		return input + '';
	},
	duration: function (input) {
		return input + 'ms';
	},
	pixels: function (input) {
		return input + 'px';
	},
	string: function (input) {
		return '"' + input + '"';
	},
	qty: function (input) {
		if (input === 1) {
			return 'once';;
		} else if (input === 2) {
			return 'twice';
		} else {
			return 'x' + input;
		}
	},
	op: function (input) {
		return getOpSynonym(input);
	},
	color: function (input) {
		return input;
	},
	field: function (input) {
		return input;
	},
	button: function (input) {
		return input;
	},
	direction: function (input) {
		return input;
	},
	comparison: function (input) {
		return input;
	} // TODO: return itself as a default option?
};

var opLookup = [
	{
		op: "SET",
		synonyms: ['=', 'SET', 'set'],
	},
	{
		op: "ADD",
		synonyms: ['+', 'ADD', 'add'],
	},
	{
		op: "SUB",
		synonyms: ['-', 'SUB', 'sub'],
	},
	{
		op: "DIV",
		synonyms: ['/', 'DIV', 'div'],
	},
	{
		op: "MUL",
		synonyms: ['*', 'MUL', 'mul'],
	},
	{
		op: "MOD",
		synonyms: ['%', 'MOD', 'mod'],
	},
	{
		op: "RNG",
		synonyms: ['?', 'RNG', 'rng'],
	}
];
// TODO: optimize, use hashmap lookups instead of find (-SB)
var getOpSynonym = function (op) {
	var found = opLookup.find(function (item) {
		return item.op === op;
	})
	return found.synonyms && found.synonyms[0]
		? found.synonyms[0]
		: op;
};
var getOpOriginal = function (synonym) {
	var orig = opLookup.find(function (item) {
		return item.synonyms.includes(synonym);
	})
	return orig && orig.op ? orig.op : synonym;
};

var getDictionaryItemFromAO = function (ao) {
	var paramsReport = getParamsReport(ao);
	if (paramsReport.missingParams.length > 0) {
		console.error('This action object is missing required params!');
		console.error(ao);
		return {};
	}
	var dictionarySameName = natlangDictionary
		.filter(function (item) {
			return ao.action === item.action;
		})
	if (dictionarySameName.length === 1) {
		return dictionarySameName[0]
	} else if (dictionarySameName.length > 1) {
		var filtered = dictionarySameName.filter(function (item) {
			var match = true;
			var setFields = getDefaultDictionaryFields(item);
			Object.keys(setFields).forEach(function (fieldName) {
				if (ao[fieldName] !== setFields[fieldName]) {
					match = false;
				}
			})
			return match;
		})
		if (filtered.length === 1) {
			return filtered [0];
		} else {
			// console.warn(ao);
			// console.warn(`Multiple dictionary entries for ${ao.action}! Matches:`);
			// filtered.forEach(function (item) {
			// 	console.warn('    ' + item.pattern)
			// })
			console.warn('Returning only the first dictionary match!')
			return filtered[0];
		}
	} else {
		console.error('Catastrophic dictionary lookup failure!');
		console.error(ao);
		return {};
	}
};

var makeActionTokensFromAO = function (ao) {
	var dictionaryItem = getDictionaryItemFromAO(ao);
	var resultArray = [];
	var patternSplits = dictionaryItem.pattern.split(' ');
	patternSplits.forEach(function (token, index) {
		if (token[0] === '$') {
			var fieldName = dictionaryItem.fields[index];
			var fieldValue = ao[fieldName];
			if (fieldValue === true || fieldValue === false) {
				fieldValue = getPreferredBool(ao.action, fieldValue)
			}
			var fieldType = token.substring(1);
			var insert = translateFieldToNatlang[fieldType](fieldValue);
			resultArray.push(insert);
		} else {
			resultArray.push(token);
		}
	})
	return resultArray;
};
var makeCommentObjectFromAO = function (ao) {
	var paramsReport = getParamsReport(ao);
	var comments = paramsReport.extraParams;
	if (comments.length > 0) {
		var commentTokens = {};
		comments.forEach(function (commentLabel) {
			commentTokens[commentLabel] = ao[commentLabel];
		})
		return commentTokens;
	} else {
		return null;
	}
};

var makeCommentStringsFromCO = function (co) {
	var commentStrings = [];
	if (Object.keys(co).length > 0) {
		Object.keys(co).forEach(function (commentLabel) {
			var insert = '/* ' + commentLabel + ': ' + co[commentLabel] + ' */';
			commentStrings.push(insert);
		})
		return commentStrings;
	} else {
		return null;
	}
};
// TODO: combine
var makeCommentStringsFromAO = function (ao) {
	var commentObject = makeCommentObjectFromAO(ao);
	if(commentObject)
		return makeCommentStringsFromCO(commentObject);
	else
		return null;
};

var translateAOToArrays = function (ao) {
	var paramsReport = getParamsReport(ao);
	var missingParams = paramsReport.missingParams;
	if (missingParams.length > 0) {
		return reportMissingParams(ao, missingParams);
	}
	var actionString = makeActionTokensFromAO(ao).join(' ');
	var resultArray = [ actionString ];
	commentStrings = makeCommentStringsFromAO(ao);
	if (commentStrings) {
		resultArray = resultArray.concat(commentStrings);
	}
	return resultArray;
};
// ^^ alternative if, for some reason, you didn't want them joined yet
var translateAO = function (ao) {
	var result = translateAOToArrays(ao);
	return result.join('\n');
};

var defaultNatlangConfig = {
	indent: '    ',
	extraIndentComments: true,
	extraIndentSplitGotos: true,
	splitGoto: true,
};
var translateJSONToNatlang = function (jsonFromFile, importConfig) {
	var config = JSON.parse(JSON.stringify(defaultNatlangConfig));
	Object.assign(config, importConfig);
	jsonFromFile = jsonFromFile || {};
	var basicArray = [];
	// Making the text blocks per script
	var scriptNames = Object.keys(jsonFromFile);
	scriptNames.forEach(function (scriptName) {
		basicArray.push(scriptName + ':');
		var aos = jsonFromFile[scriptName];
		aos.forEach(function (ao) {
			var arrayFromAO = translateAOToArrays(ao);
			basicArray = basicArray.concat(arrayFromAO);
		})
		basicArray.push('');
	});
	var indent = config.indent;
	// INDENTING
	var indentedArray = basicArray.map(function (string) {
		if (string[string.length-1] === ':') {
			return string;
		} else if (string.startsWith('/* ')) {
			return config.extraIndentComments
				? indent + indent + string
				: indent + string;
		} else if (string === '') {
			return string;
		} else {
			return indent + string;
		}
	})
	// TODO: split goto (should be easier now that it includes "then")
	return indentedArray.join('\n');
};
