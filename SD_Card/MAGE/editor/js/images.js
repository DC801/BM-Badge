var rgbaToC565 = function (r, g, b, a) {
	return a < 100
		? 32
		: (((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3));
};

var serializeColorPalette = function (colorPalette) {
	var colors = colorPalette.colorArray;
	var name = colorPalette.name;
	var headerLength = getPaddedHeaderLength(
		32 // name
		+ 1 // uint8_t color_count
		+ 1 // uint8_t padding
		+ 2 * colors.length // uint16_t colors
	);
	var arrayBuffer = new ArrayBuffer(headerLength);
	var dataView = new DataView(arrayBuffer);
	var offset = 0;
	setCharsIntoDataView(
		dataView,
		name,
		0,
		offset += 32
	);
	dataView.setUint8(
		offset, // uint8_t color_count
		colors.length
	);
	offset += 1;
	offset += 1; // uint8_t padding
	colors.forEach(function (color) {
		// DO NOT USE `IS_LITTLE_ENDIAN` HERE!
		// The screen _hardware_ is Big Endian,
		// and converting the whole framebuffer each tick would cost us 20ms
		dataView.setUint16(
			offset, // uint16_t color
			parseInt(color, 10),
			IS_SCREEN_LITTLE_ENDIAN
		);
		offset += 2;
	});
	return arrayBuffer;
};

var imageTypeHandlerMap = {
	gif: function(fileUint8Buffer) {
		var reader = new window.omggif.GifReader(fileUint8Buffer);
		var info = reader.frameInfo(0);
		var buffer = new Uint8Array(
			info.width * info.height * 4
		);
		reader.decodeAndBlitFrameRGBA(0, buffer);
		return {
			info: {
				width: info.width,
				height: info.height,
				channels: 4
			},
			data: buffer
		};
	},
	png: function(fileUint8Buffer) {
		var decoded = window.fastPng.decode(fileUint8Buffer);
		var info = {
			width: decoded.width,
			height: decoded.height,
			channels: decoded.channels
		};
		var buffer = decoded.data;
		if (decoded.palette) {
			info.channels = decoded.palette[0].length;
			var hasAlpha = info.channels === 4;
			var pixels = info.width * info.height;
			buffer = new Uint8Array(pixels * info.channels);
			for (var i = 0; i < pixels; i++) {
				var offset = i * info.channels;
				var colorIndex = decoded.data[i];
				var color = decoded.palette[colorIndex] || [0, 0, 0, 0];
				buffer[offset + 0] = color[0];
				buffer[offset + 1] = color[1];
				buffer[offset + 2] = color[2];
				if (hasAlpha) {
					buffer[offset + 3] = color[3];
				}
			}
		}
		return {
			info: info,
			data: buffer
		}
	},
};
var supportedImageTypes = Object.keys(imageTypeHandlerMap);

var handleImage = function (tileset, scenarioData, fileNameMap) {
	var imageFileName = tileset.image;
	var file = fileNameMap[imageFileName.split('/').pop()];
	var result = Promise.resolve(file);
	if (file.scenarioIndex === undefined) {
		if (window.Navigator) {
			// node < 16.7 doesn't have a createObjectURL, and in > 16.7 it's broken
			// we need this for UI components to display these images, but not in CLI
			file.blobUrl = URL.createObjectURL(file);
		}
		var mimeTypeSuffix = file.type.split('/').pop();
		var imageHandler = imageTypeHandlerMap[mimeTypeSuffix];
		if (!imageHandler) {
			throw new Error(
				'Unsupported image type: "'
				+ file.type
				+ '" detected in file named: "'
				+ file.name
				+ '". Supported types are: '
				+ supportedImageTypes.join()
			);
		}
		file.scenarioIndex = scenarioData.parsed.images.length;
		scenarioData.parsed.images.push(file);
		var colorPalette = {
			name: file.name,
			colorArray: [],
			serialized: null,
			scenarioIndex: scenarioData.parsed.imageColorPalettes.length,
		};
		scenarioData.parsed.imageColorPalettes.push(colorPalette);
		var readImageArrayBuffer = function (uint8Array, crc) {
			return (function encodeImage(result) {
				var getPaletteIndexForColor = function (color) {
					var colorIndex = colorPalette.colorArray.indexOf(color);
					if (colorIndex === -1) {
						colorIndex = colorPalette.colorArray.length;
						colorPalette.colorArray.push(color);
					}
					return colorIndex;
				};
				var sourceWidth = result.info.width;
				var sourceHeight = result.info.height;
				var pixelsPerTile = tileset.tilewidth * tileset.tileheight;
				var channels = result.info.channels;
				var hasAlpha = channels === 4;
				var dataLength = sourceWidth * sourceHeight;
				var data = new ArrayBuffer(dataLength);
				var dataView = new DataView(data);
				var pixelIndex = 0;
				// var wtfLog = [];
				while (pixelIndex < dataLength) {
					var readOffset = pixelIndex * channels;
					var sourceX = pixelIndex % sourceWidth;
					var sourceY = Math.floor(pixelIndex / sourceWidth);
					var tileX = sourceX % tileset.tilewidth;
					var tileY = sourceY % tileset.tileheight;
					var column = Math.floor(sourceX / tileset.tilewidth);
					var row = Math.floor(sourceY / tileset.tileheight);
					var writeOffset = (
						tileX
						+ (tileY * tileset.tilewidth)
						+ (((row * tileset.columns) + column) * pixelsPerTile)
					);
					var rgba = {
						r: result.data[readOffset],
						g: result.data[readOffset + 1],
						b: result.data[readOffset + 2],
						a: hasAlpha
							? result.data[readOffset + 3]
							: 255
					};
					var color = rgbaToC565(
						rgba.r,
						rgba.g,
						rgba.b,
						rgba.a,
					);
					var paletteIndex = getPaletteIndexForColor(color);
					if (paletteIndex > 255) {
						throw new Error(`"${imageFileName}" has too many colors! Max supported colors are 256.`);
					}
					// if (paletteIndex > 255) {
					// 	wtfLog.push({
					// 		pixelIndex,
					// 		sourceX,
					// 		sourceY,
					// 		rgba: JSON.stringify(rgba),
					// 		color,
					// 		paletteIndex,
					// 	});
					// }
					dataView.setUint8(
						writeOffset,
						paletteIndex
					);
					pixelIndex += 1;
				}
				// console.table(wtfLog);
				console.log(`Colors in image "${imageFileName}": ${colorPalette.colorArray.length}`);
				file.serialized = data;
				colorPalette.serialized = serializeColorPalette(colorPalette);
				createCacheForFile(crc, file, colorPalette);
				return file;
			})(imageHandler(uint8Array));
		};
		var createCacheForFile = function (crc, file, colorPalette) {
			window.imageCache[crc + file.name] = {
				imageData: Array.from(new Uint8Array(file.serialized)),
				colorPalette: {
					name: colorPalette.name,
					colorArray: colorPalette.colorArray,
					serialized: Array.from(new Uint8Array(colorPalette.serialized)),
				}
			}
		};
		var getCacheForFile = function (crc, file) {
			if (!window.imageCache) {
				window.imageCache = {};
			}
			var result = window.imageCache[crc + file.name];
			if (result) {
				result = {
					imageData: Uint8Array.from(result.imageData),
					colorPalette: {
						name: colorPalette.name,
						colorArray: colorPalette.colorArray,
						serialized: Uint8Array.from(result.colorPalette.serialized),
					}
				}
			}
			return result;
		};
		result = file.arrayBuffer()
			.then(function ingeDataCacheInterceptor (arrayBuffer) {
				var uint8Array = new Uint8Array(arrayBuffer);
				var crc = crc32(uint8Array);
				console.log(`What is the crc32 for ${file.name}? ${crc}`);
				var cachedResult = getCacheForFile(crc, file);
				if (cachedResult) {
					Object.assign(colorPalette, cachedResult.colorPalette);
					file.serialized = cachedResult.imageData;
					return file;
				}
				return readImageArrayBuffer(uint8Array, crc);
			});
	}
	return result;
};
