var dialogAlignmentEnum = {
	BOTTOM_LEFT: 0,
	BOTTOM_RIGHT: 1,
	TOP_LEFT: 2,
	TOP_RIGHT: 3,
};
var dialogResponseTypeEnum = {
	NO_RESPONSE: 0,
	SELECT_FROM_SHORT_LIST: 1,
	SELECT_FROM_LONG_LIST: 2,
	ENTER_NUMBER: 3,
	ENTER_ALPHANUMERIC: 4
};

var serializeDialog = function (
	dialog,
	map,
	fileNameMap,
	scenarioData,
) {
	if (
		!Array.isArray(dialog)
		|| !dialog.length
	) {
		throw new Error(`Dialog named "${dialog.name}" is malformed, it has no dialogScreens!`);
	}
	dialog.forEach(function (dialogScreen, index) {
		if(
			!Array.isArray(dialogScreen.messages)
			|| !dialogScreen.messages.length
		) {
			throw new Error(`Dialog named "${dialog.name}" is malformed, the ${index}th dialogScreen contains no messages!`);
		}
	});
	var uniqueMapAndDialogKey = `map:${
		map.name.replace('map-', '')
	},dialog:${
		dialog.name.replace('dialog-', '')
	}`;
	var scenarioIndex = scenarioData.uniqueDialogMap[uniqueMapAndDialogKey];
	if(scenarioIndex === undefined) {
		var headerLength = getPaddedHeaderLength(
			32 // char[32] name
			+ 4 // uint32_t screen_count
		);
		var result = new ArrayBuffer(
			headerLength
		);
		var dataView = new DataView(result);
		var offset = 0;
		setCharsIntoDataView(
			dataView,
			uniqueMapAndDialogKey,
			0,
			offset += 32
		);
		dataView.setUint32(
			offset, // uint32_t screen_count
			dialog.length,
			IS_LITTLE_ENDIAN
		);
		offset += 4;
		dialog.forEach(function (dialogScreen) {
			result = combineArrayBuffers(
				result,
				serializeDialogScreen(
					dialogScreen,
					map,
					fileNameMap,
					scenarioData,
				),
			);
		});
		var encodedDialog = {
			name: uniqueMapAndDialogKey,
			serialized: result,
			scenarioIndex: scenarioData.parsed.dialogs.length,
		}
		scenarioData.parsed.dialogs.push(encodedDialog);
		scenarioIndex = encodedDialog.scenarioIndex;
		scenarioData.uniqueDialogMap[uniqueMapAndDialogKey] = scenarioIndex;
	}
	return scenarioIndex;
};

var getPortraitIndexFromDialogScreen = function(
	dialogScreen,
	scenarioData
) {
	var portrait = scenarioData.portraits[dialogScreen.portrait];
	if(dialogScreen.portrait && !portrait) {
		throw new Error(`DialogScreen referenced a invalid portrait name: ${dialogScreen.portrait}!\nDialog was: ${JSON.stringify(dialogScreen, null, '\t')}`);
	}
	return dialogScreen.portrait
		? portrait.scenarioIndex
		: DIALOG_SCREEN_NO_PORTRAIT
}

var serializeDialogScreen = function (
	dialogScreen,
	map,
	fileNameMap,
	scenarioData,
) {
	var responses = dialogScreen.options || [];
	var entity = dialogScreen.entity
		? getObjectByNameOnMap(
			dialogScreen.entity,
			map,
			{ action: "serializeDialogScreen" },
		)
		: null;
	var entityIndex = dialogScreen.entity
		? (entity.specialIndex || entity.mapIndex)
		: DIALOG_SCREEN_NO_ENTITY;
	var portraitIndex = getPortraitIndexFromDialogScreen(
		dialogScreen,
		scenarioData
	);
	var name = (
		dialogScreen.name
		|| (
			entityIndex
				? dialogScreen.entity
				: ""
		)
	);
	var headerLength = getPaddedHeaderLength(
		+ 2 // uint16_t name_string_index
		+ 2 // uint16_t border_tileset_index
		+ 1 // uint8_t alignment
		+ 1 // uint8_t font_index
		+ 1 // uint8_t message_count
		+ 1 // uint8_t response_type
		+ 1 // uint8_t response_count
		+ 1 // uint8_t entity_id
		+ 1 // uint8_t portrait_id
		+ 1 // uint8_t emote
		+ (2 * dialogScreen.messages.length) // uint16_t messages[message_count]
		+ (
			(
				+ 2 //stringIndex
				+ 2 //mapLocalScriptIndex
			)
			* responses.length
		) // uint16_t responses[response_count]
	);
	var result = new ArrayBuffer(
		headerLength
	);
	var dataView = new DataView(result);
	var offset = 0;
	var nameStringId = serializeString(
		name,
		map,
		fileNameMap,
		scenarioData,
	);
	dataView.setUint16(
		offset, // uint16_t name_index
		nameStringId,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	var dialogTilesetFilePath = scenarioData.dialogSkins[dialogScreen.border_tileset || 'default'];
	var borderTileset = getPreloadedTilesetByName(
		dialogTilesetFilePath,
		fileNameMap,
		scenarioData,
	);
	dataView.setUint16(
		offset, // uint16_t border_tileset_index
		borderTileset.scenarioIndex,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint8(
		offset, // uint8_t alignment
		dialogAlignmentEnum[dialogScreen.alignment] || 0, // TODO: Make MORE use of ksy enum `dialog_screen_alignment_type`
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t font_index
		0, // TODO: add font_index support
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t message_count
		dialogScreen.messages.length,
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t response_type
		dialogResponseTypeEnum[dialogScreen.response_type] || 0,
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t response_count
		responses.length,
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t entity_id
		entityIndex,
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t portrait_id
		portraitIndex,
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t emote
		dialogScreen.emote || 0,
	);
	offset += 1;
	dialogScreen.messages.forEach(function (message) {
		var stringId = serializeString(
			message,
			map,
			fileNameMap,
			scenarioData,
		);
		dataView.setUint16(
			offset, // uint16_t string_id
			stringId,
			IS_LITTLE_ENDIAN
		);
		offset += 2;
	});
	responses.forEach(function (response) {
		var stringId = serializeString(
			response.label.toLocaleLowerCase(),
			map,
			fileNameMap,
			scenarioData,
		);
		var encodedScript = handleScript(
			response.script,
			map,
			fileNameMap,
			scenarioData
		);
		dataView.setUint16(
			offset, // uint16_t string_id
			stringId,
			IS_LITTLE_ENDIAN
		);
		offset += 2;
		dataView.setUint16(
			offset, // uint16_t string_id
			encodedScript.mapLocalScriptId,
			IS_LITTLE_ENDIAN
		);
		offset += 2;
	});
	return result;
};

var preloadAllDialogSkins = function (filenameMap, scenarioData) {
	return Promise.all(Object.keys(scenarioData.dialogSkins).map((function(key) {
		return loadTilesetByName(
			scenarioData.dialogSkins[key],
			filenameMap,
			scenarioData,
		);
	})));
};
