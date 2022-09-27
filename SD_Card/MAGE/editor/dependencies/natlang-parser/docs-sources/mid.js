var actionCategoryText = {
	"game management": [
		"Handle the general state of the game, such as loading maps, timing game actions, enabling and disabling player input, and managing save states."
	],
	"hex editor": [
		"Enable or disable player control of specific game features, and otherwise manage the hex editor state."
	],
	"check entity properies": [
		"These actions check whether one of an entity's properties matches a specific state. If the condition is met (or not met), then the script will abandon any remaining actions and \"goto\" to the named script.",
		"Tou can use `%SELF%` to target the entity running the script and `%PLAYER%` to target the player entity. Otherwise, you must use the entity's given name (its name in Tiled).",
	],
	"check variables": [
		"Check whether one of the MGE variables matches a specific value. If the condition is met (or not met), then the script will abandon any remaining actions and \"goto\" to the named script."
	],
	"set entity properies": [
		"Set a specific property on a specific entity."
	],
	"set variables": [
		"Manipulate MGE variables or set them to an arbitrary value."
	],
	"entity choreography": [
		"Move entities around the map using vector objects placed with Tiled.",
		"NOTE: These actions can behave erratically if any of the vertices in the geometry object are subject to coordinate underflow."
	],
	"entity appearance": [
		"Many of these actions (the ones that don't have an explicit duration) will happen instantly. Therefore if several are used back-to-back, they will all resolve on the same frame. If this is not intended behavior, you should pad them with [non-blocking delay](#non_blocking_delay)."
	],
	"camera control": [
		"Manipulate the camera's position or perform tricks like shaking the camera or fading the screen in and out to an arbitrary color."
	],
	"script control": [
		"Set a specific `on_tick` or `on_interact` script, run another script, or recursively copy the actions inside another script."
	]
};

var actionText = {
	"BLOCKING_DELAY": {
		"category": "game management",
		"info": [
			"This pauses the entire game, including all other scripts and animations, for the given duration.",
			"As this might make the game appear broken, you should probably use a [non-blocking delay](#non_blocking_delay) instead."
		]
	},
	"NON_BLOCKING_DELAY": {
		"category": "game management",
		"info": [
			"This pauses the current script while allowing all other aspects of the game to continue unimpeded.",
			"Use this if you want to pad the actions an entity is performing so they don't all occur on the same game tick.",
			"For cinematic cutscenes, you will almost certainly need to disable [player control](#set_player_control) before using this action, otherwise the player will be able to walk away in the middle. (Don't forget to turn it on again when finished!)"
		]
	},
	"SET_PLAYER_CONTROL": {
		"category": "game management",
		"info": [
			"When player control is `on`, the player entity can move around as normal. When `off`, the player entity cannot move, hack, or interact with anything.",
			"This is set to `on` (`true`) by default."
		]
	},
	"LOAD_MAP": {
		"category": "game management",
		"info": [
			"Except for the player's name, all entity properties are reset to their original values when a new map is loaded.",
			"If this action is told to load the current map, the current map will be reset. This behavior is equivalent to pressing XOR + MEM3.",
			"For most normal door behavior, you will probably want to [set the warp state](#set_war_state) before using the this action."
		]
	},
	"SLOT_SAVE": {
		"category": "game management",
		"omitExample": true,
		"info": [
			"This action saves the game state into the current slot (the last slot loaded).",
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
		"category": "game management",
		"info": [
			"This brings the save data associated with that slot into RAM.",
			"The slot is set to 0 by default."
		]
	},
	"SLOT_ERASE": {
		"category": "game management",
		"info": [
			"This action clears all the save data in the given slot."
		]
	},
	// "SET_HEX_CURSOR_LOCATION": {
	// 	"category": "hex editor",
	// 	"info": [
	// 		"??? (verify this is even implemented; BMG2020 does not use it anywhere)"
	// 	]
	// },
	"SET_HEX_EDITOR_DIALOG_MODE": {
		"category": "hex editor",
		"info": [
			"When on, this reduces the number of rows in the hex editor, which makes room for dialog boxes. (The portrait image can still cover up hex cells, though.)",
			"NOTE: This action has been disabled in the MGE to prevent accidental soft locks."
		]
	},
	"SET_HEX_EDITOR_CONTROL": {
		"category": "hex editor",
		"info": [
			"This action enables or disables player access to to the hex editor. This is on by default."
		]
	},
	"SET_HEX_EDITOR_CONTROL_CLIPBOARD": {
		"category": "hex editor",
		"info": [
			"This action enables or disables the clipboard and copy functionality within the hex editor. This is on by default. (? verify)"
		]
	},
	"CHECK_VARIABLE": {
		"category": "check variables",
		"info": [
			"Compares the value of a variable against the given value.",
			"`==` is assumed if no operator is given."
		]
	},
	"CHECK_VARIABLES": {
		"category": "check variables",
		"info": [
			"Compares the value of a variable against another.",
			"`==` is assumed if no operator is given."
		]
	},
	"CHECK_SAVE_FLAG": {
		"category": "check variables",
		"info": [
			"Checks one of the MGE save flags (booleans)."
		]
	},
	"CHECK_FOR_BUTTON_PRESS": {
		"category": "check variables",
		"info": [
			"Checks whether a button was actively pressed down that game tick.",
			"That is, the game keeps track of button state changes each game tick, and this action detects whether the target button had a change of state from *not pressed* to *pressed* that game tick. If the target button was *already pressed* when this action runs, this action will not result in a script branch.",
			"To instead check the button's state (regardless of whether that state has changed) see [CHECK_FOR_BUTTON_STATE](#check_for_button_state).",
			"NOTE: The button states are reset when a new map is loaded. If listening for a button press in the new map, this action may very will trigger immediately, even if the button was held down through the map load.",
			"See [button IDs](#button-ids) for a list of valid button values."
		]
	},
	"CHECK_FOR_BUTTON_STATE": {
		"category": "check variables",
		"info": [
			"Checks the specific status (pressed or not pressed) of a specific button at that moment.",
			"If checking for whether a button is newly pressed, see [CHECK_FOR_BUTTON_PRESS](#check_for_button_press).",

		]
	},
	"CHECK_WARP_STATE": {
		"category": "check variables",
		"info": [
			"Checks whether the warp state string is a specific value.",
		]
	},
	"SET_SAVE_FLAG": {
		"category": "set variables",
		"info": [
			"Set a save flag to `true` or `false`.",
		]
	},
	"SET_WARP_STATE": {
		"category": "set variables",
		"info": [
			"Set the warp state string to a specific value.",
		]
	},
	"MUTATE_VARIABLE": {
		"category": "set variables",
		"info": [
			"Manipulate the value of a specific variable or set it to a new value.",
			"See [operations](#operations)."
		]
	},
	"MUTATE_VARIABLES": {
		"category": "set variables",
		"info": [
			"Manipulate the value of a specific variable by using the value of another variable.",
			"See [operations](#operations)."
		]
	},
	"COPY_VARIABLE": {
		"category": "set variables",
		"info": [
			"Copies the value of an entity property into a variable or vice versa.",
		]
	},
	"CHECK_ENTITY_NAME": {
		"category": "check entity properies",
		"info": [
			"Checks an entity's current `name`.",
		]
	},
	"CHECK_ENTITY_X": {
		"category": "check entity properies",
		"info": [
			"Checks an entity's `x` coordinate.",
		]
	},
	"CHECK_ENTITY_Y": {
		"category": "check entity properies",
		"info": [
			"Checks an entity's `y` coordinate.",
		]
	},
	"CHECK_ENTITY_INTERACT_SCRIPT": {
		"category": "check entity properies",
		"info": [
			"Checks an entity's `on_interact` script (by the script's name).",
		]
	},
	"CHECK_ENTITY_TICK_SCRIPT": {
		"category": "check entity properies",
		"info": [
			"Checks an entity's `on_tick` script (by the script's name).",
		]
	},
	"CHECK_ENTITY_TYPE": {
		"category": "check entity properies",
		"info": [
			"Checks whether an entity is currently the given `entity_type`.",
			"This action is useful because you can check entity types by name, which is easy and convenient (e.g. check if the entity \"Delmar\" is the type \"old_man\"). Otherwise you'd have to use a mix of [CHECK_ENTITY_PRIMARY_ID](#check_entity_primary_id) and [CHECK_ENTITY_PRIMARY_ID_TYPE](#check_entity_primary_it_type) and also know in advance which ints you're checking for."
		]
	},
	"CHECK_ENTITY_PRIMARY_ID": {
		"category": "check entity properies",
		"info": [
			"Checks whether an entity has the given `primary_id`.",
			"[CHECK_ENTITY_TYPE](#check_entity_type) is recommended instead."
		]
	},
	"CHECK_ENTITY_SECONDARY_ID": {
		"category": "check entity properies",
		"info": [
			"Checks whether an entity has the given `secondary_id`.",
			"This entity property is only useful on \"tile\" entities, where the `secondary_id` determines which tile in the tileset is displayed.",
			"Tiles are referenced by their index, starting at the top and going toward the right (0-indexed). Click on the tile within Tiled to see its ID."
		]
	},
	"CHECK_ENTITY_PRIMARY_ID_TYPE": {
		"category": "check entity properies",
		"info": [
			"Checks an entity's `primary_id_type`: either (0) tile, (1) animation, or (2) character (sometimes called `entity_type`)"
		]
	},
	"CHECK_ENTITY_CURRENT_ANIMATION": {
		"category": "check entity properies",
		"info": [
			"Checks the id of the entity's current `animation`. (See [entity animations](#entity-animations) for what ids correspond to which animations.)"
		]
	},
	"CHECK_ENTITY_CURRENT_FRAME": {
		"category": "check entity properies",
		"info": [
			"Checks the frame (number) of the entity's current animation."
		]
	},
	"CHECK_ENTITY_DIRECTION": {
		"category": "check entity properies",
		"info": [
			"Checks whether an entity is facing one of the four cardinal directions: `north`, `south`, `east`, or `west`."
		]
	},
	"CHECK_ENTITY_GLITCHED": {
		"category": "check entity properies",
		"info": [
			"Checks whether an entity currently has it's \"glitched\" render flag set."
		]
	},
	"CHECK_ENTITY_HACKABLE_STATE_A": {
		"category": "check entity properies",
		"info": [
			"Checks the value of an entity's `hackable_state_a` byte. Max value: 255"
		]
	},
	"CHECK_ENTITY_HACKABLE_STATE_B": {
		"category": "check entity properies",
		"info": [
			"Checks the value of an entity's `hackable_state_b` byte. Max value: 255"
		]
	},
	"CHECK_ENTITY_HACKABLE_STATE_C": {
		"category": "check entity properies",
		"info": [
			"Checks the value of an entity's `hackable_state_c` byte. Max value: 255"
		]
	},
	"CHECK_ENTITY_HACKABLE_STATE_D": {
		"category": "check entity properies",
		"info": [
			"Checks the value of an entity's `hackable_state_d` byte. Max value: 255"
		]
	},
	"CHECK_ENTITY_HACKABLE_STATE_A_U2": {
		"category": "check entity properies",
		"info": [
			"Checks the values of an entity's `hackable_state_a` and `hackable_state_b` bytes, interpreted together as if a U2. Max value: 65535"
		]
	},
	"CHECK_ENTITY_HACKABLE_STATE_C_U2": {
		"category": "check entity properies",
		"info": [
			"Checks the values of an entity's `hackable_state_c` and `hackable_state_d` bytes, interpreted together as if a U2. Max value: 65535"
		]
	},
	"CHECK_ENTITY_HACKABLE_STATE_A_U4": {
		"category": "check entity properies",
		"info": [
			"Checks the values of an entity's `hackable_state_a` through `hackable_state_d` bytes, interpreted together as if a U4. Max value: …big",
			"NOTE: This is the only \"check\" action that can only check for equality, not inequality. (There aren't enough bytes to spare for the `expected_bool`!)"
		]
	},
	"CHECK_ENTITY_PATH": {
		"category": "check entity properies",
		"info": [
			"Checks the `path` name (geometry) of an entity."
		]
	},
	"CHECK_IF_ENTITY_IS_IN_GEOMETRY": {
		"category": "check entity properies",
		"info": [
			"Checks whether an entity is inside the named geometry.",
			"This action can behave erratically if any of the vertices in the geometry object are subject to coordinate underflow."
		]
	},
	"SET_ENTITY_NAME": {
		"category": "set entity properies",
		"info": [
			"Sets an entity's `name`."
		]
	},
	"SET_ENTITY_X": {
		"category": "set entity properies",
		"info": [
			"Sets an entity's `x` coordinate.",
			"In practice, you will likely want to use geometry vectors and teleport actions instead."
		]
	},
	"SET_ENTITY_Y": {
		"category": "set entity properies",
		"info": [
			"Sets an entity's `y` coordinate.",
			"In practice, you will likely want to use geometry vectors and teleport actions instead."
		]
	},
	"SET_ENTITY_TYPE": {
		"category": "set entity properies",
		"info": [
			"Sets an entity's `entity_type`."
		]
	},
	"SET_ENTITY_PRIMARY_ID": {
		"category": "set entity properies",
		"info": [
			"Sets an entity's `primary_id`.",
			"You will overwhelmingly want to set the `entity_type` by name instead with [SET_ENTITY_TYPE](#set_entity_type)."
		]
	},
	"SET_ENTITY_SECONDARY_ID": {
		"category": "set entity properies",
		"info": [
			"Sets an entity's `secondary_id`.",
			"This action will not be useful unless the entity is a tile entity (`primary_id_type`: 1)."
		]
	},
	"SET_ENTITY_PRIMARY_ID_TYPE": {
		"category": "set entity properies",
		"info": [
			"Sets an entity's `primary_id_type`: either (0) tile, (1) animation, or (2) character (sometimes called `entity_type`)"
		]
	},
	"SET_ENTITY_HACKABLE_STATE_A": {
		"category": "set entity properies",
		"info": [
			"Sets the value of an entity's `hackable_state_a` byte. Max value: 255"
		]
	},
	"SET_ENTITY_HACKABLE_STATE_B": {
		"category": "set entity properies",
		"info": [
			"Sets the value of an entity's `hackable_state_b` byte. Max value: 255"
		]
	},
	"SET_ENTITY_HACKABLE_STATE_C": {
		"category": "set entity properies",
		"info": [
			"Sets the value of an entity's `hackable_state_c` byte. Max value: 255"
		]
	},
	"SET_ENTITY_HACKABLE_STATE_D": {
		"category": "set entity properies",
		"info": [
			"Sets the value of an entity's `hackable_state_d` byte. Max value: 255"
		]
	},
	"SET_ENTITY_HACKABLE_STATE_A_U2": {
		"category": "set entity properies",
		"info": [
			"Sets the values of an entity's `hackable_state_a` and `hackable_state_b` bytes, interpreted together as if a U2. Max value: 65535"
		]
	},
	"SET_ENTITY_HACKABLE_STATE_C_U2": {
		"category": "set entity properies",
		"info": [
			"Sets the values of an entity's `hackable_state_c` and `hackable_state_d` bytes, interpreted together as if a U2. Max value: 65535"
		]
	},
	"SET_ENTITY_HACKABLE_STATE_A_U4": {
		"category": "set entity properies",
		"info": [
			"Sets the values of an entity's `hackable_state_a` through `hackable_state_d` bytes, interpreted together as if a U4. Max value: …big"
		]
	},
	"SET_ENTITY_PATH": {
		"category": "entity choreography",
		"info": [
			"This assigns a vector object to an entity. Afterward, the entity can use `%ENTITY_PATH%` to refer to that path. (This assignment can also be done within Tiled.)"
		]
	},
	"TELEPORT_ENTITY_TO_GEOMETRY": {
		"category": "entity choreography",
		"info": [
			"Moves the entity instantly to the first vertex of the specified geometry object (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`)."
		]
	},
	"WALK_ENTITY_TO_GEOMETRY": {
		"category": "entity choreography",
		"info": [
			"Moves the entity in a straight line from its current position to the first vertex of the geometry object named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time."
		]
	},
	"WALK_ENTITY_ALONG_GEOMETRY": {
		"category": "entity choreography",
		"info": [
			"Moves the entity along the geometry object named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.",
			"NOTE: Unless you want the entity to teleport to the geometry's origin point, you should probably use [WALK_ENTITY_TO_GEOMETRY](#walk_entity_to_geometry) first."
		]
	},
	"LOOP_ENTITY_ALONG_GEOMETRY": {
		"category": "entity choreography",
		"info": [
			"Moves the entity along the geometry object named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.",
			"This action will loop forever, and cannot terminate on its own; no other action given below this one inside a script will execute after this action begins.",
			"NOTE: Unless you want the entity to teleport to the geometry's origin point, you should probably use [WALK_ENTITY_TO_GEOMETRY](#walk_entity_to_geometry) first."
		]
	},
	"PLAY_ENTITY_ANIMATION": {
		"category": "entity appearance",
		"info": [
			"The entity will play the given animation the given number of times, and then will return to its default animation.",
			"A script that runs this action will not execute any further actions until the play count has been satisfied.",
			"If an entity is compelled to move around on the map, it will abort this animation playback.",
			"See [entity animations](#entity-animations) for what ids correspond to which animations"
		]
	},
	"SET_ENTITY_CURRENT_ANIMATION": {
		"category": "entity appearance",
		"info": [
			"The entity will switch to the given animation, which will loop indefinitely.",
			"If an entity is compelled to move around on the map, it will abort this animation playback. When the entity stops moving again, it will revert to its default animation and not the one given by this action.",
			"See [entity animations](#entity-animations) for what ids correspond to which animations"
		]
	},
	"SET_ENTITY_CURRENT_FRAME": {
		"category": "entity appearance",
		"info": [
			"Set the frame of the current animation.",
			"This is useful for staggering the animations of entities that have identical animation timings."
		]
	},
	"SET_ENTITY_DIRECTION": {
		"category": "entity appearance",
		"info": [
			"Turns an entity toward the `north`, `south`, `east`, or `west`."
		]
	},
	"SET_ENTITY_DIRECTION_RELATIVE": {
		"category": "entity appearance",
		"info": [
			"Turns the entity in 90° increments. Positive numbers are clockwise turns, and negative numbers are counterclockwise turns. (E.g. turn them '2' to flip them around 180°)",
			"This action can be chained with another similar one for complex behaviors. For example, to turn an entity away from the player, you can first set the entity's direction [toward the player](#set_entity_direction_target_entity), then immediately rotate it 2 turns with this action."
		]
	},
	"SET_ENTITY_DIRECTION_TARGET_ENTITY": {
		"category": "entity appearance",
		"info": [
			"Make an entity turn toward another."
		]
	},
	"SET_ENTITY_DIRECTION_TARGET_GEOMETRY": {
		"category": "entity appearance",
		"info": [
			"Make an entity turn toward a vector geometry on the map."
		]
	},
	"SET_ENTITY_GLITCHED": {
		"category": "entity appearance",
		"info": [
			"Set the glitched render flag on an entity."
		]
	},
	"SET_CAMERA_TO_FOLLOW_ENTITY": {
		"category": "camera control",
		"info": [
			"Sets what the camera is following. (`%PLAYER%` is the default.)"
		]
	},
	"TELEPORT_CAMERA_TO_GEOMETRY": {
		"category": "camera control",
		"info": [
			"Moves the camera to the first vertex of the specified geometry object."
		]
	},
	"PAN_CAMERA_TO_ENTITY": {
		"category": "camera control",
		"info": [
			"Pans the camera to an entity.",
			"NOTE: if the entity is moving while the camera is coming closer, the camera will speed up or slow down to reach the entity at the correct time."
		]
	},
	"PAN_CAMERA_TO_GEOMETRY": {
		"category": "camera control",
		"info": [
			"Pans the camera to the first vertex of a geometry object."
		]
	},
	"PAN_CAMERA_ALONG_GEOMETRY": {
		"category": "camera control",
		"info": [
			"(might not work yet — instead, make a null entity and lock the camera to it)"
		]
	},
	"LOOP_CAMERA_ALONG_GEOMETRY": {
		"category": "camera control",
		"info": [
			"(might not work yet — instead, make a null entity and lock the camera to it)"
		]
	},
	"SET_SCREEN_SHAKE": {
		"category": "camera control",
		"info": [
			"Shakes the camera a certain distance (`amplitude`) at a certain speed (`frequency`) and for a certain length of time (`duration`)."
		]
	},
	"SCREEN_FADE_OUT": {
		"category": "camera control",
		"info": [
			"Fades the screen out to the given color.",
			"Fades are slow on the hardware, so use these sparingly."
		]
	},
	"SCREEN_FADE_IN": {
		"category": "camera control",
		"info": [
			"Fades the screen in from the given color.",
			"Fades are slow on the hardware, so use these sparingly."
		]
	},
	"RUN_SCRIPT": {
		"category": "script control",
		"info": [
			"Abandons the current script and jumps to the named script. In other words, actions provided after a `RUN_SCRIPT` action will not execute. (The MGS Natlang keyword `goto` was chosen to emphasize this.)",
			"The new script runs in the same script slot that called this action."
		]
	},
	"COPY_SCRIPT": {
		"category": "script control",
		"info": [
			"The MGE encoder literally copies all the actions from the copied `script` and inserts them where `COPY_SCRIPT` is being used. This happens recursively."
		]
	},
	"SET_MAP_TICK_SCRIPT": {
		"category": "script control",
		"info": [
			"Sets the map's `on_tick` script."
		]
	},
	"SET_ENTITY_INTERACT_SCRIPT": {
		"category": "script control",
		"info": [
			"Sets an entity's `on_interact` script.",
			"If you use this action to change the script slot that is currently running the action, any actions given afterward may not execute depending on what they are.",
			"Because entity properties are reset when a map is loaded, and because entities retain the last script that was run in their `on_interact` slot, you should restore an entity's original interact script at the end of their interact script tree."
		]
	},
	"SET_ENTITY_TICK_SCRIPT": {
		"category": "script control",
		"info": [
			"Sets an entity's `on_tick` script."
		]
	}
};

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
	"$relative_direction:number": -1,
	"$slot:number": 2,
	"$value:number": 1,
	"$duration:duration": "1000ms",
	"$operation:operator": "+",
	"$comparison:operator": "<",
	"$animation:number": 3,
	"$button_id:bareword": "SQUARE",
	"$color:color": "#000",
	"$expected_byte:number": "2",
	"$expected_u2:number": "32",
	"$expected_u4:number": "9001",
	"$u2_value:number": "2",
	"$byte_value:number": "0",
};

var makeExampleFromDictionaryEntry = function (entry) {
	var pattern = entry.pattern;
	var wordSplits = pattern.split(' ');
	var result = wordSplits.map(function (word) {
		var insert = word;
		if (
			entry.exampleValues
			&& entry.exampleValues[word]
		) {
			insert = entry.exampleValues[word];
		} else if (docExampleValues[word]) {
			insert = docExampleValues[word];
		} else if (
			word.includes('$bool_value')
			|| word.includes('$expected_bool')
		) {
			var boolPrefs = mgs.boolPrefs[entry.action];
			insert = boolPrefs ? boolPrefs[0] : 'true';
		}
		if (word[0] === "?") {
			insert = word === "?script" ? "" : word.substring(1);
		}
		return insert;
	})
	return result.join(' ')
		.replace(/  /g,' ');
};

var makePrintableDictionaryEntry = function (entry) {
	var pattern = entry.pattern;
	var wordSplits = pattern.split(' ');
	var result = wordSplits.map(function (word) {
		return word[0] === "?"
			? "(" + word.substring(1) + ")"
			: word;
	})
	string = result.join(' ');
	if (entry.values) {
		string += '\n\t// Built-in values:';
		Object.keys(entry.values).forEach(function (valueName) {
			string += `\n\t// ${valueName} (${entry.values[valueName]})`;
		})
	}
	return string.replace(" then goto",`\n	then goto`);
};

var mid = Object.keys(actionCategoryText).map(function (actionCategoryName) {
	var result = `###`;
	// capitalizing title
	var titleWords = actionCategoryName.split('');
	titleWords[0] = titleWords[0].toLocaleUpperCase();
	var capitalizedTitle = titleWords.join('');
	result += ` ${capitalizedTitle} actions\n\n`
	// adding getting category info
	result += actionCategoryText[actionCategoryName].join('\n\n');
	result += '\n\n';
	// finding actions
	var filteredActionNames = Object.keys(actionText).filter(function (actionName) {
		return actionText[actionName].category === actionCategoryName;
	});
	// for all actions in that category:
	var stringedActions = filteredActionNames.map(function (actionName) {
		// action heading
		var output = `#### ${actionName}\n\n`
		actionText[actionName].info.forEach(function (paragraph) {
			output += paragraph + '\n\n';
		})
		// get dictionary entries
		var dictionaryEntries = mgs.actionDictionary.filter(function (entry) {
			return entry.action === actionName;
		})
		var printPatterns = dictionaryEntries.map(function (entry) {
			return "```\n" + makePrintableDictionaryEntry(entry) + '\n```';
		})
		output += printPatterns.join(`\n\n`);
		// examples (technically optional)
		if (!actionText[actionName].omitExample) {
			output += '\n\n';
			if (dictionaryEntries.length > 1) {
				output += "Examples:\n\n"
				var examples = dictionaryEntries.map(function (entry) {
					return '- `' + makeExampleFromDictionaryEntry(entry) + '`';
				})
				output += examples.join('\n');
			} else if (dictionaryEntries.length === 1) {
				var example = makeExampleFromDictionaryEntry(dictionaryEntries[0]);
				output += "Example: `" + example + '`';
			} else {
				console.warn("No dictionary entries for " + actionName + "???")
			}
		}
		return output;
	})
	result += stringedActions.join('\n\n');
	return result;
}).join('\n\n');
