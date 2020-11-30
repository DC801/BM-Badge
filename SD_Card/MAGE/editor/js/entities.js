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
		+ 1 // uint8_t hackable_state_a
		+ 1 // uint8_t hackable_state_b
		+ 1 // uint8_t hackable_state_c
		+ 1 // uint8_t hackable_state_d
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
		false
	);
	offset += 2;
	dataView.setUint16(
		offset, // uint16_t y
		Math.round(entity.y),
		false
	);
	offset += 2;
	dataView.on_interact_offset = offset;
	dataView.setUint16(
		offset, // uint16_t on_interact_script_id
		0, // set in another loop later
		false
	);
	offset += 2;
	dataView.on_tick_offset = offset;
	dataView.setUint16(
		offset, // uint16_t on_tick_script_id
		0, // set in another loop later
		false
	);
	offset += 2;
	var entityType = scenarioData.entityTypes[entity.type];
	if (entityType && (entityType.scenarioIndex === undefined)) {
		entityType.scenarioIndex = scenarioData.parsed.entityTypes.length;
		scenarioData.parsed.entityTypes.push(entityType);
		entityType.serialized = serializeEntityType(
			entityType,
			scenarioData,
			fileNameMap
		);
	}
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
	dataView.setUint16(
		offset, // primary_id // may be: entity_type_id, animation_id, tileset_id
		primaryIndex,
		false
	);
	offset += 2;
	dataView.setUint16(
		offset, // secondary_id // if primary_id_type is tileset_id, this is the tile_id, otherwise 0
		secondaryIndex,
		false
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
	var hackableStateAOffset = offset;
	dataView.setUint8(
		offset, // uint8_t hackable_state_a
		entity.hackable_state_a || 0
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t hackable_state_b
		entity.hackable_state_b || 0
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t hackable_state_c
		entity.hackable_state_c || 0
	);
	offset += 1;
	dataView.setUint8(
		offset, // uint8_t hackable_state_d
		entity.hackable_state_d || 0
	);
	if(entity.path) {
		console.log('This entity has a path!', entity.path);
		dataView.setUint16(
			hackableStateAOffset,
			entity.path.mapIndex,
			false
		);
	}
	offset += 1;
	entity.serialized = arrayBuffer;
	entity.dataView = dataView;
	entity.scenarioIndex = scenarioData.parsed.entities.length;
	scenarioData.parsed.entities.push(entity);
	return entity;
};

var handleEntitiesData = function (scenarioData, entitiesFile) {
	return function (entitiesData) {
		console.log(
			'object_types.json',
			entitiesData
		);
		var result = {};
		entitiesData.forEach(function (entityItem) {
			var item = assignToLessFalsy(
				{
					type: entityItem.name
				},
				scenarioData.entityTypes[entityItem.name]
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