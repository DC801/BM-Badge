var fs = require('fs');

var mgs = require('../editor/dependencies/natlang-parser/mgs_json_to_natlang.js');

var docExampleValues = { // some nice default values
	"$entity:string": "\"Entity Name\"",
	"$target_entity:string": "\"Target Entity\"",
	"$dialog:string": "dialogName",
	"$serial_dialog:string": "serialDialogName",
	"$field:bareword": "x",
	"$entity_type:string": "old_man",
	"$save_flag:string": "saveFlagName",
	"$string:string": "\"some kind of string\"",
	"$source:string": "otherVar",
	"$script:string": "scriptName",
	"$expected_script:string": "scriptName",
	"$success_script:string": "successScript",
	"$variable:string": "varName",
	"$map:string": "mapName",
	"$geometry:string": "\"vector object name\"",
	"$play_count:quantity": "twice",
	"$target_geometry:string": "\"vector object name\"",
	"$direction:bareword": "north",
	"$relative_direction:number": 3,
	"$slot:number": 2,
	"$value:number": 1,
	"$duration:duration": "1000ms",
	"$operation:operator": "+",
	"$comparison:operator": "<",
	"$animation:number": 3,
	"$button_id:bareword": "SQUARE",
	"$color:color": "#000",
	"$expected_byte:number": 2,
	"$expected_u2:number": 32,
	"$expected_u4:number": 9001,
	"$u2_value:number": 2,
	"$u4_value:number": 4,
	"$byte_value:number": 0,
	"$command:string": "map",
	"$argument:string": "castle",
	"$lights:string": "MEM3",
	"$script_slot:bareword": "on_tick",
	"$jump_index:number": 8,
	"$jump_index:bareword": "labelName",
	"$action_index:number": 8,
	"$action_index:bareword": "labelName",
	"$byte_value:number": 1,
};
var colorCatMap = {
	label: "label",
	control: "control",
	invalid: "invalid",
	r: "regex",
	str: "string",
	esc: "string-escape",
	f: "script",
	n: "number",
	comment: "comment",
	entity: "dialog-identifier",
	s: "sigil",
	i: "target",
	t: "identifier",
	const: "variable-constant",
	enum: "language-constant",
	v: "verb",
	kw: "keyword",
	u: "usused",
	t: "tag",
	op: "operator",
	c: "comparator",
	terminator: "terminator",
	b: "bracket"
};
var actionsIntro = [
	"Actions are a basic element of the DC801 Mage Game Engine (MGE) along with [[entities]].",
	"They are individual units of script behavior, such as a logic check or state management, given one after the other within a single [[scripts|script]]. They each have predefined arguments, and are indicated with \"SCREAMING_SNAKE_CASE.\" In the encoded game, they are 8 bytes a piece.",
	"Each action requires specific JSON properties, but through [[MGS Natlang]], they can instead be written as one or more \"natural language\" patterns which can then be converted into JSON.",
];

var actionCategoryText = {
	"Game Management": [
		"Handle the general state of the game, such as [[map loads|loading maps]], timing game actions, enabling and disabling player input, and managing save states."
	],
	"Hex Editor": [
		"Enable or disable player control of specific game features, and otherwise manage the hex editor state."
	],
	"Serial Console": [
		"Manage serial features and create serial output."
	],
	"Camera Control": [
		"Manipulate the camera's position or perform tricks like shaking the camera or fading the screen in and out to an arbitrary color."
	],
	"Script Control": [
		"Set a specific [[on_tick]] or [[on_interact]] script, run another script, or recursively copy the actions inside another script."
	],
	"Entity Choreography": [
		"Move entities around the map using [[vector objects]] placed with Tiled.",
		"NOTE: These actions can behave erratically if any of the vertices in the geometry object are subject to coordinate underflow."
	],
	"Entity Appearance": [
		"Many of these actions (the ones that don't have an explicit duration) will happen instantly. Therefore, if several are used back-to-back, they will all resolve on the same frame. If this is not intended behavior, you should pad them with [[NON_BLOCKING_DELAY|non-blocking delay]]."
	],
	"Set Entity Properties": [
		"Set a specific property on a specific [[entities|entity]]."
	],
	"Set Variables": [
		"Manipulate MGE variables or set them to an arbitrary value."
	],
	"Check Entity Properties": [
		"These actions check whether one of an [[entities|entity]]'s [[entity properties|properties]] matches a specific state. If the condition is met (or not met), then the script will jump: either to a specific point in the same script or the top of an entirely different script.",
		"You can use [[%SELF%]] to target the entity running the script and [[%PLAYER%]] to target the player entity. Otherwise, you must use the entity's given name (its name in Tiled).",
		"You can use the condition portion of these following actions with [[if and else]].",
	],
	"Check Variables": [
		"Check whether one of the MGE variables matches a specific value. If the condition is met (or not met), then the script will jump: either to a specific point in the same script or the top of an entirely different script.",
		"You can use the condition portion of these following actions with [[if and else]].",
	]
};

var actionText = {
	"BLOCKING_DELAY": {
		"category": "Game Management",
		"info": [
			"This pauses the entire game, including all other [[scripts]] and [[animations]], for the given duration.",
			"As this might make the game appear broken, you should probably use a [[NON_BLOCKING_DELAY]] instead."
		]
	},
	"NON_BLOCKING_DELAY": {
		"category": "Game Management",
		"info": [
			"This pauses the current [[scripts|script]] while allowing all other aspects of the game to continue unimpeded.",
			"Use this if you want to pad the actions an [[entities|entity]] is performing so they don't all occur on the same game tick.",
			"For cinematic [[cutscenes]], you will almost certainly need to disable [[SET_PLAYER_CONTROL|player control]] before using this action, otherwise the player will be able to walk away in the middle. (Don't forget to turn it on again when finished.)"
		]
	},
	"SET_PLAYER_CONTROL": {
		"category": "Game Management",
		"info": [
			"When player control is `on`, the player [[entities|entity]] can move around as normal. When `off`, the player cannot move, hack, or [[on_interact|interact]] with anything.",
			"This is set to `on` (`true`) by default."
		]
	},
	"LOAD_MAP": {
		"category": "Game Management",
		"info": [
			"Except for the player's name, all [[entity properties]] are reset to their original values when a new [[map loads|map is loaded]].",
			"If this action is told to load the current map, the current map will be reset. This behavior is equivalent to pressing `XOR` + `MEM3`.",
			"For most normal [[doors|door]] behavior, you will probably want to [[SET_WARP_STATE|set the warp state]] before using the this action."
		]
	},
	"SLOT_SAVE": {
		"category": "Game Management",
		"omitExample": true,
		"info": [
			"This action saves the [[Save Data|game state]] into the current slot (the last slot loaded).",
			"It is not possible to write save data into an arbitrary slots, nor is it possible to copy data from one save slot into another.",
			"Things that are saved:",
`- player name (string)
- \`MEM\` button offsets (the player can change the \`MEM\` button mapping)
- current map id (NOTE: this is saved, but not currently used upon load)
- the warp state string
- hex editor clipboard contents (up to 32 bytes)
- save flags (booleans)
- script variables (integers)`
		]
	},
	"SLOT_LOAD": {
		"category": "Game Management",
		"info": [
			"This brings the [[save data]] associated with that slot into RAM.",
			"The slot is set to `0` by default."
		]
	},
	"SLOT_ERASE": {
		"category": "Game Management",
		"info": [
			"This action clears all the [[save data]] in the given slot."
		]
	},
	"SHOW_DIALOG": {
		"category": "Game Management",
		"info": [
			"Plays the named [[dialogs|dialog]].",
			"A script cannot execute any other actions until the dialog is entirely finished. To give a [[cutscenes|cutscene]] sophisticated choreography, you will need to either split the dialog into multiple pieces or prepare additional scripts to manage concurrent behavior.",
			"While a dialog screen is showing, the player can only advance to the next dialog message or choose a multiple choice option within that dialog (if any); the player cannot hack, interact with another [[entities|entity]], move, etc.",
			"This action is also available as a [[combination block]]: [[show dialog block]].",
			"A script can close an open dialog with [[CLOSE_DIALOG]]."
		]
	},
	"CLOSE_DIALOG": {
		"category": "Game Management",
		"info": [
			"Ends any open [[dialogs|dialog]].",
			"Use this [[actions|action]] when you want to trigger a dialog that may potentially interrupt a dialog in progress. Otherwise, the two dialogs may collide, which can result in a soft lock."
		]
	},
	"SET_LIGHTS_CONTROL": {
		"category": "Game Management",
		"info": [
			"Enables (or disables) manual control of the [[hex editor|hex editing]] LED lights on the badge. This includes all 8 bit lights underneath the screen and the 4 lights on either side of the screen.",
			"Note that gaining control of the lights does not clear the light state by default; the lights currently on will remain on until set with [[SET_LIGHTS_STATE]].",
		]
	},
	"SET_LIGHTS_STATE": {
		"category": "Game Management",
		"info": [
			"Turns on (or off) a specific LED light on the badge. The lights immediately around the screen can only be controlled this way when the lights are set to manual mode (see [[SET_LIGHTS_CONTROL]]); otherwise, those lights are strictly used for hex editor features.",
			"If working with JSON, you can set the `lights` property to an array of strings instead of a single string if you wish to control multiple lights in one action. (Currently, lights must be toggled individually in MGS Natlang.)",
			"See [[LED IDs|LED IDs]] for a list of valid `lights` values."
		]
	},
	"SET_SERIAL_DIALOG_CONTROL": {
		"category": "Serial Console",
		"info": [
			"When `off`, the serial terminal will ignore player input.",
			"This is set to `on` (`true`) by default."
		]
	},
	"SHOW_SERIAL_DIALOG": {
		"category": "Serial Console",
		"info": [
			"Outputs the named [[serial dialogs|serial dialog]] to a connected serial console.",
			"The `concat` variant omits the newline at the end of each message, which can enable complex serial output using only MGE scripting logic. (Turn off [[SET_SERIAL_DIALOG_CONTROL|serial control]] first, then turn it back on again when finished.)",
			"This action is also available as a [[combination block]]: [[show serial dialog block]]."
		]
	},
	"CLOSE_SERIAL_DIALOG": {
		"category": "Serial Console",
		"info": [
			"Ends any [[serial dialogs|serial dialog]] that is awaiting user input, such as a [[serial dialog options|free response question or a multiple choice question]]."
		]
	},
	"SET_CONNECT_SERIAL_DIALOG": {
		"category": "Serial Console",
		"info": [
			"Sets the serial connection message to the named [[serial dialogs|serial dialog]]. (The connection message is sent whenever a serial console is newly connected to the badge hardware.)",
			"This action is also available as a [[combination block]]."
		]
	},
	"REGISTER_SERIAL_DIALOG_COMMAND": {
		"category": "Serial Console",
		"info": [
			"Once a command is registered, the player can enter the command into the serial console and the corresponding script will run in a unique serial script slot.",
			"- **Plain variant**: registers the command in general and identifies the script to run when the command is typed without any additional arguments. This variant must be used before *any* arguments can be registered (including `fail`).\n- **Fail variant**: identifies a script for custom \"unknown argument\" behavior (in the event the player attempts to use an unregistered argument for this command).",
			"Commands must be a single word.",
		]
	},
	"UNREGISTER_SERIAL_DIALOG_COMMAND": {
		"category": "Serial Console",
		"info": [
			"- **Plain variant**: unregisters the given command *and* all registered arguments for that command (if any).\n- **Fail variant**: only unregisters the `fail` script; other registered arguments (and the plain command itself) will remain intact.",
		]
	},
	"REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT": {
		"category": "Serial Console",
		"info": [
			"This action registers an argument (and a script) for an [[REGISTER_SERIAL_DIALOG_COMMAND|already-registered serial command]].",
			"Arguments can be multiple words. In-game, if the second word is `at` or `to` it is ignored, e.g. `> warp to my house` (after running `register \"warp\" + \"my house\"`)."
		]
	},
	"UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT": {
		"category": "Serial Console",
		"info": [
			"This action unregisters the specified argument from an [[REGISTER_SERIAL_DIALOG_COMMAND|already-registered serial command]]."
		]
	},
	// "SET_HEX_CURSOR_LOCATION": {
	// 	"category": "Hex Editor",
	// 	"info": [
	// 		"??? (verify this is even implemented; BMG2020 does not use it anywhere)"
	// 	]
	// },
	"SET_HEX_EDITOR_STATE": {
		"category": "Hex Editor",
		"info": [
			"Setting this to true opens the [[hex editor]]. (Does the hex editor need to be enabled?) #verifyme "
		]
	},
	"SET_HEX_EDITOR_DIALOG_MODE": {
		"category": "Hex Editor",
		"info": [
			"When on, this reduces the number of rows in the [[hex editor]], which makes room for [[dialogs|dialog]] boxes. (The portrait image can still cover up hex cells, though.)",
			"NOTE: This action has been disabled in the MGE to prevent accidental soft locks."
		]
	},
	"SET_HEX_EDITOR_CONTROL": {
		"category": "Hex Editor",
		"info": [
			"This action enables or disables player access to to the [[hex editor]]. This is on by default."
		]
	},
	"SET_HEX_EDITOR_CONTROL_CLIPBOARD": {
		"category": "Hex Editor",
		"info": [
			"This action enables or disables the clipboard and copy functionality within the [[hex editor]]. This is on by default. (? #verifyme)"
		]
	},
	"CHECK_VARIABLE": {
		"category": "Check Variables",
		"info": [
			"Compares the value of a [[Integer Variables|variable]] against the given value.",
			"`==` is assumed if no [[operator]] is given."
		]
	},
	"CHECK_VARIABLES": {
		"category": "Check Variables",
		"info": [
			"Compares the value of a [[Integer Variables|variable]] against another.",
			"`==` is assumed if no [[operator]] is given."
		]
	},
	"CHECK_SAVE_FLAG": {
		"category": "Check Variables",
		"info": [
			"Checks one of the [[save flags]] (booleans)."
		]
	},
	"CHECK_FOR_BUTTON_PRESS": {
		"category": "Check Variables",
		"info": [
			"Checks whether a button was actively pressed down that game tick.",
			"That is, the game keeps track of button state changes each game tick, and this action detects whether the target button had a change of state from *not pressed* to *pressed* that game tick. If the target button was *already pressed* when this action runs, this action will not result in a script branch.",
			"To instead check the button's state (regardless of whether that state has changed) see [[CHECK_FOR_BUTTON_STATE]].",
			"NOTE: The button states are reset when a [[map loads|new map is loaded]]. If listening for a button press in the new map, this action may very will trigger immediately, even if the button was held down through the map load.",
			"See [[button IDs]] for a list of valid button values."
		]
	},
	"CHECK_FOR_BUTTON_STATE": {
		"category": "Check Variables",
		"info": [
			"Checks the specific status (pressed or not pressed) of a specific button at that moment.",
			"If checking for whether a button is newly pressed, see [[CHECK_FOR_BUTTON_PRESS]].",

		]
	},
	"CHECK_WARP_STATE": {
		"category": "Check Variables",
		"info": [
			"Checks whether the [[warp_state|warp state string]] is a specific value.",
		]
	},
	"CHECK_DIALOG_OPEN": {
		"category": "Check Variables",
		"info": [
			"Checks whether a [[dialogs|dialog]] is currently open.",
		]
	},
	"CHECK_SERIAL_DIALOG_OPEN": {
		"category": "Check Variables",
		"info": [
			"Checks whether a [[serial dialogs|serial dialog]] is currently awaiting user input, such as a [[serial dialog options|free response question or a multiple choice question]].",
		]
	},
	"CHECK_DEBUG_MODE": {
		"category": "Check Variables",
		"info": [
			"Checks whether [[debug mode]] is currently on.",
		]
	},
	"SET_SAVE_FLAG": {
		"category": "Set Variables",
		"info": [
			"Set a [[save flags|save flag]] to `true` or `false`.",
		]
	},
	"SET_WARP_STATE": {
		"category": "Set Variables",
		"info": [
			"Set the [[warp_state|warp state string]] to a specific value.",
		]
	},
	"MUTATE_VARIABLE": {
		"category": "Set Variables",
		"info": [
			"Manipulate the value of a specific [[Integer Variables|variable]] or set it to a new value.",
			"See [[operations]]."
		]
	},
	"MUTATE_VARIABLES": {
		"category": "Set Variables",
		"info": [
			"Manipulate the value of a specific [[Integer Variables|variable]] by using the value of another variable.",
			"See [[operations]]."
		]
	},
	"COPY_VARIABLE": {
		"category": "Set Variables",
		"info": [
			"Copies the value of an [[entities|entity]] [[Entity Properties|property]] into a [[Integer Variables|variable]] or vice versa.",
		]
	},
	"CHECK_ENTITY_NAME": {
		"category": "Check Entity Properties",
		"info": [
			"Checks an [[entities|entity]]'s [[Printing Current Values|current name]].",
		]
	},
	"CHECK_ENTITY_X": {
		"category": "Check Entity Properties",
		"info": [
			"Checks an [[entities|entity]]'s [[entity properties|x]] coordinate.",
		]
	},
	"CHECK_ENTITY_Y": {
		"category": "Check Entity Properties",
		"info": [
			"Checks an [[entities|entity]]'s [[entity properties|y]] coordinate.",
		]
	},
	"CHECK_ENTITY_INTERACT_SCRIPT": {
		"category": "Check Entity Properties",
		"info": [
			"Checks an [[entities|entity]]'s [[on_interact]] [[script slot|script]] (by the [[scripts|script]]'s name).",
		]
	},
	"CHECK_ENTITY_TICK_SCRIPT": {
		"category": "Check Entity Properties",
		"info": [
			"Checks an [[entities|entity]]'s [[on_tick]] [[script slot|script]] (by the [[scripts|script]]'s name).",
		]
	},
	"CHECK_ENTITY_LOOK_SCRIPT": {
		"category": "Check Entity Properties",
		"info": [
			"Checks an [[entities|entity]]'s [[on_look]] [[script slot|script]] (by the [[scripts|script]]'s name).",
		]
	},
	"CHECK_ENTITY_TYPE": {
		"category": "Check Entity Properties",
		"info": [
			"Checks whether a [[character entity]] is currently the given [[entity properties|entity_type]].",
			"This action is useful because you can check entity types by name, which is easy and convenient (e.g. check if the entity \"Delmar\" is the type `old_man`). Otherwise you'd have to use a mix of [[CHECK_ENTITY_PRIMARY_ID]] and [[CHECK_ENTITY_PRIMARY_ID_TYPE]] and also know in advance which ints you're checking for."
		]
	},
	"CHECK_ENTITY_PRIMARY_ID": {
		"category": "Check Entity Properties",
		"info": [
			"Checks whether an [[entities|entity]] has the given [[entity types|primary_id]].",
			"[[CHECK_ENTITY_TYPE]] is recommended instead."
		]
	},
	"CHECK_ENTITY_SECONDARY_ID": {
		"category": "Check Entity Properties",
		"info": [
			"Checks whether an [[entities|entity]] has the given [[entity types|secondary_id]].",
			"This entity property is only useful on [[tile entity|tile entities]], where the `secondary_id` determines which tile in the tileset is displayed.",
			"Tiles are referenced by their index, starting at the top and going toward the right (0-indexed). Click on the tile within Tiled to see its ID."
		]
	},
	"CHECK_ENTITY_PRIMARY_ID_TYPE": {
		"category": "Check Entity Properties",
		"info": [
			"Checks an [[entities|entity]]'s [[entity types|primary_id_type]]: either (`0`) [[Tile Entity|tile]], (`1`) [[Animation Entity|animation]], or (`2`) [[Character Entity|character]] (sometimes called `entity_type`)."
		]
	},
	"CHECK_ENTITY_CURRENT_ANIMATION": {
		"category": "Check Entity Properties",
		"info": [
			"Checks the id of the [[entities|entity]]'s [[entity properties|current animation]]. (See [[animations|entity animations]] for what numbers correspond to which animations.)"
		]
	},
	"CHECK_ENTITY_CURRENT_FRAME": {
		"category": "Check Entity Properties",
		"info": [
			"Checks the frame (number) of the [[entities|entity]]'s current [[animations|entity animations]]."
		]
	},
	"CHECK_ENTITY_DIRECTION": {
		"category": "Check Entity Properties",
		"info": [
			"Checks whether an [[entities|entity]] is facing one of the four cardinal directions: `north`, `south`, `east`, or `west`."
		]
	},
	"CHECK_ENTITY_GLITCHED": {
		"category": "Check Entity Properties",
		"info": [
			"Checks whether an [[entities|entity]] currently has it's \"glitched\" render flag set."
		]
	},
	"CHECK_ENTITY_PATH": {
		"category": "Check Entity Properties",
		"info": [
			"Checks the `path` name ([[Vector Objects|geometry]]) of an [[entities|entity]]."
		]
	},
	"CHECK_IF_ENTITY_IS_IN_GEOMETRY": {
		"category": "Check Entity Properties",
		"info": [
			"Checks whether an [[entities|entity]] is inside the named [[Vector Objects|geometry]].",
			"This action can behave erratically if any of the vertices in the geometry object are subject to [[coordinate underflow]]."
		]
	},
	"SET_ENTITY_NAME": {
		"category": "Set Entity Properties",
		"info": [
			"Sets an [[entities|entity]]'s [[entity properties|name]]."
		]
	},
	"SET_ENTITY_X": {
		"category": "Set Entity Properties",
		"info": [
			"Sets an [[entities|entity]]'s [[entity properties|x]] coordinate.",
			"In practice, you will likely want to use [[Vector Objects|geometry vectors]] and teleport actions instead."
		]
	},
	"SET_ENTITY_Y": {
		"category": "Set Entity Properties",
		"info": [
			"Sets an [[entities|entity]]'s [[entity properties|y]] coordinate.",
			"In practice, you will likely want to use [[Vector Objects|geometry vectors]] and teleport actions instead."
		]
	},
	"SET_ENTITY_TYPE": {
		"category": "Set Entity Properties",
		"info": [
			"Sets an [[entities|entity]]'s [[character entity|entity_type]]. (See: [[Entity Type]], [[Entity Properties]])"
		]
	},
	"SET_ENTITY_PRIMARY_ID": {
		"category": "Set Entity Properties",
		"info": [
			"Sets an [[entities|entity]]'s [[entity properties|primary_id]].",
			"You will overwhelmingly want to set the `entity_type` by name instead with [[SET_ENTITY_TYPE]]."
		]
	},
	"SET_ENTITY_SECONDARY_ID": {
		"category": "Set Entity Properties",
		"info": [
			"Sets an [[entities|entity]]'s [[entity properties|secondary_id]].",
			"This action will not be useful unless the entity is a [[tile entity]] (`primary_id_type`: `1`)."
		]
	},
	"SET_ENTITY_PRIMARY_ID_TYPE": {
		"category": "Set Entity Properties",
		"info": [
			"Sets an [[entities|entity]]'s [[entity properties|primary_id_type]]: either (`0`) [[tile entity|tile]], (`1`) [[animation entity|animation]], or (`2`) [[character entity|character]] (sometimes called `entity_type`)."
		]
	},
	"SET_ENTITY_PATH": {
		"category": "Entity Choreography",
		"info": [
			"This assigns a [[Vector Objects|geometry object]] to an [[entities|entity]]. Afterward, the entity can use `%ENTITY_PATH%` to refer to that path. (This assignment can also be done within Tiled.)"
		]
	},
	"TELEPORT_ENTITY_TO_GEOMETRY": {
		"category": "Entity Choreography",
		"info": [
			"Moves the [[entities|entity]] instantly to the first vertex of the specified [[Vector Objects|geometry object]] (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`)."
		]
	},
	"WALK_ENTITY_TO_GEOMETRY": {
		"category": "Entity Choreography",
		"info": [
			"Moves the [[entities|entity]] in a straight line from its current position to the first vertex of the [[Vector Objects|geometry object]] named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time."
		]
	},
	"WALK_ENTITY_ALONG_GEOMETRY": {
		"category": "Entity Choreography",
		"info": [
			"Moves the [[entities|entity]] along the [[Vector Objects|geometry object]] named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.",
			"NOTE: Unless you want the entity to teleport to the geometry's origin point, you should probably use [[WALK_ENTITY_TO_GEOMETRY]] first."
		]
	},
	"LOOP_ENTITY_ALONG_GEOMETRY": {
		"category": "Entity Choreography",
		"info": [
			"Moves the [[entities|entity]] along the [[Vector Objects|geometry object]] object named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.",
			"This action will loop forever, and cannot terminate on its own; no other action given below this one inside a script will execute after this action begins.",
			"NOTE: Unless you want the entity to teleport to the geometry's origin point, you should probably use [[WALK_ENTITY_TO_GEOMETRY]] first."
		]
	},
	"PLAY_ENTITY_ANIMATION": {
		"category": "Entity Appearance",
		"info": [
			"The [[entities|entity]] will play the given [[animations|animation]] the given number of times, and then will return to its default animation.",
			"A [[scripts|script]] that runs this action will not execute any further actions until the play count has been satisfied.",
			"If an entity is compelled to move around on the map, it will abort this animation playback.",
			"See [[animations|entity animations]] for what numbers correspond to which animations."
		]
	},
	"SET_ENTITY_CURRENT_ANIMATION": {
		"category": "Entity Appearance",
		"info": [
			"The [[entities|entity]] will switch to the given [[animations|animation]], which will loop indefinitely.",
			"If an entity is compelled to move around on the map, it will abort this animation playback. (I.e. when the entity stops moving again, it will revert to its default animation, not the one given by this action.)",
			"See [[animations|entity animations]] for what numbers correspond to which animations."
		]
	},
	"SET_ENTITY_CURRENT_FRAME": {
		"category": "Entity Appearance",
		"info": [
			"Set the frame of the current [[animations|animation]].",
			"This is useful for staggering the animations of [[entities]] that have identical animation timings."
		]
	},
	"SET_ENTITY_DIRECTION": {
		"category": "Entity Appearance",
		"info": [
			"Turns an [[entities|entity]] toward the `north`, `south`, `east`, or `west`."
		]
	},
	"SET_ENTITY_DIRECTION_RELATIVE": {
		"category": "Entity Appearance",
		"info": [
			"Turns the [[entities|entity]] in 90° increments. Positive numbers are clockwise turns, and negative numbers are counterclockwise turns. (E.g. turn them '2' to flip them around 180°)",
			"This action can be chained with another similar one for complex behaviors. For example, to turn an entity away from the player, you can first set the entity's direction [[SET_ENTITY_DIRECTION_TARGET_ENTITY|toward the player]], then immediately rotate it 2 turns."
		]
	},
	"SET_ENTITY_DIRECTION_TARGET_ENTITY": {
		"category": "Entity Appearance",
		"info": [
			"Make an [[entities|entity]] turn toward another."
		]
	},
	"SET_ENTITY_DIRECTION_TARGET_GEOMETRY": {
		"category": "Entity Appearance",
		"info": [
			"Make an [[entities|entity]] turn toward a vector geometry on the map."
		]
	},
	"SET_ENTITY_MOVEMENT_RELATIVE": {
		"category": "Entity Appearance",
		"info": [
			"This adds a rotation to an [[entities|entity]]'s [[animations]]. This is different from turning an entity toward something or someone (see [[SET_ENTITY_DIRECTION]] and related actions); this action applies a rotation to *all* an entity's animations, including while the entity is in motion. In short, use this action to make an entity walk backwards or strafe (walk sideways).",
			"This number cannot be negative."
		]
	},
	"SET_ENTITY_GLITCHED": {
		"category": "Entity Appearance",
		"info": [
			"Set the glitched render flag on an [[entities|entity]]."
		]
	},
	"SET_CAMERA_TO_FOLLOW_ENTITY": {
		"category": "Camera Control",
		"info": [
			"Sets what the camera is following. ([[%PLAYER%]] is the default.)"
		]
	},
	"TELEPORT_CAMERA_TO_GEOMETRY": {
		"category": "Camera Control",
		"info": [
			"Moves the camera to the first vertex of the specified [[vector objects|geometry object]]."
		]
	},
	"PAN_CAMERA_TO_ENTITY": {
		"category": "Camera Control",
		"info": [
			"Pans the camera to an [[entities|entity]]. Afterward, the camera will follow that entity.",
			"NOTE: if the entity is moving while the camera is coming closer, the camera will speed up or slow down to reach the entity at the correct time."
		]
	},
	"PAN_CAMERA_TO_GEOMETRY": {
		"category": "Camera Control",
		"info": [
			"Pans the camera to the first vertex of a [[vector objects|geometry object]]."
		]
	},
	"PAN_CAMERA_ALONG_GEOMETRY": {
		"category": "Camera Control",
		"info": [
			"(might not work yet — instead, make a [[null entity]] and lock the camera to it)"
		]
	},
	"LOOP_CAMERA_ALONG_GEOMETRY": {
		"category": "Camera Control",
		"info": [
			"(might not work yet — instead, make a [[null entity]] and lock the camera to it)"
		]
	},
	"SET_SCREEN_SHAKE": {
		"category": "Camera Control",
		"info": [
			"Shakes the camera a certain distance (`amplitude`) at a certain speed (`frequency`) and for a certain length of time (`duration`)."
		]
	},
	"SCREEN_FADE_OUT": {
		"category": "Camera Control",
		"info": [
			"Fades the screen out to the given color.",
			"Fades are slow on the hardware, so use these sparingly."
		]
	},
	"SCREEN_FADE_IN": {
		"category": "Camera Control",
		"info": [
			"Fades the screen in from the given color.",
			"Fades are slow on the hardware, so use these sparingly."
		]
	},
	"RUN_SCRIPT": {
		"category": "Script Control",
		"info": [
			"This action abandons the current [[scripts|script]] and jumps to the named script. In other words, actions provided after a `RUN_SCRIPT` action will not execute. (The MGS Natlang keyword `goto` was chosen to emphasize this.) The new script runs in the same script slot that called this action, and will begin to execute immediately.",
			"If you want to replace the script in the current slot *without* executing the new script until the next game loop, you should instead use one of the `SET_` ... `_SCRIPT` actions."
		]
	},
	"GOTO_ACTION_INDEX": {
		"category": "Script Control",
		"info": [
			"Jumps to the action at the given [[labels|label]] ([[bareword]]) or action index ([[number]]). All jumps are made within the current [[scripts|script]].",
			"The index (number) variant is not recommended for manual use, as `COPY_SCRIPT` and procedural syntax expansion can make action indices impossible to predetermine.",
			"The keyword `return` uses this action to jump to the end of the current script (i.e. \"return early\")."
		]
	},
	"COPY_SCRIPT": {
		"category": "Script Control",
		"info": [
			"The [[MGE encoder]] literally copies all the actions from the copied [[scripts|script]] and inserts them where `COPY_SCRIPT` is being used. This happens recursively.",
			"`COPY_SCRIPT` converts and adapts [[labels|label]] references, jumps that eventually become action indices, when copied. Feel free to use `COPY_SCRIPT` for literally any script you want!",
			"See: [[COPY_SCRIPT_uses]]"
		]
	},
	"SET_MAP_TICK_SCRIPT": {
		"category": "Script Control",
		"info": [
			"Sets the map's [[on_tick]] script."
		]
	},
	"SET_ENTITY_INTERACT_SCRIPT": {
		"category": "Script Control",
		"info": [
			"Sets an [[entities|entity]]'s [[on_interact]] script.",
			"If you use this action to change the [[script slots|script slot]] that is currently running the action, any actions given afterward may not execute depending on what they are.",
			"Because [[entity properties]] are reset when a [[map loads|map is loaded]], and because entities retain the last script that was run in their `on_interact` slot, you should restore an entity's original interact script at the end of their interact script tree if there are any script jumps involved."
		]
	},
	"SET_ENTITY_TICK_SCRIPT": {
		"category": "Script Control",
		"info": [
			"Sets an [[entities|entity]]'s [[on_tick]] script."
		]
	},
	"SET_ENTITY_LOOK_SCRIPT": {
		"category": "Script Control",
		"info": [
			"Sets an [[entities|entity]]'s [[on_look]] script."
		]
	},
	"SET_SCRIPT_PAUSE": {
		"category": "Script Control",
		"info": [
			"Pauses or unpauses a [[scripts|script]]. In practice, this is most useful for temporarily pausing an [[entities|entity]]'s [[on_tick]] script during its [[on_interact]] event.",
			"Entity variant: Any entity name can be used in all the normal ways ([[%PLAYER%]] etc.). Scripts slots for these are `on_tick`, `on_interact`, and [[on_look]].",
			"Map variant: Script slots for these are [[on_load]], [[on_tick]], and [[commands|on_command]]."
		]
	}
};

var filterUnique = function (entry,i,arr) {
	return arr.findIndex(function(first) {
		return first === entry;
	}) === i;
};
var actionDictionary = mgs.actionDictionary
	.filter(function (item) { return !item.omitFromDocs; })
var actionNames = actionDictionary
	.map(function (item) { return item.action; })
	.filter(filterUnique);

var entryToJSON = function (entry) {
	var collection = {};
	var pattern = entry.pattern.replace(/<[^<>]+>($|\s)/g,'$1');
	pattern.split(' ').filter(function (item) {
		return item[0] === "$";
	}).forEach(function (word) {
		var wordSplit = word.split(':')
		var property = wordSplit[0].substring(1);
		var value;
		if (word.includes('_index:bareword')) {
			value = 'labelName';
		} else if (word.includes('_index:number')) {
			value = 12;
		} else if (
			entry.exampleValues
			&& entry.exampleValues[word]
		) {
			value = entry.exampleValues[word];
		} else if (docExampleValues[word]) {
			value = docExampleValues[word];
		} else if (
			word.includes('$bool_value')
			|| word.includes('$expected_bool')
			|| word.includes('$enabled')
		) {
			var boolPrefs = mgs.boolPrefs[entry.action];
			value = boolPrefs ? boolPrefs[0] : true;
		} else {
			console.log('breakpointme')
		}
		collection[property] = value;
	});
	if (entry.values) {
		Object.entries(entry.values).forEach(function(item){
			collection[item[0]] = item[1];
		})
	}
	collection.action = entry.action;
	// sorting the values so they can be more easily compared
	var ret = {};
	Object.keys(collection).sort().forEach(function(prop) {
		var sanitized = collection[prop];
		ret[prop] = typeof sanitized === "string"
			? sanitized.replace(/^\"(.+)\"$/, '$1')
			: sanitized;
	});
	return ret;
};

var isJSONUnique = function (testJSON, array) {
	var testProps = Object.keys(testJSON).sort();
	return !array.some(function (item) {
		var itemProps = Object.keys(item).sort();
		return itemProps.every(function (item, i) {
			return testProps[i] === item;
		});
	});
};

var makeJSONSamples = function (actionName) {
	var dictionaryEntries = actionDictionary
		.filter(function (item) { return item.action === actionName; })
		.filter(function (item) { return !item.omitFromJSON; });
	var jsonEntries = dictionaryEntries.map(entryToJSON);
	var uniqueJSON = [ jsonEntries.shift() ];
	jsonEntries.forEach(function (item) {
			if (isJSONUnique(item, uniqueJSON)) {
				uniqueJSON.push(item);
			}
		});
	return uniqueJSON;
};

var makeColorReport = function (entry) {
	var wordSplits = entry.pattern.split(' ');
	var jsonValues = entryToJSON(entry);
	Object.keys(jsonValues).forEach(function (key) {
		// putting double quotes back on :/
		var value = jsonValues[key];
		if (typeof value === "string" && value.includes(' ')) {
			jsonValues[key] = '"' + value + '"';
		}
	});
	var colorTokens = wordSplits.map(function (item) {
		var matches = item.match(/[?]?(.+?)(<([a-z]+)>)?$/);
		var word = matches[1];
		var value = word;
		if (word[0] === "$") {
			var value = word.split(':')[0].substring(1);
			value = jsonValues[value];
		}
		var colorType = matches[3] || "";
		var style = colorCatMap[colorType] || "";
		return {
			style: style,
			value: value
		};
	})
	return colorTokens.filter(function (item) {
		return !(item.value === "script" && item.style === "sigil");
	});
};
var makeColorExampleFromReport = function (colorTokens) {
	return colorTokens.map(function(token) {
		return `<span class="${token.style}">${token.value}</span>`;
	}).join(' ')
	.replace( // make `;` snug
		/ <span class="(terminator)?">;<\/span>/g,
		'<span class="$1">;</span>'
	)
	.replace( // make `then` goto the next line
		/<\/span> <span class="control">then<\/span>/g,
		'</span>\n    <span class="control">then</span>'
	)
	.replace( // make `{ }` snug
		/{<\/span> <span class="bracket">}/g,
		'{</span><span class="bracket">}'
	)
	.replace( // make `( _` snug
		/\(<\/span> <span/g,
		'(</span><span'
	)
	.replace( // make `_ )` snug
		/<\/span> <span class="bracket">\)/g,
		'</span><span class="bracket">)'
	)
	.replace( // make %MAP% a fancy color
		'>%MAP%<',
		'>"</span><span class="language-constant">%MAP%</span><span class="string">"<'
	);
};

var makePrintableEntry = function (entry) {
	var pattern = entry.pattern.replace(/<[^<>]+>($|\s)/g,'$1');
	var wordSplits = pattern.split(' ');
	var result = wordSplits.map(function (word) {
		return word[0] === "?"
			? "(" + word.substring(1) + ")"
			: word;
	})
	string = result.join(' ');
	if (entry.values) {
		Object.keys(entry.values).forEach(function (valueName) {
			string += `\n\t// built-in value: ${valueName} = ${entry.values[valueName]}`;
		})
	}
	return string.replace(" then goto",`\n    then goto`);
};

var makeObsidianMGSBlock = function (string) {
	// double line breaks are more like what obsidian does for its code blocks btw
	var string =
`<pre class="HyperMD-codeblock mgs">\n
  ${string}\n
</pre>`
	return string;
}
var makeObsidianEntry = function (actionName) {
	// JSON 
	var jsonEntries = makeJSONSamples(actionName);
	var printJSONentries = jsonEntries.map(function (json) {
		var ret = JSON.parse(JSON.stringify(json));
		// compelling booleans to be really boolean
		[ 'bool_value', 'expected_bool', 'enabled', ]
			.forEach(function(boolProp){
				if (ret[boolProp]) {
					ret[boolProp] = true;
				}
			});
		Object.keys(ret).forEach(function (prop) {
			if (prop === "operation") {
				ret[prop] = "ADD"; // this is fine probably
			}
		})
		return JSON.stringify(ret, null, '  ');
	}).join(',\n');

	// collecting "default" values
	var sampleValues = {};
	jsonEntries.forEach(function (item) {
		sampleValues = Object.assign(sampleValues, item);
	});
	Object.keys(sampleValues).forEach(function (key) {
		// putting double quotes back on :/
		var value = sampleValues[key];
		if (typeof value === "string" && value.includes(' ')) {
			sampleValues[key] = value = '"' + value + '"';
		}
	});
	
	// making the pieces

	var printJSON = [ '```json', printJSONentries, '```']
		.join('\n');

	var dict = actionDictionary
		.filter(function(item){
			return item.action === actionName;
		});
	var printDict = dict.map(makePrintableEntry);
	var printDictionary = [ '```', printDict.join('\n\n'), '```']
		.join('\n');

	var colorReports = dict.map(makeColorReport);
	var colors = colorReports.map(makeColorExampleFromReport)
		.join('\n  ');
	var printColors = makeObsidianMGSBlock(colors);
	
	// and we're done?
	var ret = [
		`# ${actionName}`,
		...actionText[actionName].info,
		`## Example JSON`,
		printJSON,
		`## MGS Natlang`,
	]
	// extra bit for conditionals
	var firstColorReport = colorReports[0];
	if (firstColorReport[0].value === 'if') {
		var thenIndex = firstColorReport.findIndex(function (item) {
			return item.value === "then";
		})
		var abbrev = firstColorReport.slice(1, thenIndex);
		ret.push(`The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.`);
		var abbrev = [
			{ style: "control", value: "if" },
			{ style: "bracket", value: "(" },
		]
			.concat(abbrev)
			.concat([
				{ style: "bracket", value: ")" },
				{ style: "bracket", value: "{" },
				{ style: "bracket", value: "}" },
			]);
		var printAbbrev = makeColorExampleFromReport(abbrev);
		ret.push(makeObsidianMGSBlock(printAbbrev));
	}
	ret = ret.concat([
		printDict.length === 1 ? '### Example:' : '### Examples:',
		printColors,
		printDict.length === 1 ? '### Dictionary entry:' : '### Dictionary entries:',
		printDictionary,
		'---',
		'Back to [[Actions]]'
	]);
	return ret.join('\n\n') + '\n';
};

// var totalPrint = actionNames.map(function(actionName) {
// 	return [
// 		`# ${actionName}`,
// 		makeObsidianEntry(actionName),
// 	].join('\n\n');
// }).join('\n');

// var totalColors = actionDictionary.map(function(entry) {
// 	var colorReport = makeColorReport(entry);
// 	return makeColorExampleFromReport(colorReport);
// }).join('\n');
// totalColors = makeObsidianMGSBlock(totalColors);

// console.log(totalPrint);

var actionParagraphs = [
	'# Actions',
	...actionsIntro,
]
Object.keys(actionCategoryText).forEach(function(cat){
	// header
	actionParagraphs.push('## ' + cat);
	// description
	actionParagraphs = actionParagraphs.concat(actionCategoryText[cat]);
	// list of actions with links
	var list = Object.entries(actionText)
		.filter(function (pair) {
			return pair[1].category === cat;
		})
		.map(function (pair) {
			return `- [[${pair[0]}]]`;
		})
		.join('\n');
	actionParagraphs.push(list);
});
actionPage = actionParagraphs.join('\n\n') + '\n';


var filePrefix = 'MGE_obsidian_vault/Actions/'

fs.writeFileSync(
	filePrefix + 'Actions.md',
	actionPage
);

actionNames.forEach(function (actionName) {
	var page = makeObsidianEntry(actionName);
	fs.writeFileSync(
		filePrefix + actionName + '.md',
		page
	);
});

// NOTE: run this with node, not VSCode, for accurate file paths!!!
// TODO: split this file into "the thing that builds the file" and "the thing that writes the file" so you can debug without borking things