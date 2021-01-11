var geometryTypeEnum = {
	point: 0,
	polyline: 1,
	polygon: 2,
};

var serializeGeometry = function (
	geometry,
	map,
	fileNameMap,
	scenarioData,
) {
	var segments = geometry.path.length;
	if (geometry.geometryType === 'polyline') {
		segments--;
	} else if (geometry.geometryType === 'point') {
		segments = 0;
	}
	var headerLength = (
		32 // char[32] name
		+ 1 // uint8_t type
		+ 1 // uint8_t point_count
		+ 1 // uint8_t segment_count
		+ 1 // uint8_t padding
		+ 4 // float path_length
		+ (
			geometry.path.length
			* (
				+ 2 // uint16_t x
				+ 2 // uint16_t y
			)
		)
		+ (
			segments
			* 4 // float segment_length
		)
	);
	var arrayBuffer = new ArrayBuffer(
		getPaddedHeaderLength(headerLength)
	);
	var dataView = new DataView(arrayBuffer);
	var offset = 0;
	setCharsIntoDataView(
		dataView,
		geometry.name,
		0,
		offset += 32
	);
	dataView.setUint8(
		offset, // uint8_t type
		geometryTypeEnum[geometry.geometryType],
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t point_count
		geometry.path.length,
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t segment_count
		segments,
	);
	offset += 1;
	offset += 1; // uint8_t padding
	var addressOfTotalLength = offset;
	offset += 4; // float total_length
	geometry.path.forEach(function (point) {
		dataView.setUint16(
			offset, // uint16_t x
			Math.round(point.x),
			IS_LITTLE_ENDIAN
		);
		offset += 2;
		dataView.setUint16(
			offset, // uint16_t y
			Math.round(point.y),
			IS_LITTLE_ENDIAN
		);
		offset += 2;
	});
	var totalLength = 0;
	if (geometry.path.length > 1) {
		geometry.path.slice(0, segments).forEach(function (pointA, index) {
			var pointB = geometry.path[(index + 1) % geometry.path.length];
			var diff = {
				x: pointB.x - pointA.x,
				y: pointB.y - pointA.y,
			};
			var segmentLength = Math.sqrt(
				(diff.x * diff.x)
				+ (diff.y * diff.y)
			);
			totalLength += segmentLength;
			dataView.setFloat32(
				offset, // float segment_length
				segmentLength,
				IS_LITTLE_ENDIAN
			);
			offset += 4;
		});
	}
	dataView.setFloat32(
		addressOfTotalLength, // float total_length
		totalLength,
		IS_LITTLE_ENDIAN
	);
	geometry.serialized = arrayBuffer;
	geometry.scenarioIndex = scenarioData.parsed.geometry.length;
	scenarioData.parsed.geometry.push(geometry);
	return geometry;
};

var getGeometryType = function (geometry) {
	var type = 'rect';
	if (geometry.point) {
		type = 'point';
	} else if (geometry.polyline) {
		type = 'polyline';
	} else if (geometry.polygon) {
		type = 'polygon';
	} else if (geometry.ellipse) {
		type = 'ellipse';
	} else if (geometry.text) {
		type = 'text';
	}
	return type;
};

var makeRelativeCoordsAbsolute = function (geometry, points) {
	return points.map(function(point) {
		return {
			x: point.x + geometry.x,
			y: point.y + geometry.y,
		};
	});
};

var geometryTypeHandlerMap = {
	point: function (geometry) {
		return [{
			x: geometry.x,
			y: geometry.y,
		}];
	},
	rect: function (geometry) {
		return [
			{ // top left
				x: geometry.x,
				y: geometry.y,
			},
			{ // top right
				x: geometry.x + geometry.width,
				y: geometry.y,
			},
			{ // bottom right
				x: geometry.x + geometry.width,
				y: geometry.y + geometry.height,
			},
			{ // bottom left
				x: geometry.x,
				y: geometry.y + geometry.height,
			}
		];
	},
	polyline: function (geometry) {
		return makeRelativeCoordsAbsolute(geometry, geometry.polyline)
	},
	polygon: function (geometry) {
		return makeRelativeCoordsAbsolute(geometry, geometry.polygon)
	},
	ellipse: function (geometry) {
		var result = [];
		var points = geometry.points || 16;
		var radFraction = (Math.PI * 2) / points;
		var angle;
		var halfWidth = geometry.width / 2;
		var halfHeight = geometry.height / 2;
		var centerX = geometry.x + halfWidth;
		var centerY = geometry.y + halfHeight;
		for (var i = 0; i < points; i += 1) {
			angle = radFraction * i;
			result.push({
				x: centerX + (Math.cos(angle) * halfWidth),
				y: centerY + (Math.sin(angle) * halfHeight),
			});
		}
		return result;
	},
};

var geometryTypeKeyMap = {
	point: 'point',
	rect: 'polygon',
	polyline: 'polyline',
	polygon: 'polygon',
	ellipse: 'polygon',
};

var getPathFromGeometry = function (geometry) {
	var type = getGeometryType(geometry);
	var handler = geometryTypeHandlerMap[type];
	var result;
	if (handler) {
		result = handler(geometry);
		result.type = type;
		geometry.path = result;
		geometry.geometryType = geometryTypeKeyMap[type];
	} else {
		console.warn(`Unsupported Geometry Type: ${type}\n`);
	}
	return result;
};

var handleTiledObjectAsGeometry = function (
	tiledObject,
	map,
	fileNameMap,
	scenarioData,
) {
	mergeInProperties(tiledObject, tiledObject.properties);
	var path = getPathFromGeometry(tiledObject);
	if (path) {
		var geometry = serializeGeometry(
			tiledObject,
			map,
			fileNameMap,
			scenarioData,
		);
		geometry.mapIndex = map.geometryIndices.length;
		map.geometryIndices.push(
			geometry.scenarioIndex
		);
	}
};
