var actionHandlerMap = {
    NULL_ACTION: 0,
    CHECK_ENTITY_BYTE: 1,
    CHECK_SAVE_FLAG: 2,
    CHECK_IF_ENTITY_IS_IN_GEOMETRY: 3,
    CHECK_FOR_BUTTON_PRESS: function (
        action,
        map,
        fileNameMap,
        scenarioData,
    ) {
        var data = initActionData(action);
        if (!action.success_script) {
            throw new Error('CHECK_FOR_BUTTON_PRESS requires a non-zero value for `success_script`');
        }
        if (!action.button_id) {
            throw new Error('CHECK_FOR_BUTTON_PRESS requires a non-zero value for `button_id`');
        }
        var serializedScriptId = handleScript(
            action.success_script,
            map,
            fileNameMap,
            scenarioData
        );
        data.dataView.setUint16(
            1,
            serializedScriptId,
            false
        );
        data.dataView.setUint8(
            3,
            action.button_id,
            false
        );
        return data;
    },
    CHECK_FOR_BUTTON_STATE: 5,
    RUN_SCRIPT: 6,
    COMPARE_ENTITY_NAME: 7,
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
    NON_BLOCKING_DELAY: 9,
    SET_PAUSE_STATE: 10,
    SET_ENTITY_BYTE: 11,
    SET_SAVE_FLAG: 12,
    SET_PLAYER_CONTROL: 13,
    SET_ENTITY_INTERACT_SCRIPT: 14,
    SET_ENTITY_TICK_SCRIPT: 15,
    SET_MAP_TICK_SCRIPT: 16,
    SET_ENTITY_TYPE: 17,
    SET_HEX_CURSOR_LOCATION: 18,
    SET_HEX_BIT: 19,
    UNLOCK_HAX_CELL: 20,
    LOCK_HAX_CELL: 21,
    LOAD_MAP: 22,
    SCREEN_SHAKE: 23,
    SCREEN_FADE_OUT: 24,
    SCREEN_FADE_IN: 25,
    SHOW_DIALOG: 26,
    SET_RENDERABLE_FONT: 27,
    MOVE_ENTITY_TO_GEOMETRY: 28,
    MOVE_ENTITY_ALONG_GEOMETRY: 29,
    LOOP_ENTITY_ALONG_GEOMETRY: 30,
    MOVE_CAMERA_TO_GEOMETRY: 31,
    MOVE_CAMERA_ALONG_GEOMETRY: 32,
    LOOP_CAMERA_ALONG_GEOMETRY: 33,
    SET_ENTITY_DIRECTION: 34,
    SET_HEX_EDITOR_STATE:  function (action) {
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
var actionNames = Object.keys(actionHandlerMap);

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
    var handler = actionHandlerMap[action.name];
    if (!handler) {
        throw new Error(`Action: "${action.name}" is not valid! Check the "actionHandlerMap" for valid options!`);
    }
    if (typeof handler === 'number') {
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
        16 // char[16] name
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
        offset += 16
    );
    dataView.setUint32(
        offset,
        script.length,
        false
    );
    offset += 1;
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
        : scenarioData.scripts[scriptName];
    if (!script) {
        throw new Error(`Script: "${scriptName}" could not be found in scenario.json!`);
    }
    if (script && (script.scenarioIndex === undefined)) {
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
    return script.scenarioIndex;
};

var handleMapScripts = function (
    map,
    fileNameMap,
    scenarioData,
) {
    //  {
    //    "name":"on_load",
    //    "type":"string",
    //    "value":"my_first_script"
    //  },
    (map.properties || []).forEach(function(property) {
        if (property.name === 'on_load') {
            map.on_load = handleScript(
                property.value,
                map,
                fileNameMap,
                scenarioData,
            );
        } else if (property.name === 'on_tick') {
            map.on_tick = handleScript(
                property.value,
                map,
                fileNameMap,
                scenarioData,
            );
        }
    });
};
