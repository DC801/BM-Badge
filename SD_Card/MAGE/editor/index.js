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
	var result = new ArrayBuffer(
		16 // char[16] name
		+ 2 // uint16_t imageIndex
		+ 2 // uint16_t tileWidth
		+ 2 // uint16_t tileHeight
		+ 2 // uint16_t width
		+ 2 // uint16_t height
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
		offset, // uint16_t tileWidth
		tilesetData.imagewidth,
		false
	);
	offset += 2
	dataView.setUint16(
		offset, // uint16_t tileHeight
		tilesetData.imageheight,
		false
	);
	offset += 2
	dataView.setUint16(
		offset, // uint8_t width
		tilesetData.columns,
		false
	);
	offset += 2
	dataView.setUint16(
		offset, // uint8_t height
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
			tiles: new ArrayBuffer(tilesetData.tilecount)
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
		return handleImage(tilesetData.image, scenarioData, fileNameMap)
			.then(function (image) {
				tilesetData.scenarioIndex = scenarioData.parsed.tilesets.length;
				scenarioData.parsed.tilesets.push(tilesetData);
				tilesetData.serialized.header = getTilesetHeader(tilesetData, image);
				tilesetFile.parsed = tilesetData;
				return tilesetData;
			});
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
			dataView.setUint8(
				offset * bytesPerTile,
				tileData.mapTilesetIndex
			);
			dataView.setUint16(
				(offset * bytesPerTile) + 1,
				tileData.tileIndex,
				false // fix endianness of output, little -> big
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
	map.serialized.header = new ArrayBuffer(
		16 // char[] name
		+ 2 // uint16_t width
		+ 2 // uint16_t height
		+ 1 // uint8_t layer count
	);
	var headerDataView = new DataView(map.serialized.header);
	setCharsIntoDataView(
		headerDataView,
		map.name,
		0,
		16
	);
	headerDataView.setUint16(16, map.width, false);
	headerDataView.setUint16(18, map.height, false);
	headerDataView.setUint8(20, map.serialized.layers.length);
};

var handleMapData = function (mapFileName, fileNameMap, scenarioData) {
	return function (map) {
		console.log(
			'Map:',
			mapFileName,
			map
		);
		map.name = mapFileName.split('.')[0];
		fileNameMap[mapFileName].parsed = map;
		return handleMapTilesets(map.tilesets, scenarioData, fileNameMap)
			.then(function () {
				handleMapLayers(map, scenarioData, fileNameMap);
				map.scenarioIndex = scenarioData.parsed.maps.length;
				scenarioData.parsed.maps.push(map);
				return map;
			});
	};
};

var handleScenarioMaps = function (scenarioData, fileNameMap) {
	var maps = scenarioData.maps;
	return Promise.all(Object.keys(maps).map(function (key) {
		var mapFileName = maps[key].split('/').pop();
		var mapFile = fileNameMap[mapFileName];
		if (!mapFile) {
			throw new Error(
				'Map `' + mapFileName + '` could not be found in folder!'
			);
		} else {
			return getFileJson(mapFile)
				.then(handleMapData(mapFileName, fileNameMap, scenarioData));
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
				file.scenarioIndex = scenarioData.parsed.images.length;
				scenarioData.parsed.images.push(file);
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
	// TODO: scenarioData.parsed
	console.log(
		'generateIndexAndComposite:scenarioData',
		scenarioData
	);
	var indices = new ArrayBuffer(
		8 // signature
		+ 2 // uint16_t mapCount
		+ 4 * scenarioData.parsed.maps.length // uint32_t *mapOffsets
		+ 2 // uint16_t tilesetCount
		+ 4 * scenarioData.parsed.tilesets.length // uint32_t *tilesetOffsets
		+ 2 // uint16_t imageCount
		+ 4 * scenarioData.parsed.images.length // uint32_t *imageOffsets
	);
	var indicesDataView = new DataView(indices);
	setCharsIntoDataView(
		indicesDataView,
		'MAGEGAME',
		0
	);
	var chunks = [
		indices
	];
	var offset = indices.byteLength;
	indicesDataView.setUint16(
		0,
		scenarioData.parsed.maps.length,
		false
	);
	scenarioData.parsed.maps.forEach(function(map, mapIndex) {
		indicesDataView.setUint32(
			2 + (mapIndex * 4),
			offset,
			false
		)
		chunks.push(map.serialized.header);
		offset += map.serialized.header.byteLength;
		map.serialized.layers.forEach(function (
			layer,
			layerIndex
		) {
			chunks.push(layer);
			offset += layer.byteLength;
		})
	});
	var compositeSize = chunks.reduce(
		function (accumulator, item) {
			return accumulator + item.byteLength;
		},
		0
	);
	var compositeArray = new Uint8Array(compositeSize);
	var currentOffset = 0;
	chunks.forEach(function (item) {
		compositeArray.set(item, currentOffset);
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
					var compositeArray = getFileJson(scenarioFile)
						.then(handleScenarioData(fileNameMap))
						.then(generateIndexAndComposite);
					vm.prepareDownload([compositeArray], 'game.dat');
				}
			} catch (error) {
				vm.error = error.message;
			}
		}
	}
});
