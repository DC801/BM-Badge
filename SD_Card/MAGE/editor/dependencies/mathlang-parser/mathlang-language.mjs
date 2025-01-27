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
			// Currently 'end' is assumed to be only one token/word; no lookups please!
			end: `')'`,
		}],
		onEnd: (f, cs) => {
			const name = mostRecentCapture(cs, 'fileName');
			addNode(f, cs, {
				node: 'include_macro',
				value: name?.value || '',
				malformed: !name,
			});
		},
	},
	constant_assignment: {
		patterns: [{
				start: `$constant:constantName>constantNames`,
				body: `'=' @any:constantValue`,
				end: `';'`,
			}],
		onEnd: (f, cs) => {
			const value = mostRecentCapture(cs, 'constantValue');
			const name = mostRecentCapture(cs, 'constantName');
			const malformed = !value || !name;
			addNode(f, cs, {
				node: 'constant_assignment',
				name: name?.value || '',
				value: value?.value || null,
				malformed,
			});
		},
	},
	any: {
		// in order of how common these are? should that matter?
		patterns: `$number | $bareword | $quoted_string
			| $boolean | $constant<constantNames
			| $duration | $quantity | $distance | $color`,
	},
	any_but_not_qstring: {
		// in order of how common these are? should that matter?
		patterns: `$number | $bareword
			| $boolean | $constant<constantNames
			| $duration | $quantity | $distance | $color`,
	},
	add_serial_dialog_settings: {
		patterns: [{
			start: `'add' 'serial_dialog'`,
			body: `'settings' '{' @serial_dialog_parameter*`,
			end: `'}'`,
		}],
		onEnd: (f, cs) => {
			const malformed = getAndDeleteStaged(cs, 'serialDialogParametersMalformed');
			const debug = getAndDeleteStaged(cs, 'serialDialogParameters[]');
			const settings = debug.map(v=>{
				return {
					property: v.property,
					value: v.value,
				};
			})
			addNode(f, cs, {
				node: 'add_serial_dialog_settings',
				debug,
				settings,
				malformed,
			});
		},
	},
	serial_dialog_parameter: {
		patterns: [
			{ start: `'wrap':property`, body: `$number:value` },
			// gotta do this for things without terminators :(
			{ body: `@any_but_not_qstring:unknownToken` },
			// RIP if you start typing a quoted string on its own...
			// (need to be able to switch into messages)
		],
		onEnd: (f, cs) => {
			const errorToken = mostRecentCapture(cs, 'unknownToken');
			if (errorToken) {
				f.errors.push({
					value: 'Unknown property or value',
					message: `Not part of a valid serial dialog property/value pair`,
					errorPos: errorToken.pos,
				});
				replaceStaged(cs, 'serialDialogParametersMalformed', true);
			} else {
				const value = mostRecentCapture(cs, 'value');
				const property = mostRecentCapture(cs, 'property');
				pushToStaged(cs, 'serialDialogParameters[]', {
					node: 'serial_dialog_parameter',
					property: property?.value || '',
					value: value?.value || null,
					malformed: !value || !property,
				});
			}
		},
	},
	add_dialog_settings: {
		patterns: [{
			start: `'add' 'dialog'`,
			body: `'settings' '{' @dialog_settings_target*`,
			end: `'}'`
		}],
		onEnd: (f, cs) => {
			const malformed = getAndDeleteStaged(cs, 'dialogParametersMalformed');
			const oldSettings = getAndDeleteStaged(cs, 'dialogSettings[]');
			const debug = oldSettings || [];
			const settings = debug.map(v=>{
				return {
					targetType: v.targetType,
					targetValue: v.targetValue,
					settings: v.settings.map(inner=>{
						const insert = { property: inner.property, value: inner.value }
						if (inner.malformed) insert.malformed = true;
						return insert;
					})
				}
			});
			addNode(f, cs, {
				node: 'add_dialog_settings',
				debug,
				settings,
				malformed,
			});
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
		onEnd: (f, cs) => {
			const targetValueCapture = mostRecentCapture(cs, 'targetValue');
			const targetCapture = mostRecentCapture(cs, 'target');
			let targetType = targetCapture?.value || null;
			let targetValue = targetValueCapture?.value || null;
			if (targetType === 'default') targetValue = '';
			pushToStaged(cs, 'dialogSettings[]', {
				node: 'add_dialog_settings_target',
				targetType,
				targetValue,
				settings: getAndDeleteStaged(cs, 'dialogParameters[]'),
			});
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
			// gotta do this for things without terminators :(
			{ body: `@any_but_not_qstring:unknownToken` },
			// RIP if you start typing a quoted string on its own...
			// (need to be able to switch into messages)
		],
		onEnd: (f, cs) => {
			const errorToken = mostRecentCapture(cs, 'unknownToken');
			if (errorToken) {
				f.errors.push({
					value: 'Unknown property or value',
					message: `Not part of a valid dialog property/value pair`,
					errorPos: errorToken.pos,
				});
				replaceStaged(cs, 'dialogParametersMalformed', true);
			} else {
				const value = mostRecentCapture(cs, 'settingsValue');
				const property = mostRecentCapture(cs, 'settingsProperty');
				pushToStaged(cs, 'dialogParameters[]', {
					node: 'dialog_parameter',
					property: property ? property.value : '',
					value: value ? value.value : null,
					malformed: !value || !property,
				});
			}
		},
	},
	dialog_literal: {
		patterns: [{ start: `'{'`, body: `@dialog*`, end: `'}'` }],
		// can have an open brace for a start because nothing
		// will launch into this other than dialog stuff
		onStart: (f, cs) => {
			if (!getStaged(cs, 'dialogName')) {
				replaceStaged(cs, 'dialogName', makeAutoIdentifierName(
					f.plaintext,
					f.tokens[cs.stack[0].startPos].pos,
					f.fileName,
				));
			}
		},
		onEnd: (f, cs) => {
			const dialogs = getAndDeleteStaged(cs, 'dialogs[]')
				.map(dialog=>{
					dialog.debug = JSON.parse(JSON.stringify(dialog));
					delete dialog.startPos;
					delete dialog.tokenPos;
					return dialog;
				})
			addNode(f, cs, {
				node: 'dialog_definition',
				name: getStaged(cs, 'dialogName'),
				dialogs,
			});
			deleteStaged(cs, 'dialogIdentifier{}');
			deleteStaged(cs, 'dialogParameters[]');
			deleteStaged(cs, 'dialogMessages[]');
			deleteStaged(cs, 'dialogOptions[]');
			// Don't delete name yet!
			// Wait for the 'SHOW_DIALOG' to use it first
		},
	},
	dialog_definition: {
		patterns: [{
			start: `'dialog' $string:dialogName`,
			body: `@dialog_literal`
		}],
		onStart: (f, cs) => {
			replaceStaged(cs, 'dialogName',
				mostRecentCapture(cs, 'dialogName').value
			);
		},
		onEnd: (f, cs) => {
			// have to wait to delete it now because of the 'show..block' variant
			deleteStaged(cs, 'dialogName');
		}
	},
	dialog: {
		patterns: `@dialog_identifier
			@dialog_parameter*
			$quoted_string:dialogMessage+
			@dialog_option*`,
		onEnd: (f, cs) => {
			const debug = {
				identifier: getStaged(cs, 'dialogIdentifier'),
				parameters: getStaged(cs, 'dialogParameters[]'),
				messages: mostRecentCaptures(cs, 'dialogMessage', 1, Infinity),
				options: getStaged(cs, 'dialogOptions[]'),
			};
			const node = {
				node: 'dialog',
				debug,
				messages: debug.messages.map(inner=>inner.value),
				identifier: {
					type: debug.identifier.type,
					value: debug.identifier.value,
				},
			};
			if (debug.parameters?.length > 0) {
				node.parameters = debug.parameters
					.map(inner=>{
						if (inner.malformed) node.malformed = true;
						return {
							property: inner.property,
							value: inner.value,
						};
					})
			}
			if (debug.options) {
				const options = [];
				debug.options.forEach(inner=>{
					if (inner.malformed) node.malformed = true;
					options.push({
						label: inner.label || '',
						script: inner.script || '',
					});
				});
				node.options = options;
			}
			// can loop, so clear but not delete
			pushToStaged(cs, 'dialogs[]', node);
			prepStaged(cs, 'dialogIdentifier{}');
			prepStaged(cs, 'dialogParameters[]');
			prepStaged(cs, 'dialogMessages[]');
			prepStaged(cs, 'dialogOptions[]');
		},
	},
	serial_dialog_literal: {
		patterns: [{ start: `'{'`, body: `@serial_dialog?`, end: `'}'` }],
		// can have an open brace for a start because nothing
		// will launch into this other than serial_dialog stuff
		onStart: (f, cs) => {
			if (!getStaged(cs, 'serialDialogName')) {
				replaceStaged(cs, 'serialDialogName', makeAutoIdentifierName(
					f.plaintext,
					f.tokens[cs.stack[0].startPos].pos,
					f.fileName,
				));
			}
		},
		onEnd: (f, cs) => {
			// Don't delete name yet!
			// Wait for the 'SHOW_SERIAL_DIALOG' to use it first
		},
	},
	serial_dialog_definition: {
		patterns: [{
			start: `'serial_dialog' $string:serialDialogName`,
			body: `@serial_dialog_literal`
		}],
		onStart: (f, cs) => {
			let name = mostRecentCapture(cs, 'serialDialogName');
			replaceStaged(cs, 'serialDialogName', name.value);
		},
		onEnd: (f, cs) => {
			// have to wait to delete it now because of the 'show..block' variant
			deleteStaged(cs, 'serialDialogName');
		}
	},
	serial_dialog: {
		patterns: `@serial_dialog_parameter*
			$quoted_string:serialDialogMessage+
			@serial_dialog_option*`,
		onEnd: (f, cs) => {
			const debug = {
				parameters: getAndDeleteStaged(cs, 'serialDialogParameters[]'),
				messages: mostRecentCaptures(cs, 'serialDialogMessage', 1, Infinity),
				options: getAndDeleteStaged(cs, 'serialDialogOptions[]'),
			};
			const node = {
				node: 'serial_dialog_definition',
				name: getStaged(cs, 'serialDialogName'),
				debug,
			};
			node.messages = debug.messages
				.map(inner=>inner.value);
			if (debug.parameters?.length > 0) {
				node.parameters = debug.parameters
					.map(inner=>{
						if (inner.malformed) node.malformed = true;
						return {
							property: inner.property,
							value: inner.value,
						};
					})
			}
			let optionType = debug?.options?.[0]?.type;
			if (optionType) {
				node[optionType] = debug.options.map(inner=>{
					if (inner.malformed) node.malformed = true;
					if (inner.type !== optionType) {
						f.warnings.push({
							value: 'Mixed serial dialog options',
							message: `Serial dialog option types are mixed; the first type will be used.`,
							errorPos: inner.startPos,
						});
					}
					return {
						label: inner.label,
						script: inner.script,
					};
				});
			}
			const malformed = getAndDeleteStaged(cs, 'serialDialogParametersMalformed');
			if (malformed) node.malformed = true;
			addNode(f, cs, node);
		},
	},
	serial_dialog_option: {
		patterns: [
			{ start: `'#':optionType`, body: `$quoted_string:label '=' $string:script` },
			{ start: `'_':optionType`, body: `$quoted_string:label '=' $string:script` },
		],
		onEnd: (f, cs) => {
			const script = mostRecentCapture(cs, 'script');
			const label = mostRecentCapture(cs, 'label');
			const optionType = mostRecentCapture(cs, 'optionType');
			let type = '';
			if (optionType.value === '#') type = 'options';
			if (optionType.value === '_') type = 'text_options';
			pushToStaged(cs, 'serialDialogOptions[]', {
				node: 'serial_dialog_option',
				type,
				label: label?.value || '',
				script: script?.value || '',
				malformed: !label || !script,
			});
		},
	},
	dialog_definition: {
		patterns: [
			{ start: `'dialog' $string:dialogName`, body: `@dialog_literal` },
		],
		onStart: (f, cs) => {
			let name = mostRecentCapture(cs, 'dialogName');
			replaceStaged(cs, 'dialogName', name.value);
		},
		onEnd: (f, cs) => {
			// have to wait to delete it now because of the 'show..block' variant
			deleteStaged(cs, 'serialDialogName');
		},
	},
	dialog_identifier: {
		patterns: [
			{ start: `'entity':identifierType`, body: `$string:identifierValue` },
			{ start: `'name':identifierType`, body: `$string:identifierValue` },
			{ body: `$bareword:identifierValue` },
		],
		onEnd: (f, cs) => {
			const identifierValue = mostRecentCapture(cs, 'identifierValue');
			const identifierType = optionalCapture(cs, 'identifierType');
			const insert = buildNode(cs, {
				node: 'dialog_identifier',
				type: identifierType?.value || 'label',
				value: identifierValue?.value || '',
			})
			replaceStaged(cs, 'dialogIdentifier', insert);
		},
	},
	dialog_option: {
		patterns: [
			{
				start: `'>'`,
				body: `$quoted_string:label '=' $string:script`
			},
		],
		onEnd: (f, cs) => {
			const script = mostRecentCapture(cs, 'script');
			const label = mostRecentCapture(cs, 'label');
			pushToStaged(cs, 'dialogOptions[]', {
				node: 'dialog_option',
				label: label?.value || '',
				script: script?.value || '',
				malformed: !label || !script,
			});
		},
	},
	show_dialog_block: {
		patterns: [{
			start: `'show' 'dialog' $string:dialogName?`,
			body: `@dialog_literal?`,
			end: `';'`,
		}],
		onStart: (f, cs) => {
			let name = optionalCapture(cs, 'dialogName');
			name = name?.value || makeAutoIdentifierName(
				f.plaintext,
				f.tokens[cs.stack[0].startPos].pos,
				f.fileName,
			);
			// need the name ready now in case there's no literal here
			replaceStaged(cs, 'dialogName', name);

		},
		onEnd: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems[]', buildNode(cs, {
				node: 'action',
				action: 'SHOW_DIALOG',
				serial_dialog: getStaged(cs, 'dialogName'),
			}));
			deleteStaged(cs, 'dialogName');
		},
	},
	show_serial_dialog_block: {
		patterns: [{
			start: `'show' 'serial_dialog' $string:serialDialogName?`,
			body: `@serial_dialog_literal?`,
			// and THAT's why there's a semicolon after braces sometimes!
			end: `';'`,
		}],
		onStart: (f, cs) => {
			let name = optionalCapture(cs, 'serialDialogName');
			name = name?.value || makeAutoIdentifierName(
				f.plaintext,
				f.tokens[cs.stack[0].startPos].pos,
				f.fileName,
			);
			// need the name ready now in case there's no literal here
			replaceStaged(cs, 'serialDialogName', name);
		},
		onEnd: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems', {
				node: 'action',
				action: 'SHOW_SERIAL_DIALOG',
				serial_dialog: getStaged(cs, 'serialDialogName'),
			});
			deleteStaged(cs, 'serialDialogName');
		},
	},
	concat_serial_dialog_block: {
		// COPY PASTA'D FROM 'show'
		patterns: [{
			start: `'concat' 'serial_dialog' $string:serialDialogName?`,
			body: `@serial_dialog_literal?`,
			end: `';'`,
		}],
		onStart: (f, cs) => {
			let name = optionalCapture(cs, 'serialDialogName');
			name = name?.value || makeAutoIdentifierName(
				f.plaintext,
				f.tokens[cs.stack[0].startPos].pos,
				f.fileName,
			);
			replaceStaged(cs, 'serialDialogName', name);
		},
		onEnd: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems[]', {
				node: 'action',
				action: 'SHOW_SERIAL_DIALOG',
				disable_newline: true, // EXCEPT FOR THIS, LOL
				serial_dialog: getStaged(cs, 'serialDialogName'),
			});
			deleteStaged(cs, 'serialDialogName');
		},
	},
	debug_macro: {
		patterns: [{
			start: `'debug'`,
			body: `'!' '(' @serial_dialog`,
			end: `')'`,
		}],
		onStart: (f, cs) => {
			const name = makeAutoIdentifierName(
				f.plaintext,
				f.tokens[cs.stack[0].startPos].pos,
				f.fileName,
			);
			replaceStaged(cs, 'serialDialogName', name);
		},
		onEnd: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems[]', {
				node: 'debug_macro',
				action: 'SHOW_SERIAL_DIALOG',
				serial_dialog: getStaged(cs, 'serialDialogName'),
			});
		},
	},
	entity_identifier: {
		patterns: [
			{ body: `'player':identifierType` },
			{ body: `'self':identifierType` },
			{ start: `'entity':identifierType`, body: `$string:entityName<entityNames` },
		],
		onEnd: (f, cs) => {
			const entityNameCapture = optionalCapture(cs, 'entityName');
			const identifierType = mostRecentCapture(cs, 'identifierType');
			let entity = null;
			let pos = identifierType.pos;
			if (identifierType?.value === 'player') entity = '%PLAYER%';
			if (identifierType?.value === 'self') entity = '%SELF%';
			if (identifierType?.value === 'entity') {
				entity = entityNameCapture.value;
				pos = entityNameCapture.value;
			}
			pushCapture(cs, { label: 'entity', value: entity, pos });
		},
	},
	entity_or_map_identifier: {
		patterns: [
			{ body: `'map':identifierType` },
			{ body: `'player':identifierType` },
			{ body: `'self':identifierType` },
			{ start: `'entity':identifierType`, body: `$string:entityName<entityNames` },
		],
		onEnd: (f, cs) => {
			const entityNameCapture = optionalCapture(cs, 'entityName');
			const identifierType = mostRecentCapture(cs, 'identifierType');
			let entity = null;
			let pos = identifierType.pos;
			if (identifierType?.value === 'map') entity = '%MAP%';
			if (identifierType?.value === 'player') entity = '%PLAYER%';
			if (identifierType?.value === 'self') entity = '%SELF%';
			if (identifierType?.value === 'entity') {
				entity = entityNameCapture.value;
				pos = entityNameCapture.value;
			}
			pushCapture(cs, { label: 'entity', value: entity, pos });
		},
	},
	script_definition: {
		patterns: [
			{
				start: `'script'? $string:scriptName>scriptNames '{'`,
				body: `@script_body_item*`,
				end: `'}'`
			},
		],
		onStart: (f, cs) => {
			prepStaged(cs, 'scriptBodyItems[]');
		},
		onEnd: (f, cs) => {
			const scriptBodyItems = getStaged(cs, 'scriptBodyItems[]');
			// // maybe move this later? let the script handler do this?
			// crawlState.staged.scriptBodyItems.push({
			// 	node: 'action', action: 'LABEL', label: 'auto return',
			// 	startPos: crawlState.tokenPos-1, tokenPos: crawlState.tokenPos,
			// });
			// // it's confusing me now so I'm hiding this
			// for my own visual QOL
			scriptBodyItems.forEach(item=>{
				// delete item.node;
				if (!item.malformed) {
					delete item.malformed;
				}
			});
			addNode(f, cs, {
				node: 'script_definition',
				name: mostRecentCapture(cs, 'scriptName').value,
				body: scriptBodyItems,
			});
			deleteStaged(cs, 'scriptBodyItems[]');
		},
	},
	// if_plain: {
	// 	patterns: [{ start: `'if' @boolean_expression`, body: `'then' 'goto' @then_goto`, end: `';'` }],
	// 	onEnd: [{
	// 		//todo
	// 	}],
	// },
	if_block: {
		patterns: [{ start: `'if' '('`, body: `@boolean_expression ')' '{' @script_body_item*`, end: `'}'`}],
		onStart: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems[]', {
				node: 'zigzag_macro',
				action: 'if_block_start',
			});
		},
		onEnd: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems[]', {
				node: 'zigzag_macro',
				action: 'if_block_end',
				conditions: getStaged(cs, 'conditions[]'),
			});
			deleteStaged(cs, 'conditions[]');
			deleteStaged(cs, 'booleanUnits[]');
			deleteStaged(cs, 'lhs[]');
		}
	},
	else_if_block: {
		patterns: [{ start: `'else' 'if'`, body: `'(' @boolean_expression ')' '{' @script_body_item*`, end: `'}'`}],
		onStart: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems[]', {
				node: 'else_if_block_start',
				action: 'zigzag_macro',
			});
		},
		onEnd: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems[]', {
				node: 'else_if_block_end',
				action: 'zigzag_macro',
				conditions: getStaged(cs, 'conditions[]'),
			});
			deleteStaged(cs, 'conditions[]');
			deleteStaged(cs, 'booleanUnits[]');
			deleteStaged(cs, 'lhs[]');
		}
	},
	else_block: {
		patterns: [{ start: `'else' '{'`, body: `@script_body_item*`, end: `'}'`}],
		onStart: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems[]', {
				node: 'zigzag_macro',
				action: 'else_block_start',
			});
		},
		onEnd: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems[]', {
				node: 'zigzag_macro',
				action: 'else_block_end',
			});
		}
	},
	copy_script: {
		patterns: [{ start: `'copy'`, body: `'!' '(' $string:script<scriptNames`, end: `')'` }],
		onEnd: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems[]', {
				node: 'action',
				action: 'COPY_SCRIPT',
				script: mostRecentCapture(cs, 'script'),
			});
		},
	},
	whyle_body_item: {
		patterns: `@script_body_item | 'break':specialGoto ';' | 'continue':specialGoto ';'`,
		onEnd: (f, cs) => {
			const special = mostRecentCapture(cs, 'specialGoto');
			if (special) {
				let label = '';
				if (special.value === 'break') label = 'auto break';
				else if (special.value === 'continue') label = 'auto continue';
				pushToStaged(cs, 'scriptBodyItems[]', {
					node: 'action',
					action: 'GOTO_ACTION_LABEL',
					label,
				});
			}
		},
	},
	while_block: {
		patterns: [{ start: `'while'`, body: `'(' @boolean_expression ')' '{' @whyle_body_item*`, end: `'}'`}],
		onStart: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems', {
				node: 'whyle_block_start',
				action: 'whyle_macro',
			});
		},
		onEnd: (f, cs) => {
			pushToStaged(cs, 'scriptBodyItems', {
				node: 'whyle_block_end',
				action: 'whyle_macro',
				conditions: getStaged(cs, 'conditions[]'),
			});
			deleteStaged(cs, 'conditions[]');
			deleteStaged(cs, 'booleanUnits[]');
			deleteStaged(cs, 'lhs[]');
		}
	},
	boolean_expression: {
		patterns: [
			{start: `@boolean_unit`, body: `@boolean_chain*`},
		],
		onEnd: (f, cs) => {
			pushToStaged(cs, 'conditions[]',
				popFromStaged(cs, 'booleanUnits[]')
			);
		},
	},
	boolean_unit: {
		patterns: `@boolean_grouping | @boolean_unary | @boolean_literal`,
	},
	boolean_grouping: {
		patterns: [{ start: `'('`, body: `@boolean_expression`, end: `')'`}],
		onStart: (f, cs) => {
			pushToStaged(cs, 'lhs[]', { node: 'groupStart' });
		},
		onEnd: (f, cs) => {
			popFromStaged(cs, 'lhs[]'); // cleanup placeholder
			pushToStaged(cs, 'booleanUnits[]', {
				node: 'grouping',
				group: popFromStaged(cs, 'conditions[]'),
			});
		},
	},
	boolean_unary: {
		patterns: [{ start: `'!':operator`, body: `@boolean_unit`}],
		onEnd: (f, cs) => {
			pushToStaged(cs, 'booleanUnits[]', {
				node: 'unary_expression',
				operand: popFromStaged(cs, 'booleanUnits[]'),
				operator: mostRecentCapture(cs, 'operator'),
			});
		},
	},
	boolean_operator: {
		patterns: `$operator:operator`,
		onEnd: (f, cs) => {
			pushToStaged(cs, 'lhs[]',
				popFromStaged(cs, 'booleanUnits[]')
			);
		},

	},
	boolean_chain: {
		patterns: `@boolean_operator @boolean_unit`,
		onEnd: (f, cs) => {
			pushToStaged(cs, 'booleanUnits[]', {
				node: 'binary_expression',
				operator: mostRecentCapture(cs, 'operator'),
				rhs: popFromStaged(cs, 'booleanUnits[]'),
				lhs: popFromStaged(cs, 'lhs[]'),
			});
		},
	},
	boolean_literal: {
		patterns: `'debug_mode':engineBool | $boolean:booleanValue | $string:flagName`,
		onEnd: (f, cs) => {
			let type = getMostRecentCaptureAnyName(cs);
			pushToStaged(cs, 'booleanUnits[]', {
				node: 'boolean_literal',
				label: type.label,
				value: type.value,
			});
		},
	},
	script_body_item: {
		patterns: [
			`@show_dialog_block`,
			`@show_serial_dialog_block`,
			`@if_block`,
			`@else_if_block`,
			`@else_block`,
			`@while_block`,
			`@debug_macro`,
			`@json_literal`,
			// `@if_plain`,
		], // also auto populated
	},
	json_literal: {
		patterns: [{ start: `'json' '!'`, body: `@json_array?` }],
		onEnd: (f, cs) => {
			const json = mostRecentCaptures(cs, 'json', 0, Infinity);
			const flat = json.map(s=>s.value).join('');
			// todo: try/catch?
			const parsed = JSON.parse(flat);
			parsed.forEach(action=>{
				action.node = 'action',
				pushToStaged(cs, 'scriptBodyItems[]', action);
			});
		},
	},
	json_object: {
		patterns: [{ start: `'{':json`, body: `@json_properties_expression?`, end: `'}':json` }],
	},
	json_object_chain: {
		patterns: [{ start: `',':json`, body: `'{':json @json_object`, end: `'}':json` }],
	},
	json_properties_expression: {
		patterns: [{ start: `@json_property_value_pair @json_property_value_pair_chain*` }],
	},
	json_property_value_pair: {
		patterns: [{ start: `$quoted_string:jsonQ`, body: `':':json @json_value` }],
		onStart: (f, cs) => {
			const quotedString = mostRecentCapture(cs, 'jsonQ');
			if (quotedString) {
				quotedString.value = `"${quotedString.value}"`;
				quotedString.label = `json`;
			}
			pushCapture(cs, quotedString);
		},
	},
	json_property_value_pair_chain: {
		patterns: [{ start: `',':json`, body: `@json_property_value_pair` }],
	},
	json_value: {
		patterns: [
			{ body: '@json_array' },
			{ body: '$quoted_string:jsonQ' },
			{ body: '$number:json' },
			{ body: '$boolean:json' },
			{ body: '@json_object' },
		],
		onEnd: (f, cs) => {
			const quotedString = mostRecentCapture(cs, 'jsonQ');
			if (quotedString) {
				quotedString.value = `"${quotedString.value}"`;
				quotedString.label = `json`;
				pushCapture(cs, quotedString);
			}
		},
	},
	json_array: {
		patterns: [{ start: `'[':json`, body: `@json_array_body?`, end: `']':json` }],
	},
	json_array_body: {
		patterns: [{body:`@json_value @json_value_chain*`}],
	},
	json_value_chain: {
		patterns: [{ start: `',':json`, body: `@json_value` }],
	},
	// enum_assignment_simple: {
	// 	patterns: [
	// 		{ start: `'player_control':lhType`, body: `'=' @boolean:bool_value`, end: `';'` },
	// 		{ start: `'lights_control':lhType`, body: `'=' @boolean:bool_value`, end: `';'` },
	// 		{ start: `'hex_editor':lhType`, body: `'=' @boolean:bool_value`, end: `';'` },
	// 		{ start: `'hex_dialog_mode':lhType`, body: `'=' @boolean:bool_value`, end: `';'` },
	// 		{ start: `'hex_control':lhType`, body: `'=' @boolean:bool_value`, end: `';'` },
	// 		{ start: `'hex_clipboard':lhType`, body: `'=' @boolean:bool_value`, end: `';'` },
	// 		{ start: `'serial_control':lhType`, body: `'=' @boolean:bool_value`, end: `';'` },
	// 	],
	// 	onEnd: (f, cs) => {
	// 		const actionMap = {
	// 			player_control: 'SET_PLAYER_CONTROL',
	// 			lights_control: 'SET_LIGHTS_CONTROL',
	// 			hex_editor: 'SET_HEX_EDITOR_STATE',
	// 			hex_dialog_mode: 'SET_HEX_EDITOR_DIALOG_MODE',
	// 			hex_control: 'SET_HEX_EDITOR_CONTROL',
	// 			hex_clipboard: 'SET_HEX_EDITOR_CONTROL_CLIPBOARD',
	// 			serial_control: 'SET_SERIAL_DIALOG_CONTROL',
	// 		}
	// 		const bool_value = mostRecentCapture(cs, 'bool_value')?.value;
	// 		const lhTypeCapture = mostRecentCapture(cs, 'lhType');
	// 		pushToStaged(cs, 'scriptBodyItems[]', {
	// 			node: 'action',
	// 			action: actionMap[lhTypeCapture?.value || ''],
	// 			bool_value,
	// 			malformed: !script,
	// 		});
	// 	}
	// }
};

const exampleActionResult = {
	patterns: [{
		body: `'goto' $string:script`,
		end: `';'`
	}],
	onEnd: (f, cs) => {
		const script = semiRecentCapture(cs, 'script')?.value || '';
		pushToStaged(cs, 'scriptBodyItems[]', {
			node: 'action',
			action: 'RUN_SCRIPT',
			script,
			malformed: !script,
		});
	},
};
const actionDictionary = {
	// no captures
	action_return: { action: 'GOTO_ACTION_LABEL',
		captures: [],
		values: { label: 'auto return' },
		patterns: [{ start: `'return'`, end: `';'` }],
	},
	action_close_dialog: { action: 'CLOSE_DIALOG',
		captures: [],
		patterns: [{ body: `'close' 'dialog'`, end: `';'` }],
	},
	action_close_serial_dialog: { action: 'CLOSE_SERIAL_DIALOG',
		captures: [],
		patterns: [{ body: `'close' 'serial_dialog'`, end: `';'` }],
	},
	action_slot_save: { action: 'SLOT_SAVE',
		captures: [],
		patterns: [{ start: `'save'`, body: `'slot'`, end: `';'` }],
	},
	// game flow manip
	action_load_map: { action: 'LOAD_MAP',
		captures: [ 'map' ],
		patterns: [{ start: `'load' 'map'`, body: `$string:map`, end: `';'` }],
	},
	action_slot_load: { action: 'SLOT_LOAD',
		captures: [ 'slot' ],
		patterns: [{ start: `'load' 'slot'`, body: `$number:slot`, end: `';'` }],
	},
	action_slot_erase: { action: 'SLOT_ERASE',
		captures: [ 'slot' ],
		patterns: [{ start: `'erase'`, body: `'slot' $number:slot`, end: `';'` }],
	},
	action_goto_index: { action: 'GOTO_ACTION_INDEX',
		captures: [ 'action_index' ],
		patterns: [{ start: `'goto' 'index'`, body: `$number:action_index`, end: `';'` }],
	},
	action_goto_label: { action: 'GOTO_ACTION_LABEL',
		captures: [ 'label' ],
		patterns: [{ start: `'goto' 'label'`, body: `$bareword:label`, end: `';'`}],
	},
	action_goto_script: { action: 'RUN_SCRIPT',
		captures: [ 'script' ],
		patterns: [{ body: `'goto' 'script'? $string:script<scriptNames`, end: `';'` }],
	},

	// uncategorized:
	action_blocking_delay: { action: 'BLOCKING_DELAY',
		captures: [ 'duration' ],
		patterns: [{ start: `'block'`, body: `$duration:duration`, end: `';'` }],
	},
	action_non_blocking_delay: { action: 'NON_BLOCKING_DELAY',
		captures: [ 'duration' ],
		patterns: [{ start: `'wait'`, body: `$duration:duration`, end: `';'` }],
	},
	action_hide_command: { action: 'SET_SERIAL_DIALOG_COMMAND_VISIBILITY',
		captures: [ 'command' ],
		values: { is_visible: false },
		patterns: [{ start: `'hide'`, body: `'command' $string:command`, end: `';'` }],
	},
	action_unhide_command: { action: 'SET_SERIAL_DIALOG_COMMAND_VISIBILITY',
		captures: [ 'command' ],
		values: { is_visible: true },
		patterns: [{ start: `'unhide'`, body: `'command' $string:command`, end: `';'` }],
	},
	action_pause_script: { action: 'SET_SCRIPT_PAUSE',
		captures: [ 'script_slot', 'entity' ],
		values: { bool_value: true },
		patterns: [{
			start: `'pause'`,
			body: `@entity_or_map_identifier $bareword:script_slot`,
			// deciding now that the file playback system can handle invalid enum
			// options (rather than the parser); parsing will become much simpler
			end: `';'`
		}],
	},
	action_unpause_script: { action: 'SET_SCRIPT_PAUSE',
		captures: [ 'script_slot', 'entity' ],
		values: { bool_value: false },
		patterns: [{
			start: `'unpause'`,
			body: `@entity_or_map_identifier $bareword:script_slot<enum_script_slot`,
			end: `';'`
		}],
	},
	action_delete_alias: { action: 'UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS',
		captures: [ 'alias' ],
		patterns: [{
			start: `'delete' 'alias'`,
			body: `$string:alias<aliases`,
			end: `';'`
		}],
	},
	action_delete_command: { action: 'UNREGISTER_SERIAL_DIALOG_COMMAND',
		captures: [ 'command' ],
		values: { is_fail: false },
		patterns: [{
			body: `'delete' 'command' $string:command`,
			end: `';'`
		}],
	},
	action_delete_command_fail: { action: 'UNREGISTER_SERIAL_DIALOG_COMMAND',
		captures: [ 'command' ],
		values: { is_fail: true },
		patterns: [{
			body: `'delete' 'command' $string:command 'fail'`,
			end: `';'`
		}],
	},
	action_delete_command_argument: { action: 'UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT',
		captures: [ 'argument', 'command' ],
		values: { is_fail: true },
		patterns: [{
			start: `'delete' 'command' $string:command '+'`,
			body: `$string:argument`,
			end: `';'`
		}],
	},
	action_camera_fade_out: { action: 'SCREEN_FADE_OUT',
		captures: [ 'color', 'duration' ],
		patterns: [{
			start: `'camera' 'fade' 'out'`,
			body: `'->' $color:color 'over' $duration:duration`,
			end: `';'`
		}],
	},
	action_camera_fade_in: { action: 'SCREEN_FADE_IN',
		captures: [ 'color', 'duration' ],
		patterns: [{
			start: `'camera' 'fade' 'in'`,
			body: `'->' $color:color 'over' $duration:duration`,
			end: `';'`
		}],
	},
	action_camera_shake: { action: 'SET_SCREEN_SHAKE',
		captures: [ 'amplitude', 'distance', 'duration' ],
		patterns: [{
			start: `'camera' 'shake'`,
			body: `'->' $duration:amplitude $distance:distance 'for' $duration:duration`,
			end: `';'`
		}],
	},
	action_play_entity_animation: { action: 'PLAY_ENTITY_ANIMATION',
		captures: [ 'animation', 'play_count', 'entity' ],
		patterns: [{
			start: `@entity_identifier 'animation'`,
			body: `'->' $number:animation $quantity:play_count?`,
			end: `';'`
		}],
	},
	action_pan_camera_to_geometry: { action: 'PAN_CAMERA_TO_GEOMETRY',
		captures: [  'duration', 'geometry' ],
		patterns: [{
			start: `'camera' '->' 'geometry' $string:geometry<geometryNames 'origin'`,
			body: `'over' $duration:duration`,
			end: `';'`
		}],
	},
	action_pan_camera_along_geometry: { action: 'PAN_CAMERA_ALONG_GEOMETRY',
		captures: [ 'duration', 'geometry' ],
		patterns: [{
			start: `'camera' '->' 'geometry' $string:geometry<geometryNames 'length' 'over'`,
			body: `$duration:duration`,
			end: `';'`
		}],
	},
	action_loop_camera_along_geometry: { action: 'LOOP_CAMERA_ALONG_GEOMETRY',
		captures: [ 'geometry' ],
		patterns: [{
			start: `'camera' '->' 'geometry' $string:geometry<geometryNames 'length' 'forever'`,
			end: `';'`
		}],
	},
	action_pan_camera_to_entity: { action: 'PAN_CAMERA_TO_ENTITY',
		captures: [ 'duration', 'entity' ],
		patterns: [{
			start: `'camera' '->' @entity_identifier 'position'`,
			body: `'over' $duration:duration`,
			end: `';'`
		}],
	},
	action_walk_entity_to_geometry: { action: 'WALK_ENTITY_TO_GEOMETRY',
		captures: [  'duration', 'geometry', 'entity' ],
		patterns: [{
			start: `@entity_identifier 'position' '->' 'geometry' $string:geometry<geometryNames 'origin'`,
			body: `'over' $duration:duration`,
			end: `';'`
		}],
	},
	action_walk_entity_along_geometry: { action: 'WALK_ENTITY_ALONG_GEOMETRY',
		captures: [ 'duration', 'geometry', 'entity' ],
		patterns: [{
			start: `@entity_identifier 'position' '->' 'geometry' $string:geometry<geometryNames 'length' 'over'`,
			body: `$duration:duration`,
			end: `';'`
		}],
	},
	action_loop_entity_along_geometry: { action: 'LOOP_ENTITY_ALONG_GEOMETRY',
		captures: [ 'geometry', 'entity' ],
		patterns: [{
			start: `@entity_identifier 'position' '->' 'geometry' $string:geometry<geometryNames 'length' 'forever'`,
			end: `';'`
		}],
	},

	action_play_entity_animation: { action: 'PLAY_ENTITY_ANIMATION',
		captures: [ 'play_count', 'animation', 'entity' ],
		patterns: [{
			start: `@entity_identifier 'animation'`,
			body: `'->' $number:animation $quantity:play_count`,
			end: `';'`
		}],
	},
	action_teleport_camera_geometry: { action: 'TELEPORT_CAMERA_TO_GEOMETRY',
		captures: [ 'geometry' ],
		patterns: [{
			start: `'camera' 'position' '=' 'geometry'`,
			body: `$string:geometry<geometryNames`,
			end: `';'`
		}],
	},
	action_camera_follow_entity: { action: 'SET_CAMERA_TO_FOLLOW_ENTITY',
		captures: [ 'entity' ],
		patterns: [{
			start: `'camera' 'position' '='`,
			body: `@entity_identifier 'position'`,
			end: `';'`
		}],
	},
	action_teleport_entity_geometry: { action: 'TELEPORT_ENTITY_TO_GEOMETRY',
		captures: [ 'geometry', 'entity' ],
		patterns: [{
			start: `@entity_identifier 'position' '='`,
			body: `'geometry' $string:geometry<geometryNames`,
			end: `';'`
		}],
	},
	// ASSIGNMENT: RH eventually to be boolean expression
	action_set_entity_glitched: { action: 'SET_ENTITY_GLITCHED',
		captures: [ 'bool_value', 'entity' ],
		patterns: [{ start: `@entity_identifier 'glitched'`, body: `'=' $boolean:bool_value`, end: `';'` }],
	},
	action_set_player_control: { action: 'SET_PLAYER_CONTROL',
		captures: [ 'bool_value' ],
		patterns: [{ start: `'player_control'`, body: `'=' $boolean:bool_value`, end: `';'` }],
	},
	action_set_lights_control: { action: 'SET_LIGHTS_CONTROL',
		captures: [ 'bool_value' ],
		patterns: [{ start: `'lights_control'`, body: `'=' $boolean:bool_value`, end: `';'` }],
	},
	action_set_hex_editor_state: { action: 'SET_HEX_EDITOR_STATE',
		captures: [ 'bool_value' ],
		patterns: [{ start: `'hex_editor'`, body: `'=' $boolean:bool_value`, end: `';'` }],
	},
	action_set_hex_editor_dialog_mode: { action: 'SET_HEX_EDITOR_DIALOG_MODE',
		captures: [ 'bool_value' ],
		patterns: [{ start: `'hex_dialog_mode'`, body: `'=' $boolean:bool_value`, end: `';'` }],
	},
	action_set_hex_editor_control: { action: 'SET_HEX_EDITOR_CONTROL',
		captures: [ 'bool_value' ],
		patterns: [{ start: `'hex_control'`, body: `'=' $boolean:bool_value`, end: `';'` }],
	},
	action_set_hex_editor_control_clipboard: { action: 'SET_HEX_EDITOR_CONTROL_CLIPBOARD',
		captures: [ 'bool_value' ],
		patterns: [{ start: `'hex_clipboard'`, body: `'=' $boolean:bool_value`, end: `';'` }],
	},
	action_set_serial_control: { action: 'SET_SERIAL_DIALOG_CONTROL',
		captures: [ 'bool_value' ],
		patterns: [{ start: `'serial_control'`, body: `'=' $boolean:bool_value`, end: `';'` }],
	},
	// when the RH becomes a boolean expression rather than a straight boolean value,
	// you can distinguish `varName1 = varName2` and `flagName1 = flagName2` by
	// putting double-`!` on the right, like `flagName1 = !!flagName2`
	action_set_save_flag: { action: 'SET_SAVE_FLAG',
		captures: [ 'bool_value', 'save_flag' ],
		patterns: [{ start: `$string:save_flag '=' $boolean:bool_value`, end: `';'` }],
	},

	// // ASSIGNMENT: RH eventually to be number expression
	// action_set_entity_x: { action: 'SET_ENTITY_X',
	// 	captures: [ 'u2_value', 'entity' ],
	// 	patterns: [{ start: `@entity_identifier 'x'`, body: `'=' $number:u2_value`, end: `';'` }],
	// },
	// action_set_entity_y: { action: 'SET_ENTITY_Y',
	// 	captures: [ 'u2_value', 'entity' ],
	// 	patterns: [{ start: `@entity_identifier 'y'`, body: `'=' $number:u2_value`, end: `';'` }],
	// },
	// action_set_entity_primary_id: { action: 'SET_ENTITY_PRIMARY_ID',
	// 	captures: [ 'u2_value', 'entity' ],
	// 	patterns: [{ start: `@entity_identifier 'primary_id'`, body: `'=' $number:u2_value`, end: `';'` }],
	// },
	// action_set_entity_secondary_id: { action: 'SET_ENTITY_SECONDARY_ID',
	// 	captures: [ 'u2_value', 'entity' ],
	// 	patterns: [{ start: `@entity_identifier 'secondary_id'`, body: `'=' $number:u2_value`, end: `';'` }],
	// },
	// action_set_entity_primary_id_type: { action: 'SET_ENTITY_PRIMARY_ID_TYPE',
	// 	captures: [ 'byte_value', 'entity' ],
	// 	patterns: [{ start: `@entity_identifier 'primary_id_type'`, body: `'=' $number:byte_value`, end: `';'` }],
	// },
	// action_set_entity_current_animation: { action: 'SET_ENTITY_CURRENT_ANIMATION',
	// 	captures: [ 'byte_value', 'entity' ],
	// 	patterns: [{ start: `@entity_identifier 'current_animation'`, body: `'=' $number:byte_value`, end: `';'` }],
	// },
	// action_set_entity_animation_frame: { action: 'SET_ENTITY_CURRENT_FRAME',
	// 	captures: [ 'byte_value', 'entity' ],
	// 	patterns: [{ start: `@entity_identifier 'animation_frame'`, body: `'=' $number:byte_value`, end: `';'` }],
	// },
	// action_set_entity_movement_relative: { action: 'SET_ENTITY_MOVEMENT_RELATIVE',
	// 	captures: [ 'relative_direction', 'entity' ],
	// 	patterns: [{ start: `@entity_identifier 'strafe'`, body: `'=' $number:relative_direction`, end: `';'` }],
	// },
	// action_copy_variable_into_entity: { action: 'COPY_VARIABLE',
	// 	captures: [ 'variable', 'field', 'entity' ],
	// 	values: { inbound: false },
	// 	patterns: [{ start: `@entity_identifier $bareword:field<entityFieldNames '='`, body: `$string:variable`, end: `';'` }],
	// },
	// action_copy_variable_from_entity: { action: 'COPY_VARIABLE',
	// 	captures: [ 'field', 'entity', 'variable' ],
	// 	values: { inbound: true },
	// 	patterns: [{ start: `$string:variable<>variableNames '=' @entity_identifier`, body: `$bareword:field<entityFieldNames`, end: `';'` }],
	// },
	// action_mutate_variable: { action: 'MUTATE_VARIABLE',
	// 	captures: [ 'field', 'entity', 'variable' ],
	// 	patterns: [{ start: `$string:variable<>variableNames $operator:operation $number:value`, end: `';'` }],
	// },
	// action_mutate_variables: { action: 'MUTATE_VARIABLES',
	// 	captures: [ 'source', 'variable' ],
	// 	patterns: [{ start: `$string:variable<>variableNames $operator:operation $string:source<>variableNames`, end: `';'` }],
	// },
	action_label: { action: 'LABEL',
		captures: [ 'label' ],
		patterns: `$bareword:labelName ':'`,
	},

}

const makeTreeEntry = (slug, treeEntry) => {
	return {
		patterns: treeEntry.patterns,
		onEnd: (f, cs) => {
			const insert = treeEntry.values
				? JSON.parse(JSON.stringify(treeEntry.values))
				: {};
			const captures = treeEntry.captures || [];
			captures.forEach(captureName=>{
				const capture = mostRecentCapture(cs, captureName);
				insert[captureName] = capture ? capture.value : null;
			});
			const actionValues = treeEntry.values;
			if (actionValues) {
				Object.entries(actionValues)
					.forEach(([key,value])=>{
						insert[key] = value;
					});
			}
			insert.node = 'action',
			insert.action = treeEntry.action; // e.g. 'RUN_SCRIPT'
			insert.startPos = cs.stack[0].startPos;
			insert.tokenPos = cs.tokenPos;
			insert.malformed = captures.reduce((acc, curr)=>{
				return acc || insert[curr] === null;
			}, false);
			pushToStaged(cs, 'scriptBodyItems[]', insert);
			// if (actionDictionary[slug].cleanupStaged) {
			// 	actionDictionary[slug].cleanupStaged
			// 		.forEach(v=>{ deleteStaged(cs, v); }); // test this
			// }
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

export const onStart = {};
export const onEnd = {};
export const patterns = {};

Object.keys(dictionary).forEach(entryName=>{
	const entry = dictionary[entryName];
	if (entry.patterns) patterns[entryName] = entry.patterns;
	if (entry.onStart) onStart[entryName] = entry.onStart;
	if (entry.onEnd) onEnd[entryName] = entry.onEnd;
});

const semiRecentCaptures = (cs, captureLabel, min = 1, max = min) => {
	// skip the irrelevant ones by setting them aside for a second
	const bot = [];
	while (
		cs.captures[cs.captures.length-1]
		&& cs.captures[cs.captures.length-1].label !== captureLabel
	) {
		bot.unshift(cs.captures.pop())
	}
	// collect the ones we want
	const extracted = [];
	for (let i = min || 1; i <= max; i++) {
		const latest = cs.captures[cs.captures.length-1];
		if (!latest) break;
		if (latest.label !== captureLabel) break;
		extracted.unshift(cs.captures.pop());
	}
	if (extracted.length < min) {
		const message = `Not enough captures labeled ${captureLabel};`
			+`found ${extracted.length}, needed at least ${min}`;
		// throw new Error (message);
	}
	// put the skipped ones back
	cs.captures = cs.captures.concat(bot);
	return extracted;
};
const semiRecentCapture = (cs, captureLabel) => {
	const extracted = semiRecentCaptures(cs, captureLabel, 1);
	return extracted ? extracted[0] : null;
};
const getMostRecentCaptureAnyName = (cs) => {
	return cs.captures.pop();
};
const readMostRecentCapture = (cs) => {
	return cs.captures[cs.captures.length-1];
};
const pushCapture = (cs, insert) => {
	return cs.captures.push(insert);
};
const mostRecentCaptures = (cs, captureLabel, min = 1, max = min) => {
	const extracted = [];
	for (let i = min || 1; i <= max; i++) {
		const latest = cs.captures[cs.captures.length-1];
		if (!latest) break;
		if (latest.label !== captureLabel) break;
		extracted.unshift(cs.captures.pop());
	}
	if (extracted.length < min) {
		return [];
		// return `Not enough captures labeled ${captureLabel};`
		// 	+`found ${extracted.length}, needed at least ${min}`;
	}
	return extracted;
};
const mostRecentCapture = (cs, captureLabel) => {
	const extracted = mostRecentCaptures(cs, captureLabel, 1);
	return extracted ? extracted[0] : null;
};
const optionalCapture = (cs, captureLabel) => {
	const extracted = mostRecentCaptures(cs, captureLabel, 0, 1);
	return extracted ? extracted[0] : null;
};

const pushToStaged = (cs, prop, value) => {
	// initialize first first
	const propName = prop.replace('[]', '');
	cs.staged[propName] = cs.staged[propName] || [];
	// insert
	cs.staged[propName].push(buildNode(cs, value));
};
const popFromStaged = (cs, prop) => {
	const propName = value.replace('[]', '');
	return cs.staged[propName].pop();
};
const replaceStaged = (cs, prop, value) => {
	const propName = prop.replace('[]', '').replace('{}', '');
	cs.staged[propName] = value;
};
const deleteStaged = (cs, prop) => {
	const propName = prop.replace('[]', '').replace('{}', '');
	delete cs.staged[propName];
};
const getStaged = (cs, prop) => {
	const propName = prop.replace('[]', '').replace('{}', '');
	return cs.staged[propName];
};
const getAndDeleteStaged = (cs, prop) => {
	const propName = prop.replace('[]', '').replace('{}', '');
	const get = getStaged(cs, propName);
	deleteStaged(cs, propName);
	return get;
};
const buildNode = (cs, item) => Object.assign({
		startPos: cs.stack[0].startPos,
		tokenPos: cs.tokenPos,
	}, item);

const prepStaged = (cs, value) => {
	const arr = value.endsWith('[]');
	const obj = value.endsWith('{}');
	if (arr) {
		const prop = value.replace('[]', '');
		cs.staged[prop] = cs.staged[prop] || [];
	} else if (obj) {
		const prop = value.replace('{}', '');
		cs.staged[prop] = cs.staged[prop] || {};
	}
};

const addNode = (f, cs, node) => {
	f.nodes.push(buildNode(cs, node));
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

export const tree = {};
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
					.replace('||','**********')
					.split('|')
					.map(str=>str.replace('**********', '||').trim());
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

export const terminators = {};
Object.entries(tree).map(([patternName, value])=>{
	terminators[patternName] = value.map(branch=>{
		return branch.find(branch=>branch.terminator)
	})
})
