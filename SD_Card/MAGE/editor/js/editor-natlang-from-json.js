// NOTE: ao = actionObject

var getRequiredActionParams = function (actionName) {
	if (actionName === 'COPY_SCRIPT') {
		return ['script'];
	} else {
		return actionFieldsMap[actionName] // external
			.map(function (item) {
				return item.propertyName
			}) || [];
	}
};

var getParamsReport = function (ao) {
	if (!ao.action) {
		console.error('Cannot get params report for missing action!');
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
		// TODO make fancy "once, twice" etc?
		return 'x' + input;
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
	}
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
		console.error(ao)
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
				// console.log(`checking ${ao[fieldName]} against ${setFields[fieldName]}`)
				if (ao[fieldName] !== setFields[fieldName]) {
					match = false;
				}
			})
			// console.log(`match result: ${match}`)
			return match;
		})
		if (filtered.length === 1) {
			return filtered [0];
		} else {
			console.warn('Dictionary filter warning (multiple dictionary entries!)');
			console.warn(ao)
			console.warn('Matched dictionary patterns:')
			filtered.forEach(function (item) {
				console.warn('    ' + item.pattern)
			})
			console.warn('Returning only the first one!')
			return filtered[0];
		}
	} else {
		console.error('Catastrophic dictionary lookup failure!');
		console.error(ao)
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
			var insert = '// ' + commentLabel + ': ' + co[commentLabel];
			commentStrings.push(insert);
		})
		return commentStrings;
	} else {
		return null;
	}
}

var translateAOToArrays = function (ao) {
	var paramsReport = getParamsReport(ao);
	var missingParams = paramsReport.missingParams;
	if (missingParams.length > 0) {
		return reportMissingParams(ao, missingParams);
	}
	var actionString = makeActionTokensFromAO(ao).join(' ');
	var resultArray = [ actionString ];
	var commentObject = makeCommentObjectFromAO(ao);
	if (commentObject) {
		commentStrings = makeCommentStringsFromCO(commentObject);
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
	extraIndents: true,
	splitGoto: true,
};
var translateScripts = function (jsonFromFile, importConfig) {
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
	})
	var indent = config.indent;
	// INDENTING
	var indentedArray = basicArray.map(function (string) {
		if (string[string.length-1] === ':') {
			return string;
		} else if (string.startsWith('// ')) {
			return config.extraIndents
				? indent + indent + string
				: indent + string;
		} else {
			return indent + string;
		}
	})
	// TODO: split goto (should be easier now that it includes "then")
	return indentedArray.join('\n');
};

var testJSONFile = {
	"test-script": [
		{
			"action": "BLOCKING_DELAY",
			"duration": 1,
		},
		{
			"action": "SET_HEX_EDITOR_STATE",
			"bool_value": false,
		},
		{
			"action": "SLOT_ERASE",
			"slot": 2,
		},
		{
			"action": "CHECK_FOR_BUTTON_PRESS",
			"button_id": "ANY",
			"success_script": "script-do-if-button",
		},
		{
			"action": "CHECK_FOR_BUTTON_STATE",
			"button_id": "ANY",
			"expected_bool": true,
			"success_script": "script-do-if-button-state",
		},
		{
			"action": "CHECK_FOR_BUTTON_STATE",
			"button_id": "ANY",
			"expected_bool": false,
			"success_script": "script-do-if-button-state",
		}
	],
	"test-script-2": [
		{
			"action": "RUN_SCRIPT",
			"script": "script-to-run",
		},
		{
			"action": "LOOP_ENTITY_ALONG_GEOMETRY",
			"entity": "Entity Name",
			"geometry": "geometry-name-loop",
			"duration": 1000,
		},
		{
			"action": "SET_HEX_EDITOR_STATE",
			"bool_value": true,
		},
		{
			"action": "SET_ENTITY_DIRECTION_RELATIVE",
			"entity": "Entity Name",
			"relative_direction": 1,
		},
		{
			"action": "SLOT_SAVE",
		},
		{
			"action": "SET_SCREEN_SHAKE",
			"frequency": 1000,
			"amplitude": 30,
			"duration": 4000,
		},
		{
			"action": "NON_BLOCKING_DELAY",
			"duration": 100000,
			"doop":"doop",
		}
	]
}

// SORTED BY FUNCTION

// var testJSON = {
// 	"natlang-test-game-management": [
// 		{
// 			"action": "BLOCKING_DELAY",
// 			"duration": 1,
// 			// "camel": "BLOCKING_DELAY"
// 		},
// 		{
// 			"action": "NON_BLOCKING_DELAY",
// 			"duration": 100000,
// 			// "camel": "NON_BLOCKING_DELAY"
// 		},
// 		{
// 			"action": "SET_PLAYER_CONTROL",
// 			"bool_value": true,
// 			// "camel": "SET_PLAYER_CONTROL"
// 		},
// 		{
// 			"action": "SET_PLAYER_CONTROL",
// 			"bool_value": false,
// 			// "camel": "SET_PLAYER_CONTROL"
// 		},
// 		{
// 			"action": "LOAD_MAP",
// 			"map": "super-long-map-name",
// 			// "camel": "LOAD_MAP"
// 		},
// 		{
// 			"action": "SHOW_DIALOG",
// 			"dialog": "super-long-dialog-name",
// 			// "camel": "SHOW_DIALOG"
// 		},
// 		{
// 			"action": "SLOT_SAVE",
// 			// "camel": "SLOT_SAVE"
// 		},
// 		{
// 			"action": "SLOT_LOAD",
// 			"slot": 0,
// 			// "camel": "SLOT_LOAD"
// 		},
// 		{
// 			"action": "SLOT_ERASE",
// 			"slot": 2,
// 			// "camel": "SLOT_ERASE"
// 		}
// 	],
// 	"natlang-test-hex-editor": [
// 		{
// 			"action": "SET_HEX_EDITOR_STATE",
// 			"bool_value": true,
// 			// "camel": "SET_HEX_EDITOR_STATE"
// 		},
// 		{
// 			"action": "SET_HEX_EDITOR_STATE",
// 			"bool_value": false,
// 			// "camel": "SET_HEX_EDITOR_STATE"
// 		},
// 		{
// 			"action": "SET_HEX_EDITOR_DIALOG_MODE",
// 			"bool_value": true,
// 			// "camel": "SET_HEX_EDITOR_DIALOG_MODE"
// 		},
// 		{
// 			"action": "SET_HEX_EDITOR_DIALOG_MODE",
// 			"bool_value": false,
// 			// "camel": "SET_HEX_EDITOR_DIALOG_MODE"
// 		},
// 		{
// 			"action": "SET_HEX_EDITOR_CONTROL",
// 			"bool_value": true,
// 			// "camel": "SET_HEX_EDITOR_CONTROL"
// 		},
// 		{
// 			"action": "SET_HEX_EDITOR_CONTROL",
// 			"bool_value": false,
// 			// "camel": "SET_HEX_EDITOR_CONTROL"
// 		},
// 		{
// 			"action": "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
// 			"bool_value": true,
// 			// "camel": "SET_HEX_EDITOR_CONTROL_CLIPBOARD"
// 		},
// 		{
// 			"action": "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
// 			"bool_value": false,
// 			// "camel": "SET_HEX_EDITOR_CONTROL_CLIPBOARD"
// 		}
// 	],
// 	"natlang-test-logic-entities": [
// 		{
// 			"action": "CHECK_ENTITY_NAME",
// 			"success_script": "script-do-if-entity-name",
// 			"string": "Checked Name",
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_NAME"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_NAME",
// 			"success_script": "script-do-if-NOT-entity-name",
// 			"string": "Checked Name",
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_NAME"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_X",
// 			"success_script": "script-do-if-entity-x",
// 			"expected_u2": 0,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_X"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_X",
// 			"success_script": "script-do-if-entity-x",
// 			"expected_u2": 0,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_X"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_INTERACT_SCRIPT",
// 			"success_script": "script-do-if-entity-y",
// 			"expected_script": "name-of-checked-script-interact",
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_INTERACT_SCRIPT"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_INTERACT_SCRIPT",
// 			"success_script": "script-do-if-entity-y",
// 			"expected_script": "name-of-checked-script-interact",
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_INTERACT_SCRIPT"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_TICK_SCRIPT",
// 			"success_script": "script-do-if-entity-tick",
// 			"expected_script": "name-of-checked-script-tick",
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_TICK_SCRIPT"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_TICK_SCRIPT",
// 			"success_script": "script-do-if-entity-tick",
// 			"expected_script": "name-of-checked-script-tick",
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_TICK_SCRIPT"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_TYPE",
// 			"success_script": "script-do-if-entity-type",
// 			"entity_type": "some-kind-of-entity-type",
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_TYPE"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_TYPE",
// 			"success_script": "script-do-if-entity-type",
// 			"entity_type": "some-kind-of-entity-type",
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_TYPE"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_PRIMARY_ID",
// 			"success_script": "script-do-if-entity-primaryid",
// 			"expected_u2": 16,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_PRIMARY_ID"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_PRIMARY_ID",
// 			"success_script": "script-do-if-entity-primaryid",
// 			"expected_u2": 16,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_PRIMARY_ID"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_SECONDARY_ID",
// 			"success_script": "script-do-if-entity-secondaryid",
// 			"expected_u2": 16,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_SECONDARY_ID"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_SECONDARY_ID",
// 			"success_script": "script-do-if-entity-secondaryid",
// 			"expected_u2": 16,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_SECONDARY_ID"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_PRIMARY_ID_TYPE",
// 			"success_script": "script-do-if-entity-primaryid-type",
// 			"expected_byte": 16,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_PRIMARY_ID_TYPE"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_PRIMARY_ID_TYPE",
// 			"success_script": "script-do-if-entity-primaryid-type",
// 			"expected_byte": 16,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_PRIMARY_ID_TYPE"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_CURRENT_ANIMATION",
// 			"success_script": "script-do-if-entity-animation",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_CURRENT_ANIMATION"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_CURRENT_ANIMATION",
// 			"success_script": "script-do-if-entity-animation",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_CURRENT_ANIMATION"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_CURRENT_FRAME",
// 			"success_script": "script-do-if-entity-frame",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_CURRENT_FRAME"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_CURRENT_FRAME",
// 			"success_script": "script-do-if-entity-frame",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_CURRENT_FRAME"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_DIRECTION",
// 			"success_script": "script-do-if-entity-direction",
// 			"direction": "north",
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_DIRECTION"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_DIRECTION",
// 			"success_script": "script-do-if-entity-direction",
// 			"direction": "north",
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_DIRECTION"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_GLITCHED",
// 			"success_script": "script-do-if-entity-is-glitched",
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_GLITCHED"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_GLITCHED",
// 			"success_script": "script-do-if-entity-is-NOT-glitched",
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_GLITCHED"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_A",
// 			"success_script": "script-do-if-entity-is-hackable-a",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_A"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_A",
// 			"success_script": "script-do-if-entity-is-hackable-a",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_A"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_B",
// 			"success_script": "script-do-if-entity-is-hackable-b",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_B"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_B",
// 			"success_script": "script-do-if-entity-is-hackable-b",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_B"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_C",
// 			"success_script": "script-do-if-entity-is-hackable-c",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_C"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_C",
// 			"success_script": "script-do-if-entity-is-hackable-c",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_C"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_D",
// 			"success_script": "script-do-if-entity-is-hackable-d",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_D"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_D",
// 			"success_script": "script-do-if-entity-is-hackable-d",
// 			"expected_byte": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_D"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_A_U2",
// 			"success_script": "script-do-if-entity-is-hackable-a-u2",
// 			"expected_u2": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_A_U2"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_A_U2",
// 			"success_script": "script-do-if-entity-is-hackable-a-u2",
// 			"expected_u2": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_A_U2"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_C_U2",
// 			"success_script": "script-do-if-entity-is-hackable-c-u2",
// 			"expected_u2": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_C_U2"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_C_U2",
// 			"success_script": "script-do-if-entity-is-hackable-c-u2",
// 			"expected_u2": 1,
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_C_U2"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_HACKABLE_STATE_A_U4",
// 			"success_script": "script-do-if-entity-is-hackable-a-u4",
// 			"expected_u4": 1,
// 			"entity": "Entity Name",
// 			"note": "expected_bool is missing on purpose -- not enough bytes available!",
// 			// "camel": "CHECK_ENTITY_HACKABLE_STATE_A_U4"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_PATH",
// 			"success_script": "script-do-if-entity-path",
// 			"geometry": "some-kind-of-geometry-name",
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_ENTITY_PATH"
// 		},
// 		{
// 			"action": "CHECK_ENTITY_PATH",
// 			"success_script": "script-do-if-entity-path",
// 			"geometry": "some-kind-of-geometry-name",
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_ENTITY_PATH"
// 		},
// 		{
// 			"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
// 			"success_script": "script-do-if-entity-path-inside",
// 			"geometry": "some-kind-of-geometry-name",
// 			"entity": "Entity Name",
// 			"expected_bool": true,
// 			// "camel": "CHECK_IF_ENTITY_IS_IN_GEOMETRY"
// 		},
// 		{
// 			"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
// 			"success_script": "script-do-if-NOT-entity-path-inside",
// 			"geometry": "some-kind-of-geometry-name",
// 			"entity": "Entity Name",
// 			"expected_bool": false,
// 			// "camel": "CHECK_IF_ENTITY_IS_IN_GEOMETRY"
// 		}
// 	],
// 	"natlang-test-logic-others": [
// 		{
// 			"action": "CHECK_VARIABLE",
// 			"variable": "i-am-a-variable",
// 			"value": 15,
// 			"comparison": "==",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-variable-==",
// 			// "camel": "CHECK_VARIABLE"
// 		},
// 		{
// 			"action": "CHECK_VARIABLE",
// 			"variable": "i-am-a-variable",
// 			"value": 15,
// 			"comparison": "==",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-variable-==-NOT",
// 			// "camel": "CHECK_VARIABLE"
// 		},
// 		{
// 			"action": "CHECK_VARIABLE",
// 			"variable": "i-am-a-variable",
// 			"value": 15,
// 			"comparison": "<",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-variable-<",
// 			// "camel": "CHECK_VARIABLE"
// 		},
// 		{
// 			"action": "CHECK_VARIABLE",
// 			"variable": "i-am-a-variable",
// 			"value": 15,
// 			"comparison": "<",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-variable-<-NOT",
// 			// "camel": "CHECK_VARIABLE"
// 		},
// 		{
// 			"action": "CHECK_VARIABLE",
// 			"variable": "i-am-a-variable",
// 			"value": 15,
// 			"comparison": "<=",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-variable-<=",
// 			// "camel": "CHECK_VARIABLE"
// 		},
// 		{
// 			"action": "CHECK_VARIABLE",
// 			"variable": "i-am-a-variable",
// 			"value": 15,
// 			"comparison": "<=",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-variable-<=-NOT",
// 			// "camel": "CHECK_VARIABLE"
// 		},
// 		{
// 			"action": "CHECK_VARIABLE",
// 			"variable": "i-am-a-variable",
// 			"value": 15,
// 			"comparison": ">=",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-variable->=",
// 			// "camel": "CHECK_VARIABLE"
// 		},
// 		{
// 			"action": "CHECK_VARIABLE",
// 			"variable": "i-am-a-variable",
// 			"value": 15,
// 			"comparison": ">=",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-variable->=-NOT",
// 			// "camel": "CHECK_VARIABLE"
// 		},
// 		{
// 			"action": "CHECK_VARIABLE",
// 			"variable": "i-am-a-variable",
// 			"value": 15,
// 			"comparison": ">",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-variable->",
// 			// "camel": "CHECK_VARIABLE"
// 		},
// 		{
// 			"action": "CHECK_VARIABLE",
// 			"variable": "i-am-a-variable",
// 			"value": 15,
// 			"comparison": ">",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-variable->-NOT",
// 			// "camel": "CHECK_VARIABLE"
// 		},
// 		{
// 			"action": "CHECK_VARIABLES",
// 			"variable": "i-am-a-variable",
// 			"source": "i-am-a-second-variable",
// 			"comparison": "==",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-variable-==",
// 			// "camel": "CHECK_VARIABLES"
// 		},
// 		{
// 			"action": "CHECK_VARIABLES",
// 			"variable": "i-am-a-variable",
// 			"source": "i-am-a-second-variable",
// 			"comparison": "==",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-variable-==-NOT",
// 			// "camel": "CHECK_VARIABLES"
// 		},
// 		{
// 			"action": "CHECK_VARIABLES",
// 			"variable": "i-am-a-variable",
// 			"source": "i-am-a-second-variable",
// 			"comparison": "<",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-variable-<",
// 			// "camel": "CHECK_VARIABLES"
// 		},
// 		{
// 			"action": "CHECK_VARIABLES",
// 			"variable": "i-am-a-variable",
// 			"source": "i-am-a-second-variable",
// 			"comparison": "<",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-variable-<-NOT",
// 			// "camel": "CHECK_VARIABLES"
// 		},
// 		{
// 			"action": "CHECK_VARIABLES",
// 			"variable": "i-am-a-variable",
// 			"source": "i-am-a-second-variable",
// 			"comparison": "<=",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-variable-<=",
// 			// "camel": "CHECK_VARIABLES"
// 		},
// 		{
// 			"action": "CHECK_VARIABLES",
// 			"variable": "i-am-a-variable",
// 			"source": "i-am-a-second-variable",
// 			"comparison": "<=",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-variable-<=-NOT",
// 			// "camel": "CHECK_VARIABLES"
// 		},
// 		{
// 			"action": "CHECK_VARIABLES",
// 			"variable": "i-am-a-variable",
// 			"source": "i-am-a-second-variable",
// 			"comparison": ">=",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-variable->=",
// 			// "camel": "CHECK_VARIABLES"
// 		},
// 		{
// 			"action": "CHECK_VARIABLES",
// 			"variable": "i-am-a-variable",
// 			"source": "i-am-a-second-variable",
// 			"comparison": ">=",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-variable->=-NOT",
// 			// "camel": "CHECK_VARIABLES"
// 		},
// 		{
// 			"action": "CHECK_VARIABLES",
// 			"variable": "i-am-a-variable",
// 			"source": "i-am-a-second-variable",
// 			"comparison": ">",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-variable->",
// 			// "camel": "CHECK_VARIABLES"
// 		},
// 		{
// 			"action": "CHECK_VARIABLES",
// 			"variable": "i-am-a-variable",
// 			"source": "i-am-a-second-variable",
// 			"comparison": ">",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-variable->-NOT",
// 			// "camel": "CHECK_VARIABLES"
// 		},
// 		{
// 			"action": "CHECK_SAVE_FLAG",
// 			"save_flag": "i-am-a-save-flag",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-flag-true",
// 			// "camel": "CHECK_SAVE_FLAG"
// 		},
// 		{
// 			"action": "CHECK_SAVE_FLAG",
// 			"save_flag": "i-am-a-save-flag",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-flag-false",
// 			// "camel": "CHECK_SAVE_FLAG"
// 		},
// 		{
// 			"action": "CHECK_FOR_BUTTON_PRESS",
// 			"button_id": "ANY",
// 			"success_script": "script-do-if-button",
// 			// "camel": "CHECK_FOR_BUTTON_PRESS"
// 		},
// 		{
// 			"action": "CHECK_FOR_BUTTON_STATE",
// 			"button_id": "ANY",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-button-state",
// 			// "camel": "CHECK_FOR_BUTTON_STATE"
// 		},
// 		{
// 			"action": "CHECK_FOR_BUTTON_STATE",
// 			"button_id": "ANY",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-button-state",
// 			// "camel": "CHECK_FOR_BUTTON_STATE"
// 		},
// 		{
// 			"action": "CHECK_WARP_STATE",
// 			"string": "warp-state-string",
// 			"expected_bool": true,
// 			"success_script": "script-do-if-warp-state",
// 			// "camel": "CHECK_WARP_STATE"
// 		},
// 		{
// 			"action": "CHECK_WARP_STATE",
// 			"string": "warp-state-string",
// 			"expected_bool": false,
// 			"success_script": "script-do-if-NOT-warp-state",
// 			// "camel": "CHECK_WARP_STATE"
// 		}
// 	],
// 	"natlang-test-set-entity": [
// 		{
// 			"action": "SET_ENTITY_NAME",
// 			"string": "New Name",
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_NAME"
// 		},
// 		{
// 			"action": "SET_ENTITY_X",
// 			"u2_value": 128,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_X"
// 		},
// 		{
// 			"action": "SET_ENTITY_Y",
// 			"u2_value": 128,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_Y"
// 		},
// 		{
// 			"action": "SET_ENTITY_TYPE",
// 			"entity_type": "some-kinda-sheep",
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_TYPE"
// 		},
// 		{
// 			"action": "SET_ENTITY_PRIMARY_ID",
// 			"u2_value": 1,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_PRIMARY_ID"
// 		},
// 		{
// 			"action": "SET_ENTITY_SECONDARY_ID",
// 			"u2_value": 2,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_SECONDARY_ID"
// 		},
// 		{
// 			"action": "SET_ENTITY_PRIMARY_ID_TYPE",
// 			"byte_value": 0,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_PRIMARY_ID_TYPE"
// 		},
// 		{
// 			"action": "SET_ENTITY_HACKABLE_STATE_A",
// 			"byte_value": 128,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_HACKABLE_STATE_A"
// 		},
// 		{
// 			"action": "SET_ENTITY_HACKABLE_STATE_B",
// 			"byte_value": 128,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_HACKABLE_STATE_B"
// 		},
// 		{
// 			"action": "SET_ENTITY_HACKABLE_STATE_C",
// 			"byte_value": 128,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_HACKABLE_STATE_C"
// 		},
// 		{
// 			"action": "SET_ENTITY_HACKABLE_STATE_D",
// 			"byte_value": 128,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_HACKABLE_STATE_D"
// 		},
// 		{
// 			"action": "SET_ENTITY_HACKABLE_STATE_A_U2",
// 			"u2_value": 2,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_HACKABLE_STATE_A_U2"
// 		},
// 		{
// 			"action": "SET_ENTITY_HACKABLE_STATE_C_U2",
// 			"u2_value": 2,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_HACKABLE_STATE_C_U2"
// 		},
// 		{
// 			"action": "SET_ENTITY_HACKABLE_STATE_A_U4",
// 			"u4_value": 4,
// 			"entity": "Entity Name",
// 			// "camel": "SET_ENTITY_HACKABLE_STATE_A_U4"
// 		}
// 	],
// 	"natlang-test-entity-choreography-paths": [
// 		{
// 			"action": "TELEPORT_ENTITY_TO_GEOMETRY",
// 			"entity": "Entity Name",
// 			"geometry": "geometry-name-teleport",
// 			// "camel": "TELEPORT_ENTITY_TO_GEOMETRY"
// 		},
// 		{
// 			"action": "WALK_ENTITY_TO_GEOMETRY",
// 			"entity": "Entity Name",
// 			"geometry": "geometry-name-walk-to",
// 			"duration": 1000,
// 			// "camel": "WALK_ENTITY_TO_GEOMETRY"
// 		},
// 		{
// 			"action": "WALK_ENTITY_ALONG_GEOMETRY",
// 			"entity": "Entity Name",
// 			"geometry": "geometry-name-walk-along",
// 			"duration": 1000,
// 			// "camel": "WALK_ENTITY_ALONG_GEOMETRY"
// 		},
// 		{
// 			"action": "LOOP_ENTITY_ALONG_GEOMETRY",
// 			"entity": "Entity Name",
// 			"geometry": "geometry-name-loop",
// 			"duration": 1000,
// 			// "camel": "LOOP_ENTITY_ALONG_GEOMETRY"
// 		},
// 		{
// 			"action": "SET_ENTITY_PATH",
// 			"entity": "Entity Name",
// 			"geometry": "geometry-name-entity-path",
// 			// "camel": "SET_ENTITY_PATH"
// 		}
// 	],
// 	"natlang-test-entity-choreography-appearance": [
// 		{
// 			"action": "PLAY_ENTITY_ANIMATION",
// 			"entity": "Entity Name",
// 			"animation": 0,
// 			"play_count": 1,
// 			// "camel": "PLAY_ENTITY_ANIMATION"
// 		},
// 		{
// 			"action": "PLAY_ENTITY_ANIMATION",
// 			"entity": "Entity Name",
// 			"animation": 0,
// 			"play_count": 2,
// 			// "camel": "PLAY_ENTITY_ANIMATION"
// 		},
// 		{
// 			"action": "SET_ENTITY_CURRENT_ANIMATION",
// 			"entity": "Entity Name",
// 			"byte_value": 0,
// 			// "camel": "SET_ENTITY_CURRENT_ANIMATION"
// 		},
// 		{
// 			"action": "SET_ENTITY_CURRENT_FRAME",
// 			"entity": "Entity Name",
// 			"byte_value": 0,
// 			// "camel": "SET_ENTITY_CURRENT_FRAME"
// 		},
// 		{
// 			"action": "SET_ENTITY_DIRECTION",
// 			"entity": "Entity Name",
// 			"direction": "north",
// 			// "camel": "SET_ENTITY_DIRECTION"
// 		},
// 		{
// 			"action": "SET_ENTITY_DIRECTION_RELATIVE",
// 			"entity": "Entity Name",
// 			"relative_direction": 1,
// 			// "camel": "SET_ENTITY_DIRECTION_RELATIVE"
// 		},
// 		{
// 			"action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
// 			"entity": "Entity Name",
// 			"target_entity": "Target Entity",
// 			// "camel": "SET_ENTITY_DIRECTION_TARGET_ENTITY"
// 		},
// 		{
// 			"action": "SET_ENTITY_DIRECTION_TARGET_GEOMETRY",
// 			"entity": "Entity Name",
// 			"target_geometry": "target-geometry",
// 			// "camel": "SET_ENTITY_DIRECTION_TARGET_GEOMETRY"
// 		},
// 		{
// 			"action": "SET_ENTITY_GLITCHED",
// 			"entity": "Entity Name",
// 			"bool_value": true,
// 			// "camel": "SET_ENTITY_GLITCHED"
// 		},
// 		{
// 			"action": "SET_ENTITY_GLITCHED",
// 			"entity": "Entity Name",
// 			"bool_value": false,
// 			// "camel": "SET_ENTITY_GLITCHED"
// 		}
// 	],
// 	"natlang-test-camera-control": [
// 		{
// 			"action": "SET_CAMERA_TO_FOLLOW_ENTITY",
// 			"entity": "Entity Name",
// 			// "camel": "SET_CAMERA_TO_FOLLOW_ENTITY"
// 		},
// 		{
// 			"action": "TELEPORT_CAMERA_TO_GEOMETRY",
// 			"geometry": "geometry-name-to-teleport",
// 			// "camel": "TELEPORT_CAMERA_TO_GEOMETRY"
// 		},
// 		{
// 			"action": "PAN_CAMERA_TO_ENTITY",
// 			"duration": 1000,
// 			"entity": "Entity Name",
// 			// "camel": "PAN_CAMERA_TO_ENTITY"
// 		},
// 		{
// 			"action": "PAN_CAMERA_TO_GEOMETRY",
// 			"duration": 1000,
// 			"geometry": "geometry-to-pan-camera",
// 			// "camel": "PAN_CAMERA_TO_GEOMETRY"
// 		},
// 		{
// 			"action": "SET_SCREEN_SHAKE",
// 			"frequency": 1000,
// 			"amplitude": 30,
// 			"duration": 4000,
// 			// "camel": "SET_SCREEN_SHAKE"
// 		},
// 		{
// 			"action": "SCREEN_FADE_OUT",
// 			"duration": 1000,
// 			"color": "#FF0000",
// 			// "camel": "SCREEN_FADE_OUT"
// 		},
// 		{
// 			"action": "SCREEN_FADE_IN",
// 			"duration": 1000,
// 			"color": "#00FF00",
// 			// "camel": "SCREEN_FADE_IN"
// 		}
// 	],
// 	"natlang-test-controlling-scripts": [
// 		{
// 			"action": "RUN_SCRIPT",
// 			"script": "script-to-run",
// 			// "camel": "RUN_SCRIPT"
// 		},
// 		{
// 			"action": "COPY_SCRIPT",
// 			"script": "script-to-copy",
// 			// "camel": "COPY_SCRIPT"
// 		},
// 		{
// 			"action": "SET_MAP_TICK_SCRIPT",
// 			"script": "script-map-tick",
// 			// "camel": "SET_MAP_TICK_SCRIPT"
// 		},
// 		{
// 			"action": "SET_ENTITY_INTERACT_SCRIPT",
// 			"entity": "Entity Name",
// 			"script": "script-entity-interact",
// 			// "camel": "SET_ENTITY_INTERACT_SCRIPT"
// 		},
// 		{
// 			"action": "SET_ENTITY_TICK_SCRIPT",
// 			"entity": "Entity Name",
// 			"script": "script-entity-tick",
// 			// "camel": "SET_ENTITY_TICK_SCRIPT"
// 		}
// 	],
// 	"natlang-test-controlling-variables": [
// 		{
// 			"action": "SET_SAVE_FLAG",
// 			"save_flag": "save-flag-to-set",
// 			"bool_value": true,
// 			// "camel": "SET_SAVE_FLAG"
// 		},
// 		{
// 			"action": "SET_SAVE_FLAG",
// 			"save_flag": "save-flag-to-set-NOT",
// 			"bool_value": false,
// 			// "camel": "SET_SAVE_FLAG"
// 		},
// 		{
// 			"action": "SET_WARP_STATE",
// 			"string": "warp-state-string",
// 			// "camel": "SET_WARP_STATE"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLE",
// 			"variable": "variable-name-set",
// 			"value": 5,
// 			"operation": "SET",
// 			// "camel": "MUTATE_VARIABLE"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLE",
// 			"variable": "variable-name-add",
// 			"value": 5,
// 			"operation": "ADD",
// 			// "camel": "MUTATE_VARIABLE"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLE",
// 			"variable": "variable-name-sub",
// 			"value": 5,
// 			"operation": "SUB",
// 			// "camel": "MUTATE_VARIABLE"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLE",
// 			"variable": "variable-name-div",
// 			"value": 5,
// 			"operation": "DIV",
// 			// "camel": "MUTATE_VARIABLE"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLE",
// 			"variable": "variable-name-mul",
// 			"value": 5,
// 			"operation": "MUL",
// 			// "camel": "MUTATE_VARIABLE"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLE",
// 			"variable": "variable-name-mod",
// 			"value": 5,
// 			"operation": "MOD",
// 			// "camel": "MUTATE_VARIABLE"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLE",
// 			"variable": "variable-name-rng",
// 			"value": 5,
// 			"operation": "RNG",
// 			// "camel": "MUTATE_VARIABLE"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLES",
// 			"variable": "variable-name-set",
// 			"source": "another-variable-name",
// 			"operation": "SET",
// 			// "camel": "MUTATE_VARIABLES"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLES",
// 			"variable": "variable-name-add",
// 			"source": "another-variable-name",
// 			"operation": "ADD",
// 			// "camel": "MUTATE_VARIABLES"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLES",
// 			"variable": "variable-name-sub",
// 			"source": "another-variable-name",
// 			"operation": "SUB",
// 			// "camel": "MUTATE_VARIABLES"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLES",
// 			"variable": "variable-name-div",
// 			"source": "another-variable-name",
// 			"operation": "DIV",
// 			// "camel": "MUTATE_VARIABLES"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLES",
// 			"variable": "variable-name-mul",
// 			"source": "another-variable-name",
// 			"operation": "MUL",
// 			// "camel": "MUTATE_VARIABLES"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLES",
// 			"variable": "variable-name-mod",
// 			"source": "another-variable-name",
// 			"operation": "MOD",
// 			// "camel": "MUTATE_VARIABLES"
// 		},
// 		{
// 			"action": "MUTATE_VARIABLES",
// 			"variable": "variable-name-rng",
// 			"source": "another-variable-name",
// 			"operation": "RNG",
// 			// "camel": "MUTATE_VARIABLES"
// 		},
// 		{
// 			"action": "COPY_VARIABLE",
// 			"variable": "variable-name-inbound",
// 			"inbound": true,
// 			"entity": "Entity Name",
// 			"field": "x",
// 			// "camel": "COPY_VARIABLE"
// 		},
// 		{
// 			"action": "COPY_VARIABLE",
// 			"variable": "variable-name-outbound",
// 			"inbound": false,
// 			"entity": "Entity Name",
// 			"field": "y",
// 			// "camel": "COPY_VARIABLE"
// 		}
// 	],
// 	"natlang-test-ch2": [
// 		{
// 			"action": "SHOW_SERIAL_DIALOG",
// 			"serial_dialog": "serial-dialog",
// 			// "camel": "SHOW_SERIAL_DIALOG"
// 		}
// 	]
// };

// SORTED BY KEY WORDS

var testJSON = {
	"natlang-UNIQUE": [
		{
			"action": "BLOCKING_DELAY",
			"duration": 1,
		},
		{
			"action": "SET_HEX_EDITOR_STATE",
			"bool_value": false,
		},
		{
			"action": "SLOT_ERASE",
			"slot": 2,
		},
		{
			"action": "RUN_SCRIPT",
			"script": "script-to-run",
		},
		{
			"action": "LOOP_ENTITY_ALONG_GEOMETRY",
			"entity": "Entity Name",
			"geometry": "geometry-name-loop",
			"duration": 1000,
		},
		{
			"action": "SET_HEX_EDITOR_STATE",
			"bool_value": true,
		},
		{
			"action": "SET_ENTITY_DIRECTION_RELATIVE",
			"entity": "Entity Name",
			"relative_direction": 1,
		},
		{
			"action": "SLOT_SAVE",
		},
		{
			"action": "SET_SCREEN_SHAKE",
			"frequency": 1000,
			"amplitude": 30,
			"duration": 4000,
		},
		{
			"action": "NON_BLOCKING_DELAY",
			"duration": 100000,
		}
	],
	"natlang-walk": [
		{
			"action": "WALK_ENTITY_TO_GEOMETRY",
			"entity": "Entity Name",
			"geometry": "geometry-name-walk-to",
			"duration": 1000,
		},
		{
			"action": "WALK_ENTITY_ALONG_GEOMETRY",
			"entity": "Entity Name",
			"geometry": "geometry-name-walk-along",
			"duration": 1000,
		}
	],
	"natlang-make": [
		{
			"action": "SET_ENTITY_GLITCHED",
			"entity": "Entity Name",
			"bool_value": true,
		},
		{
			"action": "SET_ENTITY_GLITCHED",
			"entity": "Entity Name",
			"bool_value": false,
		},
		{
			"action": "SET_CAMERA_TO_FOLLOW_ENTITY",
			"entity": "Entity Name",
		}
	],
	"natlang-teleport": [
		{
			"action": "TELEPORT_ENTITY_TO_GEOMETRY",
			"entity": "Entity Name",
			"geometry": "geometry-name-teleport",
		},
		{
			"action": "TELEPORT_CAMERA_TO_GEOMETRY",
			"geometry": "geometry-name-to-teleport",
		}
	],
	"natlang-turn": [
		{
			"action": "SET_ENTITY_DIRECTION",
			"entity": "Entity Name",
			"direction": "north",
		},
		{
			"action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
			"entity": "Entity Name",
			"target_entity": "Target Entity",
		},
		{
			"action": "SET_ENTITY_DIRECTION_TARGET_GEOMETRY",
			"entity": "Entity Name",
			"target_geometry": "target-geometry",
		},
	],
	"natlang-pan": [
		{
			"action": "PAN_CAMERA_TO_ENTITY",
			"duration": 1000,
			"entity": "Entity Name",
		},
		{
			"action": "PAN_CAMERA_TO_GEOMETRY",
			"duration": 1000,
			"geometry": "geometry-to-pan-camera",
		}
	],
	"natlang-play": [
		{
			"action": "PLAY_ENTITY_ANIMATION",
			"entity": "Entity Name",
			"animation": 0,
			"play_count": 1,
		},
		{
			"action": "PLAY_ENTITY_ANIMATION",
			"entity": "Entity Name",
			"animation": 0,
			"play_count": 2,
		},
	],
	"natlang-fade": [
		{
			"action": "SCREEN_FADE_OUT",
			"duration": 1000,
			"color": "#FF0000",
		},
		{
			"action": "SCREEN_FADE_IN",
			"duration": 1000,
			"color": "#00FF00",
		}
	],
	"natlang-load": [
		{
			"action": "LOAD_MAP",
			"map": "super-long-map-name",
		},
		{
			"action": "SLOT_LOAD",
			"slot": 0,
		}
	],
	"natlang-show": [
		{
			"action": "SHOW_DIALOG",
			"dialog": "super-long-dialog-name",
		},
		{
			"action": "SHOW_SERIAL_DIALOG",
			"serial_dialog": "serial-dialog",
		}
	],
	"natlang-copy": [
		{
			"action": "COPY_SCRIPT",
			"script": "script-to-copy",
		},
		{
			"action": "COPY_VARIABLE",
			"variable": "variable-name-inbound",
			"inbound": true,
			"entity": "Entity Name",
			"field": "x",
		},
		{
			"action": "COPY_VARIABLE",
			"variable": "variable-name-outbound",
			"inbound": false,
			"entity": "Entity Name",
			"field": "y",
		}
	],
	"natlang-mutate": [
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-set",
			"value": 5,
			"operation": "SET",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-add",
			"value": 5,
			"operation": "ADD",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-sub",
			"value": 5,
			"operation": "SUB",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-div",
			"value": 5,
			"operation": "DIV",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-mul",
			"value": 5,
			"operation": "MUL",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-mod",
			"value": 5,
			"operation": "MOD",
		},
		{
			"action": "MUTATE_VARIABLE",
			"variable": "variable-name-rng",
			"value": 5,
			"operation": "RNG",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-set",
			"source": "another-variable-name",
			"operation": "SET",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-add",
			"source": "another-variable-name",
			"operation": "ADD",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-sub",
			"source": "another-variable-name",
			"operation": "SUB",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-div",
			"source": "another-variable-name",
			"operation": "DIV",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-mul",
			"source": "another-variable-name",
			"operation": "MUL",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-mod",
			"source": "another-variable-name",
			"operation": "MOD",
		},
		{
			"action": "MUTATE_VARIABLES",
			"variable": "variable-name-rng",
			"source": "another-variable-name",
			"operation": "RNG",
		},
	],
	"natlang-set-UNIQUE": [
		{
			"action": "SET_MAP_TICK_SCRIPT",
			"script": "script-map-tick",
		},
		{
			"action": "SET_WARP_STATE",
			"string": "warp-state-string",
		}
	],
	"natlang-set-flag": [
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "save-flag-to-set",
			"bool_value": true,
		},
		{
			"action": "SET_SAVE_FLAG",
			"save_flag": "save-flag-to-set-NOT",
			"bool_value": false,
		}
	],
	"natlang-set-player": [
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": true,
		},
		{
			"action": "SET_PLAYER_CONTROL",
			"bool_value": false,
		}
	],
	"natlang-set-hex": [
		{
			"action": "SET_HEX_EDITOR_DIALOG_MODE",
			"bool_value": true,
		},
		{
			"action": "SET_HEX_EDITOR_DIALOG_MODE",
			"bool_value": false,
		},
		{
			"action": "SET_HEX_EDITOR_CONTROL",
			"bool_value": true,
		},
		{
			"action": "SET_HEX_EDITOR_CONTROL",
			"bool_value": false,
		},
		{
			"action": "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
			"bool_value": true,
		},
		{
			"action": "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
			"bool_value": false,
		},
	],
	"natlang-set-entity": [
		{
			"action": "SET_ENTITY_NAME",
			"string": "New Name",
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_X",
			"u2_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_Y",
			"u2_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_TYPE",
			"entity_type": "some-kinda-sheep",
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_PRIMARY_ID",
			"u2_value": 1,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_SECONDARY_ID",
			"u2_value": 2,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_PRIMARY_ID_TYPE",
			"byte_value": 0,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_A",
			"byte_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_B",
			"byte_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_C",
			"byte_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_D",
			"byte_value": 128,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_A_U2",
			"u2_value": 2,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_C_U2",
			"u2_value": 2,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_HACKABLE_STATE_A_U4",
			"u4_value": 4,
			"entity": "Entity Name",
		},
		{
			"action": "SET_ENTITY_PATH",
			"entity": "Entity Name",
			"geometry": "geometry-name-entity-path",
		},
		{
			"action": "SET_ENTITY_CURRENT_ANIMATION",
			"entity": "Entity Name",
			"byte_value": 0,
		},
		{
			"action": "SET_ENTITY_CURRENT_FRAME",
			"entity": "Entity Name",
			"byte_value": 0,
		},
		{
			"action": "SET_ENTITY_INTERACT_SCRIPT",
			"entity": "Entity Name",
			"script": "script-entity-interact",
		},
		{
			"action": "SET_ENTITY_TICK_SCRIPT",
			"entity": "Entity Name",
			"script": "script-entity-tick",
		}
	],
	"natlang-if-flag": [
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "i-am-a-save-flag",
			"expected_bool": true,
			"success_script": "script-do-if-flag-true",
		},
		{
			"action": "CHECK_SAVE_FLAG",
			"save_flag": "i-am-a-save-flag",
			"expected_bool": false,
			"success_script": "script-do-if-flag-false",
		}
	],
	"natlang-if-button": [
		{
			"action": "CHECK_FOR_BUTTON_PRESS",
			"button_id": "ANY",
			"success_script": "script-do-if-button",
		},
		{
			"action": "CHECK_FOR_BUTTON_STATE",
			"button_id": "ANY",
			"expected_bool": true,
			"success_script": "script-do-if-button-state",
		},
		{
			"action": "CHECK_FOR_BUTTON_STATE",
			"button_id": "ANY",
			"expected_bool": false,
			"success_script": "script-do-if-button-state",
		}
	],
	"natlang-if-warp": [
		{
			"action": "CHECK_WARP_STATE",
			"string": "warp-state-string",
			"expected_bool": true,
			"success_script": "script-do-if-warp-state",
		},
		{
			"action": "CHECK_WARP_STATE",
			"string": "warp-state-string",
			"expected_bool": false,
			"success_script": "script-do-if-NOT-warp-state",
		}
	],
	"natlang-if-variable": [
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "==",
			"expected_bool": true,
			"success_script": "script-do-if-variable-==",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "<",
			"expected_bool": true,
			"success_script": "script-do-if-variable-<",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "<=",
			"expected_bool": true,
			"success_script": "script-do-if-variable-<=",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": ">=",
			"expected_bool": true,
			"success_script": "script-do-if-variable->=",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": ">",
			"expected_bool": true,
			"success_script": "script-do-if-variable->",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "==",
			"expected_bool": true,
			"success_script": "script-do-if-variable-==",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "<",
			"expected_bool": true,
			"success_script": "script-do-if-variable-<",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "<=",
			"expected_bool": true,
			"success_script": "script-do-if-variable-<=",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": ">=",
			"expected_bool": true,
			"success_script": "script-do-if-variable->=",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": ">",
			"expected_bool": true,
			"success_script": "script-do-if-variable->",
		}
	],
	"natlang-if-variable-NOT": [
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "==",
			"expected_bool": false,
			"success_script": "script-do-if-variable-==-NOT",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "<",
			"expected_bool": false,
			"success_script": "script-do-if-variable-<-NOT",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": "<=",
			"expected_bool": false,
			"success_script": "script-do-if-variable-<=-NOT",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": ">=",
			"expected_bool": false,
			"success_script": "script-do-if-variable->=-NOT",
		},
		{
			"action": "CHECK_VARIABLE",
			"variable": "i-am-a-variable",
			"value": 15,
			"comparison": ">",
			"expected_bool": false,
			"success_script": "script-do-if-variable->-NOT",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "==",
			"expected_bool": false,
			"success_script": "script-do-if-variable-==-NOT",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "<",
			"expected_bool": false,
			"success_script": "script-do-if-variable-<-NOT",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": "<=",
			"expected_bool": false,
			"success_script": "script-do-if-variable-<=-NOT",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": ">=",
			"expected_bool": false,
			"success_script": "script-do-if-variable->=-NOT",
		},
		{
			"action": "CHECK_VARIABLES",
			"variable": "i-am-a-variable",
			"source": "i-am-a-second-variable",
			"comparison": ">",
			"expected_bool": false,
			"success_script": "script-do-if-variable->-NOT",
		}
	],
	"natlang-if-entity-SPECIAL": [
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_A_U4",
			"success_script": "script-do-if-entity-is-hackable-a-u4",
			"expected_u4": 1,
			"entity": "Entity Name",
			"note": "expected_bool is missing on purpose -- not enough bytes available!",
		},
	],
	"natlang-if-entity": [
		{
			"action": "CHECK_ENTITY_NAME",
			"success_script": "script-do-if-entity-name",
			"string": "Checked Name",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_X",
			"success_script": "script-do-if-entity-x",
			"expected_u2": 0,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_INTERACT_SCRIPT",
			"success_script": "script-do-if-entity-y",
			"expected_script": "name-of-checked-script-interact",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_TICK_SCRIPT",
			"success_script": "script-do-if-entity-tick",
			"expected_script": "name-of-checked-script-tick",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"success_script": "script-do-if-entity-type",
			"entity_type": "some-kind-of-entity-type",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_PRIMARY_ID",
			"success_script": "script-do-if-entity-primaryid",
			"expected_u2": 16,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_SECONDARY_ID",
			"success_script": "script-do-if-entity-secondaryid",
			"expected_u2": 16,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_PRIMARY_ID_TYPE",
			"success_script": "script-do-if-entity-primaryid-type",
			"expected_byte": 16,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_CURRENT_ANIMATION",
			"success_script": "script-do-if-entity-animation",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_CURRENT_FRAME",
			"success_script": "script-do-if-entity-frame",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_DIRECTION",
			"success_script": "script-do-if-entity-direction",
			"direction": "north",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_A",
			"success_script": "script-do-if-entity-is-hackable-a",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_B",
			"success_script": "script-do-if-entity-is-hackable-b",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_C",
			"success_script": "script-do-if-entity-is-hackable-c",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_D",
			"success_script": "script-do-if-entity-is-hackable-d",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_A_U2",
			"success_script": "script-do-if-entity-is-hackable-a-u2",
			"expected_u2": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_C_U2",
			"success_script": "script-do-if-entity-is-hackable-c-u2",
			"expected_u2": 1,
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_PATH",
			"success_script": "script-do-if-entity-path",
			"geometry": "some-kind-of-geometry-name",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_ENTITY_GLITCHED",
			"success_script": "script-do-if-entity-is-glitched",
			"entity": "Entity Name",
			"expected_bool": true,
		},
		{
			"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
			"success_script": "script-do-if-entity-path-inside",
			"geometry": "some-kind-of-geometry-name",
			"entity": "Entity Name",
			"expected_bool": true,
		}
	],
	"natlang-if-entity-NOT": [
		{
			"action": "CHECK_ENTITY_NAME",
			"success_script": "script-do-if-entity-name",
			"string": "Checked Name",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_X",
			"success_script": "script-do-if-entity-x",
			"expected_u2": 0,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_INTERACT_SCRIPT",
			"success_script": "script-do-if-entity-y",
			"expected_script": "name-of-checked-script-interact",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_TICK_SCRIPT",
			"success_script": "script-do-if-entity-tick",
			"expected_script": "name-of-checked-script-tick",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_TYPE",
			"success_script": "script-do-if-entity-type",
			"entity_type": "some-kind-of-entity-type",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_PRIMARY_ID",
			"success_script": "script-do-if-entity-primaryid",
			"expected_u2": 16,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_SECONDARY_ID",
			"success_script": "script-do-if-entity-secondaryid",
			"expected_u2": 16,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_PRIMARY_ID_TYPE",
			"success_script": "script-do-if-entity-primaryid-type",
			"expected_byte": 16,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_CURRENT_ANIMATION",
			"success_script": "script-do-if-entity-animation",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_CURRENT_FRAME",
			"success_script": "script-do-if-entity-frame",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_DIRECTION",
			"success_script": "script-do-if-entity-direction",
			"direction": "north",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_A",
			"success_script": "script-do-if-entity-is-hackable-a",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_B",
			"success_script": "script-do-if-entity-is-hackable-b",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_C",
			"success_script": "script-do-if-entity-is-hackable-c",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_D",
			"success_script": "script-do-if-entity-is-hackable-d",
			"expected_byte": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_A_U2",
			"success_script": "script-do-if-entity-is-hackable-a-u2",
			"expected_u2": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_HACKABLE_STATE_C_U2",
			"success_script": "script-do-if-entity-is-hackable-c-u2",
			"expected_u2": 1,
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_PATH",
			"success_script": "script-do-if-entity-path",
			"geometry": "some-kind-of-geometry-name",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_ENTITY_GLITCHED",
			"success_script": "script-do-if-entity-is-glitched",
			"entity": "Entity Name",
			"expected_bool": false,
		},
		{
			"action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
			"success_script": "script-do-if-entity-path-inside",
			"geometry": "some-kind-of-geometry-name",
			"entity": "Entity Name",
			"expected_bool": false,
		}
	]
};
