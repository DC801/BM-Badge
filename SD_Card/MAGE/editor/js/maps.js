// reference: https://doc.mapeditor.org/en/stable/reference/tmx-map-format/#tile-flipping
var FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
var FLIPPED_VERTICALLY_FLAG   = 0x40000000;
var FLIPPED_DIAGONALLY_FLAG   = 0x20000000;
var getMapTileAndOrientationByGID = function (tileGID, map) {
	var targetTileset = {};
	var tileId = tileGID;
	// Clear the flags
	tileId &= ~(
		FLIPPED_HORIZONTALLY_FLAG
		| FLIPPED_VERTICALLY_FLAG
		| FLIPPED_DIAGONALLY_FLAG
	);
	map.tilesets.find(function (tileset, index) {
		var overshot = tileId < tileset.firstgid;
		if(!overshot) {
			targetTileset = tileset;
		}
		return overshot;
	});
	var tileIndex = tileId - targetTileset.firstgid;

	var flip_x = !!(tileGID & FLIPPED_HORIZONTALLY_FLAG);
	var flip_y = !!(tileGID & FLIPPED_VERTICALLY_FLAG);
	var flip_diag = !!(tileGID & FLIPPED_DIAGONALLY_FLAG);
	return {
		tileset: targetTileset,
		tileIndex: tileIndex,
		flip_x: flip_x,
		flip_y: flip_y,
		flip_diag: flip_diag,
		renderFlags: (
			(flip_x << 2)
			+ (flip_y << 1)
			+ (flip_diag << 0)
		),
		tile: (targetTileset.parsed.tiles || []).find(function (tile) {
			return tile.id === tileIndex;
		}) || {
			id: tileIndex
		}
	}
};

var handleTileLayer = function(layer, map) {
	var bytesPerTile = 4;
	var mapLayerByteSize = bytesPerTile * map.height * map.width;
	var serializedLayer = new ArrayBuffer(mapLayerByteSize);
	var dataView = new DataView(serializedLayer);
	var offset = 0;
	var tileGid;
	var tileData;
	while (offset < layer.data.length) {
		tileGid = layer.data[offset];
		if (tileGid) { // if tileGid is 0, it's an empty tile, no work to do
			tileData = getMapTileAndOrientationByGID(tileGid, map);
			dataView.setUint16(
				(offset * bytesPerTile),
				tileData.tileIndex + 1, // because 0 must mean "empty"
				false // fix endianness of output, little -> big
			);
			dataView.setUint8(
				(offset * bytesPerTile) + 2,
				tileData.tileset.parsed.scenarioIndex
			);
			dataView.setUint8(
				(offset * bytesPerTile) + 3,
				tileData.renderFlags
			);
		}
		offset += 1;
	}
	map.serializedLayers.push(serializedLayer);
};

function handleTiledObjectAsEntity(entity, map, objects, fileNameMap, scenarioData) {
	entity.sourceMap = map.name;
	var tileData = getMapTileAndOrientationByGID(
		entity.gid,
		map
	);
	entity.flip_x = tileData.flip_x;
	entity.flip_y = tileData.flip_y;
	entity.flip_diag = tileData.flip_diag;
	mergeInProperties(
		entity,
		entity.properties,
		objects
	);
	var mergedWithTile = assignToLessFalsy(
		{},
		tileData.tile,
		entity
	);
	var entityPrototype = (
		(
			fileNameMap['entities.json']
			&& fileNameMap['entities.json'].parsed[mergedWithTile.type]
		)
		|| scenarioData.entityTypes[mergedWithTile.type]
	);
	var compositeEntity = assignToLessFalsy(
		{},
		entityPrototype || {},
		mergedWithTile
	);
	compositeEntity.renderFlags = tileData.renderFlags;
	compositeEntity.tileIndex = tileData.tileIndex;
	compositeEntity.tileset = tileData.tileset
	// console.table([
	//  entityPrototype,
	//  entity.tile,
	//  entity,
	//  mergedWithType,
	//  compositeEntity
	// ])
	serializeEntity(
		compositeEntity,
		fileNameMap,
		scenarioData,
	);
	entity.compositeEntity = compositeEntity;
	map.entityIndices.push(
		compositeEntity.scenarioIndex
	);
}

var handleObjectLayer = function (layer, map, fileNameMap, scenarioData) {
	layer.objects.forEach(function (tiledObject, index, objects) {
		if (tiledObject.rotation) {
			throw new Error(`The Encoder WILL NOT SUPPORT object rotation! Go un-rotate and encode again! Object was found on map: ${
				map.name
			};\nOffending object was: ${
				JSON.stringify(tiledObject, null, '\t')
			}`);
		}
		if (tiledObject.gid) {
			handleTiledObjectAsEntity(
				tiledObject,
				map,
				objects,
				fileNameMap,
				scenarioData,
			);
		} else {
			handleTiledObjectAsGeometry(
				tiledObject,
				map,
				fileNameMap,
				scenarioData,
			);
		}
	});
};

var handleMapTilesets = function (mapTilesets, scenarioData, fileNameMap) {
	return Promise.all(mapTilesets.map(function (mapTilesetItem) {
		var tilesetFileName = mapTilesetItem.source.split('/').pop();
		var tilesetFile = fileNameMap[tilesetFileName];
		if (!tilesetFile) {
			throw new Error(
				'Tileset `' + tilesetFileName + '` could not be found in folder!'
			);
		} else {
			if (tilesetFile.scenarioIndex === undefined) {
				tilesetFile.scenarioIndex = scenarioData.parsed.tilesets.length;
				scenarioData.parsed.tilesets.push({
					name: 'temporary - awaiting parse',
					scenarioIndex: tilesetFile.scenarioIndex,
				});
			}
			return (
				tilesetFile.parsed
					? Promise.resolve(tilesetFile.parsed)
					: getFileJson(tilesetFile)
						.then(handleTilesetData(tilesetFile, scenarioData, fileNameMap))
			).then(function (tilesetParsed) {
				mapTilesetItem.parsed = tilesetParsed;
			})
		}
	}));
};

var handleMapLayers = function (map, scenarioData, fileNameMap) {
	map.layers.forEach(function (layer) {
		console.log(
			'Layer:',
			layer
		)
		if (layer.type === 'tilelayer') {
			handleTileLayer(layer, map);
		} else if (layer.type === 'objectgroup') {
			handleObjectLayer(layer, map, fileNameMap, scenarioData);
		}
	});
	return map;
};

var generateMapHeader = function (map) {
	var headerLength = (
		16 // char[] name
		+ 2 // uint16_t tile_width
		+ 2 // uint16_t tile_height
		+ 2 // uint16_t cols
		+ 2 // uint16_t rows
		+ 2 // uint16_t on_load
		+ 2 // uint16_t on_tick
		+ 1 // uint8_t layer_count
		+ 1 // uint8_t padding
		+ 2 // uint16_t entity_count
		+ 2 // uint16_t geometry_count
		+ 2 // uint16_t script_count
		+ (
			2 // uint16_t entity_id
			* map.entityIndices.length
		)
		+ (
			2 // uint16_t geometry_id
			* map.geometryIndices.length
		)
		+ (
			2 // uint16_t script_id
			* map.scriptIndices.length
		)
	);
	var result = new ArrayBuffer(
		getPaddedHeaderLength(headerLength)
	);
	var dataView = new DataView(result);
	var offset = 0;
	setCharsIntoDataView(
		dataView,
		map.name,
		0,
		offset += 16
	);
	dataView.setUint16(offset, map.tilewidth, false);
	offset += 2;
	dataView.setUint16(offset, map.tileheight, false);
	offset += 2;
	dataView.setUint16(offset, map.width, false);
	offset += 2;
	dataView.setUint16(offset, map.height, false);
	offset += 2;
	dataView.setUint16(offset, map.on_load || 0, false);
	offset += 2;
	dataView.setUint16(offset, map.on_tick || 0, false);
	offset += 2;
	dataView.setUint8(offset, map.serializedLayers.length);
	offset += 1;
	dataView.setUint8(offset, 0); // padding
	offset += 1;
	dataView.setUint16(offset, map.entityIndices.length, false);
	offset += 2;
	dataView.setUint16(offset, map.geometryIndices.length, false);
	offset += 2;
	dataView.setUint16(offset, map.scriptIndices.length, false);
	offset += 2;
	map.entityIndices.forEach(function (entityIndex) {
		dataView.setUint16(offset, entityIndex, false);
		offset += 2;
	});
	map.geometryIndices.forEach(function (geometryIndex) {
		dataView.setUint16(offset, geometryIndex, false);
		offset += 2;
	});
	map.scriptIndices.forEach(function (scriptIndex) {
		dataView.setUint16(offset, scriptIndex, false);
		offset += 2;
	});
	return result;
};

var handleMapData = function (mapFile, fileNameMap, scenarioData) {
	return function (map) {
		console.log(
			'Map:',
			mapFile.name,
			map
		);
		map.name = mapFile.name.split('.')[0];
		mapFile.parsed = map;
		map.scenarioIndex = mapFile.scenarioIndex;
		map.entityIndices = [];
		map.geometryIndices = [];
		map.scriptIndices = [];
		map.scriptNameKeys = {};
		map.serializedLayers = [];
		scenarioData.parsed.maps[mapFile.scenarioIndex] = map;
		scenarioData.mapsByName[map.name] = map;
		return handleMapTilesets(map.tilesets, scenarioData, fileNameMap)
			.then(function () {
				handleMapLayers(map, scenarioData, fileNameMap);
				handleMapScripts(
					map,
					fileNameMap,
					scenarioData,
				);
				map.serialized = generateMapHeader(map);
				map.serializedLayers.forEach(function (layer) {
					map.serialized = combineArrayBuffers(
						map.serialized,
						layer
					);
				})
				return map;
			});
	};
};

var handleScenarioMaps = function (scenarioData, fileNameMap) {
	var maps = scenarioData.maps;
	return Promise.all(Object.keys(maps).map(function (key) {
		var mapFileName = maps[key].split('/').pop();
		var mapFile = fileNameMap[mapFileName];
		mapFile.scenarioIndex = scenarioData.parsed.maps.length;
		scenarioData.parsed.maps.push({
			name: 'temporary - still parsing',
			scenarioIndex: mapFile.scenarioIndex
		});
		if (!mapFile) {
			throw new Error(
				'Map `' + mapFileName + '` could not be found in folder!'
			);
		} else {
			return getFileJson(mapFile)
				.then(handleMapData(mapFile, fileNameMap, scenarioData));
		}
	}));
};