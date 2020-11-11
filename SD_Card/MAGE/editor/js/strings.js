var serializeString = function (
	string,
	fileNameMap,
	scenarioData,
) {
	var scenarioIndex = scenarioData.uniqueStringMap[string];
	if (scenarioIndex === undefined) {
		var paddedLength = getPaddedHeaderLength(string.length);
		var buffer = new ArrayBuffer(paddedLength);
		var dataView = new DataView(buffer);
		setCharsIntoDataView(
			dataView,
			string,
			0,
			paddedLength,
		);
		var encodedString = {
			name: string,
			serialized: buffer,
			scenarioIndex: scenarioData.parsed.strings.length,
		}
		scenarioData.parsed.strings.push(encodedString);
		scenarioIndex = encodedString.scenarioIndex;
		scenarioData.uniqueStringMap[string] = scenarioIndex;
	}
	return scenarioIndex;
};
