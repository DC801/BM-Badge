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

// DUPLICATE: todo fix that
const findLineAndCharNumbers = (input, pos) => {
	const splits = input.substring(0,pos).split('\n')
	const charCount = splits[splits.length - 1].length;
	const wholeString = input.split('\n')
	const lineNumber = splits.length;
	return {
		row: lineNumber,
		col: charCount+1,
		lineString: wholeString[lineNumber - 1],
		char: input[pos]
	};
};
const makeAutoIdentifierName = (input, pos, fileName) => {
	const coords = findLineAndCharNumbers(input, pos);
	return fileName+':'+coords.row +':'+coords.col;
};

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
	dialog_parameter: {
		patterns: [
			{ start:`'entity':settingsProperty`, body: `$string:settingsValue<>entityNames` },
			{ start:`'name':settingsProperty`, body: `$string:settingsValue` },
			{ start:`'portrait':settingsProperty`, body: `$string:settingsValue<portraitNames` },
			{ start:`'alignment':settingsProperty`, body: `$bareword:settingsValue<enum_alignment` },
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
	dialog_literal: {
		patterns: [{ start: `'{'`, body: `@dialog*`, end: `'}'` }],
		// can have an open brace for a start because nothing
		// will launch into this other than serial_dialog stuff
		onStart: (file, crawlState) => {
			crawlState.staged.dialogIdentifier = {};
			crawlState.staged.dialogParameters = [];
			crawlState.staged.dialogMessages = [];
			crawlState.staged.dialogOptions = [];
			crawlState.staged.dialogs = [];
			if (!crawlState.staged.dialogName) {
				crawlState.staged.dialogName = makeAutoIdentifierName(
					file.plaintext,
					file.tokens[crawlState.stack[0].startPos].pos,
					file.fileName,
				);
			}
		},
		onEnd: (file, crawlState) => {
			const node = {
				node: 'dialog_definition',
				name: crawlState.staged.dialogName,
				dialogs: crawlState.staged.dialogs,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			};
			file.nodes.push(node);
			delete crawlState.staged.dialogIdentifier;
			delete crawlState.staged.dialogParameters;
			delete crawlState.staged.dialogMessages;
			delete crawlState.staged.dialogOptions;
			delete crawlState.staged.dialogs;
			// Don't delete name yet!
			// Wait for the 'SHOW_DIALOG' to use it first
		},
	},
	dialog_definition: {
		patterns: [{
			start: `'dialog' $string:dialogName`,
			body: `@dialog_literal`
		}],
		onStart: (file, crawlState) => {
			// guaranteed
			let name = mostRecentCapture(crawlState, 'dialogName');
			crawlState.staged.dialogName = name.value;
		},
		onEnd: (file, crawlState) => {
			// have to wait to delete it now because of the 'show..block' variant
			delete crawlState.staged.dialogName;
		}
	},
	dialog: {
		patterns: `@dialog_identifier
			@dialog_parameter*
			$quoted_string:dialogMessage+
			@dialog_option*`,
		onEnd: (file, crawlState) => {
			const messages = mostRecentCaptures(crawlState, 'dialogMessage', 1, Infinity);
			const debug = {
				identifier: crawlState.staged.dialogIdentifier,
				parameters: crawlState.staged.dialogParameters,
				messages: messages,
				options: crawlState.staged.dialogOptions,
			};
			const node = {
				node: 'dialog',
				debug,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			};
			node.messages = debug.messages.map(inner=>inner.value);
			if (debug.parameters.length > 0) {
				node.parameters = debug.parameters
					.map(inner=>{
						if (inner.malformed) node.malformed = true;
						return {
							property: inner.property,
							value: inner.value,
						};
					})
			}
			debug.options.forEach(inner=>{
				if (inner.malformed) node.malformed = true;
				node.options = node.options || {};
				node.options[inner.label] = inner.script;
			});
			crawlState.staged.dialogs.push(node);
			crawlState.staged.dialogIdentifier = {};
			crawlState.staged.dialogParameters = [];
			crawlState.staged.dialogMessages = [];
			crawlState.staged.dialogOptions = [];
		},
	},
	serial_dialog_literal: {
		patterns: [{ start: `'{'`, body: `@serial_dialog?`, end: `'}'` }],
		// can have an open brace for a start because nothing
		// will launch into this other than serial_dialog stuff
		onStart: (file, crawlState) => {
			crawlState.staged.serialDialogOptions = [];
			crawlState.staged.serialDialogMessages = [];
			crawlState.staged.serialDialogParameters = [];
			if (!crawlState.staged.serialDialogName) {
				crawlState.staged.serialDialogName = makeAutoIdentifierName(
					file.plaintext,
					file.tokens[crawlState.stack[0].startPos].pos,
					file.fileName,
				);
			}
		},
		onEnd: (file, crawlState) => {
			const debug = {
				parameters: crawlState.staged.serialDialogParameters,
				messages: crawlState.staged.serialDialogMessages,
				options: crawlState.staged.serialDialogOptions,
			};
			const node = {
				node: 'serial_dialog_definition',
				name: crawlState.staged.serialDialogName,
				debug,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			};
			node.messages = debug.messages
				.map(inner=>inner.messages.map(v=>v.value))[0];
			if (debug.parameters.length > 0) {
				node.parameters = debug.parameters
					.map(inner=>{
						if (inner.malformed) node.malformed = true;
						return {
							property: inner.property,
							value: inner.value,
						};
					})
			}
			let optionType = debug.options[0]?.type;
			if (optionType) {
				debug.options.forEach(inner=>{
					if (inner.malformed) node.malformed = true;
					if (inner.type !== optionType) {
						file.warnings.push({
							value: 'Mixed serial dialog options',
							message: `Serial dialog option types are mixed; the first type will be used.`,
							errorPos: inner.startPos,
						});
					}
					node[optionType] = node[optionType] || {};
					node[optionType][inner.label] = inner.script;
				});
			}
			file.nodes.push(node);
			delete crawlState.staged.serialDialogOptions;
			delete crawlState.staged.serialDialogMessages;
			delete crawlState.staged.serialDialogParameters;
			// Don't delete name yet!
			// Wait for the 'SHOW_SERIAL_DIALOG' to use it first
		},
	},
	serial_dialog_definition: {
		patterns: [{
			start: `'serial_dialog' $string:serialDialogName`,
			body: `@serial_dialog_literal`
		}],
		onStart: (file, crawlState) => {
			// guaranteed
			let name = mostRecentCapture(crawlState, 'serialDialogName');
			crawlState.staged.serialDialogName = name.value;
		},
		onEnd: (file, crawlState) => {
			// have to wait to delete it now because of the 'show..block' variant
			delete crawlState.staged.serialDialogName;
		}
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
				start: `'dialog' $string:dialogName`,
				body: `'{' @dialog*`,
				end: `'}'`
			},
		],
		onStart: (file, crawlState) => {
			crawlState.staged.dialogs = [];
			crawlState.staged.dialogIdentifier = {};
			crawlState.staged.dialogParameters = [];
			crawlState.staged.dialogMessages = [];
			crawlState.staged.dialogOptions = [];
			let name = mostRecentCapture(crawlState, 'dialogName');
			crawlState.staged.dialogName = name.value;
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
	dialog_identifier: {
		patterns: [
			{ start: `'entity':identifierType`, body: `$string:identifierValue` },
			{ start: `'name':identifierType`, body: `$string:identifierValue` },
			{ body: `$bareword:identifierValue` },
		],
		onEnd: (file, crawlState) => {
			const identifierValue = mostRecentCapture(crawlState, 'identifierValue');
			const identifierType = optionalCapture(crawlState, 'identifierType');
			crawlState.staged.dialogIdentifier ={
				node: 'dialog_identifier',
				type: identifierType?.value || 'label',
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
				start: `'script'? $string:scriptName '{'`,
				body: `@script_body_item*`,
				end: `'}'`
			},
		],
		onStart: (file, crawlState) => {
			crawlState.staged.scriptBodyItems = [];
		},
		onEnd: (file, crawlState) => {
			const name = mostRecentCapture(crawlState, 'scriptName').value;
			const scriptBodyItems = crawlState.staged.scriptBodyItems;
			// // maybe move this later? let the script handler do this?
			// crawlState.staged.scriptBodyItems.push({
			// 	node: 'action',
			// 	action: 'LABEL',
			// 	label: 'auto return',
			// 	startPos: crawlState.tokenPos-1,
			// 	tokenPos: crawlState.tokenPos,
			// });
			// // it's confusing me now so I'm hiding this
			// back to our regular programming

			// for my own visual QOL
			scriptBodyItems.forEach(item=>{
				delete item.node;
				if (!item.malformed) {
					delete item.malformed;
				}
			})
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
		patterns: [
			`@show_dialog_block`,
			`@show_serial_dialog_block`,
		], // also auto populated
	},
	show_dialog_block: {
		patterns: [{
			start: `'show' 'dialog' $string:dialogName?`,
			body: `@dialog_literal?`,
			end: `';'`,
		}],
		onStart: (file, crawlState) => {
			let name = optionalCapture(crawlState, 'dialogName');
			name = name?.value || makeAutoIdentifierName(
				file.plaintext,
				file.tokens[crawlState.stack[0].startPos].pos,
				file.fileName,
			);
			// need the name ready now in case there's no literal here
			crawlState.staged.dialogName = name;

		},
		onEnd: (file, crawlState) => {
			crawlState.staged.scriptBodyItems.push({
				node: 'action',
				action: 'SERIAL_DIALOG',
				serial_dialog: crawlState.staged.dialogName,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			delete crawlState.staged.dialogName;
		},
	},
	show_serial_dialog_block: {
		patterns: [{
			start: `'show' 'serial_dialog' $string:serialDialogName?`,
			body: `@serial_dialog_literal?`,
			// and THAT's why there's a semicolon after braces sometimes!
			end: `';'`,
		}],
		onStart: (file, crawlState) => {
			let name = optionalCapture(crawlState, 'serialDialogName');
			name = name?.value || makeAutoIdentifierName(
				file.plaintext,
				file.tokens[crawlState.stack[0].startPos].pos,
				file.fileName,
			);
			// need the name ready now in case there's no literal here
			crawlState.staged.serialDialogName = name;
		},
		onEnd: (file, crawlState) => {
			crawlState.staged.scriptBodyItems.push({
				node: 'action',
				action: 'SHOW_SERIAL_DIALOG',
				serial_dialog: crawlState.staged.serialDialogName,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			delete crawlState.staged.serialDialogName;
		},
	},
	concat_serial_dialog_block: {
		// COPY PASTA'D FROM 'show'
		patterns: [{
			start: `'concat' 'serial_dialog' $string:serialDialogName?`,
			body: `@serial_dialog_literal?`,
			// and THAT's why there's a semicolon after braces sometimes!
			end: `';'`,
		}],
		onStart: (file, crawlState) => {
			let name = optionalCapture(crawlState, 'serialDialogName');
			name = name?.value || makeAutoIdentifierName(
				file.plaintext,
				file.tokens[crawlState.stack[0].startPos].pos,
				file.fileName,
			);
			// need the name ready now in case there's no literal here
			crawlState.staged.serialDialogName = name;
		},
		onEnd: (file, crawlState) => {
			crawlState.staged.scriptBodyItems.push({
				node: 'action',
				action: 'SHOW_SERIAL_DIALOG',
				disable_newline: true, // EXCEPT FOR THIS, LOL
				serial_dialog: crawlState.staged.serialDialogName,
				startPos: crawlState.stack[0].startPos,
				tokenPos: crawlState.tokenPos,
			});
			delete crawlState.staged.serialDialogName;
		},
	},
	entity_identifier: {
		patterns: [
			{ body: `'player':identifierType` },
			{ body: `'self':identifierType` },
			{ start: `'entity':identifierType`, body: `$string:entityName` },
		],
		onEnd: (file, crawlState) => {
			const identifierType = mostRecentCapture(crawlState, 'identifierType');
			let entity;
			if (identifierType === 'player') entity = '%PLAYER%';
			if (identifierType === 'self') entity = '%SELF%';
			if (identifierType === 'entity') {
				entity = optionalCapture(crawlState, 'entityName');
			}
			crawlState.staged.entityIdentifier = {
				identifierType: mostRecentCapture(crawlState, 'identifierType'),
				entity: entity || '',
			}
		},
	},
	entity_or_map_identifier: {
		patterns: [
			{ body: `'map':identifierType` },
			{ body: `'player':identifierType` },
			{ body: `'self':identifierType` },
			{ start: `'entity':identifierType`, body: `$string:entityName` },
		],
		onEnd: (file, crawlState) => {
			const identifierType = mostRecentCapture(crawlState, 'identifierType');
			let entity = '';
			if (identifierType === 'map') entity = '%MAP%';
			if (identifierType === 'player') entity = '%PLAYER%';
			if (identifierType === 'self') entity = '%SELF%';
			if (identifierType === 'entity') {
				entity = optionalCapture(crawlState, 'entityName');
			}
			crawlState.staged.entityOrMap = {
				identifierType: mostRecentCapture(crawlState, 'identifierType'),
				entity: entity || '',
			}
		},
	},
};

const exampleActionResult = {
	patterns: [{
		body: `'goto' $string:script`,
		end: `';'`
	}],
	onEnd: (file, crawlState) => {
		const script = semiRecentCapture(crawlState, 'script')?.value || '';
		crawlState.staged.scriptBodyItems.push({
			node: 'action',
			action: 'RUN_SCRIPT',
			script,
			malformed: !script,
			startPos: crawlState.stack[0].startPos,
			tokenPos: crawlState.tokenPos,
		});
	},
};
const actionDictionary = {
	action_return: {
		action: 'GOTO_ACTION_LABEL',
		captures: [],
		values: { label: 'auto return' },
		patterns: [{ start: `'return'`, end: `';'` }],
	},
	action_load_map: {
		action: 'LOAD_MAP',
		captures: [ 'map' ],
		patterns: [{ start: `'load' 'map'`, body: `$string:map`, end: `';'` }],
	},
	action_slot_load: {
		action: 'SLOT_LOAD',
		captures: [ 'slot' ],
		patterns: [{ start: `'load' 'slot'`, body: `$number:slot`, end: `';'` }],
	},
	action_slot_erase: {
		action: 'SLOT_ERASE',
		captures: [ 'slot' ],
		patterns: [{ start: `'erase'`, body: `'slot' $number:slot`, end: `';'` }],
	},
	action_slot_save: {
		action: 'SLOT_SAVE',
		captures: [],
		patterns: [{ start: `'save'`, body: `'slot'`, end: `';'` }],
	},
	action_goto_index: {
		action: 'GOTO_ACTION_INDEX',
		captures: [ 'action_index' ],
		patterns: [{ start: `'goto' 'index'`, body: `$number:action_index`, end: `';'` }],
	},
	action_goto_label: {
		action: 'GOTO_ACTION_LABEL',
		captures: [ 'label' ],
		patterns: [{ start: `'goto' 'label'`, body: `$bareword:label`, end: `';'`}],
	},
	action_goto_script: {
		action: 'RUN_SCRIPT',
		captures: [ 'script' ],
		patterns: [{ body: `'goto' $string:script`, end: `';'` }],
	},
	action_close_dialog: {
		action: 'CLOSE_DIALOG',
		captures: [],
		patterns: [{ body: `'close' 'dialog'`, end: `';'` }],
	},
	action_close_serial_dialog: {
		action: 'CLOSE_SERIAL_DIALOG',
		captures: [],
		patterns: [{ body: `'close' 'serial_dialog'`, end: `';'` }],
	},
	action_blocking_delay: {
		action: 'BLOCKING_DELAY',
		captures: [ 'duration' ],
		patterns: [{ start: `'block'`, body: `$duration:duration`, end: `';'` }],
	},
	action_non_blocking_delay: {
		action: 'NON_BLOCKING_DELAY',
		captures: [ 'duration' ],
		patterns: [{ start: `'wait'`, body: `$duration:duration`, end: `';'` }],
	},
	action_label: {
		action: 'LABEL',
		captures: [ 'label' ],
		patterns: `$bareword:labelName ':'`,
	},
	action_hide_command: {
		action: 'SET_SERIAL_DIALOG_COMMAND_VISIBILITY',
		captures: [ 'command' ],
		values: { is_visible: false },
		patterns: [{ start: `'hide'`, body: `'command' $string:command`, end: `';'` }],
	},
	action_unhide_command: {
		action: 'SET_SERIAL_DIALOG_COMMAND_VISIBILITY',
		captures: [ 'command' ],
		values: { is_visible: true },
		patterns: [{ start: `'unhide'`, body: `'command' $string:command`, end: `';'` }],
	},
	action_pause_script: {
		action: 'SET_SCRIPT_PAUSE',
		captures: [ 'script_slot' ],
		values: { bool_value: true },
		patterns: [{
			start: `'pause'`,
			body: `@entity_or_map_identifier $bareword:script_slot`,
			// deciding now that the file playback system can handle invalid enum
			// options (rather than the parser); parsing will become much simpler
			end: `';'`
		}],
		cleanupStaged: [ 'entityOrMap' ],
	},
	action_unpause_script: {
		action: 'SET_SCRIPT_PAUSE',
		captures: [ 'script_slot' ],
		values: { bool_value: false },
		patterns: [{
			start: `'unpause'`,
			body: `@entity_or_map_identifier $bareword:script_slot<enum_script_slot`,
			end: `';'`
		}],
	},
	action_delete_alias: {
		action: 'UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS',
		captures: [ 'alias' ],
		patterns: [{
			start: `'delete' 'alias'`,
			body: `$string:alias<aliases`,
			end: `';'`
		}],
	},
	action_delete_command: {
		action: 'UNREGISTER_SERIAL_DIALOG_COMMAND',
		captures: [ 'command' ],
		values: { is_fail: false },
		patterns: [{
			body: `'delete' 'command' $string:command`,
			end: `';'`
		}],
	},
	action_delete_command_fail: {
		action: 'UNREGISTER_SERIAL_DIALOG_COMMAND',
		captures: [ 'command' ],
		values: { is_fail: true },
		patterns: [{
			body: `'delete' 'command' $string:command 'fail'`,
			end: `';'`
		}],
	},
	action_delete_command_argument: {
		action: 'UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT',
		captures: [ 'argument', 'command' ],
		values: { is_fail: true },
		patterns: [{
			start: `'delete' 'command' $string:command '+'`,
			body: `$string:argument`,
			end: `';'`
		}],
	},
}

const makeTreeEntry = (slug, treeEntry) => {
	return {
		patterns: treeEntry.patterns,
		onEnd: (file, crawlState) => {
			const insert = treeEntry.values
				? JSON.parse(JSON.stringify(treeEntry.values))
				: {};
			const captures = treeEntry.captures || [];
			captures.forEach(captureName=>{
				insert[captureName] = mostRecentCapture(crawlState, captureName)?.value || null;
			})
			if (crawlState.staged.actionValues) {
				Object.entries(crawlState.staged.actionValues)
					.forEach(([key,value])=>{ insert[key] = value; });
			}
			insert.node = 'action',
			insert.action = treeEntry.action; // e.g. 'RUN_SCRIPT'
			insert.startPos = crawlState.stack[0].startPos;
			insert.tokenPos = crawlState.tokenPos;
			insert.malformed = captures.reduce((acc, curr)=>{
				return acc || insert[curr] === null;
			}, false);
			crawlState.staged.scriptBodyItems.push(insert);
			if (actionDictionary[slug].cleanupStaged) {
				actionDictionary[slug].cleanupStaged
					.forEach(v=>{ delete crawlState.staged[v]; });
			}
		},
	}
};
Object.keys(actionDictionary).forEach(slug=>{
	const data = actionDictionary[slug];
	const insert = makeTreeEntry(slug, data);
	dictionary[slug] = insert;
	dictionary.script_body_item.patterns.push(`@${slug}`);
});
dictionary.script_body_item.patterns = dictionary.script_body_item.patterns.join(' | ');

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
	return extracted ? extracted[0] : null;
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
	return extracted ? extracted[0] : null;
};
const optionalCapture = (crawlState, captureLabel) => {
	const extracted = mostRecentCaptures(crawlState, captureLabel, 0, 1);
	return extracted ? extracted[0] : null;
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

// console.log('break');

const terminators = {};
Object.entries(tree).map(([patternName, value])=>{
	terminators[patternName] = value.map(branch=>{
		return branch.find(branch=>branch.terminator)
	})
})

const language = { tree, onStart, onEnd, terminators, keywords: keywordsFound };
export default language;
