var actionHandlerMap = {
	NULL_ACTION: null,
	CHECK_FOR_BUTTON_PRESS: function (
		action,
		map,
		fileNameMap,
		scenarioData,
	) {
		var data = initActionData(action);
		if (!action.success_script) {
			throw new Error('CHECK_FOR_BUTTON_PRESS requires a string value for `success_script`');
		}
		if (!scenarioData.scripts[action.success_script]) {
			throw new Error(`CHECK_FOR_BUTTON_PRESS was not able to find a script named "${action.success_script}" provided at the value \`success_script\``);
		}
		if (!action.button_id) {
			throw new Error('CHECK_FOR_BUTTON_PRESS requires a non-zero value for `button_id`');
		}
		var mapLocalScriptId = handleScript(
			action.success_script,
			map,
			fileNameMap,
			scenarioData
		).mapLocalScriptId;
		data.dataView.setUint16(
			1,
			mapLocalScriptId,
			false
		);
		data.dataView.setUint8(
			3,
			action.button_id
		);
		return data;
	},
	RUN_SCRIPT: function (
		action,
		map,
		fileNameMap,
		scenarioData,
	) {
		var data = initActionData(action);
		if (!action.script) {
			throw new Error('RUN_SCRIPT requires a string value for `script`');
		}
		if (!scenarioData.scripts[action.script] && (action.script != 'null_script')) {
			throw new Error(`RUN_SCRIPT was not able to find a script named "${action.script}" provided at the value \`script\``);
		}
		var mapLocalScriptId = handleScript(
			action.script,
			map,
			fileNameMap,
			scenarioData
		).mapLocalScriptId;
		data.dataView.setUint16(
			1,
			mapLocalScriptId,
			false
		);
		return data;
	},
	BLOCKING_DELAY: function (action) {
		var data = initActionData(action);
		if (!action.delay_time) {
			throw new Error('BLOCKING_DELAY requires a non-zero value for `delay_time`');
		}
		data.dataView.setUint32(
			1,
			action.delay_time,
			false
		);
		return data;
	},
	NON_BLOCKING_DELAY: function (action) {
		var data = initActionData(action);
		if (!action.delay_time) {
			throw new Error('NON_BLOCKING_DELAY requires a non-zero value for `delay_time`');
		}
		data.dataView.setUint32(
			1,
			action.delay_time,
			false
		);
		return data;
	},
	SET_ENTITY_DIRECTION: function (
		action,
		map,
		fileNameMap,
		scenarioData,
	) {
		var data = initActionData(action);
		if (!action.entity) {
			throw new Error('SET_ENTITY_DIRECTION requires a string value for `entity`');
		}
		if (action.direction === undefined) {
			throw new Error('SET_ENTITY_DIRECTION requires a value for `direction`');
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
		var direction = directions[action.direction];
		if (direction === undefined) {
			throw new Error(`SET_ENTITY_DIRECTION requires a valid value for \`direction\`; Possible values:\n${
				Object.keys(directions)
			}`);
		}
		var entity = getObjectByNameOnMap(
			action.entity,
			map,
		)
		if (!entity) {
			throw new Error(`SET_ENTITY_DIRECTION was not able to find entity "${action.entity}" on map "${map.name}"`);
		}
		if (entity !== 255) {
			var mapLocalEntityIndex = map.entityIndices.indexOf(entity.compositeEntity.scenarioIndex);
		}
		else {
			mapLocalEntityIndex = 255;
		}
		if(mapLocalEntityIndex === -1) {
			throw new Error(`SET_ENTITY_DIRECTION fount entity "${action.entity}" on map "${map.name}", but it was somehow not already a member of the map it should be used on!`);
		}
		data.dataView.setUint8(
			1,
			mapLocalEntityIndex,
		);
		data.dataView.setUint8(
			2,
			direction,
		);
		return data;
	},
	SET_HEX_EDITOR_STATE: function (action) {
		var data = initActionData(action)
		if (typeof action.state !== "boolean") {
			throw new Error('SET_HEX_EDITOR_STATE requires a boolean value for `state`');
		}
		data.dataView.setUint8(
			1,
			action.state,
		);
		return data;
	},
	SET_HEX_EDITOR_DIALOG_MODE: function (action) {
		var data = initActionData(action)
		if (typeof action.state !== "boolean") {
			throw new Error('SET_HEX_EDITOR_DIALOG_MODE requires a boolean value for `state`');
		}
		data.dataView.setUint8(
			1,
			action.state,
		);
		return data;
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

var getObjectByNameOnMap = function(entityName, map) {
	if (entityName === '%SELF%') {
		return 255;
	}
	var object;
	map.layers.find(function (layer) {
		const isObjectsLayer = layer.type === 'objectgroup';
		if (isObjectsLayer) {
			object = layer.objects.find(function (object) {
				return object.name === entityName;
			});
		}
		return object !== undefined;
	});
	if (!object) {
		throw new Error(`No entity named "${entityName}" could be found on map: "${map.name}"!`);
	}
	return object;
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

var handleScript = function(
	scriptName,
	map,
	fileNameMap,
	scenarioData,
) {
	var script = scriptName === 'null_script'
		? []
		: jsonClone(scenarioData.scripts[scriptName]);
	if (!script) {
		throw new Error(`Script: "${scriptName}" could not be found in scenario.json!`);
	}
	if(script.length == 0) {
		return {
			mapLocalScriptId: 0,
			globalScriptId: 0
		};
	}
	if (script.scenarioIndex === undefined) {
		script.scenarioIndex = scenarioData.parsed.scripts.length;
		scenarioData.parsed.scripts.push(script);
		script.serialized = serializeScript(
			script,
			scriptName,
			map,
			fileNameMap,
			scenarioData,
		);
	}
	var mapLocalScriptId = map.scriptIndices.length;
	map.scriptIndices.push(script.scenarioIndex);
	return {
		mapLocalScriptId: mapLocalScriptId,
		globalScriptId: script.scenarioIndex
	};
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
	map.scriptIndices.push(0); // add the global null_script id to the local map scripts
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
