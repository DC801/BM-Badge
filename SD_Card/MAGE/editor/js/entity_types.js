var handleEntityTypesData = function (
	fileNameMap,
	scenarioData
) {
	return function (entityTypesData) {
		scenarioData.entityTypes = entityTypesData;
		var objectTypesFile = fileNameMap['object_types.json'];
		return !objectTypesFile
			? Promise.resolve([])
			: getFileJson(objectTypesFile)
				.then(handleObjectTypesData(
					fileNameMap,
					scenarioData,
				));
	};
};

var handleObjectTypesData = function (
	fileNameMap,
	scenarioData,
) {
	return function (objectTypesData) {
		console.log(
			'object_types.json',
			objectTypesData
		);
		var entityTilesetsPromiseArray = Object.keys(scenarioData.entityTypes).map(function (key) {
			var entityType = scenarioData.entityTypes[key];
			entityType.type = key;
			entityType.scenarioIndex = scenarioData.parsed.entityTypes.length;
			scenarioData.parsed.entityTypes.push(entityType);
			var entityTypePlusProperties = jsonClone(entityType);
			var objectProperties = objectTypesData.find(function (properties) {
				return properties.name === key;
			});
			if (objectProperties) {
				mergeInProperties(
					entityTypePlusProperties,
					objectProperties.properties
				);
				scenarioData.entityTypesPlusProperties[key] = entityTypePlusProperties;
			}
			return loadTilesetByName(
				entityType.tileset,
				fileNameMap,
				scenarioData,
			)
				.then(function () {
					entityType.serialized = serializeEntityType(
						entityTypePlusProperties,
						fileNameMap,
						scenarioData,
					);
				});
		});
		return Promise.all(entityTilesetsPromiseArray);
	};
};

var createAnimationDirectionSerializer = function (
	tileset,
	dataView
) {
	return function (direction) {
		var tile = (tileset.parsed.tiles || []).find(function (tile) {
			return tile.id === direction.tileid
		});
		var animation = tile && tile.animation;
		dataView.setUint16(
			dataView.currentOffset, // uint16_t type_id
			animation
				? animation.scenarioIndex
				: direction.tileid,
			IS_LITTLE_ENDIAN
		);
		dataView.currentOffset += 2;
		dataView.setUint8(
			dataView.currentOffset, // uint8_t type
			animation
				? 0
				: tileset.parsed.scenarioIndex + 1
		);
		dataView.currentOffset += 1;
		dataView.setUint8(
			dataView.currentOffset, // uint8_t render_flags
			(
				(direction.flip_x << 2)
				+ (direction.flip_y << 1)
				+ (direction.flip_diag << 0)
			)
		);
		dataView.currentOffset += 1;
	};
};
var animationDirectionSize = (
	+ 2 // uint16_t type_id
	+ 1 // uint8_t type (
	// 0: type_id is the ID of an animation,
	// !0: type is now a lookup on the tileset table,
	// and type_id is the ID of the tile on that tileset
	// )
	+ 1 // uint8_t render_flags
);
var serializeEntityType = function (
	entityType,
	fileNameMap,
	scenarioData,
) {
	var portraitKey = entityType.portrait || entityType.type;
	var portrait = scenarioData.portraits[portraitKey];
	var portraitIndex = portrait
		? portrait.scenarioIndex
		: DIALOG_SCREEN_NO_PORTRAIT;
	var animations = Object.values(entityType.animations);
	var headerLength = (
		32 // char[32] name
		+ 1 // uint8_t ??? padding
		+ 1 // uint8_t ??? padding
		+ 1 // uint8_t portrait_index
		+ 1 // uint8_t animation_count
		+ (
			animationDirectionSize
			* 4 // the number of directions supported in the engine
			* animations.length
		)
	);
	var result = new ArrayBuffer(
		getPaddedHeaderLength(headerLength)
	);
	var dataView = new DataView(result);
	dataView.currentOffset = 0;
	setCharsIntoDataView(
		dataView,
		entityType.name || entityType.type,
		0,
		dataView.currentOffset += 32
	);
	dataView.currentOffset += 2; // padding
	dataView.setUint8(
		dataView.currentOffset, // uint8_t animation_count
		portraitIndex
	);
	dataView.currentOffset += 1;
	dataView.setUint8(
		dataView.currentOffset, // uint8_t animation_count
		animations.length
	);
	dataView.currentOffset += 1;
	var tileset = fileNameMap[entityType.tileset];
	var serializeAnimation = createAnimationDirectionSerializer(
		tileset,
		dataView,
	);
	animations.forEach(function (animation) {
		animation.forEach(serializeAnimation);
	});
	return result;
};
