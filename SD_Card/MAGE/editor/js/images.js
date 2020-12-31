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
		dataView.setUint16(
			offset, // uint16_t color
			parseInt(color, 10),
			false
		);
		offset += 2;
	});
	return arrayBuffer;
};

var supportedImageTypes = ['png', 'gif'];
var handleImage = function(tileset, scenarioData, fileNameMap) {
	var imageFileName = tileset.image;
	var file = fileNameMap[imageFileName.split('/').pop()];
	var result = Promise.resolve(file);
	if (file.scenarioIndex === undefined) {
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
		var colorPalette = {
			name: file.name,
			colorArray: [],
			serialized: null,
			scenarioIndex: scenarioData.parsed.imageColorPalettes.length,
		};
		scenarioData.parsed.imageColorPalettes.push(colorPalette);
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
				var getPaletteIndexForColor = function (color) {
					var colorIndex = colorPalette.colorArray.indexOf(color);
					if (colorIndex === -1) {
						colorIndex = colorPalette.colorArray.length;
						colorPalette.colorArray.push(color);
					}
					return colorIndex;
				};
				var sourceWidth = result.shape[0];
				var sourceHeight = result.shape[1];
				var pixelsPerTile = tileset.tilewidth * tileset.tileheight;
				var hasAlpha = result.shape[2] === 4;
				var dataLength = sourceWidth * sourceHeight;
				var data = new ArrayBuffer(dataLength);
				var dataView = new DataView(data);
				var pixelIndex = 0;
				// var wtfLog = [];
				while (pixelIndex < dataLength) {
					var readOffset = pixelIndex * result.shape[2];
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
					// if (file.name === "tileset-town.png") {
					// 	wtfLog.push({
					// 		pixelIndex,
					// 		sourceX,
					// 		sourceY,
					// 		rgba: JSON.stringify(rgba),
					// 		color,
					// 		paletteIndex,
					// 	});
					// 	if (pixelIndex > 511) {
					// 		console.table(wtfLog);
					// 	}
					// }
					dataView.setUint8(
						writeOffset,
						paletteIndex
					);
					pixelIndex += 1;
				}
				console.log(`Colors in image "${imageFileName}": ${colorPalette.colorArray.length}`);
				file.serialized = data;
				colorPalette.serialized = serializeColorPalette(colorPalette);
				return file;
			});
	}
	return result;
};
