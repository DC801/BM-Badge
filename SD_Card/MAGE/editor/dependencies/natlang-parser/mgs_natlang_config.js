// "use strict";

// low budget module system, go! -SB
var window = window || {};
window.natlang = window.natlang || {};
var natlang = natlang || window.natlang;
var zigzag = window.zigzag;
if (typeof module === 'object') {
	natlang = require('./natlang-parse.js');
	whyle = require('./mgs-macro-whyle.js');
	zigzag = require('./mgs-macro-zigzag.js');
	constants = require('./mgs-macro-constants.js');
}

var mgs = {
	macros: {
		constants: constants,
		whyle: whyle,
		zigzag: zigzag
	},
	blocks: {
		"root": {
			branchesLoop: true,
			branches: [
				{ branch: "dialogSettingsNode", count: "*" },
				{ branch: "serialDialogSettingsNode", count: "*" },
				{ branch: "dialogNode", count: "*" },
				{ branch: "serialDialogNode", count: "*" },
				{ branch: "scriptNode", count: "*" },
			]
		},
		"dialogSettings": {
			branches: [
				{ branch: "dialogSettingsTarget", count: "*" },
			],
			closeChar: "}",
			onOpen: function (state) {
				state.initIfAbsent("final", "dialogSettings", []);
			},
			onClose: function () {}
			// just to silence the "no onClose?!?!" warning
		},
		"dialogSettingsTarget": {
			branches: [
				{ branch: "dialogParameter", count: "*" },
			],
			closeChar: "}",
			onClose: function (state) {
				state.pushNew(
					"final",
					"dialogSettings",
					Object.assign(
						state.inserts.dialogSettingsTarget,
						{ parameters: state.inserts.dialogParameters}
					)
				);
				state.clearInserts([ "dialogParameters", "dialogSettingsTarget"]);
			},
		},
		"serialDialogSettings": {
			branches: [
				{ branch: "serialDialogParameter", count: "*" },
			],
			closeChar: "}",
			onOpen: function (state) {
				state.initIfAbsent("final", "serialDialogParameters", {});
				state.initIfAbsent("inserts", "serialDialogParameters", {});
			},
			onClose: function (state) {
				state.replaceValue(
					"final",
					"serialDialogParameters",
					Object.assign(
						state.final.serialDialogParameters,
						state.inserts.serialDialogParameters
					)
				);
			}
		},
		"dialog": {
			branchesLoop: true,
			branches: [
				{
					branch: "dialogIdentifier",
					failMessage: "A dialog identifier is required before any dialog messages!"
				},
				{ branch: "dialogParameter", count: "*" },
				{
					branch: "dialogMessage", count: "+",
					failMessage: "You need at least one dialog message!" 
				},
				{ branch: "dialogOption", count: "*" },
			],
			closeChar: "}",
			onOpen: function (state) {
				state.initIfAbsent("inserts", "dialogIdentifier", {});
				state.initIfAbsent("inserts", "dialogParameters", {});
				state.initIfAbsent("inserts", "dialogMessages", []);
				state.initIfAbsent("inserts", "dialogOptions", []);
			},
			// TODO consolidate the below somehow?
			onLoop: function (state) {
				state.pushNew(
					"inserts",
					"dialogs",
					mgs.buildDialogFromState(state)
				);
				state.clearInserts([
					"dialogIdentifier",
					"dialogParameters",
					"dialogMessages",
					"dialogOptions",
				]);
			},
			onClose: function (state) {
				state.pushNew(
					"inserts",
					"dialogs",
					mgs.buildDialogFromState(state)
				);
				state.clearInserts([
					"dialogIdentifier",
					"dialogParameters",
					"dialogMessages",
					"dialogOptions",
				]);
				// on close only
				state.initIfAbsent("final", "dialogs", {});
				state.replaceValueDeep(
					"final",
					"dialogs",
					state.inserts.dialogName,
					state.inserts.dialogs
				)
				state.clearInserts([
					"dialogName",
				 	"dialogs"
				]);
			},
		},
		"serialDialog": {
			branches: [
				{ branch: "serialDialogParameter", count: "*" },
				{
					branch: "serialDialogMessage", count: "+",
					failMessage: "You need at least one serial dialog message!" 
				},
				{ branch: "serialDialogOptionFree", count: "*" },
				// strictly, only either type of option is allowed (not one then the other) but there is no easy means of implementing this (the parser will run with the first type it sees and not take the syntax literally for each option individually)
				{ branch: "serialDialogOptionFixed", count: "*" },
			],
			closeChar: "}",
			onOpen: function (state) {
				state.initIfAbsent("inserts", "serialDialogParameters", {});
			},
			onClose: function (state) {
				state.initIfAbsent("final", "serialDialogs", {});
				state.replaceValueDeep(
					"final",
					"serialDialogs",
					state.inserts.serialDialogName,
					mgs.buildSerialDialogFromState(state)
				);
				// reset
				state.clearInserts([
					"serialDialogParameters",
					"serialDialogMessages",
					"serialDialogOptions",
				])
				state.inserts.serialOptionType = null;
				state.inserts.serialDialogName = null;
			},
		},
		"script": {
			branches: [
				{ branch: "action", count: "*" }
			],
			closeChar: "}",
			onClose: function (state) {
				state.initIfAbsent("final", "scripts", {});
				state.replaceValueDeep(
					"final",
					"scripts",
					state.inserts.scriptName,
					state.inserts.actions
				);
				state.clearInserts([
					"scriptName",
					"actions",
				])
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
			{
				pattern: "settings ?for dialog {",
				onMatch: function (state) {
					state.startBlock("dialogSettings");
				}
			}
		],
		serialDialogSettingsNode: [
			{
				pattern: "settings ?for serial ?dialog {",
				onMatch: function (state) {
					state.startBlock("serialDialogSettings");
				}
			}
		],
		dialogNode: [
			{
				pattern: "dialog $dialog:string {",
				onMatch: function (state) {
					state.startBlock("dialog");
					state.processCaptures("dialogName");
					state.clearCaptures();
				}
			}
		],
		serialDialogNode: [
			{
				pattern: "serial dialog $serial_dialog:string {",
				onMatch: function (state) {
					state.startBlock("serialDialog");
					state.processCaptures("serialDialogName");
					state.clearCaptures();
				}
			}
		],
		scriptNode: [
			{
				pattern: "?script $scriptName:string {",
				onMatch: function (state) {
					state.startBlock("script");
					state.processCaptures("scriptName");
					state.clearCaptures();
				}
			}
		],
		dialogSettingsTarget: [
			{
				pattern: "?parameters ?for label $target:string {",
				onMatch: function (state) {
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "label" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "?parameters ?for entity $target:string {",
				onMatch: function (state) {
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "entity" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "?parameters ?for ?global default {",
				onMatch: function (state) {
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "global" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "?parameters ?for ?global defaults {",
				onMatch: function (state) {
					state.startBlock("dialogSettingsTarget");
					state.processCaptures(
						"dialogSettingsTarget",
						{ type: "global" }
					);
					state.clearCaptures();
				}
			},
		],
		dialogParameter: [
			{
				pattern: "entity $value:string",
				onMatch: function (state) {
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "entity" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "name $value:string",
				onMatch: function (state) {
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "name" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "portrait $value:string",
				onMatch: function (state) {
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "portrait" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "alignment $value:string",
				onMatch: function (state) {
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "alignment" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "border_tileset $value:string",
				onMatch: function (state) {
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "border_tileset" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "emote $value:number",
				onMatch: function (state) {
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "emote" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "wrap messages ?to $value:number",
				onMatch: function (state) {
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "messageWrap" }
						// TODO: make wrap an object rather than glue words together like this for each one; easier removal, too
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "wrap options ?to $value:number",
				onMatch: function (state) {
					state.processCaptures(
						"dialogParameter",
						{ parameterName: "optionWrap" }
					);
					state.clearCaptures();
				}
			},
		],
		dialogIdentifier: [
			{
				pattern: "$value:bareword",
				onMatch: function (state) {
					state.processCaptures(
						"dialogIdentifier",
						{ type: "label" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "entity $value:string",
				onMatch: function (state) {
					state.processCaptures(
						"dialogIdentifier",
						{ type: "entity" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "name $value:string",
				onMatch: function (state) {
					state.processCaptures(
						"dialogIdentifier",
						{ type: "name" }
					);
					state.clearCaptures();
				}
			},
		],
		dialogMessage: [
			{
				pattern: "$message:quotedString",
				onMatch: function (state) {
					state.processCaptures("dialogMessage");
					state.clearCaptures();
				}
			},
		],
		dialogOption: [
			{
				pattern: "> $label:quotedString : ?goto ?script $script:string",
				onMatch: function (state) {
					state.processCaptures("dialogOption");
					state.clearCaptures();
				}
			},
		],
		serialDialogParameter: [
			{
				pattern: "wrap ?messages ?to $value:number",
				onMatch: function (state) {
					state.processCaptures(
						"serialDialogParameter",
						{ parameterName: "messageWrap" }
					);
					state.clearCaptures();
				}
			},
		],
		serialDialogMessage: [
			{
				pattern: "$message:quotedString",
				onMatch: function (state) {
					state.processCaptures("serialDialogMessage");
					state.clearCaptures();
				}
			},
		],
		serialDialogOptionFree: [
			{
				pattern: "_ $label:quotedString : ?goto ?script $script:string",
				onMatch: function (state) {
					state.processCaptures("serialDialogOptionFree");
					state.clearCaptures();
				}
			},
		],
		serialDialogOptionFixed: [
			{
				pattern: "# $label:quotedString : ?goto ?script $script:string",
				onMatch: function (state) {
					state.processCaptures("serialDialogOptionFixed");
					state.clearCaptures();
				}
			},
		],
		action: [
			{
				pattern: "show dialog $dialog:string {",
				onMatch: function (state) {
					state.startBlock("dialog");
					state.processCaptures("dialogName");
					state.processCaptures("action",
						{ action: "SHOW_DIALOG" }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "show dialog {",
				onMatch: function (state) {
					state.startBlock("dialog");
					state.processCaptures("dialogName");
					state.processCaptures( "action",
						{
							action: "SHOW_DIALOG",
							dialog: state.inserts.dialogName
						}
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "show serial dialog $serial_dialog:string {",
				onMatch: function (state) {
					state.startBlock("serialDialog");
					state.processCaptures("serialDialogName");
					state.processCaptures("action",
						{ action: "SHOW_SERIAL_DIALOG", disable_newline: false }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "show serial dialog {",
				onMatch: function (state) {
					state.startBlock("serialDialog");
					state.processCaptures("serialDialogName");
					state.processCaptures("action",
						{
							action: "SHOW_SERIAL_DIALOG",
							disable_newline: false,
							serial_dialog: state.inserts.serialDialogName
						}
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "concat serial dialog $serial_dialog:string {",
				onMatch: function (state) {
					state.startBlock("serialDialog");
					state.processCaptures("serialDialogName");
					state.processCaptures("action",
						{ action: "SHOW_SERIAL_DIALOG", disable_newline: true }
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "concat serial dialog {",
				onMatch: function (state) {
					state.startBlock("serialDialog");
					state.processCaptures("serialDialogName");
					state.processCaptures("action",
						{
							action: "SHOW_SERIAL_DIALOG",
							disable_newline: true,
							serial_dialog: state.inserts.serialDialogName
						}
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "set serial connect ?message ?to {",
				onMatch: function (state) {
					state.startBlock("serialDialog");
					state.processCaptures("serialDialogName");
					state.processCaptures("action",
						{
							action: "SET_CONNECT_SERIAL_DIALOG",
							serial_dialog: state.inserts.serialDialogName
						}
					);
					state.clearCaptures();
				}
			},
			{
				pattern: "set serial connect ?message ?to $serial_dialog:string {",
				onMatch: function (state) {
					state.startBlock("serialDialog");
					state.processCaptures("serialDialogName");
					state.processCaptures("action",
						{ action: "SET_CONNECT_SERIAL_DIALOG" }
					);
					state.clearCaptures();
				}
			},
			// more are procedurally added
		],
	},
	capture: {
		dialogName: function (state) {
			state.replaceValue(
				"inserts",
				"dialogName",
				state.captures.dialog
					? state.captures.dialog
					: state.makeAutoIdentifierName()
			);
		},
		serialDialogName: function (state) {
			state.replaceValue(
				"inserts",
				"serialDialogName",
				state.captures.serial_dialog
					? state.captures.serial_dialog
					: state.makeAutoIdentifierName()
			);
		},
		scriptName: function (state) {
			state.replaceValue(
				"inserts",
				"scriptName",
				state.captures.scriptName
			);
		},
		dialogSettingsTarget: function (state, args) {
			state.replaceValue(
				"inserts",
				"dialogSettingsTarget",
				{
					type: args.type,
					value: state.captures.target
						? state.captures.target
						: null
				}
			);
		},
		dialogParameter: function (state, args) {
			state.initIfAbsent("inserts", "dialogParameters", {});
			state.replaceValueDeep(
				"inserts",
				"dialogParameters",
				args.parameterName,
				state.captures.value
			);
		},
		dialogIdentifier: function (state, args) {
			state.replaceValue(
				"inserts",
				"dialogIdentifier",
				{
					type: args.type,
					value: state.captures.value
				}
			);
		},
		dialogMessage: function (state) {
			state.pushNew(
				"inserts",
				"dialogMessages",
				state.captures.message
			);
		},
		dialogOption: function (state) {
			state.pushNew(
				"inserts",
				"dialogOptions",
				{
					label: state.captures.label,
					script: state.captures.script
				}
			);
		},
		serialDialogParameter: function (state, args) {
			state.replaceValueDeep(
				"inserts",
				"serialDialogParameters",
				args.parameterName,
				state.captures.value
			);
		},
		serialDialogMessage: function (state) {
			state.pushNew(
				"inserts",
				"serialDialogMessages",
				state.captures.message
			);
		},
		serialDialogOptionFree: function (state) {
			state.initIfAbsent("inserts", "serialOptionType", "text_options");
			state.pushNew(
				"inserts",
				"serialDialogOptions", {
					label: state.captures.label,
					script: state.captures.script
				}
			);
		},
		serialDialogOptionFixed: function (state) {
			state.initIfAbsent("inserts", "serialOptionType", "options");
			state.pushNew(
				"inserts",
				"serialDialogOptions",
				{
					label: state.captures.label,
					script: state.captures.script
				}
			);
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
			state.pushNew("inserts", "actions", newAction);
		}
	}
};

mgs.actionDictionary = [{
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
		action: "LABEL", // this must be below `SET_HEX_EDITOR_STATE`!!
		pattern: "$value:bareword :",
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
		action: "GOTO_ACTION_INDEX",
		pattern: "goto index $action_index:number",
	},
	{
		action: "GOTO_ACTION_INDEX",
		pattern: "goto label $action_index:bareword",
	},
	{
		action: "GOTO_ACTION_INDEX",
		pattern: "return",
		values: { "action_index": "auto return" },
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
		values: { "disable_newline": false },
	},
	{
		action: "CLOSE_DIALOG",
		pattern: "close dialog",
	},
	{
		action: "CLOSE_SERIAL_DIALOG",
		pattern: "close serial dialog",
	},
	{
		action: "SHOW_SERIAL_DIALOG",
		pattern: "concat serial dialog $serial_dialog:string",
		values: { "disable_newline": true },
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
		pattern: "set map on_tick ?to $script:string",
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
		action: "SET_SERIAL_DIALOG_CONTROL",
		pattern: "set serial control ?to $bool_value:boolean",
	},
	{
		action: "REGISTER_SERIAL_DIALOG_COMMAND",
		pattern: "register ?command $command:string -> ?script $script:string",
		values: { "is_fail": false },
	},
	{
		action: "REGISTER_SERIAL_DIALOG_COMMAND",
		pattern: "register ?command $command:string fail -> ?script $script:string",
		values: { "is_fail": true },
	},
	{
		action: "REGISTER_SERIAL_DIALOG_COMMAND",
		pattern: "register ?command $command:string failure -> ?script $script:string",
		values: { "is_fail": true },
	},
	{
		action: "REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT",
		pattern: "register ?command $command:string + ?arg $argument:string -> ?script $script:string",
	},
	{
		action: "UNREGISTER_SERIAL_DIALOG_COMMAND",
		pattern: "unregister ?command $command:string",
		values: { "is_fail": false },
	},
	{
		action: "UNREGISTER_SERIAL_DIALOG_COMMAND",
		pattern: "unregister ?command $command:string fail",
		values: { "is_fail": true },
	},
	{
		action: "UNREGISTER_SERIAL_DIALOG_COMMAND",
		pattern: "unregister ?command $command:string failure",
		values: { "is_fail": true },
	},
	{
		action: "UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT",
		pattern: "unregister ?command $command:string + ?arg $argument:string",
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
		action: "CHECK_DIALOG_OPEN",
		pattern: "if dialog is $expected_bool:boolean then goto ?script $success_script:string",
	},
	{
		action: "CHECK_SERIAL_DIALOG_OPEN",
		pattern: "if serial dialog is $expected_bool:boolean then goto ?script $success_script:string",
	},
	{
		action: "CHECK_DEBUG_MODE",
		pattern: "if debug mode is $expected_bool:boolean then goto ?script $success_script:string",
	},
	// TODO: figure out how to make it match despite the parser forcing string "true" to bool "true"
	// {
	// 	action: "CHECK_SAVE_FLAG",
	// 	pattern: "if flag $save_flag:string is not false then goto ?script $success_script:string",
	// 	values: { "expected_bool": true },
	// },
	// {
	// 	action: "CHECK_SAVE_FLAG",
	// 	pattern: "if flag $save_flag:string is not true then goto ?script $success_script:string",
	// 	values: { "expected_bool": false },
	// },
	{
		action: "CHECK_FOR_BUTTON_PRESS",
		pattern: "if button $button_id:bareword then goto ?script $success_script:string",
		values: { "expected_bool": true },
	},
	{
		action: "CHECK_FOR_BUTTON_PRESS",
		pattern: "if not button $button_id:bareword then goto ?script $success_script:string",
		values: { "expected_bool": false },
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
	{
		action: "SET_LIGHTS_CONTROL",
		pattern: "set lights control ?to $enabled:boolean",
	},
	{
		action: "SET_LIGHTS_STATE",
		pattern: "turn light $lights:string $enabled:boolean",
	},
	{
		action: "SET_SCRIPT_PAUSE",
		pattern: "pause entity $entity:string $script_slot:bareword",
		values: { "bool_value": true },
	},
	{
		action: "SET_SCRIPT_PAUSE",
		pattern: "unpause entity $entity:string $script_slot:bareword",
		values: { "bool_value": false },
	},
	{
		action: "SET_SCRIPT_PAUSE",
		pattern: "pause map $script_slot:bareword",
		values: { "bool_value": true, "entity": "%MAP%" },
	},
	{
		action: "SET_SCRIPT_PAUSE",
		pattern: "unpause map $script_slot:bareword",
		values: { "bool_value": false, "entity": "%MAP%" },
	},
];

mgs.entityPropertyMap = { // used for the procedural dictionary entries 
	CHECK_ENTITY_NAME: {
		actionProperty: "string",
		natLangProperties: "name",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_X: {
		actionProperty: "expected_u2",
		natLangProperties: "x",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_Y: {
		actionProperty: "expected_u2",
		natLangProperties: "y",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_INTERACT_SCRIPT: {
		actionProperty: "expected_script",
		natLangProperties: "on_interact",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_TICK_SCRIPT: {
		actionProperty: "expected_script",
		natLangProperties: "on_tick",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_LOOK_SCRIPT: {
		actionProperty: "expected_script",
		natLangProperties: "on_look",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_TYPE: {
		actionProperty: "entity_type",
		natLangProperties: "type",
		dictionaryRef: ":string",
	},
	CHECK_ENTITY_PRIMARY_ID: {
		actionProperty: "expected_u2",
		natLangProperties: "primary_id",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_SECONDARY_ID: {
		actionProperty: "expected_u2",
		natLangProperties: "secondary_id",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_PRIMARY_ID_TYPE: {
		actionProperty: "expected_byte",
		natLangProperties: "primary_id_type",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_CURRENT_ANIMATION: {
		actionProperty: "expected_byte",
		natLangProperties: "current_animation",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_CURRENT_FRAME: {
		actionProperty: "expected_byte",
		natLangProperties: "animation_frame",
		dictionaryRef: ":number",
	},
	CHECK_ENTITY_DIRECTION: {
		actionProperty: "direction",
		natLangProperties: "direction",
		dictionaryRef: ":bareword",
	},
	CHECK_ENTITY_PATH: {
		actionProperty: "geometry",
		natLangProperties: "path",
		dictionaryRef: ":string",
	},
	SET_ENTITY_NAME: {
		actionProperty: "string",
		natLangProperties: "name",
		dictionaryRef: ":string",
	},
	SET_ENTITY_X: {
		actionProperty: "u2_value",
		natLangProperties: "x",
		dictionaryRef: ":number",
	},
	SET_ENTITY_Y: {
		actionProperty: "u2_value",
		natLangProperties: "y",
		dictionaryRef: ":number",
	},
	SET_ENTITY_INTERACT_SCRIPT: {
		actionProperty: "script",
		natLangProperties: "on_interact",
		dictionaryRef: ":string",
	},
	SET_ENTITY_TICK_SCRIPT: {
		actionProperty: "script",
		natLangProperties: "on_tick",
		dictionaryRef: ":string",
	},
	SET_ENTITY_LOOK_SCRIPT: {
		actionProperty: "script",
		natLangProperties: "on_look",
		dictionaryRef: ":string",
	},
	SET_ENTITY_TYPE: {
		actionProperty: "entity_type",
		natLangProperties: "type",
		dictionaryRef: ":string",
	},
	SET_ENTITY_PRIMARY_ID: {
		actionProperty: "u2_value",
		natLangProperties: "primary_id",
		dictionaryRef: ":number",
	},
	SET_ENTITY_SECONDARY_ID: {
		actionProperty: "u2_value",
		natLangProperties: "secondary_id",
		dictionaryRef: ":number",
	},
	SET_ENTITY_PRIMARY_ID_TYPE: {
		actionProperty: "byte_value",
		natLangProperties: "primary_id_type",
		dictionaryRef: ":number",
	},
	SET_ENTITY_CURRENT_ANIMATION: {
		actionProperty: "byte_value",
		natLangProperties: "current_animation",
		dictionaryRef: ":number",
	},
	SET_ENTITY_CURRENT_FRAME: {
		actionProperty: "byte_value",
		natLangProperties: "animation_frame",
		dictionaryRef: ":number",
	},
	SET_ENTITY_PATH: {
		actionProperty: "geometry",
		natLangProperties: "path",
		dictionaryRef: ":string",
	},
	SET_ENTITY_MOVEMENT_RELATIVE: {
		actionProperty: "relative_direction",
		natLangProperties: "relative_direction",
		dictionaryRef: ":number",
	}
}

// adding tedious entity properties to action dictionary

Object.keys(mgs.entityPropertyMap)
	.filter(function (actionName) {
		return actionName.includes('SET_');
	})
	.forEach(function (actionName) {
		var entry = mgs.entityPropertyMap[actionName];
		var natLangProperties = Array.isArray(entry.natLangProperties)
			? entry.natLangProperties
			: [ entry.natLangProperties ];
		natLangProperties.forEach(function(natLangProperty) {
			mgs.actionDictionary.push({
				action: actionName,
				pattern: `set entity $entity:string ${natLangProperty} ?to $${entry.actionProperty}${entry.dictionaryRef}`,
			});
		})
	});

Object.keys(mgs.entityPropertyMap)
	.filter(function (actionName) {
		return actionName.includes('CHECK_');
	})
	.forEach(function (actionName) {
		var entry = mgs.entityPropertyMap[actionName];
		var natLangProperties = Array.isArray(entry.natLangProperties)
			? entry.natLangProperties
			: [ entry.natLangProperties ];
		natLangProperties.forEach(function(natLangProperty) {
			mgs.actionDictionary.push({
				action: actionName,
				pattern: `if entity $entity:string ${natLangProperty} is $${entry.actionProperty}${entry.dictionaryRef} then goto ?script $success_script:string`,
				values: { "expected_bool" : true }
			});
			mgs.actionDictionary.push({
				action: actionName,
				pattern: `if entity $entity:string ${natLangProperty} is not $${entry.actionProperty}${entry.dictionaryRef} then goto ?script $success_script:string`,
				values: { "expected_bool" : false }
			});
		})
	})

mgs.actionDictionary
	.filter(function (entry) {
		return entry.action.includes('CHECK_');
	})
	.forEach(function (entry) {
		var numberVariant = JSON.parse(JSON.stringify(entry));
		var stringVariant = JSON.parse(JSON.stringify(entry));
		numberVariant.pattern = numberVariant.pattern.replace(
			"then goto ?script $success_script:string",
			"then goto index $jump_index:number"
			);
		stringVariant.pattern = stringVariant.pattern.replace(
			"then goto ?script $success_script:string",
			"then goto label $jump_index:bareword"
			);
		mgs.actionDictionary.push(numberVariant);
		mgs.actionDictionary.push(stringVariant);
	})

// adding action dictionary items to the "flat" tree
mgs.actionDictionary.forEach(function (item) {
	// We have semicolons now (actions only)
	if (!item.pattern.endsWith("{")) {
		item.pattern = item.pattern + " ?;";
	}
	item = JSON.parse(JSON.stringify(item));
	var values = item.values || {};
	values.action = item.action;
	var autoActionFunction = function (values) {
		return function (state) {
			state.processCaptures("action", values);
		}
	}
	mgs.trees.action.push(
		{
			pattern: item.pattern,
			onMatch: autoActionFunction(values)
		}
	);
})

// // We have semicolons now (actions only)
// mgs.trees.action.forEach(function (branch) {
// 	if (!branch.pattern.endsWith("{")) {
// 		branch.pattern = branch.pattern + " ?;";
// 	}
// });

/* ------ building MGS dialogs ------ */

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

mgs.dialogWrapSpecials = {
	"%": { // entity names: max 12 chars ASCII
		endChar: "%",
		length: 12,
	},
	"$": { // integers: max value 65535
		endChar: "$",
		length: 4,
	},
};

mgs.countWordChars = function (inputString, _wrapSpecials) {
	var wrapSpecials = _wrapSpecials || {};
	var size = 0;
	var pos = 0;
	var mode = null;
	while (pos < inputString.length) {
		var nextChar = inputString[pos];
		if (mode) { // we're in a special mode
			if (nextChar === mode.endChar) { // if the mode char matches, end mode
				size += mode.length; // size was arbitrary
				pos += 1; // pos was not
				mode = null;
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
			wrapSpecials[nextChar]
			&& inputString.substring(pos+1)
				.includes(wrapSpecials[nextChar].endChar)
		) { // if the end char is in sight, start mode
			mode = wrapSpecials[nextChar];
			if (mode.wholeMustMatch) { // if there's limited whole matches allowed
				var wholeMatch = inputString.substring(pos)
					.match(mode.wholeMustMatch);
				if (wholeMatch) { // a whole match is satisfied
					var matchedStringSize = wholeMatch[0].length;
					size += mode.length;
					pos += matchedStringSize;
					mode = null; // turn off special mode 'cause we're done
					continue;
				} else {// it's not a special mode after all
					mode = null; // turn off special mode because it's normal after all
				}
			} else { // wildcard wrap contents; mode will persist
				pos += 1;
				continue;
			}
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

mgs.wrapText = function (inputString, wrapTo, wrapSpecials) {
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
			var word = mgs.countWordChars(
				workingString.substring(pos),
				wrapSpecials
			);
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
	var dialogSettings = state.final.dialogSettings || [];
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
		return mgs.wrapText(cleanedString, result.messageWrap, mgs.dialogWrapSpecials);
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

/* ------ building MGS serial dialogs ------ */

mgs.buildSerialDialogFromState = function (state) {
	var messages = state.inserts.serialDialogMessages || [];
	var options = state.inserts.serialDialogOptions || [];
	var optionType = state.inserts.serialOptionType || null;
	var result = {};
	// wrap amount
	var globalParams = state.final.serialDialogParameters || {};
	var localParams = state.inserts.serialDialogParameters || {};
	var wrapTo = 80;
	if (localParams.messageWrap) {
		wrapTo = localParams.messageWrap;
	} else if (globalParams.messageWrap) {
		wrapTo = globalParams.messageWrap;
	}	
	result.messages = messages.map(function (string) {
		var cleanedString = mgs.cleanString(string);
		var wrappedString = mgs.wrapText(cleanedString, wrapTo, mgs.serialWrapSpecials);
		return mgs.replaceTagsWithAnsi(wrappedString);
	});
	if (options && options.length) {
		if (optionType === 'options') { // multiple choice
			result.options = options.map(function (item) {
				item.label = mgs.cleanString(mgs.replaceTagsWithAnsi(item.label));
				return item;
			});
		} else if (optionType === 'text_options') { // free choice
			result.text_options = {};
			options.forEach(function (item) {
				var label = mgs.cleanString(item.label);
				result.text_options[label] = item.script;
			})
		}
	}
	return result;
};

mgs.ansiMap = [
	// bold/bright
	{
		natlang: [ 'bold' ],
		ansi: '\u001B[1m',
	},
	// faint/dim
	{
		natlang: [ 'dim' ],
		ansi: '\u001B[2m',
	},
	// reset styles
	{
		natlang: [ '/', 'reset' ],
		ansi: '\u001B[0m',
	},
	// fg colors
	{
		natlang: [ 'k', 'black' ],
		ansi: '\u001B[30m',
	},
	{
		natlang: [ 'r', 'red' ],
		ansi: '\u001B[31m',
	},
	{
		natlang: [ 'g', 'green' ],
		ansi: '\u001B[32m',
	},
	{
		natlang: [ 'y', 'yellow' ],
		ansi: '\u001B[33m',
	},
	{
		natlang: [ 'b', 'blue' ],
		ansi: '\u001B[34m',
	},
	{
		natlang: [ 'm', 'magenta' ],
		ansi: '\u001B[35m',
	},
	{
		natlang: [ 'c', 'cyan' ],
		ansi: '\u001B[36m',
	},
	{
		natlang: [ 'w', 'white' ],
		ansi: '\u001B[37m',
	},
	// bg colors
	{
		natlang: [ 'bg-k', 'bg-black' ],
		ansi: '\u001B[40m',
	},
	{
		natlang: [ 'bg-r', 'bg-red' ],
		ansi: '\u001B[41m',
	},
	{
		natlang: [ 'bg-g', 'bg-green' ],
		ansi: '\u001B[42m',
	},
	{
		natlang: [ 'bg-y', 'bg-yellow' ],
		ansi: '\u001B[43m',
	},
	{
		natlang: [ 'bg-b', 'bg-blue' ],
		ansi: '\u001B[44m',
	},
	{
		natlang: [ 'bg-m', 'bg-magenta' ],
		ansi: '\u001B[45m',
	},
	{
		natlang: [ 'bg-c', 'bg-cyan' ],
		ansi: '\u001B[46m',
	},
	{
		natlang: [ 'bg-w', 'bg-white' ],
		ansi: '\u001B[47m',
	},
	// Linux-sempai says use only red, or red and cyan, and don't use the others; you have no idea whether they're using a dark or light theme, or what their theme is like and some colors WILL NOT show up, depending,
	// non-color-related
	{
		natlang: [ 'bell' ],
		ansi: '',
	},
];

mgs.serialWrapSpecials = {
	"<": {
		endChar: ">",
		length: 0,
		wholeMustMatch: /^<(reset|\/|bold|dim|(bg-)?(black|red|green|yellow|blue|magenta|cyan|white|k|r|g|y|b|m|c|w))>/,
	},
};

mgs.tagToAnsiLookup = {};
mgs.ansiMap.forEach(function (entry) {
	entry.natlang.forEach(function (natlangEntry) {
		mgs.tagToAnsiLookup[natlangEntry] = entry.ansi;
	});
});

mgs.replaceTagsWithAnsi = function (string) {
	var result = string;
	var tags = Object.keys(mgs.tagToAnsiLookup);
	tags.forEach(function (tag) {
		var target = '<' + tag + '>';
		if (tag === '/') {
			target = '<\\/>';
		}
		var reg = new RegExp(target, 'g');
		result = result.replace(reg, mgs.tagToAnsiLookup[tag]);
	});
	return result;
};

mgs.stripAnsi = function (string) {
	return string.replace(/\u001B\[[0-9]{1,2}m/g, '');
};

window.mgs = mgs;

if (typeof module === 'object') {
	module.exports = mgs;
}
