var actionFieldsMap = {
	NULL_ACTION: null,
	CHECK_ENTITY_NAME: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'string', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_X: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_Y: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_INTERACT_SCRIPT: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'expected_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_TICK_SCRIPT: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'expected_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_TYPE: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'entity_type', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_PRIMARY_ID: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_SECONDARY_ID: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_PRIMARY_ID_TYPE: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_byte', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_CURRENT_ANIMATION: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_byte', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_CURRENT_FRAME: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_byte', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_DIRECTION: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'direction', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_HACKABLE_STATE_A: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_byte', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_HACKABLE_STATE_B: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_byte', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_HACKABLE_STATE_C: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_byte', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_HACKABLE_STATE_D: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_byte', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_HACKABLE_STATE_A_U2: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_HACKABLE_STATE_C_U2: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_ENTITY_HACKABLE_STATE_A_U4: [
		{propertyName: 'expected_u4', size: 4},
		{propertyName: 'success_script', size: 2},
		{propertyName: 'entity', size: 1},
	],
	CHECK_ENTITY_PATH: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'expected_u2', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_SAVE_FLAG: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'save_flag', size: 2},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_IF_ENTITY_IS_IN_GEOMETRY: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'geometry', size: 2},
		{propertyName: 'entity', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_FOR_BUTTON_PRESS: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'button_id', size: 1},
	],
	CHECK_FOR_BUTTON_STATE: [
		{propertyName: 'success_script', size: 2},
		{propertyName: 'button_id', size: 1},
		{propertyName: 'expected_bool', size: 1},
	],
	CHECK_WARP_STATE: [
		{propertyName: 'success_script', size: 2},
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
	PAUSE_GAME: [
		{propertyName: 'state', size: 1},
	],
	PAUSE_ENTITY_SCRIPT: [
		{propertyName: 'entity', size: 1},
		{propertyName: 'script_type', size: 1},
		{propertyName: 'state', size: 1},
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
	SET_ENTITY_HACKABLE_STATE_A: [
		{propertyName: 'byte_value', size: 1},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_HACKABLE_STATE_B: [
		{propertyName: 'byte_value', size: 1},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_HACKABLE_STATE_C: [
		{propertyName: 'byte_value', size: 1},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_HACKABLE_STATE_D: [
		{propertyName: 'byte_value', size: 1},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_HACKABLE_STATE_A_U2: [
		{propertyName: 'u2_value', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_HACKABLE_STATE_C_U2: [
		{propertyName: 'u2_value', size: 2},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_HACKABLE_STATE_A_U4: [
		{propertyName: 'u4_value', size: 4},
		{propertyName: 'entity', size: 1},
	],
	SET_ENTITY_PATH: [
		{propertyName: 'u2_value', size: 2},
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
	SET_HEX_BITS: [
		{propertyName: 'bitmask', size: 1},
		{propertyName: 'bool_value', size: 1},
	],
	SET_WARP_STATE: [
		{propertyName: 'string', size: 2}
	],
	UNLOCK_HAX_CELL: [
		{propertyName: 'address', size: 2},
	],
	LOCK_HAX_CELL: [
		{propertyName: 'address', size: 2},
	],
	SET_HEX_EDITOR_STATE: [
		{propertyName: 'expected_bool', size: 1},
	],
	SET_HEX_EDITOR_DIALOG_MODE: [
		{propertyName: 'expected_bool', size: 1},
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
	PLAY_SOUND_CONTINUOUS: null,
	PLAY_SOUND_INTERRUPT: null,
};

var actionNames = [
	'NULL_ACTION',
	'CHECK_ENTITY_NAME',
	'CHECK_ENTITY_X',
	'CHECK_ENTITY_Y',
	'CHECK_ENTITY_INTERACT_SCRIPT',
	'CHECK_ENTITY_TICK_SCRIPT',
	'CHECK_ENTITY_TYPE',
	'CHECK_ENTITY_PRIMARY_ID',
	'CHECK_ENTITY_SECONDARY_ID',
	'CHECK_ENTITY_PRIMARY_ID_TYPE',
	'CHECK_ENTITY_CURRENT_ANIMATION',
	'CHECK_ENTITY_CURRENT_FRAME',
	'CHECK_ENTITY_DIRECTION',
	'CHECK_ENTITY_HACKABLE_STATE_A',
	'CHECK_ENTITY_HACKABLE_STATE_B',
	'CHECK_ENTITY_HACKABLE_STATE_C',
	'CHECK_ENTITY_HACKABLE_STATE_D',
	'CHECK_ENTITY_HACKABLE_STATE_A_U2',
	'CHECK_ENTITY_HACKABLE_STATE_C_U2',
	'CHECK_ENTITY_HACKABLE_STATE_A_U4',
	'CHECK_ENTITY_PATH',
	'CHECK_SAVE_FLAG',
	'CHECK_IF_ENTITY_IS_IN_GEOMETRY',
	'CHECK_FOR_BUTTON_PRESS',
	'CHECK_FOR_BUTTON_STATE',
	'CHECK_WARP_STATE',
	'RUN_SCRIPT',
	'BLOCKING_DELAY',
	'NON_BLOCKING_DELAY',
	'PAUSE_GAME',
	'PAUSE_ENTITY_SCRIPT',
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
	'SET_ENTITY_HACKABLE_STATE_A',
	'SET_ENTITY_HACKABLE_STATE_B',
	'SET_ENTITY_HACKABLE_STATE_C',
	'SET_ENTITY_HACKABLE_STATE_D',
	'SET_ENTITY_HACKABLE_STATE_A_U2',
	'SET_ENTITY_HACKABLE_STATE_C_U2',
	'SET_ENTITY_HACKABLE_STATE_A_U4',
	'SET_ENTITY_PATH',
	'SET_SAVE_FLAG',
	'SET_PLAYER_CONTROL',
	'SET_MAP_TICK_SCRIPT',
	'SET_HEX_CURSOR_LOCATION',
	'SET_HEX_BITS',
	'SET_WARP_STATE',
	'UNLOCK_HAX_CELL',
	'LOCK_HAX_CELL',
	'SET_HEX_EDITOR_STATE',
	'SET_HEX_EDITOR_DIALOG_MODE',
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
	'PLAY_SOUND_CONTINUOUS',
	'PLAY_SOUND_INTERRUPT',
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
		throw new Error(`${action.action} requires a valid value for "${propertyName}"; Possible values:\n${
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

var actionPropertyNameToHandlerMap = {
	duration: getNumberFromAction,
	expected_u4: getNumberFromAction,
	map: getMapIndexFromAction,
	entity: getMapLocalEntityIndexFromAction,
	target_entity: getMapLocalEntityIndexFromAction,
	entity_type: getEntityTypeScenarioIndex,
	geometry: getGeometryIndexFromAction,
	target_geometry: getGeometryIndexFromAction,
	script: getMapLocalScriptIdFromAction,
	success_script: getMapLocalScriptIdFromAction,
	expected_script: getMapLocalScriptIdFromAction,
	string: getStringIdFromAction,
	save_flag: getSaveFlagIdFromAction,
	dialog: getDialogIdFromAction,
	address: getTwoBytesFromAction,
	color: getColor,
	expected_u2: getTwoBytesFromAction,
	u2_value: getTwoBytesFromAction,
	amplitude: getByteFromAction,
	bitmask: getByteFromAction,
	button_id: getByteFromAction,
	byte_offset: getByteFromAction,
	byte_value: getByteFromAction,
	expected_byte: getByteFromAction,
	frequency: getTwoBytesFromAction,
	font_id: getByteFromAction,
	direction: getDirectionFromAction,
	relative_direction: getRelativeDirectionFromAction,
	bool_value: getBoolFromAction,
	expected_bool: getBoolFromAction,
	state: getBoolFromAction,
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
		var handler = actionPropertyNameToHandlerMap[field.propertyName];
		if (!handler) {
			throw new Error(`No action filed handler for property "${field.propertyName}"!`)
		}
		var value = handler(
			field.propertyName,
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
	while (detectCopyScript(read)) {
		result = [];
		read.forEach(function (action) {
			if(action.action === 'COPY_SCRIPT') {
				var scriptName = getScriptByPropertyName(
					'script',
					action,
				)
				var sourceScript = getScriptByName(
					scriptName,
					scenarioData
				);
				var copiedScript = jsonClone(sourceScript);
				result = result.concat(copiedScript);
			} else {
				result.push(action);
			}
		});
		read = result;
	}
	return result;
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

var possibleEntityScripts = ['on_interact', 'on_tick'];

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

var possibleMapScripts = ['on_load', 'on_tick'];

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
	(map.properties || []).forEach(function(property) {
		if (
			property.value // because if it's empty, don't bother
			&& possibleMapScripts.includes(property.name)
		) {
			map[property.name] = handleScript(
				property.value,
				map,
				fileNameMap,
				scenarioData,
			).mapLocalScriptId;
		}
	});
	handleMapEntityScripts(
		map,
		fileNameMap,
		scenarioData,
	);
};

var mergeScriptDataIntoScenario = function(
	fileNameMap,
	scenarioData,
) {
	var allScripts = {};
	scenarioData.scripts = allScripts;
	return Promise.all(
		scenarioData.scriptPaths.map(function(scriptPath) {
			var scriptFileName = scriptPath.split('/').pop();
			var scriptFile = fileNameMap[scriptFileName];
			return getFileJson(scriptFile)
				.then(function(scriptFileData) {
					Object.keys(scriptFileData)
						.forEach(function(scriptName) {
							if (allScripts[scriptName]) {
								throw new Error(`Duplicate script name "${scriptName}" found in ${scriptFileName}!`);
							}
							allScripts[scriptName] = scriptFileData[scriptName]
						})
				});
		})
	);
};
