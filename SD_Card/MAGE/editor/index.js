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

var getTilesetHeader = function (tilesetData, image) {
	var tilesetHeaderLength = (
		16 // char[16] name
		+ 2 // uint16_t imageIndex
		+ 2 // uint16_t imageWidth
		+ 2 // uint16_t imageHeight
		+ 2 // uint16_t tileWidth
		+ 2 // uint16_t tileHeight
		+ 2 // uint16_t cols
		+ 2 // uint16_t rows
	);
	var result = new ArrayBuffer(
		tilesetHeaderLength
		+ 4 - (tilesetHeaderLength % 4) // pad to to uint32_t alignment
	);
	var dataView = new DataView(result);
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
	return result;
};
var handleTilesetData = function (tilesetFile, scenarioData, fileNameMap) {
	return function (tilesetData) {
		console.log(
			'Tileset:',
			tilesetFile.name,
			tilesetData
		);
		tilesetData.serialized = {
			tiles: new ArrayBuffer(
				tilesetData.tilecount
				+ 4 - (tilesetData.tilecount % 4) // pad to to uint32_t alignment
			)
		};
		var tileDataView = new DataView(tilesetData.serialized.tiles);
		// forget about the built-in name, using file name instead.
		tilesetData.name = tilesetFile.name.split('.')[0];
		// already has columns, add the missing pair
		tilesetData.tiles.forEach(function (tile) {
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
		});
		tilesetData.scenarioIndex = tilesetFile.scenarioIndex;
		scenarioData.parsed.tilesets[tilesetData.scenarioIndex] = tilesetData;
		var filePromise = handleImage(tilesetData.image, scenarioData, fileNameMap)
			.then(function () {
				return tilesetData;
			});
		var imageFileName = tilesetData.image.split('/').pop();
		var imageFile = fileNameMap[imageFileName];
		tilesetData.serialized.header = getTilesetHeader(tilesetData, imageFile);
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
	var mapTilesetIndex = 0;
	map.tilesets.find(function (tileset, index) {
		var overshot = tileId < tileset.firstgid;
		if(!overshot) {
			mapTilesetIndex = index;
			targetTileset = tileset;
		}
		return overshot;
	});
	var tileIndex = tileId - targetTileset.firstgid;
	return {
		tileset: targetTileset,
		tileIndex: tileIndex,
		mapTilesetIndex: mapTilesetIndex,
		flip_x: !!(tileGID & FLIPPED_HORIZONTALLY_FLAG),
		flip_y: !!(tileGID & FLIPPED_VERTICALLY_FLAG),
		flip_xy: !!(tileGID & FLIPPED_DIAGONALLY_FLAG),
		tile: targetTileset.parsed.tiles.find(function (tile) {
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
				tileData.tileIndex,
				false // fix endianness of output, little -> big
			);
			dataView.setUint8(
				(offset * bytesPerTile) + 2,
				tileData.mapTilesetIndex
			);
			dataView.setUint8(
				(offset * bytesPerTile) + 3,
				(
					(tileData.flip_x << 2)
					+ (tileData.flip_y << 1)
					+ (tileData.flip_xy << 0)
				)
			);
		}
		offset += 1;
	}
	map.serialized.layers.push(serializedLayer);
};

var handleObjectLayer = function (layer, map, fileNameMap, scenarioData) {
	layer.objects.forEach(function (entityInstance, index, objects) {
		if (entityInstance.gid) {
			var entity = getMapTileAndOrientationByGID(
				entityInstance.gid,
				map
			);
			mergeInProperties(
				entityInstance,
				entityInstance.properties,
				objects
			);
			var mergedWithType = assignToLessFalsy(
				{},
				entity.tile,
				entityInstance
			);
			var entityPrototype = (
				(
					fileNameMap['entities.json']
					&& fileNameMap['entities.json'].parsed[mergedWithType.type]
				)
				|| scenarioData.entities[mergedWithType.type]
			);
			if (!entityPrototype) {
				console.error(
					'Unsupported entity type in map objectgroup layer: "'
					+ mergedWithType.type
					+ '"; Ignoring.'
				);
			} else {
				var compositeEntityInstance = assignToLessFalsy(
					{},
					entityPrototype,
					mergedWithType
				);
				// console.table([
				//  entityPrototype,
				//  entity.tile,
				//  entityInstance,
				//  mergedWithType,
				//  compositeEntityInstance
				// ])
				map.entityInstances.push(compositeEntityInstance);
			}
		}
	});
};

var handleMapLayers = function (map, scenarioData, fileNameMap) {
	map.entityInstances = [];
	map.serialized = {
		layers: []
	};
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
	map.entityInstances.forEach(function (entityInstance) {
		console.log(
			'entityInstance:',
			entityInstance
		)
	});
	return map;
};

var generateMapHeader = function (map) {
	var headerLength = (
		16 // char[] name
		+ 2 // uint16_t tileWidth
		+ 2 // uint16_t tileHeight
		+ 2 // uint16_t width
		+ 2 // uint16_t height
		+ 1 // uint8_t layer count
		+ 1 // uint8_t tileset count
		+ map.tilesets.length * 2 // global tileset IDs
	);
	var result = new ArrayBuffer(
		headerLength
		+ 4 - (headerLength % 4) // pad to to uint32_t alignment
	);
	var headerDataView = new DataView(result);
	setCharsIntoDataView(
		headerDataView,
		map.name,
		0,
		16
	);
	var offset = 16;
	headerDataView.setUint16(offset, map.tilewidth, false);
	offset += 2;
	headerDataView.setUint16(offset, map.tileheight, false);
	offset += 2;
	headerDataView.setUint16(offset, map.width, false);
	offset += 2;
	headerDataView.setUint16(offset, map.height, false);
	offset += 2;
	headerDataView.setUint8(offset, map.serialized.layers.length);
	offset += 1;
	headerDataView.setUint8(offset, map.tilesets.length);
	offset += 1;
	map.tilesets.forEach(function (tileset) {
		headerDataView.setUint16(offset, tileset.parsed.scenarioIndex, false);
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
		scenarioData.parsed.maps[mapFile.scenarioIndex] = map;
		return handleMapTilesets(map.tilesets, scenarioData, fileNameMap)
			.then(function () {
				handleMapLayers(map, scenarioData, fileNameMap);
				map.serialized.header = generateMapHeader(map);
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
				scenarioData.entities[entityItem.name]
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
		scenarioData.parsed = {
			maps: [],
			tilesets: [],
			images: []
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
		+ 4 // uint32_t imageCount
		+ (4 * scenarioData.parsed.images.length) // uint32_t *imageOffsets
		+ (4 * scenarioData.parsed.images.length) // uint32_t *imageLengths
	);
	var indicesDataView = new DataView(indices);
	var chunks = [
		signature,
		indices
	];
	var fileOffset = signature.byteLength + indices.byteLength;
	var indicesOffset = 0;
	indicesDataView.setUint32(
		indicesOffset,
		scenarioData.parsed.maps.length,
		false
	);
	indicesOffset += 4;
	scenarioData.parsed.maps.forEach(function(map, index, maps) {
		var offset = indicesOffset + (index * 4);
		var lengthOffset = (
			offset
			+ (maps.length * 4)
		);
		var totalSize = 0;
		indicesDataView.setUint32(
			offset,
			fileOffset,
			false
		)
		chunks.push(map.serialized.header);
		totalSize += map.serialized.header.byteLength;
		map.serialized.layers.forEach(function (layer) {
			chunks.push(layer);
			totalSize += layer.byteLength;
		});
		indicesDataView.setUint32(
			lengthOffset,
			totalSize,
			false
		);
		fileOffset += totalSize;
	});
	indicesOffset += scenarioData.parsed.maps.length * 8;
	indicesDataView.setUint32(
		indicesOffset,
		scenarioData.parsed.tilesets.length,
		false
	);
	indicesOffset += 4;
	scenarioData.parsed.tilesets.forEach(function(tileset, index, tilesets) {
		var offset = indicesOffset + (index * 4);
		var lengthOffset = (
			offset
			+ (tilesets.length * 4)
		);
		var totalSize = 0;
		indicesDataView.setUint32(
			offset,
			fileOffset,
			false
		)
		chunks.push(tileset.serialized.header);
		totalSize += tileset.serialized.header.byteLength;
		chunks.push(tileset.serialized.tiles);
		totalSize += tileset.serialized.tiles.byteLength;
		indicesDataView.setUint32(
			lengthOffset,
			totalSize,
			false
		)
		fileOffset += totalSize;
	});
	indicesOffset += scenarioData.parsed.tilesets.length * 8;
	indicesDataView.setUint32(
		indicesOffset,
		scenarioData.parsed.images.length,
		false
	);
	indicesOffset += 4;
	scenarioData.parsed.images.forEach(function(image, index, images) {
		indicesDataView.setUint32(
			indicesOffset, // item offset
			fileOffset,
			false
		)
		indicesDataView.setUint32(
			indicesOffset
			+ (images.length * 4),
			image.serialized.byteLength,
			false
		)
		indicesOffset += 4;
		chunks.push(image.serialized);
		fileOffset += image.serialized.byteLength;
	});
	indicesOffset += scenarioData.parsed.images.length * 8;
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
