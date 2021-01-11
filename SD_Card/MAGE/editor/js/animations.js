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
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint16(
		offset,
		tile.animation.length,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	tile.animation.forEach(function (frame) {
		dataView.setUint16(
			offset,
			frame.tileid,
			IS_LITTLE_ENDIAN
		);
		offset += 2;
		dataView.setUint16(
			offset,
			frame.duration,
			IS_LITTLE_ENDIAN,
		);
		offset += 2;
	});
};
