var rgbaToC565 = function (r, g, b, a) {
	return a < 100
		? 32
		: (((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3));
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
