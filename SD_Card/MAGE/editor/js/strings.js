var serializeString = function (
	string,
	map,
	fileNameMap,
	scenarioData,
) {
	var parsedString = templatizeString(string, map);
	var scenarioIndex = scenarioData.uniqueStringMap[parsedString];
	if (scenarioIndex === undefined) {
		// allow for explicit null char at the end
		var paddedLength = getPaddedHeaderLength(parsedString.length + 1);
		var buffer = new ArrayBuffer(paddedLength);
		var dataView = new DataView(buffer);
		setCharsIntoDataView(
			dataView,
			parsedString,
			0,
			paddedLength - 1,
		);
		var encodedString = {
			name: parsedString,
			serialized: buffer,
			scenarioIndex: scenarioData.parsed.strings.length,
		};
		scenarioData.parsed.strings.push(encodedString);
		scenarioIndex = encodedString.scenarioIndex;
		scenarioData.uniqueStringMap[parsedString] = scenarioIndex;
	}
	return scenarioIndex;
};

var templatizeString = function (templateString, map) {
	var variableRegex = /%(.*?)%/gm
	var replaceFunction = function (
		wholeVariable,
		variableName
	) {
		var entityLookupString = specialKeywordsEnum[wholeVariable]
			? wholeVariable
			: variableName;
		var entity = getObjectByNameOnMap(entityLookupString, map, templateString)
		var entityId = (
			entity.specialIndex
			|| entity.mapIndex
		);
		return `%%${entityId}%%`;
	}
	return templateString.replace(
		variableRegex,
		replaceFunction
	)
}