window.Vue.component(
	'inputty',
	{
		template: '#inputty'
	}
);

var rgbaToC565 = function (r, g, b, a) {
	return a < 100
		? 32
		: (((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3));
};

var getFileJson = function (file) {
	return file.text()
		.then(function (text) {
			return JSON.parse(text);
		});
};

var combineArrayBuffers = function(bufferA, bufferB) {
	var temp = new Uint8Array(bufferA.byteLength + bufferB.byteLength);
	temp.set(new Uint8Array(bufferA), 0);
	temp.set(new Uint8Array(bufferB), bufferA.byteLength);
	return temp.buffer;
};

var setCharsIntoDataView = function (
	dataView,
	string,
	offset,
	maxLength
) {
	var source = string.slice(0, maxLength);
	for (var i = 0; i < source.length; i++) {
		dataView.setUint8(
			i + offset,
			source.charCodeAt(i)
		);
	}
};

var getPaddedHeaderLength = function(length) {
	// pad to to uint32_t alignment
	var mod = length % 4;
	return length + (
		mod
			? 4 - mod
			: 0
	);
};

var serializeAnimationData = function (tile, tilesetData, scenarioData) {
	tile.animation.scenarioIndex = scenarioData.parsed.animations.length;
	scenarioData.parsed.animations.push(tile.animation);
	var headerLength = (
		2 // uint16_t tileset_id
		+ 2 // uint16_t frame_count
		+ (
			(
				2 // uint16_t tileid
				+ 2 // uint16_t duration
			)
			* tile.animation.length
		)
	);
	tile.animation.serialized = new ArrayBuffer(
		getPaddedHeaderLength(headerLength)
	);
	var dataView = new DataView(tile.animation.serialized);
	var offset = 0;
	dataView.setUint16(
		offset,
		tilesetData.scenarioIndex,
		false
	);
	offset += 2;
	dataView.setUint16(
		offset,
		tile.animation.length,
		false
	);
	offset += 2;
	tile.animation.forEach(function (frame) {
		dataView.setUint16(
			offset,
			frame.tileid,
			false
		);
		offset += 2;
		dataView.setUint16(
			offset,
			frame.duration,
			false,
		);
		offset += 2;
	});
};

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
		false
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t imageWidth
		tilesetData.imagewidth,
		false
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t imageHeight
		tilesetData.imageheight,
		false
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t tileWidth
		tilesetData.tilewidth,
		false
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t tileHeight
		tilesetData.tileheight,
		false
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t cols
		tilesetData.columns,
		false
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t rows
		Math.floor(tilesetData.imageheight / tilesetData.tileheight),
		false
	);
	var result = combineArrayBuffers(
		header,
		tilesetData.serializedTiles
	);
	return result;
};
var handleTilesetData = function (tilesetFile, scenarioData, fileNameMap) {
	return function (tilesetData) {
		tilesetData.scenarioIndex = tilesetFile.scenarioIndex;
		scenarioData.parsed.tilesets[tilesetData.scenarioIndex] = tilesetData;
		console.log(
			'Tileset:',
			tilesetFile.name,
			tilesetData
		);
		tilesetData.serializedTiles = new ArrayBuffer(
			getPaddedHeaderLength(tilesetData.tilecount)
		);
		var tileDataView = new DataView(tilesetData.serializedTiles);
		// forget about the built-in name, using file name instead.
		tilesetData.name = tilesetFile.name.split('.')[0];
		// already has columns, add the missing pair
		(tilesetData.tiles || []).forEach(function (tile) {
			mergeInProperties(
				tile,
				tile.properties
			);
			var entityPrototype = (
				(
					fileNameMap['entities.json']
					&& fileNameMap['entities.json'].parsed[tile.type]
				)
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
			if (tile.type) {
				tileDataView.setUint8(
					tile.id,
					tile.type.charCodeAt(0)
				);
			}
			if (tile.animation) {
				serializeAnimationData(tile, tilesetData, scenarioData);
			}
		});
		var filePromise = handleImage(tilesetData.image, scenarioData, fileNameMap)
			.then(function () {
				return tilesetData;
			});
		var imageFileName = tilesetData.image.split('/').pop();
		var imageFile = fileNameMap[imageFileName];
		tilesetData.imageFile = imageFile;
		tilesetData.serialized = serializeTileset(tilesetData, imageFile);
		tilesetFile.parsed = tilesetData;
		return filePromise
	};
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

var propertyTypeHandlerMap = {
	'object': function (value, targetSourceList) {
		// tiled object ids always start at 1
		return value === 0
			? null
			: targetSourceList.find(function (item) {
				return item.id === value;
			});
	},
	'string': function (value, targetSourceList) {
		return value;
	},
	'bool': function (value, targetSourceList) {
		return value === true;
	},
	'color': function (value, targetSourceList) {
		var chunks = value
			.replace('#', '')
			.match(/.{1,2}/g)
			.map(function (chunk) {
				return parseInt(chunk, 10);
			});
		return rgbaToC565(
			chunks[1],
			chunks[2],
			chunks[3],
			chunks[0]
		);
	},
	'file': function (value, targetSourceList) {
		return value;
	},
	'float': function (value, targetSourceList) {
		return parseFloat(value);
	},
	'int': function (value, targetSourceList) {
		return parseInt(value, 10);
	}
};
var mergeInProperties = function (target, properties, targetSourceList) {
	var list = targetSourceList || [];
	if (properties) {
		properties.forEach(function (property) {
			target[property.name] = propertyTypeHandlerMap[property.type](
				property.value,
				list
			);
		});
	}
	return target;
};

var assignToLessFalsy = function () {
	var inputArray = Array.prototype.slice.call(arguments);
	var target = inputArray.shift();
	inputArray.forEach(function (source) {
		Object.keys(source).forEach(function (key) {
			var value = source[key];
			if (
				value === ""
				|| value === undefined
				|| value === null
			) {
				value = target[key];
			}
			if (
				value === ""
				|| value === undefined
				|| value === null
			) {
				value = null;
			}
			target[key] = value;
		});
	});
	return target;
};

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

var serializeEntityType = function (entityType, scenarioData, fileNameMap) {
	var animations = Object.values(entityType.animations);
	var headerLength = (
		16 // char[16] name
		+ 1 // uint8_t ??? padding
		+ 1 // uint8_t ??? padding
		+ 1 // uint8_t flags??? (still padding atm)
		+ 1 // uint8_t animation_count
		+ (
			(
				+ 2 // uint16_t type_id
				+ 1 // uint8_t type (
						// 0: type_id is the ID of an animation,
						// !0: type is now a lookup on the tileset table,
							// and type_id is the ID of the tile on that tileset
					// )
				+ 1 // uint8_t render_flags
			)
			* 4 // the number of directions supported in the engine
			* animations.length
		)
	);
	var result = new ArrayBuffer(
		getPaddedHeaderLength(headerLength)
	);
	var dataView = new DataView(result);
	var offset = 0;
	setCharsIntoDataView(
		dataView,
		entityType.name || entityType.type,
		0,
		offset += 16
	);
	offset += 3; // padding
	dataView.setUint8(
		offset, // uint8_t animation_count
		animations.length
	);
	offset += 1;
	animations.forEach(function (animation) {
		animation.forEach(function (direction) {
			var tileset = fileNameMap[entityType.tileset];
			var tile = tileset.parsed.tiles.find(function (tile) {
				return tile.id === direction.tileid
			});
			var animation = tile && tile.animation;
			dataView.setUint16(
				offset, // uint16_t type_id
				animation
					? animation.scenarioIndex
					: direction.tileid,
				false
			);
			offset += 2;
			dataView.setUint8(
				offset, // uint8_t type
				animation
					? 0
					: tileset.parsed.scenarioIndex + 1
			);
			offset += 1;
			dataView.setUint8(
				offset, // uint8_t render_flags
				(
					(direction.flip_x << 2)
					+ (direction.flip_y << 1)
					+ (direction.flip_diag << 0)
				)
			);
			offset += 1;
		});
	});
	return result;
}

var serializeEntity = function (entity, scenarioData, fileNameMap) {
	var headerLength = (
		16 // char[16] name
		+ 2 // uint16_t primary_id // may be: entity_type_id, animation_id, tileset_id
		+ 2 // uint16_t secondary_id // if primary_id_type is tileset_id, this is the tile_id, otherwise 0
		+ 2 // uint16_t script_id
		+ 2 // uint16_t x
		+ 2 // uint16_t y
		+ 1 // uint8_t primary_id_type
		+ 1 // uint8_t current_animation
		+ 1 // uint8_t current_frame
		+ 1 // uint8_t direction OR render_flags
		+ 1 // uint8_t hackable_state
		+ 1 // uint8_t padding
	);
	entity.serialized = new ArrayBuffer(
		getPaddedHeaderLength(headerLength)
	);
	var dataView = new DataView(entity.serialized);
	var offset = 0;
	setCharsIntoDataView(
		dataView,
		entity.name || entity.type || '',
		0,
		offset += 16
	);
	var entityType = scenarioData.entityTypes[entity.type];
	if (entityType && !entityType.scenarioIndex) {
		entityType.scenarioIndex = scenarioData.parsed.entityTypes.length;
		scenarioData.parsed.entityTypes.push(entityType);
		entityType.serialized = serializeEntityType(
			entityType,
			scenarioData,
			fileNameMap
		);
	}
	var primaryIndexType = 0; // tileset_id
	var primaryIndex;
	var secondaryIndex = 0;
	var directionOrRenderFlags = 0;
	if (entityType) {
		primaryIndexType = 2; // entity_type_id
		primaryIndex = entityType.scenarioIndex;
		Object.keys(entityType.animations)
			.find(function (animationName) {
				var animation = entityType.animations[animationName]
				return animation.find(function (animationDirection, direction) {
					if(
						(entity.tileIndex === animationDirection.tileid)
						&& (!!entity.flip_x === !!animationDirection.flip_x)
						&& (!!entity.flip_y === !!animationDirection.flip_y)
					) {
						directionOrRenderFlags = direction;
						return true
					}
				});
			});
	} else if (entity.animation) {
		primaryIndexType = 1; // animation_id
		primaryIndex = entity.animation.scenarioIndex;
	} else {
		primaryIndex = entity.tileset.parsed.scenarioIndex;
		secondaryIndex = entity.tileIndex;
	}
	if(primaryIndexType !== 2) {
		directionOrRenderFlags = entity.renderFlags;
	}
	dataView.setUint16(
		offset, // primary_id // may be: entity_type_id, animation_id, tileset_id
		primaryIndex,
		false
	);
	offset += 2;
	dataView.setUint16(
		offset, // secondary_id // if primary_id_type is tileset_id, this is the tile_id, otherwise 0
		secondaryIndex,
		false
	);
	offset += 2;
	dataView.setUint16(
		offset, // uint16_t script_id
		0, // only padding at the moment
		false
	);
	offset += 2;
	dataView.setUint16(
		offset, // uint16_t x
		Math.round(entity.x),
		false
	);
	offset += 2;
	dataView.setUint16(
		offset, // uint16_t y
		Math.round(entity.y),
		false
	);
	offset += 2;
	dataView.setUint8(
		offset, // uint8_t primary_id_type
		primaryIndexType
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t currentAnimation
		entity.currentAnimation || 0
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t currentFrame
		0
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t direction OR render_flags
		directionOrRenderFlags
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t hackable_state
		0
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t padding
		0
	);
	offset += 1;
	entity.scenarioIndex = scenarioData.parsed.entities.length;
	scenarioData.parsed.entities.push(entity);
	return entity;
};

var handleObjectLayer = function (layer, map, fileNameMap, scenarioData) {
	layer.objects.forEach(function (entity, index, objects) {
		if (entity.gid) {
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
				scenarioData,
				fileNameMap
			);
			map.entityIndices.push(
				compositeEntity.scenarioIndex
			);
		}
	});
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
		+ 1 // uint8_t layer_count
		+ 1 // uint8_t padding
		+ 2 // uint16_t entity_count
		+ (
			2 // uint16_t entity_id
			* map.entityIndices.length
		)
	);
	var result = new ArrayBuffer(
		getPaddedHeaderLength(headerLength)
	);
	var dataView = new DataView(result);
	setCharsIntoDataView(
		dataView,
		map.name,
		0,
		16
	);
	var offset = 16;
	dataView.setUint16(offset, map.tilewidth, false);
	offset += 2;
	dataView.setUint16(offset, map.tileheight, false);
	offset += 2;
	dataView.setUint16(offset, map.width, false);
	offset += 2;
	dataView.setUint16(offset, map.height, false);
	offset += 2;
	dataView.setUint8(offset, map.serializedLayers.length);
	offset += 1;
	dataView.setUint8(offset, 0); // padding
	offset += 1;
	dataView.setUint16(offset, map.entityIndices.length, false);
	offset += 2;
	map.entityIndices.forEach(function (entityIndex) {
		dataView.setUint16(offset, entityIndex, false);
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
		map.serializedLayers = [];
		scenarioData.parsed.maps[mapFile.scenarioIndex] = map;
		return handleMapTilesets(map.tilesets, scenarioData, fileNameMap)
			.then(function () {
				handleMapLayers(map, scenarioData, fileNameMap);
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

var handleEntitiesData = function (scenarioData, entitiesFile) {
	return function (entitiesData) {
		console.log(
			'entities.json',
			entitiesData
		);
		var result = {};
		entitiesData.forEach(function (entityItem) {
			var item = assignToLessFalsy(
				{
					type: entityItem.name
				},
				scenarioData.entityTypes[entityItem.name]
			);
			mergeInProperties(
				item,
				entityItem.properties
			);
			result[entityItem.name] = item;
		});
		entitiesFile.parsed = result;
	};
};

var supportedImageTypes = ['png', 'gif'];
var handleImage = function(imageFileName, scenarioData, fileNameMap) {
	var file = fileNameMap[imageFileName.split('/').pop()];
	var result = Promise.resolve(file);
	if (!file.serialized) {
		var mimeTypeSuffix = file.type.split('/').pop();
		if (supportedImageTypes.indexOf(mimeTypeSuffix) === -1) {
			throw new Error(
				'Unsupported image type: "'
				+ file.type
				+ '" detected in file named: "'
				+ file.name
				+ '". Supported types are: '
				+ supportedImageTypes.join()
			);
		}
		var blobUrl = URL.createObjectURL(file);
		file.scenarioIndex = scenarioData.parsed.images.length;
		scenarioData.parsed.images.push(file);
		result = new Promise(function (resolve) {
			window.getPixels(
				blobUrl,
				file.type,
				function (error, result) {
					if(error){
						reject(error);
					} else {
						resolve(result);
					}
				}
			);
		})
			.then(function (result) {
				URL.revokeObjectURL(blobUrl);
				console.log(
					file.name,
					result
				);
				var width = result.shape[0];
				var height = result.shape[1];
				var hasAlpha = result.shape[2] === 4;
				var dataLength = width * height;
				var dataSize = 2;
				var data = new ArrayBuffer(dataLength * dataSize);
				var dataView = new DataView(data);
				var offset = 0;
				while (offset < dataLength) {
					var readOffset = offset * result.shape[2];
					var color = rgbaToC565(
						result.data[readOffset],
						result.data[readOffset + 1],
						result.data[readOffset + 2],
						hasAlpha
							? result.data[readOffset + 3]
							: 255
					);
					// fix endianness of output, little -> big
					dataView.setUint16(
						offset * dataSize,
						color,
						false
					);
					offset += 1;
				}
				file.serialized = data;
				return file;
			});
	}
	return result;
};

var handleScenarioData = function(fileNameMap) {
	return function (scenarioData) {
		console.log(
			'scenario.json',
			scenarioData
		);
		Object.keys(scenarioData.entityTypes).forEach(function (key) {
			scenarioData.entityTypes[key].type = key;
		})
		scenarioData.parsed = {
			maps: [],
			tilesets: [],
			images: [],
			animations: [],
			entityTypes: [],
			entities: []
		};
		var entitiesFile = fileNameMap['entities.json'];
		var entitiesPromise = !entitiesFile
			? Promise.resolve()
			: getFileJson(entitiesFile)
				.then(handleEntitiesData(scenarioData, entitiesFile));
		return entitiesPromise.then(function () {
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
		false
	);
	indicesDataView.headerOffset += 4;
	parsedItems.forEach(function(item, index, list) {
		var headerOffsetOffset = indicesDataView.headerOffset + (index * 4);
		var headerLengthOffset = (
			headerOffsetOffset
			+ (list.length * 4)
		);
		var totalSize = 0;
		indicesDataView.setUint32(
			headerOffsetOffset,
			indicesDataView.fileOffset,
			false
		)
		chunks.push(item.serialized);
		totalSize += item.serialized.byteLength;
		indicesDataView.setUint32(
			headerLengthOffset,
			totalSize,
			false
		);
		indicesDataView.fileOffset += totalSize;
	});
	indicesDataView.headerOffset += parsedItems.length * 8;
};
var generateIndexAndComposite = function (scenarioData) {
	console.log(
		'generateIndexAndComposite:scenarioData',
		scenarioData
	);
	var signature = new ArrayBuffer(8);
	var signatureDataView = new DataView(signature);
	setCharsIntoDataView(
		signatureDataView,
		'MAGEGAME',
		0
	);
	var indices = new ArrayBuffer(
		+ 4 // uint32_t mapCount
		+ (4 * scenarioData.parsed.maps.length) // uint32_t *mapOffsets
		+ (4 * scenarioData.parsed.maps.length) // uint32_t *mapLengths
		+ 4 // uint32_t tilesetCount
		+ (4 * scenarioData.parsed.tilesets.length) // uint32_t *tilesetOffsets
		+ (4 * scenarioData.parsed.tilesets.length) // uint32_t *tilesetLengths
		+ 4 // uint32_t animationCount
		+ (4 * scenarioData.parsed.animations.length) // uint32_t *animationOffsets
		+ (4 * scenarioData.parsed.animations.length) // uint32_t *animationLengths
		+ 4 // uint32_t entityTypeCount
		+ (4 * scenarioData.parsed.entityTypes.length) // uint32_t *entityTypeOffsets
		+ (4 * scenarioData.parsed.entityTypes.length) // uint32_t *entityTypeLengths
		+ 4 // uint32_t entityCount
		+ (4 * scenarioData.parsed.entities.length) // uint32_t *entityOffsets
		+ (4 * scenarioData.parsed.entities.length) // uint32_t *entityLengths
		+ 4 // uint32_t imageCount
		+ (4 * scenarioData.parsed.images.length) // uint32_t *imageOffsets
		+ (4 * scenarioData.parsed.images.length) // uint32_t *imageLengths
	);
	var indicesDataView = new DataView(indices);
	var chunks = [
		signature,
		indices
	];
	indicesDataView.fileOffset = signature.byteLength + indices.byteLength;
	indicesDataView.headerOffset = 0;

	[
		'maps',
		'tilesets',
		'animations',
		'entityTypes',
		'entities',
		'images'
	].forEach(function (type) {
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
	console.log(
		'compositeArray',
		compositeArray
	);
	return compositeArray;
};

window.vueApp = new window.Vue({
	el: '#app',
	data: {
		error: null,
		jsonValue: '',
		downloadData: null
	},
	created: function () {
		console.log('Created');
	},
	methods: {
		prepareDownload: function (data, name) {
			var blob = new Blob(data, {type: 'octet/stream'});
			var url = window.URL.createObjectURL(blob);
			if(this.downloadData) {
				window.URL.revokeObjectURL(this.downloadData.url);
			}
			window.Vue.set(
				this,
				'downloadData',
				{
					href: url,
					target: '_blank',
					download: name
				}
			);
		},
		handleChange: function (event) {
			var fileNameMap = {};
			var vm = this;
			var filesArray = Array.prototype.slice.call(event.target.files);
			filesArray.forEach(function (file) {
				fileNameMap[file.name] = file;
			});
			var scenarioFile = fileNameMap['scenario.json'];
			try {
				if (!scenarioFile) {
					vm.error = 'No `scenario.json` file detected in folder, no where to start!';
				} else {
					getFileJson(scenarioFile)
						.then(handleScenarioData(fileNameMap))
						.then(generateIndexAndComposite)
						.then(function (compositeArray) {
							vm.prepareDownload([compositeArray], 'game.dat');
						});
				}
			} catch (error) {
				vm.error = error.message;
			}
		}
	}
});
