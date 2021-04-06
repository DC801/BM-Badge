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
				IS_LITTLE_ENDIAN
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
		scenarioData.entityTypesPlusProperties[mergedWithTile.type]
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

	entity.mapIndex = map.entityIndices.length;
	map.entityIndices.push(
		compositeEntity.scenarioIndex
	);
	if (entity.compositeEntity.is_player) {
		if (map.playerEntityId !== specialKeywordsEnum['%MAP%']) {
			var entityALabel = entity.compositeEntity.name || entity.compositeEntity.type;
			var entityB = map.entityObjects[map.playerEntityId];
			var entityBLabel = entityB.compositeEntity.name || entityB.compositeEntity.type;
			throw new Error(`More than one entity on map "${map.name}" has \`is_player\` checked, this is not allowed!\nCompeting entities: "${entityALabel}", "${entityBLabel}"`);
		} else {
			map.playerEntityId = entity.mapIndex;
		}
	}
}

var handleMapTilesets = function (mapTilesets, scenarioData, fileNameMap) {
	return Promise.all(mapTilesets.map(function (mapTilesetItem) {
		return loadTilesetByName(
			mapTilesetItem.source,
			fileNameMap,
			scenarioData,
		).then(function (tilesetParsed) {
			mapTilesetItem.parsed = tilesetParsed;
		});
	}));
};

var handleMapLayers = function (map, scenarioData, fileNameMap) {
	map.layers.filter(function (layer) {
		return layer.type === 'tilelayer';
	}).forEach(function (tileLayer) {
		handleTileLayer(tileLayer, map);
	})
	var allObjectsOnAllObjectLayers = [];
	map.layers.filter(function (layer) {
		return layer.type === 'objectgroup';
	}).forEach(function (objectLayer) {
		allObjectsOnAllObjectLayers = allObjectsOnAllObjectLayers
			.concat(objectLayer.objects);
	});
	allObjectsOnAllObjectLayers.forEach(function (tiledObject) {
		if (tiledObject.rotation) {
			throw new Error(`The Encoder WILL NOT SUPPORT object rotation! Go un-rotate and encode again! Object was found on map: ${
				map.name
			};\nOffending object was: ${
				JSON.stringify(tiledObject, null, '\t')
			}`);
		}
	});
	map.entityObjects = allObjectsOnAllObjectLayers.filter(function(object) {
		return object.gid !== undefined;
	});
	if (map.entityObjects.length > MAX_ENTITIES_PER_MAP) {
		throw new Error(
			`Map "${
				map.name
			}" has ${
				map.entityObjects.length
			} entities, but the limit is ${
				MAX_ENTITIES_PER_MAP
			}`
		);
	}
	map.geometryObjects = allObjectsOnAllObjectLayers.filter(function(object) {
		return object.gid === undefined;
	});
	map.geometryObjects.forEach(function (tiledObject) {
		handleTiledObjectAsGeometry(
			tiledObject,
			fileNameMap,
			scenarioData,
			map,
		);
	});
	map.playerEntityId = specialKeywordsEnum['%MAP%'];
	map.entityObjects.forEach(function (tiledObject) {
		handleTiledObjectAsEntity(
			tiledObject,
			map,
			map.geometryObjects,
			fileNameMap,
			scenarioData,
		);
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
		+ 1 // uint8_t player_entity_id
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
	dataView.setUint16(
		offset,
		map.tilewidth,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint16(
		offset,
		map.tileheight,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint16(
		offset,
		map.width,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint16(
		offset,
		map.height,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint16(
		offset,
		map.on_load || 0,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint16(
		offset,
		map.on_tick || 0,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint8(
		offset,
		map.serializedLayers.length
	);
	offset += 1;
	dataView.setUint8(
		offset,
		map.playerEntityId
	);
	offset += 1;
	dataView.setUint16(
		offset,
		map.entityIndices.length,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint16(
		offset,
		map.geometryIndices.length,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint16(
		offset,
		map.scriptIndices.length,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	map.entityIndices.forEach(function (entityIndex) {
		dataView.setUint16(
			offset,
			entityIndex,
			IS_LITTLE_ENDIAN
		);
		offset += 2;
	});
	map.geometryIndices.forEach(function (geometryIndex) {
		dataView.setUint16(
			offset,
			geometryIndex,
			IS_LITTLE_ENDIAN
		);
		offset += 2;
	});
	map.scriptIndices.forEach(function (scriptIndex) {
		dataView.setUint16(
			offset,
			scriptIndex,
			IS_LITTLE_ENDIAN
		);
		offset += 2;
	});
	return result;
};

var handleMapData = function (name, mapFile, fileNameMap, scenarioData) {
	return function (map) {
		// console.log(
		// 	'Map:',
		// 	mapFile.name,
		// 	map
		// );
		map.name = name;
		mapFile.parsed = map;
		map.scenarioIndex = mapFile.scenarioIndex;
		map.entityIndices = [];
		map.geometryIndices = [];
		map.scriptIndices = [];
		map.scriptNameKeys = {};
		map.serializedLayers = [];
		scenarioData.parsed.maps[mapFile.scenarioIndex] = map;
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
	var orderedMapPromise = Promise.resolve();
	Object.keys(maps).forEach(function (key) {
		var mapFileName = maps[key].split('/').pop();
		var mapFile = fileNameMap[mapFileName];
		mapFile.scenarioIndex = scenarioData.parsed.maps.length;
		scenarioData.parsed.maps.push({
			name: 'temporary - still parsing',
			scenarioIndex: mapFile.scenarioIndex
		});
		scenarioData.mapsByName[key] = mapFile;
		if (!mapFile) {
			throw new Error(
				'Map `' + mapFileName + '` could not be found in folder!'
			);
		} else {
			orderedMapPromise = orderedMapPromise.then(function() {
				return getFileJson(mapFile)
					.then(handleMapData(key, mapFile, fileNameMap, scenarioData))
			});
		}
	});
	return orderedMapPromise;
};