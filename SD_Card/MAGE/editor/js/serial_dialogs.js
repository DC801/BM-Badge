var serialDialogResponseTypeEnum = {
	NONE: 0,
	ENTER_NUMBER: 1,
	ENTER_STRING: 2
};

var emptyMap = { // global scope, mock being real map
	name: 'GLOBAL',
	scriptIndices: [],
	scriptNameKeys: {},
	layers: []
}

var serializeSerialDialog = function (
	serialDialog,
	map,
	fileNameMap,
	scenarioData,
) {
	if(
		!Array.isArray(serialDialog.messages)
		|| !serialDialog.messages.length
	) {
		throw new Error(`SerialDialog named "${serialDialog.name}" is malformed, it contains no messages!`);
	}
	var uniqueSerialDialogKey = serialDialog.name.replace('serial_dialog-', '');
	var scenarioIndex = serialDialog.scenarioIndex;
	if(scenarioIndex === undefined) {
		var responses = serialDialog.options || [];
		var responseType = serialDialogResponseTypeEnum.NONE;
		if (responses.length && serialDialog.text_options) {
			throw new Error(`SerialDialog named "${serialDialog.name}" is malformed, it has both 'options' and
'text_options'! Pick one, not both!`);
		}
		if (responses.length) {
			responseType = serialDialogResponseTypeEnum.ENTER_NUMBER;
		}
		var textOptions = serialDialog.text_options;
		if (textOptions) {
			responseType = serialDialogResponseTypeEnum.ENTER_STRING;
			responses = convertTextOptionsToResponses(textOptions);
		}
		if (responses.length > 255) {
			throw new Error(`SerialDialog named "${serialDialog.name}" is malformed, it has too many options! It should have less than 256 options!!`);
		}
		var headerLength = getPaddedHeaderLength(
			32 // char[32] name
			+ 2 // uint16_t string_id
			+ 1 // uint8_t response_type
			+ 1 // uint8_t response_count
			+ (
				(
					+ 2 //string_id
					+ 2 //map_local_script_id
				)
				* responses.length
			) // responses[response_count]
		);
		var result = new ArrayBuffer(
			headerLength
		);
		var dataView = new DataView(result);
		var offset = 0;
		setCharsIntoDataView(
			dataView,
			uniqueSerialDialogKey,
			0,
			offset += 32
		);
		var stringId = serializeString(
			serialDialog.messages.join('\n'),
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
		dataView.setUint8(
			offset, // uint8_t response_type
			responseType || 0,
		);
		offset += 1;
		dataView.setUint8(
			offset, // uint8_t response_count
			responses.length,
		);
		offset += 1;
		responses.forEach(function (response) {
			var stringId = serializeString(
				response.label,
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
				offset, // uint16_t map_local_script_id
				encodedScript.mapLocalScriptId,
				IS_LITTLE_ENDIAN
			);
			offset += 2;
		});
		var encodedSerialDialog = {
			name: uniqueSerialDialogKey,
			serialized: result,
			scenarioIndex: scenarioData.parsed.serialDialogs.length,
		}
		scenarioData.parsed.serialDialogs.push(encodedSerialDialog);
		scenarioIndex = encodedSerialDialog.scenarioIndex;
	}
	return scenarioIndex;
};
