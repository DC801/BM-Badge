var actionHandlerMap = {
	NULL_ACTION: null,
	CHECK_ENTITY_BYTE: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'script', size: 2},
				{propertyName: 'entity', size: 1},
				{propertyName: 'byte_offset', size: 1},
				{propertyName: 'expected_byte', size: 1},
			],
			'CHECK_ENTITY_BYTE',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	CHECK_SAVE_FLAG: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'script', size: 2},
				{propertyName: 'byte_offset', size: 1},
				{propertyName: 'expected_bool', size: 1},
			],
			'CHECK_SAVE_FLAG',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	CHECK_IF_ENTITY_IS_IN_GEOMETRY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'geometry', size: 2},
				{propertyName: 'script', size: 2},
				{propertyName: 'entity', size: 1},
				{propertyName: 'expected_bool', size: 1},
			],
			'CHECK_IF_ENTITY_IS_IN_GEOMETRY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	CHECK_FOR_BUTTON_PRESS: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'script', size: 2},
				{propertyName: 'button_id', size: 1},
			],
			'CHECK_FOR_BUTTON_PRESS',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	CHECK_FOR_BUTTON_STATE: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'script', size: 2},
				{propertyName: 'button_id', size: 1},
				{propertyName: 'expected_bool', size: 1},
			],
			'CHECK_FOR_BUTTON_STATE',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	RUN_SCRIPT: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'script', size: 2},
			],
			'RUN_SCRIPT',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	COMPARE_ENTITY_NAME: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'string', size: 2},
				{propertyName: 'script', size: 2},
				{propertyName: 'entity', size: 1},
				{propertyName: 'expected_bool', size: 1},
			],
			'COMPARE_ENTITY_NAME',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	BLOCKING_DELAY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
			],
			'BLOCKING_DELAY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	NON_BLOCKING_DELAY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
			],
			'NON_BLOCKING_DELAY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_PAUSE_STATE: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'state', size: 1},
			],
			'SET_PAUSE_STATE',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_ENTITY_BYTE: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'entity', size: 1},
				{propertyName: 'byte_offset', size: 1},
				{propertyName: 'byte_value', size: 1},
			],
			'SET_ENTITY_BYTE',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_SAVE_FLAG: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'byte_offset', size: 1},
				{propertyName: 'bool_value', size: 1},
			],
			'SET_SAVE_FLAG',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_PLAYER_CONTROL: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'bool_value', size: 1},
			],
			'SET_PLAYER_CONTROL',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_ENTITY_INTERACT_SCRIPT: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'script', size: 2},
				{propertyName: 'entity', size: 1},
			],
			'SET_ENTITY_INTERACT_SCRIPT',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_ENTITY_TICK_SCRIPT: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'script', size: 2},
				{propertyName: 'entity', size: 1},
			],
			'SET_ENTITY_TICK_SCRIPT',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_MAP_TICK_SCRIPT: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'script', size: 2},
				{propertyName: 'entity', size: 1},
			],
			'SET_MAP_TICK_SCRIPT',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_ENTITY_TYPE: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'primary_id', size: 2},
				{propertyName: 'secondary_id', size: 2},
				{propertyName: 'primary_id_type', size: 1},
				{propertyName: 'entity', size: 1},
			],
			'SET_ENTITY_TYPE',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_ENTITY_DIRECTION: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'entity', size: 1},
				{propertyName: 'direction', size: 1},
			],
			'SET_ENTITY_DIRECTION',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_HEX_CURSOR_LOCATION: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'address', size: 2},
			],
			'SET_HEX_CURSOR_LOCATION',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_HEX_BIT: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'bitmask', size: 1},
				{propertyName: 'bool_value', size: 1},
			],
			'SET_HEX_BIT',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	UNLOCK_HAX_CELL: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'address', size: 2},
			],
			'UNLOCK_HAX_CELL',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	LOCK_HAX_CELL: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'address', size: 2},
			],
			'LOCK_HAX_CELL',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_HEX_EDITOR_STATE: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'expected_bool', size: 1},
			],
			'SET_HEX_EDITOR_STATE',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_HEX_EDITOR_DIALOG_MODE: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'expected_bool', size: 1},
			],
			'SET_HEX_EDITOR_DIALOG_MODE',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	LOAD_MAP: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'map', size: 2},
			],
			'LOAD_MAP',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_RENDERABLE_FONT: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'font_id', size: 1},
			],
			'SET_RENDERABLE_FONT',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	TELEPORT_ENTITY_TO_GEOMETRY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'geometry', size: 2},
				{propertyName: 'entity', size: 1},
			],
			'TELEPORT_ENTITY_TO_GEOMETRY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	WALK_ENTITY_TO_GEOMETRY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
				{propertyName: 'geometry', size: 2},
				{propertyName: 'entity', size: 1},
			],
			'WALK_ENTITY_TO_GEOMETRY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	WALK_ENTITY_ALONG_GEOMETRY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
				{propertyName: 'geometry', size: 2},
				{propertyName: 'entity', size: 1},
			],
			'WALK_ENTITY_ALONG_GEOMETRY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	LOOP_ENTITY_ALONG_GEOMETRY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
				{propertyName: 'geometry', size: 2},
				{propertyName: 'entity', size: 1},
			],
			'LOOP_ENTITY_ALONG_GEOMETRY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_CAMERA_TO_FOLLOW_ENTITY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'entity', size: 1},
			],
			'SET_CAMERA_TO_FOLLOW_ENTITY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	TELEPORT_CAMERA_TO_GEOMETRY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'geometry', size: 2},
			],
			'TELEPORT_CAMERA_TO_GEOMETRY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	PAN_CAMERA_TO_GEOMETRY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
				{propertyName: 'geometry', size: 2},
				{propertyName: 'entity', size: 1},
			],
			'PAN_CAMERA_TO_GEOMETRY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	PAN_CAMERA_ALONG_GEOMETRY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
				{propertyName: 'geometry', size: 2},
				{propertyName: 'entity', size: 1},
			],
			'PAN_CAMERA_ALONG_GEOMETRY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	LOOP_CAMERA_ALONG_GEOMETRY: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
				{propertyName: 'geometry', size: 2},
				{propertyName: 'entity', size: 1},
			],
			'LOOP_CAMERA_ALONG_GEOMETRY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SET_SCREEN_SHAKE: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
				{propertyName: 'amplitude', size: 1},
				{propertyName: 'frequency', size: 1},
			],
			'LOOP_CAMERA_ALONG_GEOMETRY',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SCREEN_FADE_IN: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
				{propertyName: 'color', size: 2},
			],
			'SCREEN_FADE_IN',
			map,
			fileNameMap,
			scenarioData,
		);
	},
	SCREEN_FADE_OUT: function (action, map, fileNameMap, scenarioData) {
		return handleActionWithFields(
			action,
			[
				{propertyName: 'duration', size: 4},
				{propertyName: 'color', size: 2},
			],
			'SCREEN_FADE_OUT',
			map,
			fileNameMap,
			scenarioData,
		);
	},
};

var actionNames = [
	'NULL_ACTION',
	'CHECK_ENTITY_BYTE',
	'CHECK_SAVE_FLAG',
	'CHECK_IF_ENTITY_IS_IN_GEOMETRY',
	'CHECK_FOR_BUTTON_PRESS',
	'CHECK_FOR_BUTTON_STATE',
	'RUN_SCRIPT',
	'COMPARE_ENTITY_NAME',
	'BLOCKING_DELAY',
	'NON_BLOCKING_DELAY',
	'SET_PAUSE_STATE',
	'SET_ENTITY_BYTE',
	'SET_SAVE_FLAG',
	'SET_PLAYER_CONTROL',
	'SET_ENTITY_INTERACT_SCRIPT',
	'SET_ENTITY_TICK_SCRIPT',
	'SET_MAP_TICK_SCRIPT',
	'SET_ENTITY_TYPE',
	'SET_ENTITY_DIRECTION',
	'SET_HEX_CURSOR_LOCATION',
	'SET_HEX_BIT',
	'UNLOCK_HAX_CELL',
	'LOCK_HAX_CELL',
	'SET_HEX_EDITOR_STATE',
	'SET_HEX_EDITOR_DIALOG_MODE',
	'LOAD_MAP',
	'SHOW_DIALOG',
	'SET_RENDERABLE_FONT',
	'TELEPORT_ENTITY_TO_GEOMETRY',
	'WALK_ENTITY_TO_GEOMETRY',
	'WALK_ENTITY_ALONG_GEOMETRY',
	'LOOP_ENTITY_ALONG_GEOMETRY',
	'SET_CAMERA_TO_FOLLOW_ENTITY',
	'TELEPORT_CAMERA_TO_GEOMETRY',
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
}

var getObjectByNameOnMap = function(name, map, actionName) {
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
		throw new Error(`${actionName} No object named "${name}" could be found on map: "${map.name}"!`);
	}
	return object;
};

var getMapLocalEntityIndexFromAction = function (
	propertyName,
	action,
	actionName,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (!value) {
		throw new Error(`${actionName} requires a string value for "${propertyName}"`);
	}
	var entity = getObjectByNameOnMap(
		value,
		map,
		actionName,
	);
	var mapLocalEntityIndex = (
		entity.specialIndex
		|| map.entityIndices.indexOf(entity.compositeEntity.scenarioIndex)
	)
	if(mapLocalEntityIndex === -1) {
		throw new Error(`${actionName} found entity "${value}" on map "${map.name}", but it was somehow not already a member of the map it should be used on!`);
	}
	return mapLocalEntityIndex;
};

var getMapIndexFromAction = function (
	propertyName,
	action,
	actionName,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (!value) {
		throw new Error(`${actionName} requires a string value for "${propertyName}"`);
	}
	var lookedUpMap = scenarioData.mapsByName[value];
	var mapIndex = lookedUpMap && lookedUpMap.scenarioIndex;
	if(mapIndex === undefined) {
		throw new Error(`${actionName} was unable to find map "${value}"!`);
	}
	return mapIndex;
};

var getGeometryIndexFromAction = function (
	propertyName,
	action,
	actionName,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (!value) {
		throw new Error(`${actionName} requires a string value for "${propertyName}"`);
	}
	var geometry = getObjectByNameOnMap(value, map, actionName);
	if (
		!geometry
		|| !geometry.path
	) {
		throw new Error(`${actionName} was not able to find geometry named "${value}" on the map named "${map.name}"`);
	}
	return geometry.scenarioIndex;
};

var getDirectionFromAction = function (
	propertyName,
	action,
	actionName,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (value === undefined) {
		throw new Error(`${actionName} requires a value for "${propertyName}"`);
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
		throw new Error(`${actionName} requires a valid value for "${propertyName}"; Possible values:\n${
			Object.keys(directions)
		}`);
	}
	return direction;
};

var getNumberFromAction = function (
	propertyName,
	action,
	actionName,
	map,
	fileNameMap,
	scenarioData
) {
	var value = action[propertyName];
	if (typeof value !== 'number') {
		throw new Error(`${actionName} requires a value for "${propertyName}"!`);
	}
	value = parseInt(value, 10);
	if (value < 0) {
		throw new Error(`${actionName} "${propertyName}" value "${value}" must be greater than or equal to zero!`);
	}
	return value;
};

var getByteFromAction = function (propertyName, action, map, actionName) {
	var value = getNumberFromAction(propertyName, action, map, actionName);
	var maxSize = 255;
	if (value > maxSize) {
		throw new Error(`${actionName} "${propertyName}" value "${value}" must be less than or equal to ${maxSize}!`);
	}
	return value;
};

var getTwoBytesFromAction = function (propertyName, action, map, actionName) {
	var value = getNumberFromAction(propertyName, action, map, actionName);
	var maxSize = 65535;
	if (value > maxSize) {
		throw new Error(`${actionName} "${propertyName}" value "${value}" must be less than or equal to ${maxSize}!`);
	}
	return value;
};

var getBoolFromAction = function (
	propertyName,
	action,
	actionName,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (typeof value !== 'boolean') {
		throw new Error(`${actionName} requires a (true | false) value for "${propertyName}"!`);
	}
	return value;
};

var getStringIdFromAction = function (
	propertyName,
	action,
	actionName,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (typeof value !== 'string') {
		throw new Error(`${actionName} requires a string value for "${propertyName}"!`);
	}
	return serializeString(
		value,
		fileNameMap,
		scenarioData,
	);
};

var getMapLocalScriptIdFromAction = function (
	propertyName,
	action,
	actionName,
	map,
	fileNameMap,
	scenarioData,
) {
	var value = action[propertyName];
	if (!value) {
		throw new Error(`${actionName} requires a string value for "${propertyName}"`);
	}
	if (!scenarioData.scripts[value]) {
		throw new Error(`${actionName} was not able to find a script named "${value}" provided at the property "${propertyName}"`);
	}
	var mapLocalScriptId = handleScript(
		value,
		map,
		fileNameMap,
		scenarioData
	).mapLocalScriptId;
	return mapLocalScriptId;
};

var initActionData = function (action) {
	var buffer = new ArrayBuffer(8);
	var dataView = new DataView(buffer);
	var actionIndex = actionNames.indexOf(action.name);
	if (actionIndex === -1) {
		throw new Error(`Invalid Action: ${action.name}`);
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
	map: getMapIndexFromAction,
	entity: getMapLocalEntityIndexFromAction,
	geometry: getGeometryIndexFromAction,
	script: getMapLocalScriptIdFromAction,
	string: getStringIdFromAction,
	address: getTwoBytesFromAction,
	color: getTwoBytesFromAction,
	primary_id: getTwoBytesFromAction,
	secondary_id: getTwoBytesFromAction,
	primary_id_type: getByteFromAction,
	amplitude: getByteFromAction,
	bitmask: getByteFromAction,
	button_id: getByteFromAction,
	byte_offset: getByteFromAction,
	byte_value: getByteFromAction,
	expected_byte: getByteFromAction,
	frequency: getByteFromAction,
	font_id: getByteFromAction,
	direction: getDirectionFromAction,
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
	actionName,
	map,
	fileNameMap,
	scenarioData,
) {
	var data = initActionData(action);
	var offset = 1; // always start at 1 because that's the actionId
	fields.forEach(function (field) {
		var handler = actionPropertyNameToHandlerMap[field.propertyName];
		var value = handler(
			field.propertyName,
			action,
			actionName,
			map,
			fileNameMap,
			scenarioData,
		);
		var dataViewMethodName = sizeHandlerMap[field.size];
		data.dataView[dataViewMethodName](
			offset,
			value,
			false
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
	var actionIndex = actionNames.indexOf(action.name);
	if (actionIndex === -1) {
		throw new Error(`Action: "${action.name}" is not valid! Check the "actionHandlerMap" for valid options!`);
	}
	var handler = actionHandlerMap[action.name];
	if (!handler) {
		throw new Error(`Action: "${action.name}" has not been implemented yet! Please add it to the "actionHandlerMap"!`);
	}
	return handler(
		action,
		map,
		fileNameMap,
		scenarioData,
	).buffer;
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
	dataView.setUint32(
		offset,
		script.length,
		false
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
		mapLocalScriptId: mapLocalScriptId,
		globalScriptId: script.scenarioIndex
	};

	script.forEach(function(action) {
		result = combineArrayBuffers(
			result,
			serializeAction(
				action,
				map,
				fileNameMap,
				scenarioData,
			),
		);
	})
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
			var script = jsonClone(scenarioData.scripts[scriptName]);
			if (!script) {
				throw new Error(`Script: "${scriptName}" could not be found in scenario.json!`);
			}
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
					false
				);
			}
		});
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
		if (possibleMapScripts.includes(property.name)) {
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
	scenarioData,
	fileNameMap
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