var serializeEntity = function (
	entity,
	fileNameMap,
	scenarioData,
) {
	var headerLength = (
		12 // char[12] name
		+ 2 // uint16_t x
		+ 2 // uint16_t y
		+ 2 // uint16_t on_interact_script_id // local index to the map's script list
		+ 2 // uint16_t on_tick_script_id // local index to the map's script list
		+ 2 // uint16_t primary_id // may be: entity_type_id, animation_id, tileset_id
		+ 2 // uint16_t secondary_id // if primary_id_type is tileset_id, this is the tile_id, otherwise 0
		+ 1 // uint8_t primary_id_type
		+ 1 // uint8_t current_animation
		+ 1 // uint8_t current_frame
		+ 1 // uint8_t direction OR render_flags
		+ 2 // uint16_t path_id
		+ 2 // uint16_t on_tick_script_id
	);
	var arrayBuffer = new ArrayBuffer(
		getPaddedHeaderLength(headerLength)
	);
	var dataView = new DataView(arrayBuffer);
	var offset = 0;
	setCharsIntoDataView(
		dataView,
		entity.name || entity.type || '',
		0,
		offset += 12
	);
	dataView.setUint16(
		offset, // uint16_t x
		Math.round(entity.x),
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint16(
		offset, // uint16_t y
		Math.round(entity.y),
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.on_interact_offset = offset;
	dataView.setUint16(
		offset, // uint16_t on_interact_script_id
		0, // set in another loop later
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.on_tick_offset = offset;
	dataView.setUint16(
		offset, // uint16_t on_tick_script_id
		0, // set in another loop later
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	var entityType = scenarioData.entityTypes[entity.type];
	var primaryIndexType = 0; // tileset_id
	var primaryIndex;
	var secondaryIndex = 0;
	var directionOrRenderFlags = 0;
	if (entityType) {
		primaryIndexType = 2; // entity_type_id
		primaryIndex = entityType.scenarioIndex;
		Object.keys(entityType.animations)
			.find(function (animationName) {
				var animation = entityType.animations[animationName]
				return animation.find(function (animationDirection, direction) {
					if(
						(entity.tileIndex === animationDirection.tileid)
						&& (!!entity.flip_x === !!animationDirection.flip_x)
						&& (!!entity.flip_y === !!animationDirection.flip_y)
					) {
						directionOrRenderFlags = direction;
						return true
					}
				});
			});
	} else if (entity.animation) {
		primaryIndexType = 1; // animation_id
		primaryIndex = entity.animation.scenarioIndex;
	} else {
		primaryIndex = entity.tileset.parsed.scenarioIndex;
		secondaryIndex = entity.tileIndex;
	}
	if(primaryIndexType !== 2) {
		directionOrRenderFlags = entity.renderFlags;
	}
	if(entity.is_glitched) {
		directionOrRenderFlags |= IS_GLITCHED_FLAG;
	}
	if(entity.is_debug) {
		directionOrRenderFlags |= IS_DEBUG_FLAG;
	}
	if(entity.is_flipped_diagonal) {
		directionOrRenderFlags |= IS_FLIPPED_DIAGONAL_FLAG;
	}
	dataView.setUint16(
		offset, // primary_id // may be: entity_type_id, animation_id, tileset_id
		primaryIndex,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint16(
		offset, // secondary_id // if primary_id_type is tileset_id, this is the tile_id, otherwise 0
		secondaryIndex,
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	dataView.setUint8(
		offset, // uint8_t primary_id_type
		primaryIndexType
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t currentAnimation
		entity.currentAnimation || 0
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t currentFrame
		entity.current_frame || 0
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t direction OR render_flags
		directionOrRenderFlags
	);
	offset += 1;
	if(entity.path) {
		// console.log('This entity has a path!', entity.path);
		dataView.setUint16(
			offset,
			entity.path.mapIndex,
			IS_LITTLE_ENDIAN
		);
	}
	offset += 2;
	dataView.on_look_offset = offset;
	dataView.setUint16(
		offset, // uint16_t on_look_script_id
		0, // set in another loop later
		IS_LITTLE_ENDIAN
	);
	offset += 2;
	entity.serialized = arrayBuffer;
	entity.dataView = dataView;
	entity.scenarioIndex = scenarioData.parsed.entities.length;
	scenarioData.parsed.entities.push(entity);
	return entity;
};
