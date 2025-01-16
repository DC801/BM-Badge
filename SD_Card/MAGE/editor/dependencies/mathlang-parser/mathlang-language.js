const patterns = {
	document: `@root* $EOF`,
	root: `@include_macro
		| @constant_assignment
		| @add_serial_dialog_settings
		| @add_dialog_settings
	`,
	include_macro: `'include' '!' '(' $quoted_string:fileName? ')'`,
	constant_assignment: `$constant:constantName>constantNames
		'=' @constant_value:constantValue ';'`,
	constant_value: `$constant<constantNames
		| $boolean
		| $quoted_string | $bareword
		| $number | $duration | $distance | $color | $quantity`,
	enum_alignment: `'TR' | 'BR' | 'TL' | 'BL'
		| 'TOP_RIGHT' | 'BOTTOM_RIGHT' | 'TOP_LEFT' | 'BOTTOM_LEFT'`,
	add_serial_dialog_settings: `'add' 'serial_dialog' 'settings' '{'
			@serial_dialog_parameter*
		'}'`,
	serial_dialog_parameter: `'wrap':property $number:value`,
	// adding new:
	add_dialog_settings: `'add' 'dialog' 'settings' '{'
		@dialog_settings_target*
	'}'`,
	dialog_settings_target: `'default':target '{' @dialog_parameter* '}'
	| 'label':dialogSettingsTarget $bareword:dialogSettingsTargetValue '{' @dialog_parameter* '}'
	| 'entity':dialogSettingsTarget $string:dialogSettingsTargetValue '{' @dialog_parameter* '}'
	`,
	dialog_parameter: `
		'entity':dialogSettingsProperty $string:dialogSettingsValue<>entityNames
		| 'name':dialogSettingsProperty $string:dialogSettingsValue
		| 'portrait':dialogSettingsProperty $string:dialogSettingsValue<portraitNames
		| 'alignment':dialogSettingsProperty @enum_alignment:dialogSettingsValue
		| 'border_tileset':dialogSettingsProperty $string:dialogSettingsValue
		| 'emote':dialogSettingsProperty $number:dialogSettingsValue
		| 'wrap':dialogSettingsProperty $number:dialogSettingsValue
	`,

	// for later (test these):
	enum_lights: `'LED_XOR' | 'LED_ADD' | 'LED_SUB' | 'LED_PAGE'
		| 'LED_BIT128' | 'LED_BIT64' | 'LED_BIT32' | 'LED_BIT16'
		| 'LED_BIT8' | 'LED_BIT4' | 'LED_BIT2' | 'LED_BIT1'
		| 'LED_MEM0' | 'LED_MEM1' | 'LED_MEM2' | 'LED_MEM3'
		| 'LED_HAX' | 'LED_USB' | 'LED_SD' | 'LED_ALL'`,
	enum_buttons: `'MEM0' | 'MEM1' | 'MEM2' | 'MEM3'
		| 'BIT128' | 'BIT64' | 'BIT32' | 'BIT16'
		| 'BIT8' | 'BIT4' | 'BIT2' | 'BIT1'
		| 'XOR' | 'ADD' | 'SUB' | 'PAGE'
		| 'LJOY_CENTER' | 'LJOY_UP' | 'LJOY_DOWN'
		| 'LJOY_LEFT' | 'LJOY_RIGHT'
		| 'RJOY_CENTER' | 'RJOY_UP' | 'RJOY_DOWN'
		| 'RJOY_LEFT' | 'RJOY_RIGHT'
		| 'TRIANGLE' | 'X' | 'CROSS' | 'O' | 'CIRCLE'
		| 'SQUARE' | 'HAX' | 'ANY'`,
	enum_map_slots: `'on_load' | 'on_tick' | 'on_look'`,
	enum_entity_slots: `'on_interact' | 'on_tick' | 'on_look'`,
	enum_save_slots: `'1' | '2' | '3'`,
	enum_nsew: `'north' | 'south' | 'east' | 'west'`,
	enum_entity_field: `'x' | 'y'
		| 'primary_id' | 'secondary_id' | 'primary_id_type'
		| 'interact_script_id' | 'tick_script_id' | 'look_script_id'
		| 'current_animation' | 'current_frame' | 'direction' | 'path_id'`,
};

// CONSTRAINTS (for now)
// Each entry is linear apart from `|`, which means that any of the "split" phrases will trigger as a match for that pattern
// Phrases cannot be built up from more complicated logic than this; no `()` indicating subphrase splits, etc.
// Every "word" is a single unit of token logic within its larger pattern
// WORD TYPES
// 'literal' = aka terminal; must literally match the token value (no matter what type the token says it is)
// @lookup = aka nonterminal; a reference to another pattern
// $token_literal = any base-level token; the value of that token is captured and labeled either at that token or at the "caller" token (not sure what to do if there's more than one captured token when that label tries to label things (TODO: maybe just add multiple captures with that label? The captures are an array, not an object, after all))
// WORD MODIFIERS
// :label = any captures in that pattern (or any refernced pattern) will be called this in the output handed up
// <collectionName = the token value can be autocompleted from a "collection", e.g. `entityNames`
// >collectionName = the token value populates a "collection", which is used for autocompletion
// <>collectionName = counts as both '<' and '>' at the same time
// ><collectionName = (same as above)
// WORD repitition
// no repitition mark means there must be one token that matches exactly
// ? = 0-1; proceed even if missing
// + = 1+; must match at least once, but can be multiple
// * = 0+; can be zero matches, or can be an unlimited number of matches

// auditing the above pattern dictionary structure
const keywordsFound = new Set();
const patternLookupsFound = new Set();
const tokenTypesFound = new Set();
const collectionsFound = new Set();
const capturesIdentified = {};
const getWordReport = (word, patternName) => {
	const literal = word.match(/^'(.+?)'/);
	const remainder = literal
		? word.replace(literal[0], '')
		: word;
	const fragments = remainder.length > 0
		? remainder.split(/\b/g)
		: [];
	const token = {
		original: word,
		rep: '',
		type: literal ? 'literal' : '',
		value: literal ? literal[1] : '',
	}
	if (
		fragments[fragments.length-1] === '?'
		|| fragments[fragments.length-1] === '*'
		|| fragments[fragments.length-1] === '+'
	) {
		token.rep = fragments.pop();
	}
	while (fragments.length > 0) {
		if (fragments.length % 2 !== 0) {
			throw new Error("Subpattern not built up from pairs: " + word);
		}
		const left = fragments.shift();
		const right = fragments.shift();
		if (!/[a-zA-Z_]+/.test(right)) {
			throw new Error("Right half is not a word: " + left + right);
		}
		if (left === '$') {
			token.type = 'capture';
			token.value = right;
			tokenTypesFound.add(right);
		} else if (left === '@') {
			token.type = 'lookup';
			token.value = right;
			patternLookupsFound.add(right);
		} else if (left === ":") {
			token.label = right;
			capturesIdentified[patternName] = capturesIdentified[patternName] || [];
			capturesIdentified[patternName].push(word);
		}
		if (left.includes("<")) {
			collectionsFound.add(right);
			token.autoComplete = right;
		}
		if (left.includes(">")) {
			collectionsFound.add(right);
			token.toCollection = right;
		}
		if (token.type === '') throw new Error("Unknown token sigil: " + left + right);
	}
	return token;
};

const tree = {};
Object.entries(patterns).forEach(([patternName, pattern])=>{
	const allTokenPatterns = [];
	const splits = pattern.trim()
		.split('|')
		.map(str=>str.trim());
	splits.forEach(subpattern=>{
		const words = subpattern.split(/[\t\n\s]+/g).map(item=>getWordReport(item,patternName));
		allTokenPatterns.push(words);
	});
	tree[patternName] = allTokenPatterns;
});

const parsedPatterns = { // generated from `patterns`, to be rebuilt each time; here for refernced purposes only
  document: [
    [
      { rep: "*", type: "lookup", value: "root", original: "@root*", },
      { rep: "", type: "capture", value: "EOF", original: "$EOF", },
    ],
  ],
  root: [
    [
      { rep: "", type: "lookup", value: "include_macro", original: "@include_macro", },
    ],
    [
      { rep: "", type: "lookup", value: "constant_assignment", original: "@constant_assignment", },
    ],
  ],
  include_macro: [
    [
      { rep: "", type: "literal", value: "include", original: "'include'", },
      { rep: "", type: "literal", value: "!", original: "'!'", },
      { rep: "", type: "literal", value: "(", original: "'('", },
      { rep: "?", type: "capture", value: "quoted_string", label: "fileName", original: "$quoted_string:fileName?", },
      { rep: "", type: "literal", value: ")", original: "')'", },
    ],
  ],
  constant_assignment: [
    [
      { rep: "", type: "capture", value: "constant", label: "constantName", toCollection: "constantNames", original: "$constant:constantName>constantNames", },
      { rep: "", type: "literal", value: "=", original: "'='", },
      { rep: "", type: "lookup", value: "constant_value", label: "constantValue", original: "@constant_value:constantValue", },
      { rep: "", type: "literal", value: ";", original: "';'", },
    ],
  ],
  constant_value: [
    [
      { rep: "", type: "capture", value: "constant", autoComplete: "constantNames", original: "$constant<constantNames", },
    ],
    [
      { rep: "", type: "capture", value: "boolean", original: "$boolean", },
    ],
    [
      { rep: "", type: "capture", value: "quoted_string", original: "$quoted_string", },
    ],
    [
      { rep: "", type: "capture", value: "bareword", original: "$bareword", },
    ],
    [
      { rep: "", type: "capture", value: "number", original: "$number", },
    ],
    [
      { rep: "", type: "capture", value: "duration", original: "$duration", },
    ],
    [
      { rep: "", type: "capture", value: "distance", original: "$distance", },
    ],
    [
      { rep: "", type: "capture", value: "color", original: "$color", },
    ],
    [
      { rep: "", type: "capture", value: "quantity", original: "$quantity", },
    ],
    [
      { rep: "", type: "lookup", value: "enum_alignment", original: "@enum_alignment", },
    ],
  ],
  enum_alignment: [
    [
      { rep: "", type: "literal", value: "TR", original: "'TR'", },
    ],
    [
      { rep: "", type: "literal", value: "BR", original: "'BR'", },
    ],
    [
      { rep: "", type: "literal", value: "TL", original: "'TL'", },
    ],
    [
      { rep: "", type: "literal", value: "BL", original: "'BL'", },
    ],
    [
      { rep: "", type: "literal", value: "TOP_RIGHT", original: "'TOP_RIGHT'", },
    ],
    [
      { rep: "", type: "literal", value: "BOTTOM_RIGHT", original: "'BOTTOM_RIGHT'", },
    ],
    [
      { rep: "", type: "literal", value: "TOP_LEFT", original: "'TOP_LEFT'", },
    ],
    [
      { rep: "", type: "literal", value: "BOTTOM_LEFT", original: "'BOTTOM_LEFT'", },
    ],
  ],
};

console.log('break');
