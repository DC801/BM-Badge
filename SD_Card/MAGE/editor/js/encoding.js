var dataTypes = [
	'maps',
	'tilesets',
	'animations',
	'entityTypes',
	'entities',
	'geometry',
	'scripts',
	'portraits',
	'dialogs',
	'serialDialogs',
	'imageColorPalettes',
	'strings',
	'save_flags',
	'variables',
	'images',
];

var checkMapEntityPropertyPresent = function(compositeEntity, propertyToCheck) {
	var scriptName = '';
	var foundScriptDefinition = false; // TODO

	if (! ('properties' in compositeEntity)) {
		return null;
	}

	for (var index in compositeEntity.properties) {
		var entityProperty = compositeEntity.properties[index];
		if (entityProperty.name == propertyToCheck) {
			scriptName = entityProperty.value;
			// if (findScriptDefinition(scriptName)) {
			// 	foundScriptDefinition = true;
			// } // TODO
			break; // no need to search for the right property object more after finding it
		}
	}

	if (foundScriptDefinition) {
		return null; // no problem found for this check
	} // note foundScriptDefinition being true implies scriptName is also set

	var result = `${compositeEntity.name || "NO NAME"} (id ${compositeEntity.id}) needs a ${propertyToCheck} script`;

	if (scriptName) { // a script name is present in map data but never defined in mgs folder
		// num_undefined_scripts += 1; // TODO
		result += ` (UNDEFINED: script \'${scriptName}\' expected from the map file is never defined)`;
	}

	return result;
};

var handleScenarioData = function (fileNameMap) {
	return function (scenarioData) {
		console.log(
			'scenario.json',
			scenarioData
		);
		scenarioData.tilesetMap = {};
		scenarioData.mapsByName = {};
		scenarioData.parsed = {};
		scenarioData.uniqueStringLikeMaps = {
			strings: {},
			save_flags: {},
			variables: {},
		};
		scenarioData.uniqueDialogMap = {};
		scenarioData.entityTypesPlusProperties = {};
		dataTypes.forEach(function (typeName) {
			scenarioData.parsed[typeName] = [];
		});
		scenarioData.dialogSkinsTilesetMap = {}
		scenarioData.sanityChecks = {
			problems: {},
			checks: {
				checkInteractScript: function(compositeEntity) {
					return checkMapEntityPropertyPresent(compositeEntity, 'on_interact');
				},
				checkLookScript: function(compositeEntity) {
					return checkMapEntityPropertyPresent(compositeEntity, 'on_look');
				},
				checkNamePresent: function(compositeEntity) {
					if (compositeEntity.name == undefined || compositeEntity.name == null || ! (compositeEntity.name.replace(/\s/g, '').length)) {
						return `${compositeEntity.name || "NO NAME"} (id ${compositeEntity.id}) needs a name in the map file`;
					} else {
						return null;
					}
				}
			}
		};
		var preloadSkinsPromise = preloadAllDialogSkins(fileNameMap, scenarioData);
		var portraitsFile = fileNameMap['portraits.json'];
		var portraitsPromise = preloadSkinsPromise.then(function preloadSkinHandler () {
			return getFileJson(portraitsFile)
				.then(handlePortraitsData(fileNameMap, scenarioData))
		});
		var entityTypesFile = fileNameMap['entity_types.json'];
		var entityTypesPromise = portraitsPromise.then(function portraitPromiseHandler () {
			return getFileJson(entityTypesFile)
				.then(handleEntityTypesData(fileNameMap, scenarioData))
		});

		var mergeNamedJsonIntoScenario = function (
			pathPropertyName,
			destinationPropertyName,
			mergeSuccessCallback
		) {
			return function (
				fileNameMap,
				scenarioData,
			) {
				var collectedTypeMap = {};
				var itemSourceFileMap = {};
				var fileItemMap = {};
				scenarioData[destinationPropertyName] = collectedTypeMap;
				scenarioData[destinationPropertyName + 'SourceFileMap'] = itemSourceFileMap;
				scenarioData[destinationPropertyName + 'FileItemMap'] = fileItemMap;
				var result = Promise.all(
					scenarioData[pathPropertyName].map(function(filePath) {
						var fileName = filePath.split('/').pop();
						var fileObject = fileNameMap[fileName];
						if (!fileObject) {
							throw new Error(`File listed in 'scenario.json' not found: '${fileName}'`);
						}
						return getFileJson(fileObject)
							.then(function(fileData) {
								Object.keys(fileData)
									.forEach(function(itemName, index) {
										if (collectedTypeMap[itemName]) {
											throw new Error(`Duplicate ${destinationPropertyName} name "${itemName}" found in ${fileName}!`);
										}
										fileData[itemName].name = itemName;
										collectedTypeMap[itemName] = fileData[itemName];
										itemSourceFileMap[itemName] = {
											fileName: fileName,
											index: index
										};
										if (!fileItemMap[fileName]) {
											fileItemMap[fileName] = [];
										}
										fileItemMap[fileName].push(
											itemName
										);
									});
							});
					})
				)
					.then(function () {
						return collectedTypeMap;
					});
				if (mergeSuccessCallback) {
					result = result.then(mergeSuccessCallback);
				}
				return result;
			}
		};

		var natlangMgsPromise = convertMgsFilesIntoScenarioDataConfig(
			fileNameMap,
			scenarioData,
		);

		var mergeScriptDataIntoScenario = mergeNamedJsonIntoScenario(
			'scriptPaths',
			'scripts',
			function (allScripts) {
				var lookaheadAndIdentifyAllScriptVariables = makeVariableLookaheadFunction(scenarioData);
				Object.values(allScripts)
					.forEach(lookaheadAndIdentifyAllScriptVariables);
			}
		);
		var mergeDialogDataIntoScenario = mergeNamedJsonIntoScenario(
			'dialogPaths',
			'dialogs',
		);
		var mergeSerialDialogDataIntoScenario = mergeNamedJsonIntoScenario(
			'serialDialogPaths',
			'serialDialogs',
		);
		return Promise.all([
			entityTypesPromise,
			natlangMgsPromise,
			mergeMapDataIntoScenario(fileNameMap, scenarioData),
		])
			.then(function mergeScriptDialogAndSerialDialog () {
				return Promise.all([
					mergeScriptDataIntoScenario(fileNameMap, scenarioData),
					mergeDialogDataIntoScenario(fileNameMap, scenarioData),
					mergeSerialDialogDataIntoScenario(fileNameMap, scenarioData),
				])
			})
			.then(function processMaps () {
				serializeNullScript(
					fileNameMap,
					scenarioData,
				);
				return handleScenarioMaps(scenarioData, fileNameMap)
					.then(function () {
						return scenarioData;
					});
			});
	}
};

var addParsedTypeToHeadersAndChunks = function (
	parsedItems,
	indicesDataView,
	chunks
) {
	indicesDataView.setUint32(
		indicesDataView.headerOffset,
		parsedItems.length,
		IS_LITTLE_ENDIAN
	);
	indicesDataView.headerOffset += 4;
	parsedItems.forEach(function (item, index, list) {
		var headerOffsetOffset = indicesDataView.headerOffset + (index * 4);
		var headerLengthOffset = (
			headerOffsetOffset
			+ (list.length * 4)
		);
		var totalSize = 0;
		indicesDataView.setUint32(
			headerOffsetOffset,
			indicesDataView.fileOffset,
			IS_LITTLE_ENDIAN
		);
		chunks.push(item.serialized);
		totalSize += item.serialized.byteLength;
		indicesDataView.setUint32(
			headerLengthOffset,
			totalSize,
			IS_LITTLE_ENDIAN
		);
		indicesDataView.fileOffset += totalSize;
	});
	indicesDataView.headerOffset += parsedItems.length * 8;
};

var makeCRCTable = function(){
	var c;
	var crcTable = [];
	for(var n =0; n < 256; n++){
		c = n;
		for(var k =0; k < 8; k++){
			c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
		}
		crcTable[n] = c;
	}
	return crcTable;
}

var crc32 = function(data) {
	var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
	var crc = 0 ^ (-1);
	for (var i = 0; i < data.length; i++ ) {
		crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
	}
	return (crc ^ (-1)) >>> 0;
};

var generateIndexAndComposite = function (scenarioData) {
	// console.log(
	// 	'generateIndexAndComposite:scenarioData',
	// 	scenarioData
	// );
	var signature = new ArrayBuffer(20);
	var signatureDataView = new DataView(signature);
	setCharsIntoDataView(
		signatureDataView,
		'MAGEGAME',
		0
	);
	var headerSize = 0;
	dataTypes.forEach(function (typeName) {
		headerSize += (
			4 // uint32_t count
			+ (4 * scenarioData.parsed[typeName].length) // uint32_t offsets
			+ (4 * scenarioData.parsed[typeName].length) // uint32_t lengths
		)
	});
	var indices = new ArrayBuffer(headerSize);
	var indicesDataView = new DataView(indices);
	var chunks = [
		signature,
		indices
	];
	indicesDataView.fileOffset = signature.byteLength + indices.byteLength;
	indicesDataView.headerOffset = 0;

	dataTypes.forEach(function (type) {
		addParsedTypeToHeadersAndChunks(
			scenarioData.parsed[type],
			indicesDataView,
			chunks
		);
	})

	var compositeSize = chunks.reduce(
		function (accumulator, item) {
			return accumulator + item.byteLength;
		},
		0
	);
	var compositeArray = new Uint8Array(compositeSize);
	var currentOffset = 0;
	chunks.forEach(function (item) {
		compositeArray.set(
			new Uint8Array(item),
			currentOffset
		);
		currentOffset += item.byteLength;
	});

	var compositeArrayDataView = new DataView(compositeArray.buffer);
	var compositeArrayDataViewOffsetBySignature = new Uint8Array(
		compositeArray.buffer,
		signature.byteLength
	);
	var checksum = crc32(compositeArrayDataViewOffsetBySignature);
	compositeArrayDataView.setUint32(
		8,
		ENGINE_VERSION,
		IS_LITTLE_ENDIAN
	);
	compositeArrayDataView.setUint32(
		12,
		checksum,
		IS_LITTLE_ENDIAN
	);
	compositeArrayDataView.setUint32(
		16,
		compositeSize,
		IS_LITTLE_ENDIAN
	);

	console.log(
		'compositeArray',
		compositeArray
	);
	var hashHex = [
		compositeArray[12],
		compositeArray[13],
		compositeArray[14],
		compositeArray[15],
	].map(function (value) {
		return value.toString(16).padStart(2, 0)
	}).join('');
	var lengthHex = [
		compositeArray[16],
		compositeArray[17],
		compositeArray[18],
		compositeArray[19],
	].map(function (value) {
		return value.toString(16).padStart(2, 0)
	}).join('');
	console.log('data crc32:', checksum);
	console.log('data crc32 hex:', hashHex);
	console.log('data length:', compositeSize);
	console.log('data length hex:', lengthHex);
	return compositeArray;
};
