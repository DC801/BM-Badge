// "use strict";

// low budget module system, go! -SB
var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;
var mgs = mgs || window.mgs;
if (typeof module === 'object') {
	mgs = require('./mgs_natlang_config.js');
}
var log = window.log || false;

mgs.boolPrefs = {
	SET_HEX_EDITOR_STATE: [ 'open', 'close' ], // required due to keywords
	SET_PLAYER_CONTROL: [ 'on', 'off' ],
	SET_HEX_EDITOR_DIALOG_MODE: [ 'on', 'off' ],
	SET_HEX_EDITOR_CONTROL: [ 'on', 'off' ],
	SET_HEX_EDITOR_CONTROL_CLIPBOARD: [ 'on', 'off' ],
	SET_SERIAL_DIALOG_CONTROL: [ 'on', 'off' ],
	// [ 'true', 'false' ] for everything else
};

mgs.operationPrefs = {
	"SET": "=",
	"ADD": "+",
	"SUB": "-",
	"MUL": "*",
	"DIV": "/",
	"MOD": "%",
	"RNG": "?",
}

mgs.actionToNatlang = function (origJSON) {
	// TODO: dialog integration
	var patternChoices = mgs.actionDictionary
		.filter(function (entry) {
			return entry.action === origJSON.action
		})
	if (patternChoices.length === 0) { //
		console.error(origJSON)
		throw new Error("The above action was not found in the action dictionary! Action: " + origJSON.action);
	}
	if (patternChoices.length > 1) { // filter
		patternChoices = patternChoices
			.filter(function (entry) {
				var commonValues = true;
				if (entry.values) {
					var params = Object.keys(entry.values);
					params.forEach(function (param) {
						if (entry.values[param] !== origJSON[param]) {
							commonValues = false;
						}
					})
					return commonValues;
				} else {
					console.log(`Action ${origJSON.action} has synonyms with no contrasting properties. (This might be fine.)`)
					return true;
				}
			})
	}
	if (patternChoices.length === 0) { // overfiltered
		console.error(origJSON)
		throw new Error(`The above action was so aggressively filtered there was nothing left! Action: ${origJSON.action}`);
	} else if (patternChoices.length > 1) { // underfiltered
		if (log) {console.log(origJSON); }
		if (log) {console.log("This action has several dictionary entries and filtering failed to sufficiently distinguish them. Assuming synonyms...."); }
	}
	// Only 1 action dictionary entry remains. (Or, if not, they are hopefully synonyms, and we can just use the first one, which is presumably the "default")
	var wordArray = patternChoices[0].pattern.split(' ');
	var finalWords = [];
	wordArray.forEach(function (word) {
		if (word[0] === "?") {
			finalWords.push(word.substring(1));
		} else if (word[0] === "$") {
			// properly formatting the natlang word
			var varSplits = word.substring(1).split(":");
			var paramName = varSplits[0];
			var extractedWord = origJSON[paramName];
			if (extractedWord === undefined) { // Must explicitly check against undefined, as this value may be `false`!
				console.error(origJSON)
				throw new Error("No parameter named '" + paramName + "' found in action " + origJSON.action);
			}
			var variableType = varSplits[1];
			if (variableType === "operator") {
				extractedWord = mgs.operationPrefs[extractedWord]
					|| extractedWord;
			} else if (
				mgs.boolPrefs[origJSON.action]
				&& variableType === "boolean"
			) {
				extractedWord = extractedWord
					? mgs.boolPrefs[origJSON.action][0]
					: mgs.boolPrefs[origJSON.action][1]
			} else if (variableType === "duration") {
				extractedWord += 'ms';
			} else if (variableType === "distance") {
				extractedWord += 'px';
			} else if (variableType === "quantity") {
				if (extractedWord === 1) {
					extractedWord = "once";
				} else if (extractedWord === 2) {
					extractedWord = "twice";
				} else if (extractedWord === 3) {
					extractedWord = "thrice";
				} else {
					extractedWord += 'x';
				}
			} else if (typeof extractedWord === "string") {
				extractedWord = mgs.makeStringSafe(extractedWord);
			}
			// formatting done
			finalWords.push(extractedWord)
		} else {
			finalWords.push(word);
		}
	})
	return '\t' + finalWords.join(' ');
}

mgs.actionToNatlangComments = function (actionJSON) {
	// extract comments from action JSON
	var actionName = actionJSON.action;
	var foundParams = {
		action: true
	};
	var dictionaryItem = mgs.actionDictionary.find(function (entry) {
		// just the first one is fine; any should be just as good as another
		return entry.action === actionName;
	})
	var patternSplits = dictionaryItem.pattern.split(' ');
	patternSplits.forEach(function (patternWord) {
		if (patternWord[0] === "$") {
			var splits = patternWord.substring(1).split(":");
			foundParams[splits[0]] = true;
		}
	})
	if (dictionaryItem.values) {
		Object.keys(dictionaryItem.values).forEach(function (extraParam) {
			foundParams[extraParam] = true;
		})
	}
	// foundParams are parameters the action "needs"; all else are comments!
	var comments = [];
	Object.keys(actionJSON).forEach(function (paramName) {
		if (!foundParams[paramName]) {
			var cleanComment = actionJSON[paramName].replace(/\n/g," ");
			comments.push(`	// ${paramName}: ${cleanComment}`)
		}
	})
	return comments.join('\n');
}

mgs.assessDialogParams = function (dialogObj) {
	// wants MGE dialog JSON
	var entityTallies = {};
	var nameTallies = {};
	var skipParamsLookup = {
		"messages": true,
		"response_type": true,
		"options": true
	}
	var dialogNames = Object.keys(dialogObj);
	dialogNames.forEach(function (dialogName) {
		var dialogChonkArray = dialogObj[dialogName];
		dialogChonkArray.forEach(function (chonk) {
			if (chonk.entity) {
				entityTallies[chonk.entity] = entityTallies[chonk.entity] || {};
				var tallies = entityTallies[chonk.entity];
				var paramNames = Object.keys(chonk);
				var relevantParams = paramNames.filter(function (paramName) {
					return !skipParamsLookup[paramName]
						&& paramName !== "entity"
				})
				relevantParams.forEach(function (paramName) {
					tallies[paramName] = tallies[paramName] || {};
					tallies[paramName][chonk[paramName]] = tallies[paramName][chonk[paramName]] + 1 || 1;
				})
				tallies["TOTAL"] = tallies["TOTAL"] + 1 || 1;
			} else if (chonk.name) {
				nameTallies[chonk.name] = nameTallies[chonk.name] || {};
				var tallies = nameTallies[chonk.name];
				var paramNames = Object.keys(chonk);
				var relevantParams = paramNames.filter(function (paramName) {
					return !skipParamsLookup[paramName]
						&& paramName !== "name"
				})
				relevantParams.forEach(function (paramName) {
					tallies[paramName] = tallies[paramName] || {};
					tallies[paramName][chonk[paramName]] = tallies[paramName][chonk[paramName]] + 1 || 1;
				})
				tallies["TOTAL"] = tallies["TOTAL"] + 1 || 1;
			}
		})
	})
	return {
		entityTallies: entityTallies,
		nameTallies: nameTallies
	};
// yields include:
// {
// 	"%PLAYER%": {
// 		"alignment": {
// 			"BOTTOM_RIGHT": 23,
// 			"TOP_RIGHT": 3
// 		},
// 		"TOTAL": 26
// 	}
// }
}

mgs.getBestTally = function (object) {
	var best = '';
	var bestCount = 0;
	Object.keys(object).forEach(function (param) {
		if (object[param] > bestCount) {
			best = param;
			bestCount = object[param];
		}
	})
	return best;
	// turns
	//	{
	//		"BOTTOM_RIGHT": 23,
	//		"TOP_RIGHT": 3
	//	}
	// into
	//	"BOTTOM_RIGHT"
}

mgs.metaAlignmentAssessment = function (assessment) {
	// wants object from mgs.assessDialogParams()
	var entityNames = Object.keys(assessment.entityTallies);
	var nameNames = Object.keys(assessment.nameTallies);
	var entityAlignments = entityNames.map(function (name) {
		var info = assessment.entityTallies[name];
		var best = mgs.getBestTally(info.alignment);
		return best;
	}) // returns { "%PLAYER%": "BOTTOM_RIGHT", "%SELF%": …}
	var nameAlignments = nameNames.map(function (name) {
		var info = assessment.nameTallies[name];
		var best = mgs.getBestTally(info.alignment);
		return best;
	})
	// if an entity/name gets one vote each (choosing their favorite), what alignment wins?
	var overall = {
		"TOP_RIGHT": 0,
		"TOP_LEFT": 0,
		"BOTTOM_RIGHT": 0,
		"BOTTOM_LEFT": 0
	}
	var totalAlignments = entityAlignments.concat(nameAlignments);
	totalAlignments.forEach(function (alignment) {
		overall[alignment] += 1;
	})
	return overall;
}

mgs.makeStringSafe = function (inputString) {
	// wrap in double quotes unless the string matches the "bareword" pattern from the lexer
	var string = inputString + '';
	var safe = string.match(/^[-A-Za-z0-9_.$#]+$/)
	if (safe) {
		return string;
	} else {
		return '"' + string + '"';
	}
}

mgs.intelligentDialogHandler = function (dialogObj) {
	// optimized for BMG2020 trends... not particularly intelligent otherwise
	if (!Object.keys(dialogObj).length) {
		return {
			dialogs: {},
			settings: '',
			naiveString: '',
		}
	}
	var assessment = mgs.assessDialogParams(dialogObj);
	var metaAlignment = mgs.metaAlignmentAssessment(assessment);
	var globalAlign = mgs.getBestTally(metaAlignment);
	// ^^ we now have the "global" alignment trend

	var entityAlignmentLookup = {};
	var nameAlignmentLookup = {};

	Object.keys(assessment.entityTallies).forEach(function (entityName) {
		// get favorite alignment for each "entity" entry
		var info = assessment.entityTallies[entityName];
		var alignment = mgs.getBestTally(info.alignment);
		entityAlignmentLookup[entityName] = alignment;
	})
	Object.keys(assessment.nameTallies).forEach(function (nameName) {
		// get favorite alignment for each "name" entry
		var info = assessment.nameTallies[nameName];
		var alignment = mgs.getBestTally(info.alignment);
		nameAlignmentLookup[nameName] = alignment;
	})

	// dialog settings node: first, globals to start things off
	var settings
		= `settings for dialog {\n`
		+ `	parameters for global defaults {\n`
		+ `		alignment ${globalAlign}\n`
		+ `	}\n`

	// built-in labels for inconvenient and common identifiers
	var specialCases = {
		"%PLAYER%": "PLAYER",
		"%SELF%": "SELF"
	};

	Object.keys(specialCases).forEach(function (entityName) {
		if (entityAlignmentLookup[entityName]) {
			settings = settings
				+`	parameters for label ${specialCases[entityName]} {\n`
				+`		entity "${entityName}"\n`
			if (entityAlignmentLookup[entityName] !== globalAlign) {
				settings += `		alignment ${entityAlignmentLookup[entityName]}\n`
			}
			settings += `	}\n`
		}
	})
	Object.keys(entityAlignmentLookup)
		// filter out %PLAYER% or %SELF etc (they've been handled already)
		.filter(function (entityName) {
			return !specialCases[entityName];
		})
		.forEach(function (entityName) {
			if (entityAlignmentLookup[entityName] !== globalAlign) {
				settings = settings
				+`	parameters for entity ${mgs.makeStringSafe(entityName)} {\n`
				+`		alignment ${entityAlignmentLookup[entityName]}\n`
				+`	}\n`
			}
		})

	// spacious
	settings = settings + "}\n"

	var result = {
		settings: settings,
		dialogs: {},
		naiveString: ``
	};

	// making the dialogs O.o

	var dialogNames = Object.keys(dialogObj);
	dialogNames.forEach(function (dialogName) {
		var dialogArray = dialogObj[dialogName]; // raw JSON object for that dialog screen/chonk/unit
		var chonks = dialogArray.map(function (dialog) {
			var stringArray = [];
			// IDENTIFIER
			var identifier = specialCases[dialog.entity]
			// any convenience labels for %SELF% and %PLAYER% will be found this way
			if (!identifier) { // if not a special case
				var entityName = dialog.entity;
				if (entityName) { // the dialog is "entity" type
					identifier = mgs.makeStringSafe(entityName);
					// if the "safe" name is wrapped in quotes,
					// must prefix it with `entity` to make it a valid natlang identifier
					// (otherwise it will parse as a dialog message)
					if (identifier[0] === '"') {
						identifier = "entity " + identifier;
					}
				} else { // the dialog is "name" type (only these 2 scenarios are valid in MGE dialog chonks)
					// "name" prefix is ALWAYS required for these; bare names are parsed as (lazy) entity names
					identifier = "name " + mgs.makeStringSafe(dialog.name);
				}
			}
			stringArray.push(`	${identifier}`);

			// PARAMETERS (alignment)
			var defaultAlign = globalAlign;
			if (dialog.entity) { // if it's an "entity" dialog, get its favorite alignment
				defaultAlign
					= entityAlignmentLookup[dialog.entity]
					? entityAlignmentLookup[dialog.entity]
					: defaultAlign // TODO: determine whether this fallback is actually useful
			}
			if (dialog.alignment !== defaultAlign) {
				// if this chonk doesn't use its favorite alignment, include it now
				stringArray.push(`	alignment ${dialog.alignment}`);
			}

			// PARAMETERS (other)
			var paramNames = Object.keys(dialog);
			if (dialog.entity) {
				paramNames = paramNames.filter(function (item) {
					return item !== "entity";
				})
			} else if (dialog.name) {
				paramNames = paramNames.filter(function (item) {
					return item !== "name";
				})
			}
			// entity, name, portrait, alignment, border_tileset, and emote are relevent now
			// however we did alignment already:
			paramNames = paramNames.filter(function (item) {
				return item !== "messages"
					&& item !== "response_type"
					&& item !== "options"
					&& item !== "alignment" // has been handled already
			})
			// and we should filter the ones that were used for the identifier
			if (dialog.entity) {
				paramNames = paramNames.filter(function (item) {
					return item !== "entity"
				})
			} else {
				paramNames = paramNames.filter(function (item) {
					return item !== "name"
				})
			}
			// what's left that is "real" is portrait, border_tileset (and possibly name)
			// all others must therefore be comments
			var commentList = {};
			paramNames.forEach(function (paramName) {
				if (
					paramName === "name"
					|| paramName === "portrait"
					|| paramName === "border_tileset"
					|| paramName === "emote"
				) {
					var value = dialog[paramName];
					stringArray.push(`	${paramName} ${mgs.makeStringSafe(value)}`);
				} else {
					commentList[paramName] = dialog[paramName];
				}
			})
			Object.keys(commentList).forEach(function (comment) {
				var cleanComment = dialog[comment].replace(/\n/g," ");
				stringArray.push(`	// ${comment}: ${cleanComment}`);
			})
			// MESSAGES
			var messages = dialog.messages.map(function (message) {
				var line = message // javascript~~
					.replace(/\n/g,"\\n")
					.replace(/\t/g,"    ")
					.replace(/\"/g,"\\\"");
				return `	"${line}"`
			}).join('\n');
			stringArray.push(messages);
			// OPTIONS
			if (dialog.options) {
				dialog.options.forEach(function (option) {
					stringArray.push(`	> "${option.label}" : goto "${mgs.makeStringSafe(option.script)}"`);
				})
			}
			// THE REST OF THE OWL
			var chonk = stringArray.join('\n');
			return chonk;
		})
		var dialogBody = chonks.join('\n\n');
		result.dialogs[dialogName] = dialogBody;
	})
	result.naiveString += result.settings;
	dialogNames.forEach(function (dialogName) {
		var dialogBody = result.dialogs[dialogName];
		result.naiveString += `dialog "${dialogName}" {\n`
		result.naiveString += `${dialogBody}\n`
		result.naiveString += `}\n`
	})
	return result;
}

mgs.intelligentDualHandler = function (scriptObj, dialogObj) {
	var handledDialogObj = mgs.intelligentDialogHandler(dialogObj);
	var scriptNames = Object.keys(scriptObj)
	var handledDialogNames = [];
	var naiveString = ``;
	if (handledDialogObj && handledDialogObj.settings.length) {
		naiveString += handledDialogObj.settings + '\n';
	}
	var scriptStrings = scriptNames.map(function (scriptName) {
		var stringed = mgs.makeStringSafe(scriptName) + ' {\n'
		var actions = scriptObj[scriptName];
		actions.forEach(function (action) {
			if (
				action.action === "SHOW_DIALOG"
				&& handledDialogObj.dialogs[action.dialog]
				&& !handledDialogNames.includes(action.dialog)
			) {
				handledDialogNames.push(action.dialog);
				var dialogString = handledDialogObj.dialogs[action.dialog];
				dialogString = dialogString.replace(/\t/g,"\t\t");
				stringed += `	show dialog ${mgs.makeStringSafe(action.dialog)} {\n`
					+ `${dialogString}\n`
					+ "	}\n"
			} else {
				stringed += mgs.actionToNatlang(action) + '\n';
			}
			var actionComments = mgs.actionToNatlangComments(action);
			if (actionComments) {
				stringed += actionComments + '\n';
			}
		})
		stringed += '}'
		return stringed;
	})
	naiveString += scriptStrings.join('\n\n');
	var totalDialogNames = Object.keys(handledDialogObj.dialogs);
	var unhandledDialogNames = totalDialogNames.filter(function (dialogName) {
			return !handledDialogNames.includes(dialogName);
		})
	var unhandledDialogStrings = [];
	unhandledDialogNames.forEach(function (dialogName) {
		var insert = `dialog ${mgs.makeStringSafe(dialogName)} {\n`
		insert += handledDialogObj.dialogs[dialogName] + '\n';
		insert += `}`
		unhandledDialogStrings.push(insert);
	})
	if (unhandledDialogStrings.length) {
		naiveString += '\n\n' + unhandledDialogStrings.join('\n');
	}
	return naiveString;
}

mgs.natlangFormatter = function (string, config) {
	config = config || {}
	if (config.simpleGoto) {
		string = string.replace(/goto script/g,"goto");
	}
	if (config.simpleCopy) {
		string = string.replace(/copy script/g,"copy");
	}
	if (config.splitThen) {
		string = string.replace(/ then goto/g,"\n\t\tthen goto");
	}
	if (config.altIndent && typeof config.altIndentChar === "string") {
		string = string.replace(/\t/g,config.altIndentChar);
	}
	if (config.nestledAlign) {
		string = string.replace(/\n(\s)*alignment TOP_RIGHT/g," alignment TOP_RIGHT");
		string = string.replace(/\n(\s)*alignment BOTTOM_RIGHT/g," alignment BOTTOM_RIGHT");
		string = string.replace(/\n(\s)*alignment TOP_LEFT/g," alignment TOP_LEFT");
		string = string.replace(/\n(\s)*alignment BOTTOM_LEFT/g," alignment BOTTOM_LEFT");
	}
	if (config.shortAlign) {
		string = string.replace(/TOP_RIGHT/g,"TR");
		string = string.replace(/BOTTOM_RIGHT/g,"BR");
		string = string.replace(/TOP_LEFT/g,"TL");
		string = string.replace(/BOTTOM_LEFT/g,"BL");
	}
	return string;
}

if (typeof module === 'object') {
	module.exports = mgs;
}
