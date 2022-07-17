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

var testTokens = [
	[ 'block', '1ms' ],
	[ 'camera', 'follow', 'entity', '"Entity Name"' ],
	[ 'close', 'hex', 'editor' ],
	[ 'open', 'hex', 'editor' ],
	[ 'rotate', 'entity', '"Entity Name"', '1' ],
	[ 'erase', 'slot', '2' ],
	[ 'goto', '"script-to-run"' ],
	[ 'loop', 'entity', '"Entity Name"', 'along', 'geometry', '"geometry-name-loop"', 'over', '1000ms' ],
	[ 'save', 'slot' ],
	[ 'shake', 'camera', '1000ms', '30px', 'for', '4000ms' ],
	[ 'wait', '100000ms' ],
	[ 'walk', 'entity', '"Entity Name"', 'to', 'geometry', '"geometry-name-walk-to"', 'over', '1000ms' ],
	[ 'walk', 'entity', '"Entity Name"', 'along', 'geometry', '"geometry-name-walk-along"', 'over', '1000ms' ],
	[ 'make', 'entity', '"Entity Name"', 'glitched' ],
	[ 'make', 'entity', '"Entity Name"', 'unglitched' ],
	[ 'teleport', 'entity', '"Entity Name"', 'to', 'geometry', '"geometry-name-teleport"' ],
	[ 'teleport', 'camera', 'to', 'geometry', '"geometry-name-to-teleport"' ],
	[ 'turn', 'entity', '"Entity Name"', 'north' ],
	[ 'turn', 'entity', '"Entity Name"', 'toward', 'entity', '"Target Entity"' ],
	[ 'turn', 'entity', '"Entity Name"', 'toward', 'entity', '"target-geometry"' ],
	[ 'pan', 'camera', 'to', 'entity', '"Entity Name"', 'over', '1000ms' ],
	[ 'pan', 'camera', 'to', 'geometry', '"geometry-to-pan-camera"', 'over', '1000ms' ],
	[ 'play', 'entity', '"Entity Name"', 'animation', '0', 'x1' ],
	[ 'fade', 'out', 'camera', 'to', '#FF0000', 'over', '1000ms' ],
	[ 'fade', 'in', 'camera', 'from', '#00FF00', 'over', '1000ms' ],
	[ 'load', 'map', '"super-long-map-name"' ],
	[ 'load', 'slot', '0' ],
	[ 'show', 'dialog', '"super-long-dialog-name"' ],
	[ 'show', 'serial', 'dialog', '"serial-dialog"' ],
	[ 'copy', '"script-to-copy"' ],
	[ 'copy', 'entity', '"Entity Name"', 'x', 'into', 'variable', '"variable-name-inbound"' ],
	[ 'copy', 'entity', '"Entity Name"', 'y', 'from', 'variable', '"variable-name-outbound"' ],
	[ 'mutate', '"variable-name-set"', '=', '5' ],
	[ 'mutate', '"variable-name-add"', '+', '5' ],
	[ 'mutate', '"variable-name-sub"', '-', '5' ],
	[ 'mutate', '"variable-name-div"', '/', '5' ],
	[ 'mutate', '"variable-name-mul"', '*', '5' ],
	[ 'mutate', '"variable-name-mod"', '%', '5' ],
	[ 'mutate', '"variable-name-rng"', '?', '5' ],
	[ 'mutate', '"variable-name-set"', '=', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-add"', '+', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-sub"', '-', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-div"', '/', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-mul"', '*', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-mod"', '%', '"another-variable-name"' ],
	[ 'mutate', '"variable-name-rng"', '?', '"another-variable-name"' ],
	[ 'set', 'map', 'tick', 'script', 'to', '"script-map-tick"' ],
	[ 'set', 'warp', 'state', 'to', '"warp-state-string"' ],
	[ 'set', 'flag', '"save-flag-to-set"', 'to', 'true' ],
	[ 'set', 'flag', '"save-flag-to-set-NOT"', 'to', 'false' ],
	[ 'set', 'player', 'control', 'on' ],
	[ 'set', 'player', 'control', 'off' ],
	[ 'set', 'hex', 'dialog', 'mode', 'on' ],
	[ 'set', 'hex', 'dialog', 'mode', 'off' ],
	[ 'set', 'hex', 'control', 'on' ],
	[ 'set', 'hex', 'control', 'off' ],
	[ 'set', 'hex', 'clipboard', 'on' ],
	[ 'set', 'hex', 'clipboard', 'off' ],
	[ 'set', 'entity', '"Entity Name"', 'name', 'to', '"New Name"' ],
	[ 'set', 'entity', '"Entity Name"', 'x', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'y', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'type', 'to', '"some-kinda-sheep"' ],
	[ 'set', 'entity', '"Entity Name"', 'primaryID', 'to', '1' ],
	[ 'set', 'entity', '"Entity Name"', 'secondaryID', 'to', '2' ],
	[ 'set', 'entity', '"Entity Name"', 'primaryIDtype', 'to', '5' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateA', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateB', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateC', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateD', 'to', '128' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateAU2', 'to', '2' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateCU2', 'to', '2' ],
	[ 'set', 'entity', '"Entity Name"', 'hackableStateAU4', 'to', '4' ],
	[ 'set', 'entity', '"Entity Name"', 'path', 'to', '"geometry-name-entity-path"' ],
	[ 'set', 'entity', '"Entity Name"', 'animation', 'to', '0' ],
	[ 'set', 'entity', '"Entity Name"', 'animationFrame', 'to', '0' ],
	[ 'set', 'entity', '"Entity Name"', 'interactScript', 'to', '"script-entity-interact"' ],
	[ 'set', 'entity', '"Entity Name"', 'tickScript', 'to', '"script-entity-tick"' ],
	[ 'if', 'flag', '"i-am-a-save-flag"', 'is', 'true', 'goto', '"script-do-if-flag-true"' ],
	[ 'if', 'flag', '"i-am-a-save-flag"', 'is', 'false', 'goto', '"script-do-if-flag-false"' ],
	[ 'if', 'button', 'ANY', 'goto', '"script-do-if-button"' ],
	[ 'if', 'button', 'ANY', 'is', 'pressed', 'goto', '"script-do-if-button-state"' ],
	[ 'if', 'button', 'ANY', 'is', 'not', 'pressed', 'goto', '"script-do-if-button-state-NOT"' ],
	[ 'if', 'warp', 'state', 'is', '"warp-state-string"', 'goto', '"script-do-if-warp-state"' ],
	[ 'if', 'warp', 'state', 'is', 'not', '"warp-state-string"', 'goto', '"script-do-if-NOT-warp-state"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', '15', 'goto', '"script-do-if-variable-=="' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', '<', '15', 'goto', '"script-do-if-variable-<"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', 'not', '15', 'goto', '"script-do-if-variable-==-NOT"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', 'not', '<', '15', 'goto', '"script-do-if-variable-<-NOT"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', '"i-am-a-second-variable"', 'goto', '"script-do-if-variable-=="' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', '<', '"i-am-a-second-variable"', 'goto', '"script-do-if-variable-<"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', 'not', '"i-am-a-second-variable"', 'goto', '"script-do-if-variable-==-NOT"' ],
	[ 'if', 'variable', '"i-am-a-variable"', 'is', 'not', '<', '"i-am-a-second-variable"', 'goto', '"script-do-if-variable-<-NOT"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateAU4', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-a-u4"' ],
	[ 'if', 'entity', '"Entity Name"', 'name', 'is', '"Checked Name"', 'goto', '"script-do-if-entity-name"' ],
	[ 'if', 'entity', '"Entity Name"', 'x', 'is', '0', 'goto', '"script-do-if-entity-x"' ],
	[ 'if', 'entity', '"Entity Name"', 'interactScript', 'is', '"name-of-checked-script-interact"', 'goto', '"script-do-if-entity-y"' ],
	[ 'if', 'entity', '"Entity Name"', 'tickScript', 'is', '"name-of-checked-script-tick"', 'goto', '"script-do-if-entity-tick"' ],
	[ 'if', 'entity', '"Entity Name"', 'type', 'is', '"some-kind-of-entity-type"', 'goto', '"script-do-if-entity-type"' ],
	[ 'if', 'entity', '"Entity Name"', 'primaryID', 'is', '16', 'goto', '"script-do-if-entity-primaryid"' ],
	[ 'if', 'entity', '"Entity Name"', 'secondaryID', 'is', '16', 'goto', '"script-do-if-entity-secondaryid"' ],
	[ 'if', 'entity', '"Entity Name"', 'primaryIDtype', 'is', '16', 'goto', '"script-do-if-entity-primaryid-type"' ],
	[ 'if', 'entity', '"Entity Name"', 'animation', 'is', '1', 'goto', '"script-do-if-entity-animation"' ],
	[ 'if', 'entity', '"Entity Name"', 'animationFrame', 'is', '1', 'goto', '"script-do-if-entity-frame"' ],
	[ 'if', 'entity', '"Entity Name"', 'direction', 'is', 'north', 'goto', '"script-do-if-entity-direction"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateA', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-a"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateB', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-b"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateC', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-c"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateD', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-d"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateAU2', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-a-u2"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateCU2', 'is', '1', 'goto', '"script-do-if-entity-is-hackable-c-u2"' ],
	[ 'if', 'entity', '"Entity Name"', 'path', 'is', '"some-kind-of-geometry-name"', 'goto', '"script-do-if-entity-path"' ],
	[ 'if', 'entity', '"Entity Name"', 'name', 'is', 'not', '"Checked Name"', 'goto', '"script-do-if-entity-name"' ],
	[ 'if', 'entity', '"Entity Name"', 'x', 'is', 'not', '0', 'goto', '"script-do-if-entity-x"' ],
	[ 'if', 'entity', '"Entity Name"', 'interactScript', 'is', 'not', '"name-of-checked-script-interact"', 'goto', '"script-do-if-entity-y"' ],
	[ 'if', 'entity', '"Entity Name"', 'tickScript', 'is', 'not', '"name-of-checked-script-tick"', 'goto', '"script-do-if-entity-tick"' ],
	[ 'if', 'entity', '"Entity Name"', 'type', 'is', 'not', '"some-kind-of-entity-type"', 'goto', '"script-do-if-entity-type"' ],
	[ 'if', 'entity', '"Entity Name"', 'primaryID', 'is', 'not', '16', 'goto', '"script-do-if-entity-primaryid"' ],
	[ 'if', 'entity', '"Entity Name"', 'secondaryID', 'is', 'not', '16', 'goto', '"script-do-if-entity-secondaryid"' ],
	[ 'if', 'entity', '"Entity Name"', 'primaryIDtype', 'is', 'not', '16', 'goto', '"script-do-if-entity-primaryid-type"' ],
	[ 'if', 'entity', '"Entity Name"', 'animation', 'is', 'not', '1', 'goto', '"script-do-if-entity-animation"' ],
	[ 'if', 'entity', '"Entity Name"', 'animationFrame', 'is', 'not', '1', 'goto', '"script-do-if-entity-frame"' ],
	[ 'if', 'entity', '"Entity Name"', 'direction', 'is', 'not', 'north', 'goto', '"script-do-if-entity-direction"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateA', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-a"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateB', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-b"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateC', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-c"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateD', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-d"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateAU2', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-a-u2"' ],
	[ 'if', 'entity', '"Entity Name"', 'hackableStateCU2', 'is', 'not', '1', 'goto', '"script-do-if-entity-is-hackable-c-u2"' ],
	[ 'if', 'entity', '"Entity Name"', 'path', 'is', 'not', '"some-kind-of-geometry-name"', 'goto', '"script-do-if-entity-path"' ],
	[ 'if', 'entity', '"Entity Name"', 'is', 'glitched', 'goto', '"script-do-if-entity-is-glitched"' ],
	[ 'if', 'entity', '"Entity Name"', 'is', 'inside', 'geometry', '"some-kind-of-geometry-name"', 'goto', '"script-do-if-entity-path-inside"' ],
	[ 'if', 'entity', '"Entity Name"', 'is', 'not', 'glitched', 'goto', '"script-do-if-entity-is-glitched"' ],
	[ 'if', 'entity', '"Entity Name"', 'is', 'not', 'inside', 'geometry', '"some-kind-of-geometry-name"', 'goto', '"script-do-if-entity-path-inside"' ],
];
