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
};
