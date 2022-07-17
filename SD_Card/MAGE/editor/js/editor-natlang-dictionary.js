var natlangDictionary = [
	{
		action: "BLOCKING_DELAY",
		pattern: "block $duration",
		fields: [ null, "duration" ],
	},
	{
		action: "SET_CAMERA_TO_FOLLOW_ENTITY",
		pattern: "camera follow entity $string",
		fields: [ null, null, null, "entity" ],
	},
	{
		action: "SET_HEX_EDITOR_STATE",
		pattern: "$bool hex editor",
		fields: [ "bool_value", null, null ],
	},
	{
		action: "SLOT_ERASE",
		pattern: "erase slot $int",
		fields: [ null, null, "slot" ],
	},
	{
		action: "RUN_SCRIPT",
		pattern: "goto $string",
		fields: [ null, "script" ],
	},
	{
		action: "LOOP_ENTITY_ALONG_GEOMETRY",
		pattern: "loop entity $string along geometry $string over $duration",
		fields: [ null, null, "entity", null, null, "geometry", null, "duration" ],
	},
	{
		action: "SET_ENTITY_DIRECTION_RELATIVE",
		pattern: "rotate entity $string $int",
		fields: [ null, null, "entity", "relative_direction" ],
	},
	{
		action: "SLOT_SAVE",
		pattern: "save slot",
		fields: [ null, null ],
	},
	{
		action: "SET_SCREEN_SHAKE",
		pattern: "shake camera $duration $pixels for $duration",
		fields: [ null, null, "frequency", "amplitude", null, "duration" ],
	},
	{
		action: "NON_BLOCKING_DELAY",
		pattern: "wait $duration",
		fields: [ null, "duration" ],
	},
	{
		action: "WALK_ENTITY_TO_GEOMETRY",
		pattern: "walk entity $string to geometry $string over $duration",
		fields: [ null, null, "entity", null, null, "geometry", null, "duration"],
	},
	{
		action: "WALK_ENTITY_ALONG_GEOMETRY",
		pattern: "walk entity $string along geometry $string over $duration",
		fields: [ null, null, "entity", null, null, "geometry", null, "duration"],
	},
	{
		action: "SET_ENTITY_GLITCHED",
		pattern: "make entity $string glitched",
		fields: [ null, null, "entity", "bool_value"],
		values: [ null, null, null, true],
	},
	{
		action: "SET_ENTITY_GLITCHED",
		pattern: "make entity $string unglitched",
		fields: [ null, null, "entity", "bool_value"],
		values: [ null, null, null, false],
	},
	{
		action: "TELEPORT_ENTITY_TO_GEOMETRY",
		pattern: "teleport entity $string to geometry $string",
		fields: [ null, null, "entity", null, null, "geometry"],
	},
	{
		action: "TELEPORT_CAMERA_TO_GEOMETRY",
		pattern: "teleport camera to geometry $string",
		fields: [ null, null, null, null, "geometry"],
	},
	{
		action: "SET_ENTITY_DIRECTION",
		pattern: "turn entity $string $direction",
		fields: [ null, null, "entity", "direction" ],
	},
	{
		action: "SET_ENTITY_DIRECTION_TARGET_ENTITY",
		pattern: "turn entity $string toward entity $string",
		fields: [ null, null, "entity", null, null, "target_entity" ],
	},
	{
		action: "SET_ENTITY_DIRECTION_TARGET_GEOMETRY",
		pattern: "turn entity $string toward geometry $string",
		fields: [ null, null, "entity", null, null, "target_geometry" ],
	},
	{
		action: "PAN_CAMERA_TO_ENTITY",
		pattern: "pan camera to entity $string over $duration",
		fields: [ null, null, null, null, "entity", null, "duration" ],
	},
	{
		action: "PAN_CAMERA_TO_GEOMETRY",
		pattern: "pan camera to geometry $string over $duration",
		fields: [ null, null, null, null, "geometry", null, "duration" ],
	},
	{
		action: "PLAY_ENTITY_ANIMATION",
		pattern: "play entity $string animation $int $qty",
		fields: [ null, null, "entity", null, "animation", "play_count" ],
	},
	{
		action: "SCREEN_FADE_OUT",
		pattern: "fade out camera to $color over $duration",
		fields: [ null, null, null, null, "color", null, "duration"],
	},
	{
		action: "SCREEN_FADE_IN",
		pattern: "fade in camera from $color over $duration",
		fields: [ null, null, null, null, "color", null, "duration"],
	},
	{
		action: "LOAD_MAP",
		pattern: "load map $string",
		fields: [ null, null, "map"],
	},
	{
		action: "SLOT_LOAD",
		pattern: "load slot $int",
		fields: [ null, null, "slot"],
	},
	{
		action: "SHOW_DIALOG",
		pattern: "show dialog $string",
		fields: [ null, null, "dialog"],
	},
	{
		action: "SHOW_SERIAL_DIALOG",
		pattern: "show serial dialog $string",
		fields: [ null, null, null, "serial_dialog"],
	},
	{
		action: "COPY_SCRIPT",
		pattern: "copy $string",
		fields: [ null, "script"],
	},
	{
		action: "COPY_VARIABLE",
		pattern: "copy entity $string $field into variable $string",
		fields: [ null, null, "entity", "field", "inbound", null, "variable"],
		values: [ null, null, null, null, true, null, null],
	},
	{
		action: "COPY_VARIABLE",
		pattern: "copy entity $string $field from variable $string",
		fields: [ null, null, "entity", "field", "inbound", null, "variable"],
		values: [ null, null, null, null, false, null, null],
	},
	{
		action: "MUTATE_VARIABLE",
		pattern: "mutate $string $op $int",
		fields: [ null, "variable", "operation", "value" ]
	},
	{
		action: "MUTATE_VARIABLES",
		pattern: "mutate $string $op $string",
		fields: [ null, "variable", "operation", "source" ]
	},
	{
		action: "SET_MAP_TICK_SCRIPT",
		pattern: "set map tick script to $string",
		fields: [ null, null, null, null, null, "script" ]
	},
	{
		action: "SET_WARP_STATE",
		pattern: "set warp state to $string",
		fields: [ null, null, null, null, "string" ]
	},
	{
		action: "SET_SAVE_FLAG",
		pattern: "set flag $string to $bool",
		fields: [ null, null, "save_flag", null, "bool_value" ]
	},
	{
		action: "SET_PLAYER_CONTROL",
		pattern: "set player control $bool",
		fields: [ null, null, null, "bool_value" ]
	},
	{
		action: "SET_HEX_EDITOR_DIALOG_MODE",
		pattern: "set hex dialog mode $bool",
		fields: [ null, null, null, null, "bool_value" ]
	},
	{
		action: "SET_HEX_EDITOR_CONTROL",
		pattern: "set hex control $bool",
		fields: [ null, null, null, "bool_value" ]
	},
	{
		action: "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
		pattern: "set hex clipboard $bool",
		fields: [ null, null, null, "bool_value" ]
	},
	// {
	// 	action: "SET_ENTITY_NAME",
	// 	pattern: "set entity $string name to $string",
	// 	fields: [ null, null, "entity", null, null, "string" ]
	// } // ONES LIKE THIS ARE PROCEDURALLY ADDED
	{
		action: "CHECK_SAVE_FLAG",
		pattern: "if flag $string is $bool goto $string",
		fields: [ null, null, "save_flag", null, "expected_bool", null, "success_script" ]
	},
	{
		action: "CHECK_FOR_BUTTON_PRESS",
		pattern: "if button $button goto $string",
		fields: [ null, null, "button_id", null, "success_script" ]
	},
	{
		action: "CHECK_FOR_BUTTON_STATE",
		pattern: "if button $button is pressed goto $string",
		fields: [ null, null, "button_id", "expected_bool", null, null, "success_script" ],
		values: [ null, null, null, true, null, null, null ]
	},
	{
		action: "CHECK_FOR_BUTTON_STATE",
		pattern: "if button $button is not pressed goto $string",
		fields: [ null, null, "button_id", null, "expected_bool", null, null, "success_script" ],
		values: [ null, null, null, null, false, null, null, null ]
	},
	{
		action: "CHECK_WARP_STATE",
		pattern: "if warp state is $string goto $string",
		fields: [ null, null, null, "expected_bool", "string", null, "success_script" ],
		values: [ null, null, null, true, null, null, null ]
	},
	{
		action: "CHECK_WARP_STATE",
		pattern: "if warp state is not $string goto $string",
		fields: [ null, null, null, null, "expected_bool", "string", null, "success_script" ],
		values: [ null, null, null, null, false, null, null, null ]
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $string is $int goto $string",
		fields: [ "expected_bool", null, "variable", "comparison", "value", null, "success_script" ],
		values: [ true, null, null, '==', null, null, null ]
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $string is $comparison $int goto $string",
		fields: [ null, null, "variable", "expected_bool", "comparison", "value", null, "success_script" ],
		values: [ null, null, null, true, null, null, null, null ]
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $string is not $int goto $string",
		fields: [ null, null, "variable", "comparison", "expected_bool", "value", null, "success_script" ],
		values: [ null, null, null, '==', false, null, null, null ]
	},
	{
		action: "CHECK_VARIABLE",
		pattern: "if variable $string is not $comparison $int goto $string",
		fields: [ null, null, "variable", null, "expected_bool", "comparison", "value", null, "success_script" ],
		values: [ null, null, null, null, false, null, null, null, null ]
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $string is $string goto $string",
		fields: [ "expected_bool", null, "variable", "comparison", "source", null, "success_script" ],
		values: [ true, null, null, '==', null, null, null ]
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $string is $comparison $string goto $string",
		fields: [ null, null, "variable", "expected_bool", "comparison", "source", null, "success_script" ],
		values: [ null, null, null, true, null, null, null, null ]
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $string is not $string goto $string",
		fields: [ null, null, "variable", "comparison", "expected_bool", "source", null, "success_script" ],
		values: [ null, null, null, '==', false, null, null, null ]
	},
	{
		action: "CHECK_VARIABLES",
		pattern: "if variable $string is not $comparison $string goto $string",
		fields: [ null, null, "variable", null, "expected_bool", "comparison", "source", null, "success_script" ],
		values: [ null, null, null, null, false, null, null, null, null ]
	},
	{
		action: "CHECK_ENTITY_HACKABLE_STATE_A_U4",
		pattern: "if entity $string hackableStateAU4 is $int goto $string",
		fields: [ null, null, "entity", null, null, "expected_u4", null, "success_script" ]
	},
	// {
	// 	action: "CHECK_ENTITY_NAME",
	// 	pattern: "if entity $string name is $string goto $string",
	// 	fields: [ null, null, "entity", null, "expected_bool", "string", null, "success_script" ],
	// 	values: [ null, null, null, null, true, null, null, null ]
	// } // PROCEDURALLY DONE
	{
		action: "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
		pattern: "if entity $string is inside geometry $string goto $string",
		fields: [ null, null, "entity", "expected_bool", null, null, "geometry", null, "success_script" ],
		values: [ null, null, null, true, null, null, null, null, null ]
	},
	{
		action: "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
		pattern: "if entity $string is not inside geometry $string goto $string",
		fields: [ null, null, "entity", null, "expected_bool", null, null, "geometry", null, "success_script" ],
		values: [ null, null, null, null, false, null, null, null, null, null ]
	},
	{
		action: "CHECK_ENTITY_GLITCHED",
		pattern: "if entity $string is glitched goto $string",
		fields: [ null, null, "entity", "expected_bool", null, null, "success_script" ],
		values: [ null, null, null, true, null, null, null ]
	},
	{
		action: "CHECK_ENTITY_GLITCHED",
		pattern: "if entity $string is not glitched goto $string",
		fields: [ null, null, "entity", null, "expected_bool", null, null, "success_script" ],
		values: [ null, null, null, null, false, null, null, null ]
	},
];

// PROCEDURAL BITS

var entitySpecificPropertyMap = {
	CHECK_ENTITY_NAME: {
		actionProperty: "string",
		natLangProperty: "name",
		dictionaryRef: "$string",
	},
	CHECK_ENTITY_X: {
		actionProperty: "expected_u2",
		natLangProperty: "x",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_Y: {
		actionProperty: "expected_u2",
		natLangProperty: "y",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_INTERACT_SCRIPT: {
		actionProperty: "expected_script",
		natLangProperty: "interactScript",
		dictionaryRef: "$string",
	},
	CHECK_ENTITY_TICK_SCRIPT: {
		actionProperty: "expected_script",
		natLangProperty: "tickScript",
		dictionaryRef: "$string",
	},
	CHECK_ENTITY_TYPE: {
		actionProperty: "entity_type",
		natLangProperty: "type",
		dictionaryRef: "$string",
	},
	CHECK_ENTITY_PRIMARY_ID: {
		actionProperty: "expected_u2",
		natLangProperty: "primaryID",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_SECONDARY_ID: {
		actionProperty: "expected_u2",
		natLangProperty: "secondaryID",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_PRIMARY_ID_TYPE: {
		actionProperty: "expected_byte",
		natLangProperty: "primaryIDtype",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_CURRENT_ANIMATION: {
		actionProperty: "expected_byte",
		natLangProperty: "animation",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_CURRENT_FRAME: {
		actionProperty: "expected_byte",
		natLangProperty: "animationFrame",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_DIRECTION: {
		actionProperty: "direction",
		natLangProperty: "direction",
		dictionaryRef: "$direction",
	},
	CHECK_ENTITY_HACKABLE_STATE_A: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateA",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_HACKABLE_STATE_B: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateB",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_HACKABLE_STATE_C: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateC",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_HACKABLE_STATE_D: {
		actionProperty: "expected_byte",
		natLangProperty: "hackableStateD",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_HACKABLE_STATE_A_U2: {
		actionProperty: "expected_u2",
		natLangProperty: "hackableStateAU2",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_HACKABLE_STATE_C_U2: {
		actionProperty: "expected_u2",
		natLangProperty: "hackableStateCU2",
		dictionaryRef: "$int",
	},
	CHECK_ENTITY_PATH: {
		actionProperty: "geometry",
		natLangProperty: "path",
		dictionaryRef: "$string",
	},
	SET_ENTITY_NAME: {
		actionProperty: "string",
		natLangProperty: "name",
		dictionaryRef: "$string",
	},
	SET_ENTITY_X: {
		actionProperty: "u2_value",
		natLangProperty: "x",
		dictionaryRef: "$int",
	},
	SET_ENTITY_Y: {
		actionProperty: "u2_value",
		natLangProperty: "y",
		dictionaryRef: "$int",
	},
	SET_ENTITY_INTERACT_SCRIPT: {
		actionProperty: "script",
		natLangProperty: "interactScript",
		dictionaryRef: "$string",
	},
	SET_ENTITY_TICK_SCRIPT: {
		actionProperty: "script",
		natLangProperty: "tickScript",
		dictionaryRef: "$string",
	},
	SET_ENTITY_TYPE: {
		actionProperty: "entity_type",
		natLangProperty: "type",
		dictionaryRef: "$string",
	},
	SET_ENTITY_PRIMARY_ID: {
		actionProperty: "u2_value",
		natLangProperty: "primaryID",
		dictionaryRef: "$int",
	},
	SET_ENTITY_SECONDARY_ID: {
		actionProperty: "u2_value",
		natLangProperty: "secondaryID",
		dictionaryRef: "$int",
	},
	SET_ENTITY_PRIMARY_ID_TYPE: {
		actionProperty: "byte_value",
		natLangProperty: "primaryIDtype",
		dictionaryRef: "$int",
	},
	SET_ENTITY_CURRENT_ANIMATION: {
		actionProperty: "byte_value",
		natLangProperty: "animation",
		dictionaryRef: "$int",
	},
	SET_ENTITY_CURRENT_FRAME: {
		actionProperty: "byte_value",
		natLangProperty: "animationFrame",
		dictionaryRef: "$int",
	},
	SET_ENTITY_DIRECTION: {
		actionProperty: "direction",
		natLangProperty: "direction",
		dictionaryRef: "$direction",
	},
	SET_ENTITY_HACKABLE_STATE_A: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateA",
		dictionaryRef: "$int",
	},
	SET_ENTITY_HACKABLE_STATE_B: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateB",
		dictionaryRef: "$int",
	},
	SET_ENTITY_HACKABLE_STATE_C: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateC",
		dictionaryRef: "$int",
	},
	SET_ENTITY_HACKABLE_STATE_D: {
		actionProperty: "byte_value",
		natLangProperty: "hackableStateD",
		dictionaryRef: "$int",
	},
	SET_ENTITY_HACKABLE_STATE_A_U2: {
		actionProperty: "u2_value",
		natLangProperty: "hackableStateAU2",
		dictionaryRef: "$int",
	},
	SET_ENTITY_HACKABLE_STATE_C_U2: {
		actionProperty: "u2_value",
		natLangProperty: "hackableStateCU2",
		dictionaryRef: "$int",
	},
	SET_ENTITY_HACKABLE_STATE_A_U4: {
		actionProperty: "u4_value",
		natLangProperty: "hackableStateAU4",
		dictionaryRef: "$int",
	},
	SET_ENTITY_PATH: {
		actionProperty: "geometry",
		natLangProperty: "path",
		dictionaryRef: "$string",
	},
};

// SUPPLEMENTING DICTIONARY

Object.keys(entitySpecificPropertyMap) // See line 449 in the other place
	.filter(function (actionName) {
		return actionName.includes('SET_');
	})
	.forEach(function (actionName) {
		var mapStuffs = entitySpecificPropertyMap[actionName];
		var pattern =
			`set entity $string `
			+ `${mapStuffs.natLangProperty} to `
			+ `${mapStuffs.dictionaryRef}`
		var insert = {
			action: actionName,
			pattern: pattern,
			fields: [
				null,
				null,
				"entity",
				null,
				null,
				mapStuffs.actionProperty
			],
		}
		natlangDictionary.push(insert);
	})

Object.keys(entitySpecificPropertyMap) // See line 449 in the other place
	.filter(function (actionName) {
		return actionName.includes('CHECK_');
	})
	.forEach(function (actionName) {
		var mapStuffs = entitySpecificPropertyMap[actionName];
		var pattern =
			`if entity $string `
			+ `${mapStuffs.natLangProperty} is `
			+ `${mapStuffs.dictionaryRef} `
			+ `goto $string`
		var insert = {
			action: actionName,
			pattern: pattern,
			fields: [
				null,
				null,
				"entity",
				null,
				"expected_bool",
				mapStuffs.actionProperty,
				null,
				"success_script"
			],
			values: [
				null,
				null,
				null,
				null,
				true,
				null,
				null,
				null
			],
		}
		var patternNeg =
			`if entity $string `
			+ `${mapStuffs.natLangProperty} is not `
			+ `${mapStuffs.dictionaryRef} `
			+ `goto $string`
		var insertNeg = {
			action: actionName,
			pattern: patternNeg,
			fields: [
				null,
				null,
				"entity",
				null,
				null,
				"expected_bool",
				mapStuffs.actionProperty,
				null,
				"success_script"
			],
			values: [
				null,
				null,
				null,
				null,
				null,
				false,
				null,
				null,
				null
			],
		}
		natlangDictionary.push(insert);
		natlangDictionary.push(insertNeg);
	})
