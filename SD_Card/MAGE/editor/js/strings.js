var serializeString = function (
	string,
	map,
	fileNameMap,
	scenarioData,
) {
	return serializeSomethingLikeAString(
		string,
		map,
		fileNameMap,
		scenarioData,
		'strings'
	);
};
var serializeSaveFlag = function (
	string,
	map,
	fileNameMap,
	scenarioData,
) {
	return serializeSomethingLikeAString(
		string,
		map,
		fileNameMap,
		scenarioData,
		'save_flags'
	);
};
var serializeVariable = function (
	string,
	map,
	fileNameMap,
	scenarioData,
) {
	var variableId = serializeSomethingLikeAString(
		string,
		map,
		fileNameMap,
		scenarioData,
		'variables'
	);
	if(variableId > 255) {
		throw new Error(`There is a limit of 255 Variables! The one that broke the encoder's back was: "${string}"`);
	}
	return variableId;
};
var serializeSomethingLikeAString = function (
	string,
	map,
	fileNameMap,
	scenarioData,
	destinationPropertyName,
) {
	var parsedString = templatizeString(
		string,
		map,
		scenarioData,
	);
	var scenarioIndex = scenarioData.uniqueStringLikeMaps[destinationPropertyName][parsedString];
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
			scenarioIndex: scenarioData.parsed[destinationPropertyName].length,
		};
		scenarioData.parsed[destinationPropertyName].push(encodedString);
		scenarioIndex = encodedString.scenarioIndex;
		scenarioData.uniqueStringLikeMaps[destinationPropertyName][parsedString] = scenarioIndex;
	}
	return scenarioIndex;
};

var templatizeString = function (
	templateString,
	map,
	scenarioData,
) {
	var entityRegex = /%(.*?)%/gm;
	var variableRegex = /\$(.*?)\$/gm;
	var entityIndexReplaceFunction = function (
		wholeVariable,
		variableName
	) {
		var entityLookupString = specialKeywordsEnum[wholeVariable]
			? wholeVariable
			: variableName;
		var entity = getObjectByNameOnMap(
			entityLookupString,
			map,
			{
				action: templateString
			}
		)
		var entityId = (
			entity.specialIndex
			|| entity.mapIndex
		);
		return `%%${entityId}%%`;
	}
	var variableIndexReplaceFunction = function (
		wholeVariable,
		variableName
	) {
		var variableIndex = scenarioData.uniqueStringLikeMaps.variables[variableName];
		if(variableIndex === undefined) {
			throw new Error(`templatizeString was unable to find the variable "${variableName}" in the string "${templateString}"`);
		}
		return `$$${variableIndex}$$`;
	}
	return templateString
		.replace(
			entityRegex,
			entityIndexReplaceFunction
		)
		.replace(
			variableRegex,
			variableIndexReplaceFunction
		);
};
