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

var handleTilesetData = function (tilesetFile, fileNameMap) {
	return function (tilesetData) {
		console.log(
			'Tileset:',
			tilesetFile.name,
			tilesetData
		);
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
			)
		})
		tilesetFile.parsed = tilesetData;
		return tilesetData;
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
						.then(handleTilesetData(tilesetFile, fileNameMap))
			).then(function (tilesetParsed) {
				mapTilesetItem.parsed = tilesetParsed
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
	})
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
	map.tilesets.find(function (tileset) {
		var overshot = tileId < tileset.firstgid;
		if(!overshot) {
			targetTileset = tileset;
		}
		return overshot;
	});
	var tileIndex = tileId - targetTileset.firstgid;
	return {
		tileset: targetTileset,
		tileIndex: tileIndex,
		orientation: {
			flipped_horizontally: !!(tileGID & FLIPPED_HORIZONTALLY_FLAG),
			flipped_vertically: !!(tileGID & FLIPPED_VERTICALLY_FLAG),
			flipped_diagonally: !!(tileGID & FLIPPED_DIAGONALLY_FLAG)
		},
		tile: targetTileset.parsed.tiles.find(function (tile) {
			return tile.id === tileIndex;
		}) || {
			id: tileIndex
		}
	}
};

var handleTiledObjectLayer = function (layer, map, fileNameMap, scenarioData) {
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
				entity.orientation,
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
	map.layers.forEach(function (layer) {
		console.log(
			'Layer:',
			layer
		)
		if (layer.type === 'tilelayer') {
		} else if (layer.type === 'objectgroup') {
			handleTiledObjectLayer(layer, map, fileNameMap, scenarioData);
		}
	});
	map.entityInstances.forEach(function (entityInstance) {
		console.log(
			'entityInstance:',
			entityInstance
		)
	});
};

var handleMapData = function (mapFileName, fileNameMap, scenarioData) {
	return function (map) {
		console.log(
			'Map:',
			mapFileName,
			map
		);
		fileNameMap[mapFileName].parsed = map;
		return handleMapTilesets(map.tilesets, scenarioData, fileNameMap)
			.then(function () {
				handleMapLayers(map, scenarioData, fileNameMap);
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
var handleImage = function(imageFileName, fileNameMap) {
	var file = fileNameMap[imageFileName];
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
	var result = Promise.resolve(file);
	if (!file.serialized) {
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
	var chunks = [];
	var compositeSize = chunks.reduce(
		function (accumulator, item) {
			return accumulator + item.data.byteLength;
		},
		0
	);
	var compositeArray = new Uint8Array(compositeSize);
	var currentOffset = 0;
	chunks.forEach(function (item) {
		compositeArray.set(item.data, currentOffset);
		currentOffset += item.data.byteLength;
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
