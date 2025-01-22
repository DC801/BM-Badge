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

const dictionary = {
	document: {
		patterns: [{ body: `@root*`, end: `$EOF` }],
	},
	root: {
		patterns:
			`@include_macro`
			+ ` | @constant_assignment`
			+ ` | @add_serial_dialog_settings`
			+ ` | @add_dialog_settings`
			+ ` | @serial_dialog_definition`
			+ ` | @dialog_definition`
			+ ` | @script_definition`
	},
	include_macro: {
		patterns: [{
			// Match 'start' and it's a definite match.
			// Failures after this are considered to be this branch malformed, not a misidentified branch.
			start: `'include'`,
			body: `'!' '(' $quoted_string:fileName`,
			// If things are broken but you match 'end' you can put in a
			// placeholder node with the values you did get, plus {malformed:true}
			// then proceed as if it matched correctly.
			// Currently 'end' is only one token/word
			end: `')'`,
		}],
		onEnd: (file, crawlState) => {
			const value = mostRecentCapture(crawlState, 'fileName');
			const malformed = !value;
			file.nodes.push({
				node: 'include_macro',
				value: value?.value || '',
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
				malformed,
			});
		},
	},
	constant_assignment: {
		patterns: [{
				start: `$constant:constantName>constantNames`,
				body: `'=' @constant_value:constantValue`,
				end: `';'`,
			}],
		onEnd: (file, crawlState) => {
			const value = mostRecentCapture(crawlState, 'constantValue');
			const name = mostRecentCapture(crawlState, 'constantName');
			const malformed = !value || !name;
			file.nodes.push({
				node: 'constant_assignment',
				name: name?.value || '',
				value: value?.value || null,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
				malformed,
			});
		},
	},
	constant_value: {
		// in order of how common these are? should that matter?
		patterns: `$number | $bareword | $quoted_string
			| $boolean | $constant<constantNames
			| $duration | $quantity | $distance | $color`,
	},
	add_serial_dialog_settings: {
		patterns: [{
			start: `'add' 'serial_dialog'`,
			body: `'settings' '{' @serial_dialog_parameter*`,
			end: `'}'`,
		}],
		onStart: (file, crawlState) => {
			crawlState.staged.serialDialogParameters = [];
		},
		onEnd: (file, crawlState) => {
			const settings = crawlState.staged.serialDialogParameters;
			file.nodes.push({
				node: 'add_serial_dialog_settings',
				settings: settings,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			delete crawlState.staged.serialDialogParameters;
		},
	},
	serial_dialog_parameter: {
		patterns: [{
			start: `'wrap':property`,
			body: `$number:value`,
		}],
		onEnd: (file, crawlState) => {
			const value = mostRecentCapture(crawlState, 'value');
			const property = mostRecentCapture(crawlState, 'property');
			const malformed = !value || !property;
			crawlState.staged.serialDialogParameters.push({
				node: 'serial_dialog_parameter',
				property: property?.value || '',
				value: value?.value || null,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
				malformed,
			});
		},
	},
	add_dialog_settings: {
		patterns: [{
			start: `'add' 'dialog'`,
			body: `'settings' '{' @dialog_settings_target*`,
			end: `'}'`
		}],
		onStart: (file, crawlState) => {
			crawlState.staged.dialogSettings = [];
		},
		onEnd: (file, crawlState) => {
			const settings = crawlState.staged.dialogSettings;
			file.nodes.push({
				node: 'add_dialog_settings',
				settings: settings,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			delete crawlState.staged.dialogSettingsTarget;
		},
	},
	dialog_settings_target: {
		patterns: [
			{
				start: `'default':target`,
				body: `'{' @dialog_parameter*`,
				end: `'}'`
			},
			{
				start: `'label':target`,
				body: `$bareword:targetValue '{' @dialog_parameter*`,
				end: `'}'`
			},
			{
				start: `'entity':target`,
				body: `$string:targetValue '{' @dialog_parameter*`,
				end: `'}'`
			},
		],
		onStart: (file, crawlState) => {
			crawlState.staged.dialogParameters = [];
		},
		onEnd: (file, crawlState) => {
			const targetValue = mostRecentCapture(crawlState, 'targetValue');
			const target = mostRecentCapture(crawlState, 'target');
			crawlState.staged.dialogSettings.push({
				node: 'add_dialog_settings_target',
				targetType: target?.value || '',
				targetValue: targetValue?.value || null,
				settings: crawlState.staged.dialogParameters,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			delete crawlState.staged.dialogParameters;
		},
	},
	enum_alignment: {
		patterns: `'TOP_RIGHT':settingsValue | 'TR':settingsValue
			| 'TOP_LEFT':settingsValue | 'TL':settingsValue
			| 'BOTTOM_RIGHT':settingsValue | 'BR':settingsValue
			| 'BOTTOM_LEFT':settingsValue | 'BL':settingsValue`,
	},
	dialog_parameter: {
		patterns: [
			{ start:`'entity':settingsProperty`, body: `$string:settingsValue<>entityNames` },
			{ start:`'name':settingsProperty`, body: `$string:settingsValue` },
			{ start:`'portrait':settingsProperty`, body: `$string:settingsValue<portraitNames` },
			{ start:`'alignment':settingsProperty`, body: `@enum_alignment` },
			{ start:`'border_tileset':settingsProperty`, body: `$string:settingsValue` },
			{ start:`'emote':settingsProperty`, body: `$number:settingsValue` },
			{ start:`'wrap':settingsProperty`, body: `$number:settingsValue` },
		],
		onEnd: (file, crawlState) => {
			const value = mostRecentCapture(crawlState, 'settingsValue');
			const property = mostRecentCapture(crawlState, 'settingsProperty');
			const malformed = !value || !property;
			crawlState.staged.dialogParameters.push({
				node: 'dialog_parameter',
				property: property ? property.value : '',
				value: value ? value.value : null,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
				malformed,
			});
		},
	},
	serial_dialog_definition: {
		patterns: [{
			start: `'serial_dialog'`,
			body: `$string:serialDialogName '{' @serial_dialog?`,
			end: `'}'`
		}],
		onStart: (file, crawlState) => {
			crawlState.staged.serialDialogOptions = [];
			crawlState.staged.serialDialogMessages = [];
			crawlState.staged.serialDialogParameters = [];
		},
		onEnd: (file, crawlState) => {
			const name = mostRecentCapture(crawlState, 'serialDialogName');
			file.nodes.push({
				node: 'serial_dialog_definition',
				name: name?.value || '',
				parameters: crawlState.staged.serialDialogParameters,
				messages: crawlState.staged.serialDialogMessages,
				options: crawlState.staged.serialDialogOptions,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			delete crawlState.staged.serialDialogOptions;
			delete crawlState.staged.serialDialogMessages;
			delete crawlState.staged.serialDialogParameters;
		},
	},
	serial_dialog: {
		patterns: `@serial_dialog_parameter*
			$string:serialDialogMessage+
			@serial_dialog_option*`,
		onEnd: (file, crawlState) => {
			const messages = mostRecentCaptures(crawlState, 'serialDialogMessage', 1, Infinity);
			crawlState.staged.serialDialogMessages.push({
				node: 'serial_dialog',
				messages,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
		},
	},
	serial_dialog_option: {
		patterns: [
			{
				start: `'#':optionType`,
				body: `$quoted_string:label '=' $string:script`
			},
			{
				start: `'_':optionType`,
				body: `$quoted_string:label '=' $string:script`
			},
		],
		onEnd: (file, crawlState) => {
			const script = mostRecentCapture(crawlState, 'script');
			const label = mostRecentCapture(crawlState, 'label');
			const optionType = mostRecentCapture(crawlState, 'optionType');
			const malformed = !label || !script;
			let type = '';
			if (optionType.value === '#') type = 'options';
			if (optionType.value === '_') type = 'text_options';
			crawlState.staged.serialDialogOptions.push({
				node: 'serial_dialog_option',
				type,
				label: label?.value || '',
				script: script?.value || '',
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
				malformed,
			});
		},
	},
	dialog_definition: {
		patterns: [
			{
				start: `'dialog'`,
				body: `$string:dialogName '{' @dialog*`,
				end: `'}'`
			},
		],
		onStart: (file, crawlState) => {
			crawlState.staged.dialogs = [];
			crawlState.staged.dialogIdentifier = {};
			crawlState.staged.dialogParameters = [];
			crawlState.staged.dialogOptions = [];
			crawlState.staged.dialogMessages = [];
		},
		onEnd: (file, crawlState) => {
			const name = mostRecentCapture(crawlState, 'dialogName')?.value || ''
			file.nodes.push({
				node: 'dialog_definition',
				name,
				dialogs: crawlState.staged.dialogs,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			delete crawlState.staged.dialogs;
			delete crawlState.staged.dialogIdentifier;
			delete crawlState.staged.dialogParameters;
			delete crawlState.staged.dialogMessages;
			delete crawlState.staged.dialogOptions;
		},
	},
	dialog: {
		patterns: `@dialog_identifier
			@dialog_parameter*
			$quoted_string:dialogMessage+
			@dialog_option*`,
		onEnd: (file, crawlState) => {
			const messages = mostRecentCaptures(crawlState, 'dialogMessage', 1, Infinity);
			crawlState.staged.dialogs.push({
				node: 'dialog',
				identifier: crawlState.staged.dialogIdentifier,
				parameters: crawlState.staged.dialogParameters,
				messages: messages,
				options: crawlState.staged.dialogOptions,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			crawlState.staged.dialogIdentifier = {};
			crawlState.staged.dialogParameters = [];
			crawlState.staged.dialogMessages = [];
			crawlState.staged.dialogOptions = [];
		},
	},
	dialog_identifier: {
		patterns: [
			{ start: `'entity':identifierType`, body: `$string:identifierValue` },
			{ start: `'name':identifierType`, body: `$string:identifierValue` },
			{ body: `$bareword:identifierValue` },
		],
		onEnd: (file, crawlState) => {
			const identifierValue = mostRecentCapture(crawlState, 'identifierValue');
			const identifierType = mostRecentCaptures(crawlState, 'identifierType', 0, 1);
			crawlState.staged.dialogIdentifier ={
				node: 'dialog_identifier',
				type: identifierType[0]?.value || 'label',
				value: identifierValue?.value || '',
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			};
		},
	},
	dialog_option: {
		patterns: [
			{
				start: `'>'`,
				body: `$quoted_string:label '=' $string:script`
			},
		],
		onEnd: (file, crawlState) => {
			const script = mostRecentCapture(crawlState, 'script');
			const label = mostRecentCapture(crawlState, 'label');
			const malformed = !label || !script;
			crawlState.staged.dialogOptions.push({
				node: 'dialog_option',
				label: label?.value || '',
				script: script?.value || '',
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
				malformed,
			});
		},
	},
	script_definition: {
		patterns: [
			{
				start: `'script'? $string:scriptName`,
				body: `'{' @script_body_item*`,
				end: `'}'`
			},
		],
		onStart: (file, crawlState) => {
			crawlState.staged.scriptBodyItems = [];
		},
		onEnd: (file, crawlState) => {
			const name = mostRecentCapture(crawlState, 'scriptName').value;
			const scriptBodyItems = crawlState.staged.scriptBodyItems;
			// maybe move this later? let the script handler do this?
			crawlState.staged.scriptBodyItems.push({
				node: 'action',
				action: 'LABEL',
				label: 'auto return',
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			// back to our regular programming
			file.nodes.push({
				node: 'script_definition',
				name,
				body: scriptBodyItems,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			delete crawlState.staged.scriptBodyItems;
		},
	},
	script_body_item: {
		patterns: `@action_return
			| @action_label
			| @action_load_map`,
	},
	action_return: {
		patterns: [{ start: `'return'`, end: `';'` }],
		onEnd: (file, crawlState) => {
			crawlState.staged.scriptBodyItems.push({
				node: 'action',
				action: 'GOTO_ACTION_LABEL',
				label: 'auto return',
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
		},
	},
	action_label: {
		patterns: `$bareword:labelName ':'`, // must wait until ':'; no split into body!
		onEnd: (file, crawlState) => {
			const label = semiRecentCapture(crawlState, 'labelName')?.value || '';
			crawlState.staged.scriptBodyItems.push({
				node: 'action',
				action: 'LABEL',
				label,
				malformed: !label,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
		},
	},
	action_load_map: {
		patterns: [{
			start: `'load' 'map'`,
			body: `$string:mapName`,
			end: `';'`
		}],
		onEnd: (file, crawlState) => {
			const map = semiRecentCapture(crawlState, 'mapName')?.value || '';
			crawlState.staged.scriptBodyItems.push({
				node: 'action',
				action: 'LOAD_MAP',
				map,
				malformed: !map,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
		},
	},
	// show_dialog_block: {
	// 	patterns: [
	// 		{
	// 			start: `'show' 'dialog' '{'`,
	// 			body: `@dialog*`,
	// 			end: `'}'`
	// 		},
	// 		{
	// 			start: `'show' 'dialog' $string:dialogName '{'`,
	// 			body: `@dialog*`,
	// 			end: `'}'`
	// 		},
	// 	],
	// 	onMatch: (file, crawlState, startPos) => {
	// 		const dialogs = mostRecentNodes(file, 'dialog', 0, Infinity);
	// 		const dialogNameCapture = mostRecentCapture(crawlState, 'dialogName');
	// 		file.nodes.push({
	// 			node: 'dialog_definition',
	// 			dialogName: dialogNameCapture.value,
	// 			dialogs,
	// 			tokenPos: startPos,
	// 		});
	// 	},
	// },
	// // untested:
	// entity_identifier: {
	// 	patterns: [
	// 		{ body: `'player':entityIdentifierType` },
	// 		{ body: `'self':entityIdentifierType` },
	// 		{ start: `'entity':entityIdentifierType`, body: `$string:entityName` },
	// 	],
	// 	onMatch: (file, crawlState, startPos) => {
	// 		const entityNameCapture = mostRecentCaptures(crawlState, 'entityName', 0, 1);
	// 		const entityIdentifierType = mostRecentCapture(crawlState, 'entityIdentifierType');
	// 		let entityName = '';
	// 		if (entityIdentifierType.value === 'self') entityName = '%SELF%';
	// 		else if (entityIdentifierType.value === 'player') entityName = '%PLAYER%';
	// 		else entityName = entityNameCapture[0].entityName
	// 		file.nodes.push({
	// 			node: 'entity_identifier',
	// 			value: entityName,
	// 			tokenPos: startPos,
	// 		});
	// 	}
	// },
	// geometry_identifier: {
	// 	patterns: [
	// 		{ start: `'geometry'`, body: `$string:geometryName` },
	// 	],
	// },
	// enum_map_slots: {
	// 	patterns: `'on_load' | 'on_tick' | 'on_look'`,
	// },
	// enum_entity_slots: {
	// 	patterns: `'on_interact' | 'on_tick' | 'on_look'`,
	// },
	// enum_save_slots: {
	// 	patterns: `'1' | '2' | '3'`,
	// },
	// enum_nsew: {
	// 	patterns: `'north' | 'south' | 'east' | 'west'`,
	// },
	// enum_lights: {
	// 	patterns: `'LED_XOR' | 'LED_ADD' | 'LED_SUB' | 'LED_PAGE'
	// 		| 'LED_BIT128' | 'LED_BIT64' | 'LED_BIT32' | 'LED_BIT16'
	// 		| 'LED_BIT8' | 'LED_BIT4' | 'LED_BIT2' | 'LED_BIT1'
	// 		| 'LED_MEM0' | 'LED_MEM1' | 'LED_MEM2' | 'LED_MEM3'
	// 		| 'LED_HAX' | 'LED_USB' | 'LED_SD' | 'LED_ALL'`,
	// },
	// enum_buttons: {
	// 	patterns: `'MEM0' | 'MEM1' | 'MEM2' | 'MEM3'
	// 		| 'XOR' | 'ADD' | 'SUB' | 'PAGE'
	// 		| 'BIT128' | 'BIT64' | 'BIT32' | 'BIT16'
	// 		| 'BIT8' | 'BIT4' | 'BIT2' | 'BIT1'
	// 		| 'LJOY_CENTER' | 'LJOY_UP' | 'LJOY_DOWN'
	// 		| 'LJOY_LEFT' | 'LJOY_RIGHT'
	// 		| 'RJOY_CENTER' | 'RJOY_UP' | 'RJOY_DOWN'
	// 		| 'RJOY_LEFT' | 'RJOY_RIGHT'
	// 		| 'TRIANGLE' | 'SQUARE' | 'X' | 'CROSS'
	// 		| 'O' | 'CIRCLE' | 'HAX' | 'ANY'`,
	// },
	// enum_entity_field: {
	// 	patterns: `'x' | 'y' | 'direction' | 'path_id'
	// 		| 'primary_id' | 'secondary_id' | 'primary_id_type'
	// 		| 'interact_script_id' | 'tick_script_id' | 'look_script_id'
	// 		| 'current_animation' | 'current_frame'`,
	// },
};

const onStart = {};
const onEnd = {};
const patterns = {};

Object.keys(dictionary).forEach(entryName=>{
	const entry = dictionary[entryName];
	if (entry.patterns) patterns[entryName] = entry.patterns;
	if (entry.onStart) onStart[entryName] = entry.onStart;
	if (entry.onEnd) onEnd[entryName] = entry.onEnd;
});

const semiRecentCaptures = (crawlState, captureLabel, min = 1, max = min) => {
	// skip the irrelevant ones by setting them aside for a second
	const bot = [];
	while (
		crawlState.captures[crawlState.captures.length-1]
		&& crawlState.captures[crawlState.captures.length-1].label !== captureLabel
	) {
		bot.unshift(crawlState.captures.pop())
	}
	// collect the ones we want
	const extracted = [];
	for (let i = min || 1; i <= max; i++) {
		const latest = crawlState.captures[crawlState.captures.length-1];
		if (!latest) break;
		if (latest.label !== captureLabel) break;
		extracted.unshift(crawlState.captures.pop());
	}
	if (extracted.length < min) {
		const message = `Not enough captures labeled ${captureLabel};`
			+`found ${extracted.length}, needed at least ${min}`;
		// throw new Error (message);
	}
	// put the skipped ones back
	crawlState.captures = crawlState.captures.concat(bot);
	return extracted;
};
const semiRecentCapture = (crawlState, captureLabel) => {
	const extracted = semiRecentCaptures(crawlState, captureLabel, 1);
	return extracted ? extracted[0] : false;
};
const mostRecentCaptures = (crawlState, captureLabel, min = 1, max = min) => {
	const extracted = [];
	for (let i = min || 1; i <= max; i++) {
		const latest = crawlState.captures[crawlState.captures.length-1];
		if (!latest) break;
		if (latest.label !== captureLabel) break;
		extracted.unshift(crawlState.captures.pop());
	}
	if (extracted.length < min) {
		return [];
		// return `Not enough captures labeled ${captureLabel};`
		// 	+`found ${extracted.length}, needed at least ${min}`;
	}
	return extracted;
};
const mostRecentCapture = (crawlState, captureLabel) => {
	const extracted = mostRecentCaptures(crawlState, captureLabel, 1);
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
	if (literal) keywordsFound.add(literal[1]);
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
		} else if (left === ':') {
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
Object.entries(patterns).forEach(([patternName, origPatterns])=>{
	const allTokenPatterns = [];
	let patterns = typeof origPatterns === 'string'
		? origPatterns.split(/[\s\t\n]+\|[\s\t\n]+/g).map(bod=>{ return { body: bod }; })
		: origPatterns
	patterns.forEach(altPattern=>{
		let twigs = [];
		['start','body','end'].forEach(subType=>{
			const pattern = altPattern[subType];
			if (pattern) {
				const splits = pattern.trim()
					.split('|')
					.map(str=>str.trim());
				splits.forEach((subpattern, i, arr) => {
					const words = subpattern.split(/[\t\n\s]+/g).map(item=>getWordReport(item,patternName));
					if (subType === 'start') {
						words[words.length-1].confirmNode = true;
					} else if (subType === 'end' && i === 0) {
						words[words.length-1].terminator = true;
					}
					twigs = twigs.concat(words);
				});
			}
		});
		allTokenPatterns.push(twigs);
	});
	tree[patternName] = allTokenPatterns;
});

const conditionsLHS = [
	{
		action: 'CHECK_DEBUG_MODE',
		pattern: `'debug_mode'`,
		type: 'boolean',
	},
	{
		action: 'CHECK_SAVE_FLAG',
		pattern: `$string:flagName<>flagNames`,
		type: 'boolean',
	},
	{
		action: 'CHECK_ENTITY_GLITCHED',
		pattern: `@entity_identifier 'glitched'`,
		type: 'boolean',
	},
	{
		action: 'CHECK_DIALOG_OPEN',
		pattern: `'dialog' 'open'`,
		type: 'boolean',
	},
	{
		action: 'CHECK_SERIAL_DIALOG_OPEN',
		pattern: `'serial_dialog' 'open'`,
		type: 'boolean',
	},
	{
		action: 'CHECK_FOR_BUTTON_STATE',
		pattern: `'button' $enum_button:buttonName 'down'`,
		type: 'boolean',
		values: { expected_bool: true },
	},
	{
		action: 'CHECK_FOR_BUTTON_STATE',
		pattern: `'button' $enum_button:buttonName 'up'`,
		type: 'boolean',
		values: { expected_bool: false },
	},
	{
		action: 'CHECK_FOR_BUTTON_PRESS',
		pattern: `'button' $enum_button:buttonName 'pressed'`,
		type: 'boolean',
	},
	{
		action: 'CHECK_IF_ENTITY_IS_IN_GEOMETRY',
		pattern: `@entity_identifier 'intersects' @geometry_identifier`,
		type: 'boolean',
	},
	{
		action: 'CHECK_ENTITY_X',
		pattern: `@entity_identifier 'x'`,
		type: 'number_equality',
	},
	{
		action: 'CHECK_ENTITY_Y',
		pattern: `@entity_identifier 'y'`,
		type: 'number_equality',
	},
	{
		action: 'CHECK_ENTITY_PRIMARY_ID',
		pattern: `@entity_identifier 'primary_id'`,
		type: 'number_equality',
	},
	{
		action: 'CHECK_ENTITY_SECONDARY_ID',
		pattern: `@entity_identifier 'secondary_id'`,
		type: 'number_equality',
	},
	{
		action: 'CHECK_ENTITY_PRIMARY_ID_TYPE',
		pattern: `@entity_identifier 'primary_id_type'`,
		type: 'number_equality',
	},
	{
		action: 'CHECK_ENTITY_CURRENT_ANIMATION',
		pattern: `@entity_identifier 'current_animation'`,
		type: 'number_equality',
	},
	{
		action: 'CHECK_ENTITY_CURRENT_FRAME',
		pattern: `@entity_identifier 'animation_frame'`,
		type: 'number_equality',
	},
	{
		action: 'CHECK_ENTITY_NAME',
		pattern: `@entity_identifier 'name'`,
		type: 'string_equality',
	},
	{
		action: 'CHECK_ENTITY_INTERACT_SCRIPT',
		pattern: `@entity_identifier 'on_interact'`,
		type: 'string_equality',
	},
	{
		action: 'CHECK_ENTITY_TICK_SCRIPT',
		pattern: `@entity_identifier 'on_tick'`,
		type: 'string_equality',
	},
	{
		action: 'CHECK_ENTITY_LOOK_SCRIPT',
		pattern: `@entity_identifier 'on_look'`,
		type: 'string_equality',
	},
	{
		action: 'CHECK_ENTITY_TYPE',
		pattern: `@entity_identifier 'type'`,
		type: 'string_equality',
	},
	{
		action: 'CHECK_ENTITY_PATH',
		pattern: `@entity_identifier 'path'`,
		type: 'string_equality',
	},
	{
		action: 'CHECK_WARP_STATE',
		pattern: `'warp_state'`,
		type: 'string_equality',
	},
	{
		action: 'CHECK_ENTITY_DIRECTION',
		pattern: `@entity_identifier 'direction'`,
		type: 'string_nsew',
	},
	{
		action: 'CHECK_VARIABLE',
		pattern: `$string:variable`,
		type: 'string_against_number', // < <= == => >
		// rhs = ':value'
	},
	{
		action: 'CHECK_VARIABLES',
		pattern: `$string:variable`,
		type: 'string_against_string', // < <= == => >
		// rhs = ':source'
	},
];

// console.log('break');

const terminators = {};
Object.entries(tree).map(([patternName, value])=>{
	terminators[patternName] = value.map(branch=>{
		return branch.find(branch=>branch.terminator)
	})
})

const language = { tree, onStart, onEnd, terminators, keywords: keywordsFound };
export default language;
