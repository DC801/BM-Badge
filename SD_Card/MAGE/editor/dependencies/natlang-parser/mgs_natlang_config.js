// "use strict";

// low budget module system, go! -SB
var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;
if (typeof module === 'object') {
	natlang = require('./natlang-parse.js');
}

var mgs = {
	blocks: {
		"root": {
			branchesLoop: true,
			branches: [
				{ branch: "dialogSettingsNode", multipleOkay: true, zeroOkay: true },
				{ branch: "dialogNode", multipleOkay: true, zeroOkay: true },
				{ branch: "scriptNode", multipleOkay: true, zeroOkay: true },
			]
		},
		"dialogSettings": {
			branches: [
				{ branch: "dialogSettingsTarget", multipleOkay: true, zeroOkay: true },
			],
			closeChar: "}",
			onOpen: function (state) {
				state.finalState.dialogSettings = state.finalState.dialogSettings || [];
			},
			onClose: function () {} // just to silence the "no onClose?!?!" warning
		},
		"dialogSettingsTarget": {
			branches: [
				{ branch: "dialogParameter", multipleOkay: true, zeroOkay: true },
			],
			closeChar: "}",
			onClose: function (state) {
				var inserts = state.inserts;
				var finalState = state.finalState;
				var result = inserts.dialogSettingsTarget;
				result.parameters = inserts.dialogParameters;
				inserts.dialogParameters = {};
				inserts.dialogSettingsTarget = {};
				finalState.dialogSettings = finalState.dialogSettings || [];
				finalState.dialogSettings.push(result);
			},
		},
		"dialog": {
			branchesLoop: true,
			branches: [
				{
					branch: "dialogIdentifier",
					multipleOkay: false,
					zeroOkay: false,
					failMessage: "A dialog identifier is required before any dialog messages!"
				},
				{ branch: "dialogParameter", multipleOkay: true, zeroOkay: true },
				{
					branch: "dialogMessage",
					multipleOkay: true,
					zeroOkay: false,
					failMessage: "You need at least one dialog message!" 
				},
				{ branch: "dialogOption", multipleOkay: true, zeroOkay: true },
			],
			closeChar: "}",
			// consolidate the below somehow?
			onLoop: function (state) {
				var inserts = state.inserts;
				var insert = mgs.buildDialogFromState(state);
				inserts.dialogs = inserts.dialogs || [];
				inserts.dialogs.push(insert);
				inserts.dialogIdentifier = {};
				inserts.dialogParameters = {};
				inserts.dialogMessages = [];
				inserts.dialogOptions = [];
			},
			onClose: function (state) {
				var inserts = state.inserts;
				var final = state.finalState;
				var insert = mgs.buildDialogFromState(state);
				inserts.dialogs = inserts.dialogs || [];
				inserts.dialogs.push(insert);
				inserts.dialogIdentifier = {};
				inserts.dialogParameters = {};
				inserts.dialogMessages = [];
				inserts.dialogOptions = [];
				final.dialogs = final.dialogs || {};
				final.dialogs[inserts.dialogName] = inserts.dialogs;
				inserts.dialogName = null;
				inserts.dialogs = [];
			},
		},
		"script": {
			branches: [
				{ branch: "action", multipleOkay: true, zeroOkay: true }
			],
			closeChar: "}",
			onClose: function (state) {
				var inserts = state.inserts;
				var final = state.finalState;
				final.scripts = final.scripts || {};
				final.scripts[inserts.scriptName] = inserts.actions;
				inserts.scriptName = null;
				inserts.actions = [];
			}
		}
	},
	// The below is slim but a little tricky syntactically. Is problem or no?
	// A "normal" object isn't that much less slim! Consider:
	// dialogSettingsNode: {
	// 	pattern: "settings ?for dialog {",
	//	onMatch: function (state) { state.startBlock("dialogSettings"); }
	// }

	trees: {
		dialogSettingsNode: [
			["settings ?for dialog {",
				function (state) {
					// console.log("    Found 'settings ?for dialog {'")
					state.startBlock("dialogSettings");
				}],
		],
		dialogNode: [
			["dialog $dialog:string {",
				function (state) {
					// console.log("    Found 'dialog $dialog:string {'")
					state.startBlock("dialog");
					state.processCaptures("dialogName");
					state.clearCaptures();
				}],
		],
		scriptNode: [
			["?script $scriptName:string {",
				function (state) {
					// console.log("    Found '?script $scriptName:string {'")
					state.startBlock("script");
					state.processCaptures("scriptName");
					state.clearCaptures();
				}],
		],
		dialogSettingsTarget: [
			["?parameters ?for label $target:string {",
				function (state) {
					// console.log("    Found '?parameters ?for label $target:string {'")
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "label" }
					);
					state.clearCaptures();
				}],
			["?parameters ?for entity $target:string {",
				function (state) {
					// console.log("    Found '?parameters ?for entity $target:string {'")
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "entity" }
					);
					state.clearCaptures();
				}],
			["?parameters ?for ?global default {",
				function (state) {
					// console.log("    Found '?parameters ?for ?global default {'")
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "global" }
					);
					state.clearCaptures();
				}],
			["?parameters ?for ?global defaults {",
				function (state) {
					// console.log("    Found '?parameters ?for ?global defaults {'")
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "global" }
					);
					state.clearCaptures();
				}]
		],
		dialogParameter: [
			["entity $value:string",
				function (state) {
					// console.log("    Found 'entity $value:string'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "entity" }
					);
					state.clearCaptures();
				}],
			["name $value:string",
				function (state) {
					// console.log("    Found 'name $value:string'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "name" }
					);
					state.clearCaptures();
				}],
			["portrait $value:string",
				function (state) {
					// console.log("    Found 'portrait $value:string'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "portrait" }
					);
					state.clearCaptures();
				}],
			["alignment $value:string",
				function (state) {
					// console.log("    Found 'alignment $value:string'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "alignment" }
					);
					state.clearCaptures();
				}],
			["border_tileset $value:string",
				function (state) {
					// console.log("    Found 'border_tileset $value:string'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "border_tileset" }
					);
					state.clearCaptures();
				}],
			["emote $value:number",
				function (state) {
					// console.log("    Found 'emote $value:number'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "emote" }
					);
					state.clearCaptures();
				}],
			// ["$parameterName:string $value:string",
			// 	function (state, captures) {
			// 		state.capture.dialogParameter(state, captures.parameterName, captures.value);
			// 	}],
			// (I'd rather make the parameter value a closed list, I think; results in better "why it broke" communication for invalid words)
			["wrap messages ?to $value:number",
				function (state) {
					// console.log("    Found 'wrap messages ?to $value:number'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "messageWrap" }
						// TODO: make wrap an object rather than glue words together like this for each one; easier removal, too
					);
					state.clearCaptures();
				}],
				["wrap options ?to $value:number",
				function (state) {
					// console.log("    Found 'wrap options ?to $value:number'")
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "optionWrap" }
					);
					state.clearCaptures();
				}]
		],
		dialogIdentifier: [
			["$value:bareword",
				function (state) {
					// console.log("    Found '$value:bareword'")
					state.processCaptures(
						"dialogIdentifier",
						{ type: "label" }
					);
					state.clearCaptures();
				}],
			["entity $value:string",
				function (state) {
					// console.log("    Found 'entity $value:string'")
					state.processCaptures(
						"dialogIdentifier",
						{ type: "entity" }
					);
					state.clearCaptures();
				}],
			["name $value:string",
				function (state) {
					// console.log("    Found 'entity $value:string'")
					state.processCaptures(
						"dialogIdentifier",
						{ type: "name" }
					);
					state.clearCaptures();
				}]
		],
		dialogMessage: [
			["$message:quotedString",
				function (state) {
					// console.log("    Found '$message:quotedString'")
					state.processCaptures("dialogMessage");
					state.clearCaptures();
				}]
			],
		dialogOption: [
			["> $label:quotedString : ?goto ?script $script:string",
			// TODO: forbid "goto" and "script" in script/dialog names.... (probably more words, too)
				function (state) {
					// console.log("    Found '$message:quotedString'")
					state.processCaptures("dialogOption");
					state.clearCaptures();
				}]
		],
		action: [
			["show dialog $dialog:string {",
				function (state) {
					// console.log("    Found 'show dialog $dialog:quotedString {'")
					state.startBlock("dialog");
					state.processCaptures("dialogName");
					state.processCaptures(
						"action",
						{ action: "SHOW_DIALOG" }
					);
					state.clearCaptures();
				}],
			["show dialog {",
				function (state) {
					// console.log("    Found 'show dialog {'")
					state.startBlock("dialog");
					state.processCaptures("dialogName");
					state.processCaptures(
						"action",
						{
							action: "SHOW_DIALOG",
							dialog: state.inserts.dialogName
						}
					);
					state.clearCaptures();
				}]
			// more are procedurally added
		],
	},
	capture: {
		dialogName: function (state) {
			if (state.captures.dialog) {
				state.inserts.dialogName = state.captures.dialog;
			} else {
				state.inserts.dialogName = state.makeAutoIdentifierName();
			}
		},
		scriptName: function (state) {
			state.inserts.scriptName = state.captures.scriptName;
		},
		dialogSettingsTarget: function (state, args) {
			state.inserts.dialogSettingsTarget = {
					type: args.type,
					value: state.captures.target
						? state.captures.target
						: null
				}
		},
		dialogParameter: function (state, args) {
			state.inserts.dialogParameters = state.inserts.dialogParameters || {};
			state.inserts.dialogParameters[args.parameterName] = state.captures.value;
		},
		dialogIdentifier: function (state, args) {
			state.inserts.dialogIdentifier = {
				type: args.type,
				value: state.captures.value
			}
		},
		dialogMessage: function (state) {
			state.inserts.dialogMessages = state.inserts.dialogMessages || [];
			state.inserts.dialogMessages.push(state.captures.message);
		},
		dialogOption: function (state) {
			state.inserts.dialogOptions = state.inserts.dialogOptions || [];
			state.inserts.dialogOptions.push({
				label: state.captures.label,
				script: state.captures.script
			});
		},
		action: function (state, args) {
			var newAction = args
				? JSON.parse(JSON.stringify(args))
				: {};
			newAction.action = args.action;
			Object.keys(state.captures).forEach(function (propertyName) {
				newAction[propertyName] = state.captures[propertyName];
			});
			Object.keys(newAction).forEach(function (paramName) {
				if (paramName === "operation") {
					newAction[paramName] = natlang.opLookup[newAction[paramName]];
				}
			})
			state.inserts.actions = state.inserts.actions || [];
			state.inserts.actions.push(newAction);
		}
	}
};

mgs.actionDictionary = [
	{
		action: "BLOCKING_DELAY",
		pattern: "block $duration:duration",
	},
	{
		action: "SET_CAMERA_TO_FOLLOW_ENTITY",
		pattern: "make camera follow entity $entity:string",
	},
	{
		action: "SET_HEX_EDITOR_STATE",
		pattern: "$bool_value:boolean hex editor",
	},
	{
		action: "SLOT_ERASE",
		pattern: "erase slot $slot:number",
	},
	{
		action: "RUN_SCRIPT",
		pattern: "goto ?script $script:string",
	},
	{
		action: "LOOP_ENTITY_ALONG_GEOMETRY",
		pattern: "loop entity $entity:string along geometry $geometry:string over $duration:duration",
	},
	{
		action: "SET_ENTITY_DIRECTION_RELATIVE",
		pattern: "rotate entity $entity:string $relative_direction:number",
	},
	{
		action: "SLOT_SAVE",
		pattern: "save slot",
	},
	{
		action: "SET_SCREEN_SHAKE",
		pattern: "shake camera $frequency:duration $amplitude:distance for $duration:duration",
		exampleValues: {
			"$frequency:duration": "200ms",
			"$amplitude:distance": "32px",
			"$duration:duration": "3s",
		}
	},
	{
		action: "NON_BLOCKING_DELAY",
		pattern: "wait $duration:duration",
		exampleValues: { "$duration:duration": "400ms", }

	},
	{
		action: "WALK_ENTITY_TO_GEOMETRY",
		pattern: "walk entity $entity:string to geometry $geometry:string over $duration:duration",
	},
	{
		action: "WALK_ENTITY_ALONG_GEOMETRY",
		pattern: "walk entity $entity:string along geometry $geometry:string over $duration:duration",
	},
	{
		action: "SET_ENTITY_GLITCHED",
		pattern: "make entity $entity:string glitched",
		values: { "bool_value": true },
	},
	{
		action: "SET_ENTITY_GLITCHED",
		pattern: "make entity $entity:string unglitched",
		values: { "bool_value": false },
	},
	{
		action: "TELEPORT_ENTITY_TO_GEOMETRY",
		pattern: "teleport entity $entity:string to geometry $geometry:string",
	},
	{
		action: "TELEPORT_CAMERA_TO_GEOMETRY",
		pattern: "teleport camera to geometry $geometry:string",
	},
	{
		action: "SET_ENTITY_DIRECTION",
		pattern: "turn entity $entity:string $direction:bareword",
	},
	{
		action: "SET_ENTITY_DIRECTION_TARGET_ENTITY",
		pattern: "turn entity $entity:string toward entity $target_entity:string",
	},
	{
		action: "SET_ENTITY_DIRECTION_TARGET_GEOMETRY",
		pattern: "turn entity $entity:string toward geometry $target_geometry:string",
	},
	{
		action: "PAN_CAMERA_TO_ENTITY",
		pattern: "pan camera to entity $entity:string over $duration:duration",
	},
	{
		action: "PAN_CAMERA_ALONG_GEOMETRY",
		pattern: "pan camera along geometry $geometry:string over $duration:duration",
	},
	{
		action: "LOOP_CAMERA_ALONG_GEOMETRY",
		pattern: "loop camera along geometry $geometry:string over $duration:duration",
	},
	{
		action: "PAN_CAMERA_TO_GEOMETRY",
		pattern: "pan camera to geometry $geometry:string over $duration:duration",
	},
	{
		action: "PLAY_ENTITY_ANIMATION",
		pattern: "play entity $entity:string animation $animation:number $play_count:quantity",
		exampleValues: { "$animation:number": "3", }
	},
	{
		action: "SCREEN_FADE_OUT",
		pattern: "fade out camera to $color:color over $duration:duration",
	},
	{
		action: "SCREEN_FADE_IN",
		pattern: "fade in camera from $color:color over $duration:duration",
	},
	{
		action: "LOAD_MAP",
		pattern: "load map $map:string",
	},
	{
		action: "SLOT_LOAD",
		pattern: "load slot $slot:number",
	},
	{
		action: "SHOW_DIALOG",
		pattern: "show dialog $dialog:string",
	},
	{
		action: "SHOW_SERIAL_DIALOG",
		pattern: "show serial dialog $serial_dialog:string",
	},
	{
		action: "SET_CONNECT_SERIAL_DIALOG",
		pattern: "set serial connect ?message ?to $serial_dialog:string",
	},
	{
		action: "COPY_SCRIPT",
		pattern: "copy ?script $script:string",
	},
	{
		action: "COPY_VARIABLE",
		pattern: "copy entity $entity:string $field:bareword into variable $variable:string",
		values: { "inbound": true },
	},
	{
		action: "COPY_VARIABLE",
		pattern: "copy variable $variable:string from entity $entity:string $field:bareword",
		values: { "inbound": true },
	},
	{
		action: "COPY_VARIABLE",
		pattern: "copy variable $variable:string into entity $entity:string $field:bareword",
		values: { "inbound": false },
	},
	{
		action: "COPY_VARIABLE",
		pattern: "copy entity $entity:string $field:bareword from variable $variable:string",
		values: { "inbound": false },
	},
	{
		action: "MUTATE_VARIABLE",
		pattern: "mutate $variable:string $operation:operator $value:number",
	},
	{
		action: "MUTATE_VARIABLES",
		pattern: "mutate $variable:string $operation:operator $source:string",
	},
	{
		action: "SET_MAP_TICK_SCRIPT",
		pattern: "set map tickScript ?to $script:string",
	},
	{
		action: "SET_WARP_STATE",
		pattern: "set warp state ?to $string:string",
	},
	{
		action: "SET_SAVE_FLAG",
		pattern: "set flag $save_flag:string ?to $bool_value:boolean",
	},
	{
		action: "SET_PLAYER_CONTROL",
		pattern: "set player control ?to $bool_value:boolean",
	},
	{
		action: "SET_HEX_EDITOR_DIALOG_MODE",
		pattern: "set hex dialog mode ?to $bool_value:boolean",
	},
	{
		action: "SET_HEX_EDITOR_CONTROL",
		pattern: "set hex control ?to $bool_value:boolean",
	},
	{
		action: "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
		pattern: "set hex clipboard ?to $bool_value:boolean",
	},
	// {
	// 	action: "SET_ENTITY_NAME",
	// 	pattern: "set entity $entity:string name ?to $string:string",
	// } // ONES LIKE THIS ARE PROCEDURALLY ADDED
	{
		action: "CHECK_SAVE_FLAG",
		pattern: "if flag $save_flag:string is $expected_bool:boolean then goto ?script $success_script:string",
	},
	{
		action: "CHECK_FOR_BUTTON_PRESS",
		pattern: "if button $button_id:bareword then goto ?script $success_script:string",
	},
	{
		action: "CHECK_FOR_BUTTON_STATE",
		pattern: "if button $button_id:bareword is currently pressed then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_FOR_BUTTON_STATE",
		pattern: "if button $button_id:bareword is not currently pressed then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
	{
		action: "CHECK_WARP_STATE",
		pattern: "if warp state is $string:string then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_WARP_STATE",
		pattern: "if warp state is not $string:string then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $variable:string is $value:number then goto ?script $success_script:string",
		values: {
			"expected_bool": true,
			"comparison": "==",
		},
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $variable:string is $comparison:operator $value:number then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $variable:string is not $value:number then goto ?script $success_script:string",
		values: {
			"expected_bool": false,
			"comparison": "==",
		},
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $variable:string is not $comparison:operator $value:number then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $variable:string is $source:string then goto ?script $success_script:string",
		values: {
			"expected_bool": true,
			"comparison": "==",
		},
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $variable:string is $comparison:operator $source:string then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $variable:string is not $source:string then goto ?script $success_script:string",
		values: {
			"expected_bool": false,
			"comparison": "==",
		},
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $variable:string is not $comparison:operator $source:string then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
	{
		action: "CHECK_ENTITY_HACKABLE_STATE_A_U4",
		pattern: "if entity $entity:string hackableStateAU4 is $expected_u4:number then goto ?script $success_script:string",
	},
	// {
	// 	action: "CHECK_ENTITY_NAME",
	// 	pattern: "if entity $entity:string name is $string:string then goto ?script $success_script:string",
	// 	values: { "expected_bool": true }
	// } // PROCEDURALLY DONE
	{
		action: "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
		pattern: "if entity $entity:string is inside geometry $geometry:string then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
		pattern: "if entity $entity:string is not inside geometry $geometry:string then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
	{
		action: "CHECK_ENTITY_GLITCHED",
		pattern: "if entity $entity:string is glitched then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_ENTITY_GLITCHED",
		pattern: "if entity $entity:string is not glitched then goto ?script $success_script:string",
		values: { "expected_bool": false },
	},
];

mgs.entityPropertyMap = { // used for the procedural dictionary entries 
	CHECK_ENTITY_NAME: {
		actionProperty: "string",
		natLangProperty: "name",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_X: {
		actionProperty: "expected_u2",
		natLangProperty: "x",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_Y: {
		actionProperty: "expected_u2",
		natLangProperty: "y",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_INTERACT_SCRIPT: {
		actionProperty: "expected_script",
		natLangProperty: "interactScript",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_TICK_SCRIPT: {
		actionProperty: "expected_script",
		natLangProperty: "tickScript",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_TYPE: {
		actionProperty: "entity_type",
		natLangProperty: "type",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_PRIMARY_ID: {
		actionProperty: "expected_u2",
		natLangProperty: "primaryID",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_SECONDARY_ID: {
		actionProperty: "expected_u2",
		natLangProperty: "secondaryID",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_PRIMARY_ID_TYPE: {
		actionProperty: "expected_byte",
		natLangProperty: "primaryIDtype",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_CURRENT_ANIMATION: {
		actionProperty: "expected_byte",
		natLangProperty: "animation",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_CURRENT_FRAME: {
		actionProperty: "expected_byte",
		natLangProperty: "animationFrame",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_DIRECTION: {
		actionProperty: "direction",
		natLangProperty: "direction",
		dictionaryRef: ":bareword",
	},
	CHECK_ENTITY_HACKABLE_STATE_A: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateA",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_HACKABLE_STATE_B: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateB",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_HACKABLE_STATE_C: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateC",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_HACKABLE_STATE_D: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateD",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_HACKABLE_STATE_A_U2: {
		actionProperty: "expected_u2",
		natLangProperty: "hackableStateAU2",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_HACKABLE_STATE_C_U2: {
		actionProperty: "expected_u2",
		natLangProperty: "hackableStateCU2",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_PATH: {
		actionProperty: "geometry",
		natLangProperty: "path",
		dictionaryRef: ":string",
	},
	SET_ENTITY_NAME: {
		actionProperty: "string",
		natLangProperty: "name",
		dictionaryRef: ":string",
	},
	SET_ENTITY_X: {
		actionProperty: "u2_value",
		natLangProperty: "x",
		dictionaryRef: ":number",
	},
	SET_ENTITY_Y: {
		actionProperty: "u2_value",
		natLangProperty: "y",
		dictionaryRef: ":number",
	},
	SET_ENTITY_INTERACT_SCRIPT: {
		actionProperty: "script",
		natLangProperty: "interactScript",
		dictionaryRef: ":string",
	},
	SET_ENTITY_TICK_SCRIPT: {
		actionProperty: "script",
		natLangProperty: "tickScript",
		dictionaryRef: ":string",
	},
	SET_ENTITY_TYPE: {
		actionProperty: "entity_type",
		natLangProperty: "type",
		dictionaryRef: ":string",
	},
	SET_ENTITY_PRIMARY_ID: {
		actionProperty: "u2_value",
		natLangProperty: "primaryID",
		dictionaryRef: ":number",
	},
	SET_ENTITY_SECONDARY_ID: {
		actionProperty: "u2_value",
		natLangProperty: "secondaryID",
		dictionaryRef: ":number",
	},
	SET_ENTITY_PRIMARY_ID_TYPE: {
		actionProperty: "byte_value",
		natLangProperty: "primaryIDtype",
		dictionaryRef: ":number",
	},
	SET_ENTITY_CURRENT_ANIMATION: {
		actionProperty: "byte_value",
		natLangProperty: "animation",
		dictionaryRef: ":number",
	},
	SET_ENTITY_CURRENT_FRAME: {
		actionProperty: "byte_value",
		natLangProperty: "animationFrame",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_A: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateA",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_B: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateB",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_C: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateC",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_D: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateD",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_A_U2: {
		actionProperty: "u2_value",
		natLangProperty: "hackableStateAU2",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_C_U2: {
		actionProperty: "u2_value",
		natLangProperty: "hackableStateCU2",
		dictionaryRef: ":number",
	},
	SET_ENTITY_HACKABLE_STATE_A_U4: {
		actionProperty: "u4_value",
		natLangProperty: "hackableStateAU4",
		dictionaryRef: ":number",
	},
	SET_ENTITY_PATH: {
		actionProperty: "geometry",
		natLangProperty: "path",
		dictionaryRef: ":string",
	}
}

// adding tedious entity properties to action dictionary

Object.keys(mgs.entityPropertyMap)
	.filter(function (actionName) {
		return actionName.includes('SET_');
	})
	.forEach(function (actionName) {
		var lookup = mgs.entityPropertyMap[actionName];
		var pattern =
			"set entity $entity:string "
			+ lookup.natLangProperty + " ?to "
			+ "$" + lookup.actionProperty + lookup.dictionaryRef;
		var insert = {
			action: actionName,
			pattern: pattern,
		}
		mgs.actionDictionary.push(insert);
	});

Object.keys(mgs.entityPropertyMap)
	.filter(function (actionName) {
		return actionName.includes('CHECK_');
	})
	.forEach(function (actionName) {
		var lookup = mgs.entityPropertyMap[actionName];
		var pattern =
			"if entity $entity:string "
			+ lookup.natLangProperty
			+ " is $" + lookup.actionProperty + lookup.dictionaryRef
			+ " then goto ?script $success_script:string"
		var insert = {
			action: actionName,
			pattern: pattern,
			values: { "expected_bool" : true }
		}
		var patternNeg =
			"if entity $entity:string "
			+ lookup.natLangProperty
			+ " is not $" + lookup.actionProperty + lookup.dictionaryRef
			+ " then goto ?script $success_script:string"
		var insertNeg = {
			action: actionName,
			pattern: patternNeg,
			values: { "expected_bool" : false }
		}
		mgs.actionDictionary.push(insert);
		mgs.actionDictionary.push(insertNeg);
	})
	//TODO!! [lol what is this todo?]

// adding action dictionary items to the "flat" tree
mgs.actionDictionary.forEach(function (item) {
	item = JSON.parse(JSON.stringify(item));
	var values = item.values || {};
	values.action = item.action;
	var autoActionFunction = function (values) {
		return function (state) {
			state.processCaptures("action", values);
		}
	}
	mgs.trees.action.push(
		[
			item.pattern,
			autoActionFunction(values)
		]
	);
})

/* building MGS dialogs */

mgs.cleanString = function (inputString) {
	return inputString
		.replace(/(“|”)/g, '"')
		.replace(/(‘|’)/g, "'")
		.replace(/…/g, "...")
		.replace(/\t/g, "    ")
		.replace(/—/g, "--") // emdash
		.replace(/–/g, "-"); // endash
};

mgs.identifyEscapedChar = function (inputString) {
	// returns 2nd char if 1st char is `\` and 2nd is in bounds
	if (inputString[0] === '\\') {
		return inputString[1];
	}
};

mgs.countWordChars = function (inputString) {
	var specialCases = {
		"%": 12, // entity names: max 12 chars ASCII
		"$": 5, // integers: max value 65535
	};
	var size = 0;
	var pos = 0;
	var mode = null;
	while (pos < inputString.length) {
		var nextChar = inputString[pos];
		if (mode) { // we're in a special mode
			if (nextChar === mode) { // if the mode char matches, end mode
				mode = null;
				size += specialCases[nextChar]; // size was arbitrary
				pos += 1; // pos was not
				continue;
			}
			var escaped = mgs.identifyEscapedChar(inputString.substring(pos));
			if (escaped) { // atm will fall through
				pos += 2;
				continue;
			}
			// all the rest are "normal"
			pos += 1;
			continue;
		}
		// we're not in a special mode
		// escaped chars:
		var escaped = mgs.identifyEscapedChar(inputString.substring(pos));
		if (escaped) { // atm will fall through
			size += 1;
			pos += 2;
			continue;
		}
		if (nextChar === ' ') { // end processing "word"
			break;
		}
		// special char
		if (
			specialCases[nextChar]
			&& inputString[pos+1]
			&& inputString.substring(pos+1).includes(nextChar)
		) { // if there's another of the same char later, start mode
			mode = nextChar;
			pos += 1;
			continue;
		}
		// all the rest are "normal"
		size += 1;
		pos += 1;
		continue;
	}
	return {
		match: inputString.substring(0, pos),
		size: size,
	}
};

mgs.wrapText = function (inputString, wrapTo) {
	// TODO: hyphenated words?
	wrapTo = wrapTo || 42; // magic number alert!
	var stringSplits = inputString.split('\n'); // TODO: more line breaks
	var stringsResults = [];
	var countSpaces = function (string) {
		var match = string.match(/^ +/);
		return match ? match[0].length : false;
	};
	stringSplits.forEach(function (line) {
		var workingString = mgs.cleanString(line);
		var pos = 0;
		var insert = '';
		var insertLength = 0;
		var lastSpaceFound = null;
		while (workingString.substring(pos).length) {
			// spaces (newlines removed above; tabs were converted to spaces prior)
			var spaceCount = countSpaces(workingString.substring(pos));
			if (spaceCount) {
				lastSpaceFound = pos;
				pos += spaceCount;
				insert += ' '.repeat(spaceCount);
				insertLength += spaceCount;
				continue;
			}
			// things other than spaces
			var word = mgs.countWordChars(workingString.substring(pos));
			if (insertLength + word.size > wrapTo) {
				var choppedInsert = insert.substring(0, lastSpaceFound);
				stringsResults.push(choppedInsert);
				workingString = workingString.substring(pos);
				pos = 0;
				insert = '';
				insertLength = 0;
				lastSpaceFound = null;
			}
			pos += word.match.length;
			insert += word.match;
			insertLength += word.size;
		}
		stringsResults.push(insert);
	})
	return stringsResults.join('\n');
};

mgs.buildDialogFromState = function (state) {
	var dialogSettings = state.finalState.dialogSettings || [];
	var identifier = state.inserts.dialogIdentifier;
	var parameters = state.inserts.dialogParameters;
	var messages = state.inserts.dialogMessages || [];
	var options = state.inserts.dialogOptions;
	var result = {};
	// getting params from dialogSettings
	if (identifier.type === "name") {
		result.name = identifier.value;
	}
	if (identifier.type === "label") {
		var entityEntries = dialogSettings.filter(function (item) {
				return item.type === "label"
					&& item.value === identifier.value;
			})
		if (entityEntries.length > 0) {
			entityEntries.forEach(function (entry) {
				var capturedParams = Object.keys(entry.parameters);
				capturedParams.forEach(function (propertyName) {
					result[propertyName] = entry.parameters[propertyName];
				})
			})
		} else {
			identifier.type = "entity";
			// result.labelWarning = `No settings found for label "${identifier.value}" -- treating as entity name`;
			// treat as entitiy; will handle immediately below
		}
	}
	if (identifier.type === "entity" || Object.keys(result).length === 0) {
		var entityEntries = dialogSettings.filter(function (entry) {
				return entry.type === "entity"
					&& entry.value === identifier.value;
			})
		if (entityEntries.length) {
			entityEntries.forEach(function (entry) {
				var capturedParams = Object.keys(entry.parameters);
				capturedParams.forEach(function (propertyName) {
					result[propertyName] = entry.parameters[propertyName];
				})
			})
		}
		result.entity = identifier.value;
	}
	// put in global params only if no existing params by that name
	var globalParams = dialogSettings.filter(function (item) {
		return item.type === "global"
	})
	if (globalParams.length) {
		globalParams.forEach(function (globalEntry) {
			Object.keys(globalEntry.parameters).forEach(function (propertyName) {
				if (!result[propertyName]) {
					result[propertyName] = globalEntry.parameters[propertyName];
				}
			})
		})
	}
	// override the above with params found in the dialog itself
	if (parameters) {
		Object.keys(parameters).forEach(function (parameterName) {
			result[parameterName] = parameters[parameterName];
		})
	}
	var alignmentMap = {
		"BL": "BOTTOM_LEFT",
		"BR": "BOTTOM_RIGHT",
		"TL": "TOP_LEFT",
		"TR": "TOP_RIGHT",
		"BOTTOM_LEFT": "BOTTOM_LEFT",
		"BOTTOM_RIGHT": "BOTTOM_RIGHT",
		"TOP_LEFT": "TOP_LEFT",
		"TOP_RIGHT": "TOP_RIGHT"
	}
	result.messages = messages.map(function (string) {
		var cleanedString = mgs.cleanString(string);
		return mgs.wrapText(cleanedString, result.messageWrap);
	});
	if (options && options.length) {
		result.response_type = "SELECT_FROM_SHORT_LIST";
		result.options = options.map(function (option) {
			return {
				label: mgs.cleanString(option.label),
				script: option.script
			}
		});
	}
	var newAlignment = alignmentMap[result.alignment];
	if (!newAlignment) {
		var warningMessage = "Alignment cannot be " + result.alignment + "; falling back to 'BOTTOM_LEFT'";
		console.warn(warningMessage);
		result.alignWarning = warningMessage;
		result.alignment = "BOTTOM_LEFT";
	} else {
		result.alignment = newAlignment;
	}
	delete result.messageWrap;
	return result;
};

window.mgs = mgs;

if (typeof module === 'object') {
	module.exports = mgs;
}
