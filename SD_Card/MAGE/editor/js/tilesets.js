var serializeTileset = function (tilesetData, image) {
	var tilesetHeaderLength = getPaddedHeaderLength(
		16 // char[16] name
		+ 2 // uint16_t imageIndex
		+ 2 // uint16_t imageWidth
		+ 2 // uint16_t imageHeight
		+ 2 // uint16_t tileWidth
		+ 2 // uint16_t tileHeight
		+ 2 // uint16_t cols
		+ 2 // uint16_t rows
	);
	var header = new ArrayBuffer(
		tilesetHeaderLength
	);
	var dataView = new DataView(header);
	var offset = 0;
	setCharsIntoDataView(
		dataView,
		tilesetData.name,
		0,
		offset += 16
	);
	dataView.setUint16(
		offset, // uint16_t imageIndex
		image.scenarioIndex,
		IS_LITTLE_ENDIAN
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t imageWidth
		tilesetData.tilewidth, // used to be tilesetData.imagewidth,
		IS_LITTLE_ENDIAN
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t imageHeight
		tilesetData.rows * tilesetData.columns * tilesetData.tileheight, // used to be tilesetData.imageheight
		IS_LITTLE_ENDIAN
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t tileWidth
		tilesetData.tilewidth,
		IS_LITTLE_ENDIAN
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t tileHeight
		tilesetData.tileheight,
		IS_LITTLE_ENDIAN
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t cols
		1, // used to be tilesetData.columns,
		IS_LITTLE_ENDIAN
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t rows
		tilesetData.rows * tilesetData.columns,
		IS_LITTLE_ENDIAN
	);
	var result = combineArrayBuffers(
		header,
		tilesetData.serializedTiles
	);
	return result;
};

var handleTilesetData = function (tilesetFile, scenarioData, fileNameMap) {
	return function (tilesetData) {
		tilesetData.filename = tilesetFile.name;
		tilesetData.scenarioIndex = tilesetFile.scenarioIndex;
		scenarioData.parsed.tilesets[tilesetData.scenarioIndex] = tilesetData;
		// console.log(
		// 	'Tileset:',
		// 	tilesetFile.name,
		// 	tilesetData
		// );
		scenarioData.tilesetMap[tilesetData.filename] = tilesetData;
		tilesetData.serializedTiles = new ArrayBuffer(
			getPaddedHeaderLength(tilesetData.tilecount * 2)
		);
		var tileDataView = new DataView(tilesetData.serializedTiles);
		// forget about the built-in name, using file name instead.
		tilesetData.name = tilesetFile.name.split('.')[0];
		// already has columns, add the missing pair
		tilesetData.rows = Math.floor(tilesetData.imageheight / tilesetData.tileheight);
		(tilesetData.tiles || []).forEach(function (tile) {
			mergeInProperties(
				tile,
				tile.properties
			);
			var entityPrototype = (
				scenarioData.entityTypesPlusProperties[tile.type]
				|| {}
			);
			Object.assign(
				tile,
				assignToLessFalsy(
					{},
					entityPrototype,
					tile
				)
			);
			if (
				tile.objectgroup
				&& tile.objectgroup.objects
			) {
				// we probably have tile geometry!
				if (tile.objectgroup.objects.length > 1) {
					throw new Error(`${tilesetData.name} has more than one geometry on a single tile!`);
				}
				var geometry = handleTiledObjectAsGeometry(
					tile.objectgroup.objects[0],
					fileNameMap,
					scenarioData,
				);
				if (geometry) {
					tileDataView.setUint16(
						tile.id * 2,
						geometry.scenarioIndex + 1, // because if it's 0, we shouldn't have to
						IS_LITTLE_ENDIAN,
					);
				}
			}
			if (tile.animation) {
				serializeAnimationData(tile, tilesetData, scenarioData);
			}
		});
		var filePromise = handleImage(tilesetData, scenarioData, fileNameMap)
			.then(function () {
				return tilesetData;
			});
		var imageFileName = tilesetData.image.split('/').pop();
		tilesetData.imageFileName = imageFileName;
		var imageFile = fileNameMap[imageFileName];
		tilesetData.imageFile = imageFile;
		tilesetData.serialized = serializeTileset(tilesetData, imageFile);
		tilesetFile.parsed = tilesetData;
		return filePromise
	};
};

var loadTilesetByName = function(
	tilesetFileName,
	fileNameMap,
	scenarioData,
) {
	var tilesetFileNameSplit = tilesetFileName.split('/').pop();
	var tilesetFile = fileNameMap[tilesetFileNameSplit];
	if (!tilesetFile) {
		throw new Error(
			'Tileset `' + tilesetFileNameSplit + '` could not be found in folder!'
		);
	} else {
		if (tilesetFile.scenarioIndex === undefined) {
			tilesetFile.scenarioIndex = scenarioData.parsed.tilesets.length;
			scenarioData.parsed.tilesets.push({
				name: `temporary - ${tilesetFileNameSplit} - awaiting parse`,
				scenarioIndex: tilesetFile.scenarioIndex
			});
		}
		return (
			tilesetFile.parsed
				? Promise.resolve(tilesetFile.parsed)
				: getFileJson(tilesetFile)
					.then(handleTilesetData(tilesetFile, scenarioData, fileNameMap))
		)
	}
};

var getPreloadedTilesetByName = function(
	tilesetFileName,
	fileNameMap,
	scenarioData,
) {
	var tilesetFileNameSplit = tilesetFileName.split('/').pop();
	var tilesetFile = fileNameMap[tilesetFileNameSplit];
	if (!tilesetFile.parsed) {
		throw new Error(
			'Tileset `' + tilesetFileNameSplit + '` was not loaded at the time it was requested!'
		);
	}
	return tilesetFile.parsed;
};
