var actionFieldsMap = {
	NULL_ACTION: null,
	CHECK_ENTITY_NAME: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'string', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_X: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_Y: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_INTERACT_SCRIPT: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'expected_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_TICK_SCRIPT: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'expected_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_LOOK_SCRIPT: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'expected_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_TYPE: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'entity_type', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_PRIMARY_ID: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_SECONDARY_ID: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_PRIMARY_ID_TYPE: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_byte', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_CURRENT_ANIMATION: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_byte', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_CURRENT_FRAME: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_byte', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_DIRECTION: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'direction', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_GLITCHED: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_PATH: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'geometry', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_SAVE_FLAG: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'save_flag', size: 2},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_IF_ENTITY_IS_IN_GEOMETRY: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'geometry', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_FOR_BUTTON_PRESS: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'button_id', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_FOR_BUTTON_STATE: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'button_id', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_WARP_STATE: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'string', size: 2},
		{propertyName: 'expected_bool', size: 1},
	],
	RUN_SCRIPT: [
		{propertyName: 'script', size: 2},
	],
	BLOCKING_DELAY: [
		{propertyName: 'duration', size: 4},
	],
	NON_BLOCKING_DELAY: [
		{propertyName: 'duration', size: 4},
	],
	SET_ENTITY_NAME: [
		{propertyName: 'string', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_X: [
		{propertyName: 'u2_value', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_Y: [
		{propertyName: 'u2_value', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_INTERACT_SCRIPT: [
		{propertyName: 'script', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_TICK_SCRIPT: [
		{propertyName: 'script', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_TYPE: [
		{propertyName: 'entity_type', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_PRIMARY_ID: [
		{propertyName: 'u2_value', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_SECONDARY_ID: [
		{propertyName: 'u2_value', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_PRIMARY_ID_TYPE: [
		{propertyName: 'byte_value', size: 1},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_CURRENT_ANIMATION: [
		{propertyName: 'byte_value', size: 1},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_CURRENT_FRAME: [
		{propertyName: 'byte_value', size: 1},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_DIRECTION: [
		{propertyName: 'direction', size: 1},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_DIRECTION_RELATIVE: [
		{propertyName: 'relative_direction', size: 1},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_DIRECTION_TARGET_ENTITY: [
		{propertyName: 'target_entity', size: 1},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_DIRECTION_TARGET_GEOMETRY: [
		{propertyName: 'target_geometry', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_GLITCHED: [
		{propertyName: 'entity', size: 1},
		{propertyName: 'bool_value', size: 1},
	],
	SET_ENTITY_PATH: [
		{propertyName: 'geometry', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_SAVE_FLAG: [
		{propertyName: 'save_flag', size: 2},
		{propertyName: 'bool_value', size: 1},
	],
	SET_PLAYER_CONTROL: [
		{propertyName: 'bool_value', size: 1},
	],
	SET_MAP_TICK_SCRIPT: [
		{propertyName: 'script', size: 2},
	],
	SET_HEX_CURSOR_LOCATION: [
		{propertyName: 'address', size: 2},
	],
	SET_WARP_STATE: [
		{propertyName: 'string', size: 2}
	],
	SET_HEX_EDITOR_STATE: [
		{propertyName: 'bool_value', size: 1},
	],
	SET_HEX_EDITOR_DIALOG_MODE: [
		{propertyName: 'bool_value', size: 1},
	],
	SET_HEX_EDITOR_CONTROL: [
		{propertyName: 'bool_value', size: 1},
	],
	SET_HEX_EDITOR_CONTROL_CLIPBOARD: [
		{propertyName: 'bool_value', size: 1},
	],
	LOAD_MAP: [
		{propertyName: 'map', size: 2},
	],
	SHOW_DIALOG: [
		{propertyName: 'dialog', size: 2},
	],
	PLAY_ENTITY_ANIMATION: [
		{propertyName: 'entity', size: 1},
		{propertyName: 'animation', size: 1},
		{propertyName: 'play_count', size: 1},
	],
	TELEPORT_ENTITY_TO_GEOMETRY: [
		{propertyName: 'geometry', size: 2},
		{propertyName: 'entity', size: 1},
	],
	WALK_ENTITY_TO_GEOMETRY: [
		{propertyName: 'duration', size: 4},
		{propertyName: 'geometry', size: 2},
		{propertyName: 'entity', size: 1},
	],
	WALK_ENTITY_ALONG_GEOMETRY: [
		{propertyName: 'duration', size: 4},
		{propertyName: 'geometry', size: 2},
		{propertyName: 'entity', size: 1},
	],
	LOOP_ENTITY_ALONG_GEOMETRY: [
		{propertyName: 'duration', size: 4},
		{propertyName: 'geometry', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_CAMERA_TO_FOLLOW_ENTITY: [
		{propertyName: 'entity', size: 1},
	],
	TELEPORT_CAMERA_TO_GEOMETRY: [
		{propertyName: 'geometry', size: 2},
	],
	PAN_CAMERA_TO_ENTITY: [
		{propertyName: 'duration', size: 4},
		{propertyName: 'entity', size: 1},
	],
	PAN_CAMERA_TO_GEOMETRY: [
		{propertyName: 'duration', size: 4},
		{propertyName: 'geometry', size: 2},
	],
	PAN_CAMERA_ALONG_GEOMETRY: [
		{propertyName: 'duration', size: 4},
		{propertyName: 'geometry', size: 2},
		{propertyName: 'entity', size: 1},
	],
	LOOP_CAMERA_ALONG_GEOMETRY: [
		{propertyName: 'duration', size: 4},
		{propertyName: 'geometry', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_SCREEN_SHAKE: [
		{propertyName: 'duration', size: 2},
		{propertyName: 'frequency', size: 2},
		{propertyName: 'amplitude', size: 1},
	],
	SCREEN_FADE_OUT: [
		{propertyName: 'duration', size: 4},
		{propertyName: 'color', size: 2, endian: IS_SCREEN_LITTLE_ENDIAN},
	],
	SCREEN_FADE_IN: [
		{propertyName: 'duration', size: 4},
		{propertyName: 'color', size: 2, endian: IS_SCREEN_LITTLE_ENDIAN},
	],
	MUTATE_VARIABLE: [
		{propertyName: 'value', size: 2},
		{propertyName: 'variable', size: 1},
		{propertyName: 'operation', size: 1},
	],
	MUTATE_VARIABLES: [
		{propertyName: 'variable', size: 1},
		{propertyName: 'source', size: 1},
		{propertyName: 'operation', size: 1},
	],
	COPY_VARIABLE: [
		{propertyName: 'variable', size: 1},
		{propertyName: 'entity', size: 1},
		{propertyName: 'field', size: 1},
		{propertyName: 'inbound', size: 1},
	],
	CHECK_VARIABLE: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'value', size: 2},
		{propertyName: 'variable', size: 1},
		{propertyName: 'comparison', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_VARIABLES: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'variable', size: 1},
		{propertyName: 'source', size: 1},
		{propertyName: 'comparison', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	SLOT_SAVE: [],
	SLOT_LOAD: [
		{propertyName: 'slot', size: 1},
	],
	SLOT_ERASE: [
		{propertyName: 'slot', size: 1},
	],
	SET_CONNECT_SERIAL_DIALOG: [
		{propertyName: 'serial_dialog', size: 2},
	],
	SHOW_SERIAL_DIALOG: [
		{propertyName: 'serial_dialog', size: 2},
		{propertyName: 'disable_newline', size: 1},
	],
	SET_MAP_LOOK_SCRIPT: [
		{propertyName: 'script', size: 2},
	],
	SET_ENTITY_LOOK_SCRIPT: [
		{propertyName: 'script', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_TELEPORT_ENABLED: [
		{propertyName: 'bool_value', size: 1},
	],
	CHECK_MAP: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'map', size: 2},
		{propertyName: 'expected_bool', size: 1},
	],
	SET_BLE_FLAG: [
		{propertyName: 'ble_flag', size: 1},
		{propertyName: 'bool_value', size: 1},
	],
	CHECK_BLE_FLAG: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'ble_flag', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	SET_SERIAL_DIALOG_CONTROL: [
		{propertyName: 'bool_value', size: 1},
	],
	REGISTER_SERIAL_DIALOG_COMMAND: [
		{propertyName: 'command', size: 2},
		{propertyName: 'script', size: 2},
		{propertyName: 'is_fail', size: 1},
	],
	REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT: [
		{propertyName: 'command', size: 2},
		{propertyName: 'argument', size: 2},
		{propertyName: 'script', size: 2},
	],
	UNREGISTER_SERIAL_DIALOG_COMMAND: [
		{propertyName: 'command', size: 2},
		{propertyName: 'is_fail', size: 1},
	],
	UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT: [
		{propertyName: 'command', size: 2},
		{propertyName: 'argument', size: 2},
	],
	SET_ENTITY_MOVEMENT_RELATIVE: [
		{propertyName: 'relative_direction', size: 1},
		{propertyName: 'entity', size: 1},
	],
	CHECK_DIALOG_OPEN: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_SERIAL_DIALOG_OPEN: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_DEBUG_MODE: [
		{propertyName: ['success_script', 'jump_index'], size: 2},
		{propertyName: 'expected_bool', size: 1},
	],
	CLOSE_DIALOG: [],
	CLOSE_SERIAL_DIALOG: [],
	SET_LIGHTS_CONTROL: [
		{propertyName: 'enabled', size: 1},
	],
	SET_LIGHTS_STATE: [
		{propertyName: 'lights', size: 4},
		{propertyName: 'enabled', size: 1},
	],
	GOTO_ACTION_INDEX: [
		{propertyName: 'action_index', size: 2},
	],
	SET_SCRIPT_PAUSE: [
		{propertyName: 'entity', size: 1},
		{propertyName: 'script_slot', size: 1},
		{propertyName: 'bool_value', size: 1},
	],
};

var actionNames = [
	'NULL_ACTION',
	'CHECK_ENTITY_NAME',
	'CHECK_ENTITY_X',
	'CHECK_ENTITY_Y',
	'CHECK_ENTITY_INTERACT_SCRIPT',
	'CHECK_ENTITY_TICK_SCRIPT',
	'CHECK_ENTITY_LOOK_SCRIPT',
	'CHECK_ENTITY_TYPE',
	'CHECK_ENTITY_PRIMARY_ID',
	'CHECK_ENTITY_SECONDARY_ID',
	'CHECK_ENTITY_PRIMARY_ID_TYPE',
	'CHECK_ENTITY_CURRENT_ANIMATION',
	'CHECK_ENTITY_CURRENT_FRAME',
	'CHECK_ENTITY_DIRECTION',
	'CHECK_ENTITY_GLITCHED',
	'CHECK_ENTITY_PATH',
	'CHECK_SAVE_FLAG',
	'CHECK_IF_ENTITY_IS_IN_GEOMETRY',
	'CHECK_FOR_BUTTON_PRESS',
	'CHECK_FOR_BUTTON_STATE',
	'CHECK_WARP_STATE',
	'RUN_SCRIPT',
	'BLOCKING_DELAY',
	'NON_BLOCKING_DELAY',
	'SET_ENTITY_NAME',
	'SET_ENTITY_X',
	'SET_ENTITY_Y',
	'SET_ENTITY_INTERACT_SCRIPT',
	'SET_ENTITY_TICK_SCRIPT',
	'SET_ENTITY_TYPE',
	'SET_ENTITY_PRIMARY_ID',
	'SET_ENTITY_SECONDARY_ID',
	'SET_ENTITY_PRIMARY_ID_TYPE',
	'SET_ENTITY_CURRENT_ANIMATION',
	'SET_ENTITY_CURRENT_FRAME',
	'SET_ENTITY_DIRECTION',
	'SET_ENTITY_DIRECTION_RELATIVE',
	'SET_ENTITY_DIRECTION_TARGET_ENTITY',
	'SET_ENTITY_DIRECTION_TARGET_GEOMETRY',
	'SET_ENTITY_GLITCHED',
	'SET_ENTITY_PATH',
	'SET_SAVE_FLAG',
	'SET_PLAYER_CONTROL',
	'SET_MAP_TICK_SCRIPT',
	'SET_HEX_CURSOR_LOCATION',
	'SET_WARP_STATE',
	'SET_HEX_EDITOR_STATE',
	'SET_HEX_EDITOR_DIALOG_MODE',
	'SET_HEX_EDITOR_CONTROL',
	'SET_HEX_EDITOR_CONTROL_CLIPBOARD',
	'LOAD_MAP',
	'SHOW_DIALOG',
	'PLAY_ENTITY_ANIMATION',
	'TELEPORT_ENTITY_TO_GEOMETRY',
	'WALK_ENTITY_TO_GEOMETRY',
	'WALK_ENTITY_ALONG_GEOMETRY',
	'LOOP_ENTITY_ALONG_GEOMETRY',
	'SET_CAMERA_TO_FOLLOW_ENTITY',
	'TELEPORT_CAMERA_TO_GEOMETRY',
	'PAN_CAMERA_TO_ENTITY',
	'PAN_CAMERA_TO_GEOMETRY',
	'PAN_CAMERA_ALONG_GEOMETRY',
	'LOOP_CAMERA_ALONG_GEOMETRY',
	'SET_SCREEN_SHAKE',
	'SCREEN_FADE_OUT',
	'SCREEN_FADE_IN',
	'MUTATE_VARIABLE',
	'MUTATE_VARIABLES',
	'COPY_VARIABLE',
	'CHECK_VARIABLE',
	'CHECK_VARIABLES',
	'SLOT_SAVE',
	'SLOT_LOAD',
	'SLOT_ERASE',
	'SET_CONNECT_SERIAL_DIALOG',
	'SHOW_SERIAL_DIALOG',
	'SET_MAP_LOOK_SCRIPT',
	'SET_ENTITY_LOOK_SCRIPT',
	'SET_TELEPORT_ENABLED',
	'CHECK_MAP',
	'SET_BLE_FLAG',
	'CHECK_BLE_FLAG',
	'SET_SERIAL_DIALOG_CONTROL',
	'REGISTER_SERIAL_DIALOG_COMMAND',
	'REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT',
	'UNREGISTER_SERIAL_DIALOG_COMMAND',
	'UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT',
	'SET_ENTITY_MOVEMENT_RELATIVE',
	'CHECK_DIALOG_OPEN',
	'CHECK_SERIAL_DIALOG_OPEN',
	'CHECK_DEBUG_MODE',
	'CLOSE_DIALOG',
	'CLOSE_SERIAL_DIALOG',
	'SET_LIGHTS_CONTROL',
	'SET_LIGHTS_STATE',
	'GOTO_ACTION_INDEX',
	'SET_SCRIPT_PAUSE',
];

var specialKeywordsEnum = {
	'%MAP%': 255,
	'%SELF%': 254,
	'%PLAYER%': 253,
	'%ENTITY_PATH%': 65535,
}

var getObjectByNameOnMap = function(name, map, action) {
	var specialIndex = specialKeywordsEnum[name];
	var object;
	if (specialIndex) {
		object = { specialIndex: specialIndex };
	} else {
		map.layers.find(function (layer) {
			const isObjectsLayer = layer.type === 'objectgroup';
			if (isObjectsLayer) {
				object = layer.objects.find(function (object) {
					return object.name === name;
				});
			}
			return object !== undefined;
		});
	}
	if (!object) {
		throw new Error(`"${action.action}" No object named "${name}" could be found on map: "${map.name}"!`);
	}
	return object;
};

var getMapLocalEntityIndexFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (!value) {
		throw new Error(`${action.action} requires a string value for "${propertyName}"`);
	}
	var entity = getObjectByNameOnMap(
		value,
		map,
		action,
	);
	var mapLocalEntityIndex = (
		entity.specialIndex
		|| map.entityIndices.indexOf(entity.compositeEntity.scenarioIndex)
	)
	if(mapLocalEntityIndex === -1) {
		throw new Error(`${action.action} found entity "${value}" on map "${map.name}", but it was somehow not already a member of the map it should be used on!`);
	}
	return mapLocalEntityIndex;
};

var getEntityTypeScenarioIndex = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (!value) {
		throw new Error(`${action.action} requires a string value for "${propertyName}"`);
	}
	var entityType = scenarioData.entityTypes[value];
	if(!entityType) {
		throw new Error(`${action.action} requires a valid value for "${propertyName}"; "${value}" was not found in ScenarioData!`);
	}
	return entityType.scenarioIndex;
};

var getMapIndexFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (!value) {
		throw new Error(`${action.action} requires a string value for "${propertyName}"`);
	}
	var lookedUpMap = scenarioData.mapsByName[value];
	var mapIndex = lookedUpMap && lookedUpMap.scenarioIndex;
	if(mapIndex === undefined) {
		throw new Error(`${action.action} was unable to find map "${value}"!`);
	}
	return mapIndex;
};

var getGeometryIndexFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (!value) {
		throw new Error(`${action.action} requires a string value for "${propertyName}"`);
	}
	var geometry = getObjectByNameOnMap(value, map, action);
	if (!geometry) {
		throw new Error(`${action.action} was not able to find geometry named "${value}" on the map named "${map.name}"`);
	}
	return geometry.specialIndex || geometry.mapIndex;
};

var buttonMap = {
	MEM0: 0,
	MEM1: 1,
	MEM2: 2,
	MEM3: 3,
	BIT128: 4,
	BIT64: 5,
	BIT32: 6,
	BIT16: 7,
	BIT8: 8,
	BIT4: 9,
	BIT2: 10,
	BIT1: 11,
	XOR: 12,
	ADD: 13,
	SUB: 14,
	PAGE: 15,
	LJOY_CENTER: 16,
	LJOY_UP: 17,
	LJOY_DOWN: 18,
	LJOY_LEFT: 19,
	LJOY_RIGHT: 20,
	RJOY_CENTER: 21,
	RJOY_UP: 22,
	RJOY_DOWN: 23,
	RJOY_LEFT: 24,
	RJOY_RIGHT: 25,
	TRIANGLE: 22,
	X: 23,
	CROSS: 23,
	CIRCLE: 24,
	O: 24,
	SQUARE: 25,
	HAX: 26, // Cap Touch
	ANY: 27, // the elusive `any key`
};

var getButtonFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (value === undefined) {
		throw new Error(`${action.action} requires a value for "${propertyName}"`);
	}
	var button = buttonMap[value];
	if (button === undefined) {
		throw new Error(`${action.action} was given value "${value}", but requires a valid value for "${propertyName}"; Possible values:\n${
			Object.keys(buttonMap)
		}`);
	}
	return button;
};

var getDirectionFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (value === undefined) {
		throw new Error(`${action.action} requires a value for "${propertyName}"`);
	}
	var directions = {
		0: 0,
		1: 1,
		2: 2,
		3: 3,
		"north": 0,
		"east": 1,
		"south": 2,
		"west": 3,
	};
	var direction = directions[value];
	if (direction === undefined) {
		throw new Error(`${action.action} was given value "${value}", but requires a valid value for "${propertyName}"; Possible values:\n${
			Object.keys(directions)
		}`);
	}
	return direction;
};

var getRelativeDirectionFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (value === undefined) {
		throw new Error(`${action.action} requires a value for "${propertyName}"`);
	}
	if (
		!Number.isInteger(value)
		|| (Math.abs(value) > 3)
	) {
		throw new Error(`${action.action} requires a valid value for "${propertyName}"; Value must be an integer from -3 to +3`);
	}
	return value;
};

var getNumberFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData
) {
	var value = action[propertyName];
	if (typeof value !== 'number') {
		throw new Error(`${action.action} requires a value for "${propertyName}"!`);
	}
	value = parseInt(value, 10);
	if (value < 0) {
		throw new Error(`${action.action} "${propertyName}" value "${value}" must be greater than or equal to zero!`);
	}
	return value;
};

var ledNameMap = {
	LED_XOR    : 0b0000000000000000001,
	LED_ADD    : 0b0000000000000000010,
	LED_SUB    : 0b0000000000000000100,
	LED_PAGE   : 0b0000000000000001000,
	LED_BIT128 : 0b0000000000000010000,
	LED_BIT64  : 0b0000000000000100000,
	LED_BIT32  : 0b0000000000001000000,
	LED_BIT16  : 0b0000000000010000000,
	LED_BIT8   : 0b0000000000100000000,
	LED_BIT4   : 0b0000000001000000000,
	LED_BIT2   : 0b0000000010000000000,
	LED_BIT1   : 0b0000000100000000000,
	LED_MEM3   : 0b0000001000000000000,
	LED_MEM2   : 0b0000010000000000000,
	LED_MEM1   : 0b0000100000000000000,
	LED_MEM0   : 0b0001000000000000000,
	LED_USB    : 0b0010000000000000000,
	LED_HAX    : 0b0100000000000000000,
	LED_SD     : 0b1000000000000000000,
	ALL        : 0b1111111111111111111,
};
var getLightsFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData
) {
	var value = 0;
	var rawValue = action[propertyName];
	if (typeof rawValue === 'string') {
		rawValue = [rawValue];
	}
	if (!Array.isArray(rawValue)) {
		throw new Error(`${action.action} requires either a string or array for the value of "${propertyName}"!`);
	}
	if (!rawValue.length) {
		throw new Error(`${action.action} requires a non-empty array of lights for "${propertyName}"!`);
	}
	rawValue.forEach(function (name) {
		var currentLightValue = ledNameMap[name];
		if (!currentLightValue) {
			throw new Error(`${action.action} Invalid light name "${name}" for value "${propertyName}"!`);
		}
		value |= currentLightValue;
	});
	if (value < 1) {
		throw new Error(`${action.action} "${propertyName}" value "${rawValue}" must be greater than or equal to zero!`);
	}
	return value;
};

var getByteFromAction = function (propertyName, action, map) {
	var value = getNumberFromAction(propertyName, action, map);
	var maxSize = 255;
	if (value > maxSize) {
		throw new Error(`${action.action} "${propertyName}" value "${value}" must be less than or equal to ${maxSize}!`);
	}
	return value;
};

var rgbRegex = /#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})/;
var rgbaRegex = /#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})/;
var getColor = function (propertyName, action, map) {
	var value = action[propertyName];
	if (typeof value !== 'string') {
		throw new Error(`${action.action} requires a string value for "${propertyName}"!`);
	}
	var match = (
		rgbaRegex.exec(value)
		|| rgbRegex.exec(value)
	);
	if (!match) {
		throw new Error(`${action.action} "${propertyName}" value "${value}" must be greater than or equal to zero!`);
	}
	match.shift();
	match[0] = parseInt(match[0], 16);
	match[1] = parseInt(match[1], 16);
	match[2] = parseInt(match[2], 16);
	match[3] = match[3] === undefined
		? 255
		: parseInt(match[3], 16);
	return rgbaToC565(
		match[0],
		match[1],
		match[2],
		match[3],
	);
};

var getTwoBytesFromAction = function (propertyName, action, map) {
	var value = getNumberFromAction(propertyName, action, map);
	var maxSize = 65535;
	if (value > maxSize) {
		throw new Error(`${action.action} "${propertyName}" value "${value}" must be less than or equal to ${maxSize}!`);
	}
	return value;
};

var getBoolFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (typeof value !== 'boolean') {
		throw new Error(`${action.action} requires a (true | false) value for "${propertyName}"!`);
	}
	// Type crimes in JavaScript; bools can be cast to 0 or 1
	// Set the upper bit in a byte to use the expected_bool field as a bitmask.
	if (
		action.success_script === undefined
		&& action.jump_index !== undefined
	) {
		value += 128;
	}
	return value;
};

var getDefaultFalseBoolFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName] || false;
	if (typeof value !== 'boolean') {
		throw new Error(`${action.action} requires a (true | false) value for "${propertyName}"!`);
	}
	return value;
};

var getStringIdFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (typeof value !== 'string') {
		throw new Error(`${action.action} requires a string value for "${propertyName}"!`);
	}
	return serializeString(
		value,
		map,
		fileNameMap,
		scenarioData,
	);
};

var getSaveFlagIdFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (typeof value !== 'string') {
		throw new Error(`${action.action} requires a string value for "${propertyName}"!`);
	}
	return serializeSaveFlag(
		value,
		map,
		fileNameMap,
		scenarioData,
	);
};

var getVariableIdFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (typeof value !== 'string') {
		throw new Error(`${action.action} requires a string value for "${propertyName}"!`);
	}
	return serializeVariable(
		value,
		map,
		fileNameMap,
		scenarioData,
	);
};

var entityFieldMap = {
	x: 12,
	y: 14,
	interact_script_id: 16,
	tick_script_id: 18,
	primary_id: 20,
	secondary_id: 22,
	primary_id_type: 24,
	current_animation: 25,
	current_frame: 26,
	direction: 27,
	path_id: 28,
	look_script_id: 30,
};
var getFieldFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (value === undefined) {
		throw new Error(`${action.action} requires a value for "${propertyName}"`);
	}
	var field = entityFieldMap[value];
	if (field === undefined) {
		throw new Error(`${action.action} was given value "${value}", but requires a valid value for "${propertyName}"; Possible values:\n${
			Object.keys(entityFieldMap)
		}`);
	}
	return field;
};

var operationMap = {
	SET: 0,
	ADD: 1,
	SUB: 2,
	DIV: 3,
	MUL: 4,
	MOD: 5,
	RNG: 6,
};
var getOperationFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (value === undefined) {
		throw new Error(`${action.action} was given value "${value}", but requires a value for "${propertyName}"`);
	}
	var operation = operationMap[value];
	if (operation === undefined) {
		throw new Error(`${action.action} was given value "${value}", but requires a valid value for "${propertyName}"; Possible values:\n${
			Object.keys(operationMap)
		}`);
	}
	return operation;
};

var comparisonMap = {
	LT  : 0,
	LTEQ: 1,
	EQ  : 2,
	GTEQ: 3,
	GT  : 4,
	"<" : 0,
	"<=": 1,
	"==": 2,
	">=": 3,
	">" : 4,
};
var getComparisonFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (value === undefined) {
		throw new Error(`${action.action} was given value "${value}", but requires a value for "${propertyName}"`);
	}
	var comparison = comparisonMap[value];
	if (comparison === undefined) {
		throw new Error(`${action.action} requires a valid value for "${propertyName}"; Possible values:\n${
			Object.keys(comparisonMap)
		}`);
	}
	return comparison;
};

var getDialogIdFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (typeof value !== 'string') {
		throw new Error(`${action.action} requires a string value for "${propertyName}"!`);
	}
	var dialog = scenarioData.dialogs[value];
	if (!dialog) {
		throw new Error(`${action.action} was unable to find a dialog named "${value}"!`);
	}
	return serializeDialog(
		dialog,
		map,
		fileNameMap,
		scenarioData,
	);
};

var getScriptByName = function (
	scriptName,
	scenarioData,
) {
	var sourceScript = scenarioData.scripts[scriptName];
	if (!sourceScript) {
		throw new Error(`Script: "${scriptName}" could not be found in scenario.json!`);
	}
	return sourceScript;
};
var getScriptByPropertyName = function (
	propertyName,
	action,
) {
	var scriptName = action[propertyName];
	if (!scriptName) {
		throw new Error(`${action.action} requires a string value for "${propertyName}"`);
	}
	return scriptName;
};
var getMapLocalScriptIdFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var scriptName = getScriptByPropertyName(
		propertyName,
		action,
	);
	var encodedScript = handleScript(
		scriptName,
		map,
		fileNameMap,
		scenarioData
	);
	return encodedScript.mapLocalScriptId;
};

var initActionData = function (action) {
	var buffer = new ArrayBuffer(8);
	var dataView = new DataView(buffer);
	var actionIndex = actionNames.indexOf(action.action);
	if (actionIndex === -1) {
		throw new Error(`Invalid Action: ${action.action}`);
	}
	dataView.setUint8(
		0, // action index
		actionIndex
	);
	return {
		buffer: buffer,
		dataView: dataView,
	}
};

var getSerialDialogIdFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (typeof value !== 'string') {
		throw new Error(`${action.action} requires a string value for "${propertyName}"!`);
	}
	var serialDialog = scenarioData.serialDialogs[value];
	if (!serialDialog) {
		throw new Error(`${action.action} was unable to find a serial_dialog named "${value}"!`);
	}
	return serializeSerialDialog(
		serialDialog,
		map,
		fileNameMap,
		scenarioData,
	);
};

var getItemIdFromAction = function () {
	throw new Error('getItemIdFromAction is not implemented yet!');
};

var getBleFlagIdFromAction = function () {
	throw new Error('getBleFlagIdFromAction is not implemented yet!');
};

var scriptSlotMap = {
	ON_LOAD: 0,
	ON_TICK: 1,
	ON_INTERACT: 2,
	ON_LOOK: 3,
	ON_COMMAND: 4,
};
var getScriptSlotFromAction = function (
	propertyName,
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var key = action[propertyName];
	if (key === undefined) {
		throw new Error(`${action.action} was given value "${key}", but requires a value for "${propertyName}"`);
	}
	var value = scriptSlotMap[key.toLocaleUpperCase()];
	if (value === undefined) {
		throw new Error(`${action.action} requires a valid value for "${propertyName}"; Possible values:\n${
			Object.keys(scriptSlotMap)
		}`);
	}
	return value;
};

var actionPropertyNameToHandlerMap = {
	duration: getNumberFromAction,
	expected_u4: getNumberFromAction,
	lights: getLightsFromAction,
	map: getMapIndexFromAction,
	entity: getMapLocalEntityIndexFromAction,
	target_entity: getMapLocalEntityIndexFromAction,
	entity_type: getEntityTypeScenarioIndex,
	geometry: getGeometryIndexFromAction,
	target_geometry: getGeometryIndexFromAction,
	script: getMapLocalScriptIdFromAction,
	success_script: getMapLocalScriptIdFromAction,
	jump_index: getTwoBytesFromAction,
	action_index: getTwoBytesFromAction,
	expected_script: getMapLocalScriptIdFromAction,
	string: getStringIdFromAction,
	command: getStringIdFromAction,
	argument: getStringIdFromAction,
	save_flag: getSaveFlagIdFromAction,
	dialog: getDialogIdFromAction,
	address: getTwoBytesFromAction,
	color: getColor,
	expected_u2: getTwoBytesFromAction,
	u2_value: getTwoBytesFromAction,
	amplitude: getByteFromAction,
	bitmask: getByteFromAction,
	button_id: getButtonFromAction,
	byte_offset: getByteFromAction,
	byte_value: getByteFromAction,
	expected_byte: getByteFromAction,
	animation: getByteFromAction,
	play_count: getByteFromAction,
	frequency: getTwoBytesFromAction,
	font_id: getByteFromAction,
	slot: getByteFromAction,
	direction: getDirectionFromAction,
	relative_direction: getRelativeDirectionFromAction,
	enabled: getBoolFromAction,
	bool_value: getBoolFromAction,
	expected_bool: getBoolFromAction,
	disable_newline: getDefaultFalseBoolFromAction,
	is_fail: getDefaultFalseBoolFromAction,
	value: getTwoBytesFromAction,
	variable: getVariableIdFromAction,
	source: getVariableIdFromAction,
	field: getFieldFromAction,
	inbound: getBoolFromAction,
	operation: getOperationFromAction,
	comparison: getComparisonFromAction,
	serial_dialog: getSerialDialogIdFromAction,
	item_name: getItemIdFromAction,
	ble_flag: getBleFlagIdFromAction,
	script_slot: getScriptSlotFromAction,
};

var sizeHandlerMap = [
	'BAD_SIZE_ERROR',
	'setUint8',
	'setUint16',
	'BAD_SIZE_ERROR',
	'setUint32',
	'BAD_SIZE_ERROR',
	'BAD_SIZE_ERROR',
	'BAD_SIZE_ERROR',
	'BAD_SIZE_ERROR',
];

var handleActionWithFields = function(
	action,
	fields,
	map,
	fileNameMap,
	scenarioData,
) {
	var data = initActionData(action);
	var offset = 1; // always start at 1 because that's the actionId
	fields.forEach(function (field) {
		var propertyName = field.propertyName;
		if (Array.isArray(field.propertyName)) {
			for (var i = 0; i < field.propertyName.length; i++) {
				var searchName = field.propertyName[i];
				if (action[searchName] !== undefined) {
					propertyName = searchName;
					break;
				}
			}
		}
		var handler = actionPropertyNameToHandlerMap[propertyName];
		if (!handler) {
			throw new Error(`No action field handler for property "${propertyName}"!`)
		}
		var value = handler(
			propertyName,
			action,
			map,
			fileNameMap,
			scenarioData,
		);
		var dataViewMethodName = sizeHandlerMap[field.size];
		data.dataView[dataViewMethodName](
			offset,
			value,
			field.endian === undefined
				? IS_LITTLE_ENDIAN
				: field.endian,
		);
		offset += field.size;
	})
	return data;
};

var serializeAction = function (
	action,
	map,
	fileNameMap,
	scenarioData,
) {
	var actionIndex = actionNames.indexOf(action.action);
	if (actionIndex === -1) {
		throw new Error(`Action: "${action.action}" is not valid! Check the "actionHandlerMap" for valid options!`);
	}
	var fields = actionFieldsMap[action.action];
	if (!fields) {
		throw new Error(`Action: "${action.action}" has not been implemented yet! Please add it to the "actionHandlerMap"!`);
	}
	return handleActionWithFields(
		action,
		fields,
		map,
		fileNameMap,
		scenarioData,
	).buffer;
};

var detectCopyScript = function (script) {
	return script.filter(function (action) {
		return action.action === 'COPY_SCRIPT';
	}).length > 0;
};

var preProcessScript = function(
	script,
	scriptName,
	map,
	fileNameMap,
	scenarioData,
) {
	var result = script;
	var read = script;
	var copyScriptCount = 0; // For linker
	while (detectCopyScript(read)) {
		result = [];
		read.forEach(function (action) {
			if(action.action === 'COPY_SCRIPT') {
				var scriptName = getScriptByPropertyName(
					'script',
					action,
				);
				var sourceScript = getScriptByName(
					scriptName,
					scenarioData
				);
				var copiedScriptSource = JSON.stringify(sourceScript);
				if (action.search_and_replace) {
					Object.entries(action.search_and_replace).map(function (pair) {
						var search = pair[0];
						var replace = pair[1];
						var regex = new RegExp(search, 'gm');
						copiedScriptSource = copiedScriptSource.replace(
							regex,
							replace
						);
					});
				}
				var copiedScript = JSON.parse(copiedScriptSource);

				// Linker things!

				// This number will be unique each time COPY_SCRIPT is evaluated, preventing label collisions
				copyScriptCount += 1;
				var safetyPrefix = `COPY${copyScriptCount} `; // should become "COPY4 LABEL 72" or whatever

				// Make the hardcoded index jumps into string labels
				var destinationMap = {}; // The action indices and what their label will be
				var destinationCount = 0; // To make unique labels
				var getOrMakeLabel = function (index) {
					if (destinationMap[index] === undefined) {
						destinationCount += 1;
						destinationMap[index] = `AUTOLABEL ${destinationCount}`;
					}
					return destinationMap[index];
				}
				copiedScript.forEach(function (entry) {
					if (
						entry.action.includes("CHECK_")
						&& entry.jump_index !== undefined
						&& typeof entry.jump_index === "number"
					) {
						entry.jump_index = getOrMakeLabel(entry.jump_index);
					} else if (
						entry.action === "GOTO_ACTION_INDEX"
						&& entry.action_index !== undefined
						&& typeof entry.action_index === "number"
					) {
						entry.action_index = getOrMakeLabel(entry.action_index);
					}
				});
				var destinationIndicies = Object.keys(destinationMap)
					.map(function (n) { return n * 1; })
					.sort(function (a, b) { return b - a; }); // descending order
				destinationIndicies.forEach(function (insertionIndex) {
					copiedScript.splice(
						insertionIndex,
						0,
						{
							action: "LABEL",
							value: destinationMap[insertionIndex],
						}
					)
				});
				// Prefix the (now-all-string) labels
				copiedScript = copiedScript.map(function (entry) {
					var property;
					if (
						entry.action.includes("CHECK_")
						&& entry.jump_index !== undefined
					) {
						property = "jump_index";
					} else if (entry.action == "GOTO_ACTION_INDEX") {
						property = "action_index";
					} else if (entry.action == "LABEL") {
						property = "value";
					}
					if ( property
						&& typeof entry[property] === "string"
					) {
						entry[property] = safetyPrefix + entry[property];
					}
					return entry;
				});
				// Linker helper done!

				result = result.concat(copiedScript);
			} else {
				result.push(action);
			}
		});
		read = result;
	}
	return result;
};

var linker = function (_actionArray) {
	var actionArray = JSON.parse(JSON.stringify(_actionArray));
	var arraySize = actionArray.length;
	var labels = {};
	for (var i = 0; i < arraySize; i++) {
		if (actionArray[i].action == "LABEL") {
			labels[actionArray[i].value] = i;
			actionArray.splice(i,1)
			arraySize -= 1;
		}
	}
	actionArray.forEach(function(action) {
		if (
			action.action.includes("CHECK_")
			&& action.jump_index
			&& typeof action.jump_index === "string"
		) {
			if (action.jump_index === undefined) {
				throw new Error ("I'm just cutting things off here. Invalid label someplace!!! Good luck lol don't break anything next time");
			}
			action.jump_index = labels[action.jump_index];
		} else if (
			action.action == "GOTO_ACTION_INDEX"
			&& typeof action.action_index === "string"
		) {
			action.action_index = labels[action.action_index]
		}
	});
	return actionArray;
};	

var serializeScript = function (
	script,
	scriptName,
	map,
	fileNameMap,
	scenarioData,
) {
	var headerLength = (
		32 // char[32] name
		+ 4 // uint32_t action_count
	);
	var result = new ArrayBuffer(
		getPaddedHeaderLength(headerLength)
	);
	var dataView = new DataView(result);
	var offset = 0;
	setCharsIntoDataView(
		dataView,
		scriptName,
		0,
		offset += 32
	);
	var compositeScript = preProcessScript(
		script,
		scriptName,
		map,
		fileNameMap,
		scenarioData,
	);
	compositeScript = linker(compositeScript);
	dataView.setUint32(
		offset,
		compositeScript.length,
		IS_LITTLE_ENDIAN
	);
	offset += 4;

	// in case actions call scripts that call this script again,
	// put this script into the scriptKeyNames first,
	// so others can refer to this without infinite looping because
	// it's already in there.
	script.scenarioIndex = scenarioData.parsed.scripts.length;
	scenarioData.parsed.scripts.push(script);
	var mapLocalScriptId = map.scriptIndices.length;
	map.scriptIndices.push(script.scenarioIndex);
	map.scriptNameKeys[scriptName] = {
		compositeScript: compositeScript,
		mapLocalScriptId: mapLocalScriptId,
		globalScriptId: script.scenarioIndex
	};

	compositeScript.forEach(function(action) {
		result = combineArrayBuffers(
			result,
			serializeAction(
				action,
				map,
				fileNameMap,
				scenarioData,
			),
		);
	});
	return result;
};

var serializeNullScript = function(
	fileNameMap,
	scenarioData,
) {
	var nullScript = [];
	nullScript.serialized = serializeScript(
		nullScript,
		'null_script',
		{
			name: 'null_map_only_used_for_null_script',
			scriptIndices: [],
			scriptNameKeys: {},
		},
		fileNameMap,
		scenarioData,
	);
	scenarioData.scripts['null_script'] = nullScript;
}

var handleScript = function(
	scriptName,
	map,
	fileNameMap,
	scenarioData,
) {
	var result = map.scriptNameKeys[scriptName];
	if (!result) {
		if(scriptName === 'null_script') {
			result = {
				mapLocalScriptId: 0,
				globalScriptId: 0
			};
			map.scriptIndices.push(0);
			map.scriptNameKeys[scriptName] = result;
		} else {
			var sourceScript = getScriptByName(
				scriptName,
				scenarioData,
			);
			var script = jsonClone(sourceScript);
			script.serialized = serializeScript(
				script,
				scriptName,
				map,
				fileNameMap,
				scenarioData,
			);
			result = map.scriptNameKeys[scriptName];
		}
	}
	return result;
};

var possibleEntityScripts = [
	'on_interact',
	'on_tick',
	'on_look',
];

var handleMapEntityScripts = function (
	map,
	fileNameMap,
	scenarioData,
) {
	map.entityIndices.forEach(function (globalEntityIndex) {
		var entity = scenarioData.parsed.entities[globalEntityIndex];
		possibleEntityScripts.forEach(function (propertyName) {
			var scriptName = entity[propertyName];
			map.currentEntityMapIndex = entity.mapIndex;
			if (scriptName) {
				var mapLocalScriptId = handleScript(
					scriptName,
					map,
					fileNameMap,
					scenarioData,
				).mapLocalScriptId;
				entity.dataView.setUint16(
					entity.dataView[propertyName + '_offset'], // uint16_t on_${possibleScriptName}_script_id
					mapLocalScriptId,
					IS_LITTLE_ENDIAN
				);
			}
		});
		map.currentEntityMapIndex = undefined;
	});
};

var possibleMapScripts = [
	'on_load',
	'on_tick',
	'on_look',
];

var collectMapScripts = function (
	map,
) {
	var result = {};
	// this is the shape if it came from a tiled map file
	(map.properties || []).forEach(function(property) {
		if (
			property.value // because if it's empty, don't bother
			&& possibleMapScripts.includes(property.name)
		) {
			result[property.name] = property.value;
		}
	});
	// this is if it's a property defined in maps.json
	possibleMapScripts.forEach(function (scriptSlot) {
		var scriptName = map[scriptSlot];
		var existingScriptName = result[scriptSlot];
		if (scriptName) {
			if (existingScriptName) {
				throw new Error(`Duplicate "${scriptSlot}" definition on map "${map.name}": Your map has this script defined in the Tiled map, as well as maps.json. Remove one of them to continue.`);
			} else {
				result[scriptSlot] = scriptName;
			}
		}
	});
	return result;
};

var handleMapScripts = function (
	map,
	fileNameMap,
	scenarioData,
) {
	//  {
	//	"name":"on_load",
	//	"type":"string",
	//	"value":"my_first_script"
	//  },
	handleScript( // add the global null_script id to the local map scripts
		'null_script',
		map,
		fileNameMap,
		scenarioData,
	);
	var mapScripts = collectMapScripts(map);
	// console.log(`Processing scripts for map: "${map.name}"`);
	Object.keys(mapScripts).forEach(function (scriptSlot) {
		var scriptName = mapScripts[scriptSlot];
		// console.log(`	- ${scriptSlot}:${scriptName}`);
		map[scriptSlot] = handleScript(
			scriptName,
			map,
			fileNameMap,
			scenarioData,
		).mapLocalScriptId;
	});
	map.directionScriptIds = {};
	Object.keys(map.directions || {}).forEach(function (directionName) {
		var scriptName = map.directions[directionName];
		map.directionScriptIds[directionName] = handleScript(
			scriptName,
			map,
			fileNameMap,
			scenarioData,
		).mapLocalScriptId;
	});
	handleMapEntityScripts(
		map,
		fileNameMap,
		scenarioData,
	);
};

var makeVariableLookaheadFunction = function(scenarioData) {
	return function (script) {
		script.forEach(function (action) {
			if(action.variable) {
				serializeVariable(action.variable, {}, {}, scenarioData);
			}
			if(action.source) {
				serializeVariable(action.source, {}, {}, scenarioData);
			}
		});
	}
};
