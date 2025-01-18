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


// `captures` and `unusedLabels` use shift/unshift! Everything else uses pop/push!
// (though `nodes` doesn't, so if I'm having helper functions do that stuff anyway, should I change it back?)

// for error recovery... ooh, what if each pattern also had an error recovery function??
const dictionary = {
	document: {
		pattern: `@root* $EOF`
	},
	root: {
		pattern: `@include_macro
			| @constant_assignment
			| @add_serial_dialog_settings
			| @add_dialog_settings
			| @dialog_definition
			| @serial_dialog_definition
		`,
	},
	include_macro: {
		pattern: `'include' '!' '(' $quoted_string:fileName? ')'`,
		onMatch: (state, crawlState, startPos) => {
			const fileNameCapture = mostRecentCapture(crawlState, 'fileName');
			if (fileNameCapture) {
				state.nodes.push({
					node: 'include_macro',
					value: fileNameCapture.value,
					tokenPos: fileNameCapture.pos,
				});
			} else {
				state.warnings.push({
					value: 'Include macro lacks a filename',
					message: 'Nothing will break, but this is useless in practice. Maybe put a file name in there!',
					pos: crawlState.tokenPos,
				});
				state.nodes.push({
					node: 'include_macro',
					value: '',
					tokenPos: startPos,
					ignorable: true,
				});
			}
		},
	},
	constant_assignment: {
		pattern: `$constant:constantName>constantNames '=' @constant_value:constantValue ';'`,
		onMatch: (state, crawlState, startPos) => {
			const valueCapture = mostRecentCapture(crawlState, 'constantValue');
			const nameCapture = mostRecentCapture(crawlState, 'constantName');
			state.nodes.push({
				node: 'constant_assignment',
				label: nameCapture.value,
				value: valueCapture.value,
				tokenPos: startPos,
			});
		},
	},
	constant_value: {
		pattern: `$constant<constantNames | $boolean | $quoted_string | $bareword
			| $number | $duration | $distance | $color | $quantity`,
	},
	add_serial_dialog_settings: {
		pattern: `'add' 'serial_dialog' 'settings' '{' @serial_dialog_parameter* '}'`,
		onMatch: (state, _crawlState, startPos) => {
			state.nodes.push({
				node: 'add_serial_dialog_settings',
				settings: mostRecentNodes(state, 'serial_dialog_parameter', 0, Infinity),
				tokenPos: startPos,
			});
		},
	},
	serial_dialog_parameter: {
		pattern: `'wrap':property $number:value`,
		onMatch: (state, crawlState, startPos) => {
			const valueCapture = semiRecentCapture(crawlState, 'value');
			const propertyCapture = semiRecentCapture(crawlState, 'property');
			state.nodes.push({
				node: 'serial_dialog_parameter',
				label: propertyCapture.value,
				value: valueCapture.value,
				tokenPos: startPos,
			});
		},
	},
	add_dialog_settings: {
		pattern: `'add' 'dialog' 'settings' '{' @dialog_settings_target* '}'`,
	},
	dialog_settings_target: {
		pattern: `'default':target '{' @dialog_parameter* '}'
			| 'label':target $bareword:targetValue '{' @dialog_parameter* '}'
			| 'entity':target $string:targetValue '{' @dialog_parameter* '}'`,
		onMatch: (state, crawlState, startPos) => {
			const settings = mostRecentNodes(state, 'dialog_parameter', 0, Infinity);
			const targetValueCapture = mostRecentCaptures(crawlState, 'targetValue', 0, 1);
			const targetValue = targetValueCapture ? targetValueCapture.value : 'default';
			const target = mostRecentCapture(crawlState, 'target');
			const entry = {
				node: 'add_dialog_settings',
				target: target.value,
				targetValue,
				settings,
				tokenPos: startPos,
			};
			state.nodes.push(entry);
		},
	},
	enum_alignment: {
		pattern: `'TOP_RIGHT' | 'TOP_LEFT' | 'TR' | 'TL'
			| 'BOTTOM_RIGHT' | 'BOTTOM_LEFT' | 'BR' | 'BL'`,
	},
	dialog_parameter: {
		pattern: `'entity':settingsProperty $string:settingsValue<>entityNames
			| 'name':settingsProperty $string:settingsValue
			| 'portrait':settingsProperty $string:settingsValue<portraitNames
			| 'alignment':settingsProperty @enum_alignment:settingsValue
			| 'border_tileset':settingsProperty $string:settingsValue
			| 'emote':settingsProperty $number:settingsValue
			| 'wrap':settingsProperty $number:settingsValue`,
		onMatch: (state, crawlState, startPos) => {
			const valueCapture = mostRecentCapture(crawlState, 'settingsValue');
			const propertyCapture = mostRecentCapture(crawlState, 'settingsProperty');
			state.nodes.push({
				node: 'dialog_parameter',
				label: propertyCapture.value,
				value: valueCapture.value,
				tokenPos: startPos,
			});
		},
	},
	dialog_definition: {
		pattern: `'dialog' $string:dialogName '{' @dialog* '}'`,
		onMatch: (state, crawlState, startPos) => {
			const dialogs = mostRecentNodes(state, 'dialog', 0, Infinity);
			const dialogNameCapture = mostRecentCapture(crawlState, 'dialogName');
			state.nodes.push({
				node: 'dialog_definition',
				dialogName: dialogNameCapture.value,
				dialogs,
				tokenPos: startPos,
			});
		},
	},
	dialog: {
		pattern: `@dialog_identifier
			@dialog_parameter*
			$string:dialogMessage+
			@dialog_option*`,
			onMatch: (state, crawlState, startPos) => {
				const optionCaptures = mostRecentNodes(state, 'dialog_option', 0, Infinity);
				const messageCaptures = mostRecentCaptures(crawlState, 'dialogMessage', 1, Infinity);
				const parameterCaptures = mostRecentNodes(state, 'dialog_parameter', 0, Infinity);
				const identifierCapture = mostRecentNode(state, 'dialog_identifier');
				state.nodes.push({
					node: 'dialog',
					identifier: identifierCapture,
					parameters: parameterCaptures,
					messages: messageCaptures.reverse(),
					options: optionCaptures,
					tokenPos: startPos,
				});
			},
		},
	dialog_identifier: {
		pattern: `'entity':identifierType $string:identifierValue
			| 'name':identifierType $string:identifierValue
			| $bareword:identifierValue`,
		onMatch: (state, crawlState, startPos) => {
			const identifierValueCapture = mostRecentCapture(crawlState, 'identifierValue');
			const identifierTypeCapture = mostRecentCaptures(crawlState, 'identifierType', 0, 1);
			state.nodes.push({
				node: 'dialog_identifier',
				type: identifierTypeCapture.length > 0 ? identifierTypeCapture[0].value : 'label',
				value: identifierValueCapture.value,
				tokenPos: startPos,
			});
		},
	},
	dialog_option: {
		pattern: `'>' $quoted_string:label '=' $string:script`,
		onMatch: (state, crawlState, startPos) => {
			const scriptNameCapture = mostRecentCapture(crawlState, 'script');
			const labelNameCapture = mostRecentCapture(crawlState, 'label');
			state.nodes.push({
				node: 'dialog_option',
				label: labelNameCapture.value,
				script: scriptNameCapture.value,
				tokenPos: startPos,
			});
		},
	},

	// current
	serial_dialog_definition: {
		pattern: `'serial_dialog' $string:serialDialogName '{' @serial_dialog? '}'`,
		onMatch: (state, crawlState, startPos) => {
			const serialDialog = mostRecentNode(state, 'serial_dialog', 0, 1);
			const serialDialogNameCapture = mostRecentCapture(crawlState, 'serialDialogName');
			state.nodes.push({
				node: 'serial_dialog_definition',
				dialogName: serialDialogNameCapture.value,
				serialDialog,
				tokenPos: startPos,
			});
		},
	},
	serial_dialog: {
		pattern: `@serial_dialog_parameter* $string:serialDialogMessage+ @serial_dialog_option*`,
			onMatch: (state, crawlState, startPos) => {
				const optionCaptures = mostRecentNodes(state, 'serial_dialog_option', 0, Infinity);
				const messageCaptures = mostRecentCaptures(crawlState, 'serialDialogMessage', 1, Infinity);
				const parameterCaptures = mostRecentNodes(state, 'serial_dialog_parameter', 0, Infinity);
				state.nodes.push({
					node: 'serial_dialog',
					parameters: parameterCaptures,
					messages: messageCaptures.reverse(),
					options: optionCaptures,
					tokenPos: startPos,
				});
			},
		},
	serial_dialog_option: {
		pattern: `'#':optionType $quoted_string:label '=' $string:script
			| '_':optionType $quoted_string:label '=' $string:script`,
		onMatch: (state, crawlState, startPos) => {
			const scriptNameCapture = mostRecentCapture(crawlState, 'script');
			const labelNameCapture = mostRecentCapture(crawlState, 'label');
			const optionTypeCapture = mostRecentCapture(crawlState, 'optionType');
			let type = '';
			if (optionTypeCapture.value === '#') type = 'options';
			if (optionTypeCapture.value === '_') type = 'text_options';
			state.nodes.push({
				node: 'serial_dialog_option',
				type,
				label: labelNameCapture.value,
				script: scriptNameCapture.value,
				tokenPos: startPos,
			});
		},
	},
	// untested:
	entity_identifier: {
		pattern: `'player':entityIdentifierType
			| 'self':entityIdentifierType
			| 'entity':entityIdentifierType $string:entityName`,
		onMatch: (state, crawlState, startPos) => {
			const entityNameCapture = mostRecentCaptures(crawlState, 'entityName', 0, 1);
			const entityIdentifierType = mostRecentCapture(crawlState, 'entityIdentifierType');
			let entityName = '';
			if (entityIdentifierType.value === 'self') entityName = '%SELF%';
			else if (entityIdentifierType.value === 'player') entityName = '%PLAYER%';
			else entityName = entityNameCapture[0].entityName
			state.nodes.push({
				node: 'entity_identifier',
				value: entityName,
				tokenPos: startPos,
			});
		}
	},
	geometry_identifier: {
		pattern: `'geometry' $string:geometryName`,
	},
	enum_map_slots: {
		pattern: `'on_load' | 'on_tick' | 'on_look'`,
	},
	enum_entity_slots: {
		pattern: `'on_interact' | 'on_tick' | 'on_look'`,
	},
	enum_save_slots: {
		pattern: `'1' | '2' | '3'`,
	},
	enum_nsew: {
		pattern: `'north' | 'south' | 'east' | 'west'`,
	},
	enum_lights: {
		pattern: `'LED_XOR' | 'LED_ADD' | 'LED_SUB' | 'LED_PAGE'
			| 'LED_BIT128' | 'LED_BIT64' | 'LED_BIT32' | 'LED_BIT16'
			| 'LED_BIT8' | 'LED_BIT4' | 'LED_BIT2' | 'LED_BIT1'
			| 'LED_MEM0' | 'LED_MEM1' | 'LED_MEM2' | 'LED_MEM3'
			| 'LED_HAX' | 'LED_USB' | 'LED_SD' | 'LED_ALL'`,
	},
	enum_buttons: {
		pattern: `'MEM0' | 'MEM1' | 'MEM2' | 'MEM3' | 'XOR' | 'ADD' | 'SUB' | 'PAGE'
			| 'BIT128' | 'BIT64' | 'BIT32' | 'BIT16' | 'BIT8' | 'BIT4' | 'BIT2' | 'BIT1'
			| 'LJOY_CENTER' | 'LJOY_UP' | 'LJOY_DOWN' | 'LJOY_LEFT' | 'LJOY_RIGHT'
			| 'RJOY_CENTER' | 'RJOY_UP' | 'RJOY_DOWN' | 'RJOY_LEFT' | 'RJOY_RIGHT'
			| 'TRIANGLE' | 'X' | 'CROSS' | 'O' | 'CIRCLE' | 'SQUARE' | 'HAX' | 'ANY'`,
	},
	enum_entity_field: {
		pattern: `'x' | 'y' | 'primary_id' | 'secondary_id' | 'primary_id_type'
			| 'interact_script_id' | 'tick_script_id' | 'look_script_id'
			| 'current_animation' | 'current_frame' | 'direction' | 'path_id'`,
	},

};

const onMatch = {};
const patterns = {};

Object.keys(dictionary).forEach(entryName=>{
	const entry = dictionary[entryName];
	if (entry.pattern) patterns[entryName] = entry.pattern;
	if (entry.onMatch) onMatch[entryName] = entry.onMatch;
});

const semiRecentCaptures = (crawlState, captureLabel, min = 1, max = min) => {
	// skip the irrelevant ones by setting them aside for a second
	const top = [];
	while (
		crawlState.captures[0]
		&& crawlState.captures[0].label !== captureLabel
	) {
		top.push(crawlState.captures.shift())
	}
	// collect the ones we want
	const extracted = [];
	for (let i = min || 1; i <= max; i++) {
		const latest = crawlState.captures[0];
		if (!latest) break;
		if (latest.label !== captureLabel) break;
		extracted.push(crawlState.captures.shift());
	}
	if (extracted.length < min) {
		const message = `Not enough captures labeled ${captureLabel};`
			+`found ${extracted.length}, needed at least ${min}`;
		throw new Error (message);
	}
	// put the skipped ones back
	crawlState.captures = top.concat(crawlState.captures);
	return extracted;
};
const semiRecentCapture = (crawlState, captureLabel) => {
	const extracted = semiRecentCaptures(crawlState, captureLabel, 1);
	return extracted ? extracted[0] : false;
};
const mostRecentCaptures = (crawlState, captureLabel, min = 1, max = min) => {
	const extracted = [];
	for (let i = min || 1; i <= max; i++) {
		const latest = crawlState.captures[0];
		if (!latest) break;
		if (latest.label !== captureLabel) break;
		extracted.push(crawlState.captures.shift());
	}
	if (extracted.length < min) {
		const message = `Not enough captures labeled ${captureLabel};`
			+`found ${extracted.length}, needed at least ${min}`;
		throw new Error (message);
	}
	return extracted;
};
const mostRecentCapture = (crawlState, captureLabel) => {
	const extracted = mostRecentCaptures(crawlState, captureLabel, 1);
	return extracted ? extracted[0] : false;
};

const mostRecentNodes = (state, nodeName, min = 1, max = min) => {
	const extracted = [];
	for (let i = min || 1; i <= max; i++) {
		const latest = state.nodes[state.nodes.length-1];
		if (!latest) break;
		if (latest.node !== nodeName) break;
		extracted.unshift(state.nodes.pop());
	}
	if (extracted.length < min) {
		const message = `Not enough ${nodeName} nodes;`
			+`found ${extracted.length}, needed at least ${min}`;
		throw new Error (message);
	}
	return extracted;
};
const mostRecentNode = (state, nodeName) => {
	const extracted = mostRecentNodes(state, nodeName, 1);
	return extracted ? extracted[0] : false;
};

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

// const parsedPatterns = { // generated from `patterns`, to be rebuilt each time; here for refernced purposes only
//   document: [
//     [
//       { rep: "*", type: "lookup", value: "root", original: "@root*", },
//       { rep: "", type: "capture", value: "EOF", original: "$EOF", },
//     ],
//   ],
//   root: [
//     [
//       { rep: "", type: "lookup", value: "include_macro", original: "@include_macro", },
//     ],
//     [
//       { rep: "", type: "lookup", value: "constant_assignment", original: "@constant_assignment", },
//     ],
//   ],
//   include_macro: [
//     [
//       { rep: "", type: "literal", value: "include", original: "'include'", },
//       { rep: "", type: "literal", value: "!", original: "'!'", },
//       { rep: "", type: "literal", value: "(", original: "'('", },
//       { rep: "?", type: "capture", value: "quoted_string", label: "fileName", original: "$quoted_string:fileName?", },
//       { rep: "", type: "literal", value: ")", original: "')'", },
//     ],
//   ],
//   constant_assignment: [
//     [
//       { rep: "", type: "capture", value: "constant", label: "constantName", toCollection: "constantNames", original: "$constant:constantName>constantNames", },
//       { rep: "", type: "literal", value: "=", original: "'='", },
//       { rep: "", type: "lookup", value: "constant_value", label: "constantValue", original: "@constant_value:constantValue", },
//       { rep: "", type: "literal", value: ";", original: "';'", },
//     ],
//   ],
//   constant_value: [
//     [
//       { rep: "", type: "capture", value: "constant", autoComplete: "constantNames", original: "$constant<constantNames", },
//     ],
//     [
//       { rep: "", type: "capture", value: "boolean", original: "$boolean", },
//     ],
//     [
//       { rep: "", type: "capture", value: "quoted_string", original: "$quoted_string", },
//     ],
//     [
//       { rep: "", type: "capture", value: "bareword", original: "$bareword", },
//     ],
//     [
//       { rep: "", type: "capture", value: "number", original: "$number", },
//     ],
//     [
//       { rep: "", type: "capture", value: "duration", original: "$duration", },
//     ],
//     [
//       { rep: "", type: "capture", value: "distance", original: "$distance", },
//     ],
//     [
//       { rep: "", type: "capture", value: "color", original: "$color", },
//     ],
//     [
//       { rep: "", type: "capture", value: "quantity", original: "$quantity", },
//     ],
//     [
//       { rep: "", type: "lookup", value: "enum_alignment", original: "@enum_alignment", },
//     ],
//   ],
//   enum_alignment: [
//     [
//       { rep: "", type: "literal", value: "TR", original: "'TR'", },
//     ],
//     [
//       { rep: "", type: "literal", value: "BR", original: "'BR'", },
//     ],
//     [
//       { rep: "", type: "literal", value: "TL", original: "'TL'", },
//     ],
//     [
//       { rep: "", type: "literal", value: "BL", original: "'BL'", },
//     ],
//     [
//       { rep: "", type: "literal", value: "TOP_RIGHT", original: "'TOP_RIGHT'", },
//     ],
//     [
//       { rep: "", type: "literal", value: "BOTTOM_RIGHT", original: "'BOTTOM_RIGHT'", },
//     ],
//     [
//       { rep: "", type: "literal", value: "TOP_LEFT", original: "'TOP_LEFT'", },
//     ],
//     [
//       { rep: "", type: "literal", value: "BOTTOM_LEFT", original: "'BOTTOM_LEFT'", },
//     ],
//   ],
// };

// // CONDITIONS

// const conditions = [

// 	{
// 		action: 'CHECK_DEBUG_MODE',
// 		pattern: `'debug_mode'`,
// 		type: 'boolean',
// 	},
// 	{
// 		action: 'CHECK_SAVE_FLAG',
// 		pattern: `$string:flagName<>flagNames`,
// 		type: 'boolean',
// 	},
// 	{
// 		action: 'CHECK_ENTITY_GLITCHED',
// 		pattern: `@entity_identifier 'glitched'`,
// 		type: 'boolean',
// 	},
// 	{
// 		action: 'CHECK_DIALOG_OPEN',
// 		pattern: `'dialog' 'open'`,
// 		type: 'boolean',
// 	},
// 	{
// 		action: 'CHECK_SERIAL_DIALOG_OPEN',
// 		pattern: `'serial_dialog' 'open'`,
// 		type: 'boolean',
// 	},
// 	{
// 		action: 'CHECK_FOR_BUTTON_STATE',
// 		pattern: `'button' $enum_button:buttonName 'down'`,
// 		type: 'boolean',
// 	},
// 	{
// 		action: 'CHECK_FOR_BUTTON_STATE',
// 		pattern: `'button' $enum_button:buttonName 'up'`,
// 		type: 'boolean',
// 	},
// 	{
// 		action: 'CHECK_FOR_BUTTON_PRESS',
// 		pattern: `'button' $enum_button:buttonName 'pressed'`,
// 		type: 'boolean',
// 	},
// 	{
// 		action: 'CHECK_IF_ENTITY_IS_IN_GEOMETRY',
// 		pattern: `@entity_identifier 'intersects' @geometry_identifier`,
// 		type: 'boolean',
// 	},
// ];


console.log('break');

const language = { tree, onMatch };

export default language;
