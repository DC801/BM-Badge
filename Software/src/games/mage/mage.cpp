#include <memory>
#include <utility>

#include "common.h"
#include "entity.h"

#include "FrameBuffer.h"
#include "EngineROM.h"
#include "EnginePanic.h"

#include "mage_rom.h"
#include "mage_hex.h"
#include "mage_input.h"

std::unique_ptr<MageRom> MageROM;

FrameBuffer *mage_canvas;
uint32_t lastTime;
uint32_t now;
uint32_t delta_time;

Point cameraPosition = {
	.x = 0,
	.y = 0,
};

void mage_game_loop()
{
	now = millis();
	delta_time = now - lastTime;

	if (*hexEditorState)
	{
		mage_canvas->clearScreen(RGB(0,0,0));
		update_hex_editor();
		render_hex_editor();
	}
	else
	{
		mage_canvas->clearScreen(RGB(0,0,255));
		apply_input_to_player();

		uint8_t layerCount = MageROM->Map().LayerCount();

		if (layerCount > 1)
		{
			for (
				uint8_t layerIndex = 0;
				layerIndex < (layerCount - 1);
				layerIndex++
			)
			{
				MageROM->DrawMap(layerIndex, cameraPosition.x, cameraPosition.y);
			}
		}
		else
		{
			MageROM->DrawMap(0, cameraPosition.x, cameraPosition.y);
		}

		//update_entities();
		MageROM->UpdateEntities(delta_time);

		//draw_entities();
		MageROM->DrawEntities(cameraPosition.x, cameraPosition.y);

		if (layerCount > 1)
		{
			MageROM->DrawMap(layerCount - 1, cameraPosition.x, cameraPosition.y);
		}
	}

	// update_hex_lights();
	mage_canvas->blt();
	lastTime = now;

#ifdef DC801_DESKTOP
	nrf_delay_ms(5);
#endif
}

void MAGE()
{
	// Initialize ROM and drivers
	EngineROM_Init();

	// Verify magic
	if (EngineROM_Magic((const uint8_t*)"MAGEGAME", 8) != true)
	{
		ENGINE_PANIC("Failed to match Game Magic");
	}

	// Construct MageRom object, loading all headers
	MageROM = std::make_unique<MageRom>();

	mage_canvas = p_canvas();
	lastTime = millis();
	set_hex_op(HEX_OPS_XOR);

	while (EngineIsRunning())
	{
		EngineHandleInput();
		apply_input_to_game();
		mage_game_loop();
	}

	// Close rom and any open files
	EngineROM_Deinit();

	return;
}

/* void draw_map (uint8_t layer)
{
	uint32_t tileCount = *currentMap.width * *currentMap.height;
	uint8_t flags = 0;
	uint16_t tileId = 0;
	uint16_t cols = 0;
	int32_t x = 0;
	int32_t y = 0;
	uint8_t *tiles = data + currentMap.startOfLayers;
	MageTileset tileset;
	MageTile *tile;

	for (uint32_t mapTileIndex = 0; mapTileIndex < tileCount; ++mapTileIndex)
	{
		x = ((int32_t) *currentMap.tileWidth * (mapTileIndex % *currentMap.width)) - cameraPosition.x;
		y = ((int32_t) *currentMap.tileHeight * (mapTileIndex / *currentMap.width)) - cameraPosition.y;

		if
		(
			x > -*currentMap.tileWidth
			&& x < WIDTH
			&& y > -*currentMap.tileHeight
			&& y < HEIGHT
		)
		{
			tile = (MageTile *) &tiles[
				(layer * tileCount * 4)
				+ (mapTileIndex * 4)
			];

			tileId = convert_endian_u2_value((*tile).tileId);

			if (tileId != 0)
			{
				tileId -= 1;
				flags = (*tile).flags;
				tileset = *get_tileset_by_id((*tile).tilesetId);
				cols = *tileset.cols;

				mage_canvas->drawImageChunkWithFlags(
					x,
					y,
					*currentMap.tileWidth,
					*currentMap.tileHeight,
					get_image_by_index(*tileset.imageIndex),
					(tileId % cols) * *tileset.tileWidth,
					(tileId / cols) * *tileset.tileHeight,
					*tileset.imageWidth,
					0x0020,
					flags
				);
			}
		}
	}
}*/

/*
void get_renderable_data_from_entity (
	MageEntity *entity,
	MageEntityRenderableData *renderableData
) {
	renderableData->animationFrame = nullptr;
	renderableData->animation = nullptr;
	renderableData->renderFlags = &entity->direction;
	renderableData->entityType = nullptr;
	renderableData->tileset = nullptr;

	if(entity->primaryType == ENTITY_PRIMARY_TILESET)
	{
		renderableData->tileset = get_tileset_by_id(entity->primaryTypeIndex);
		renderableData->tileIndex = &entity->secondaryTypeIndex;
	}

	else if(entity->primaryType == ENTITY_PRIMARY_ANIMATION)
	{
		uint32_t animationOffset = *(
			dataMemoryAddresses.animationOffsets
			+ entity->primaryTypeIndex
		);

		renderableData->animation = (MageAnimation *) (data + animationOffset);
	}
	else if(entity->primaryType == ENTITY_PRIMARY_ENTITY_TYPE)
	{
		renderableData->entityType = get_entity_type_by_index(entity->primaryTypeIndex);

		MageEntityTypeAnimationDirection *entityTypeAnimationDirection = (
			&renderableData->entityType->entityTypeAnimationDirection
			+ (
				entity->currentAnimation
				* 4
			)
			+ entity->direction
		);

		renderableData->renderFlags = &entityTypeAnimationDirection->renderFlags;

		if(entityTypeAnimationDirection->type == 0)
		{
			uint32_t animationOffset = *(
				dataMemoryAddresses.animationOffsets
				+ entityTypeAnimationDirection->typeIndex
			);

			renderableData->animation = (MageAnimation *) (data + animationOffset);
		}
		else
		{
			renderableData->tileset = get_tileset_by_id(entityTypeAnimationDirection->type);
			renderableData->tileIndex = &entityTypeAnimationDirection->typeIndex;
		}
	}

	if(renderableData->animation)
	{
		renderableData->tileset = get_tileset_by_id(renderableData->animation->tilesetIndex);

		renderableData->animationFrame = (
			&renderableData->animation->animationFrames
			+ entity->currentFrame
		);

		renderableData->tileIndex = &renderableData->animationFrame->tileIndex;
	}
}*/

/*
void swap_entity_pointers (MageEntity** xp, MageEntity** yp)
{
	MageEntity* temp = *xp;
	*xp = *yp;
	*yp = temp;
}*/

/*
void sort_current_map_entities_by_render_order ()
{
	/*uint16_t i, j, min_idx;
	uint16_t n = *currentMap.entityCount;
	MageEntity **array = currentMapEntitiesSortedByRenderOrder;

	for(i = 0; i < n; i++)
	{
		array[i] = currentMapEntities + i;
	}

	// One by one move boundary of unsorted subarray
	for (i = 0; i < n - 1; i++)
	{

		// Find the minimum element in unsorted array
		min_idx = i;
		for (j = i + 1; j < n; j++)
		{
			if (array[j]->y < array[min_idx]->y)
			{
				min_idx = j;
			}
		}

		// Swap the found minimum element
		// with the first element
		swap_entity_pointers(&array[min_idx], &array[i]);
	}
}*/

// MageEntityRenderableData renderableEntityData = {};
// uint8_t animation_frame_limiter = 0;
// uint8_t animation_frame = 0;

/*
void draw_entities()
{
	uint16_t entityCount = *currentMap.entityCount;
	MageEntity *entity;
	MageTileset *tileset;
	uint16_t tileIndex;
	uint16_t tilesetX;
	uint16_t tilesetY;
	uint8_t renderFlags;

	sort_current_map_entities_by_render_order();

	for(uint16_t i = 0; i < entityCount; i++)
	{
		entity = *(currentMapEntitiesSortedByRenderOrder + i);

		get_renderable_data_from_entity(
			entity,
			&renderableEntityData
		);

		tileset     = renderableEntityData.tileset;
		tileIndex   = *renderableEntityData.tileIndex;
		renderFlags = *renderableEntityData.renderFlags;
		tilesetX = *tileset->tileWidth * (tileIndex % *tileset->cols);
		tilesetY = *tileset->tileHeight * (tileIndex / *tileset->cols);

		// printf("tileset->name: %s\n", tileset->name);
		// printf("tileset->tileWidth: %" PRIu16 "\n", *tileset->tileWidth);
		// printf("tileset->tileHeight: %" PRIu16 "\n", *tileset->tileHeight);

		mage_canvas->drawImageWithFlags(
			entity->x - cameraPosition.x,
			entity->y - cameraPosition.y - *tileset->tileHeight,
			*tileset->tileWidth,
			*tileset->tileHeight,
			get_image_by_index(*tileset->imageIndex),
			tilesetX,
			tilesetY,
			*tileset->imageWidth,
			0x0020,
			renderFlags
		);
	}
}*/

// MageEntity *playerEntity;

/*
void update_entity_frame (
	MageEntity *entity,
	uint16_t *currentFrameTimer
)
{
	*currentFrameTimer += delta_time * 50;
	get_renderable_data_from_entity(entity, &renderableEntityData);
	if(renderableEntityData.animationFrame) {
		if(*currentFrameTimer >= renderableEntityData.animationFrame->duration) {
			*currentFrameTimer = 0;
			entity->currentFrame++;
			entity->currentFrame = (
				entity->currentFrame
				% renderableEntityData.animation->frameCount
			);
		}
}*/

/*
void update_entities ()
{
	/*MageEntity *entity;
	uint16_t *currentFrameTimer;
	uint16_t entityCount = *currentMap.entityCount;
	for(uint16_t i = 0; i < entityCount; i++) {
		entity = currentMapEntities + i;
		currentFrameTimer = currentMapEntityFrameTicks + i;
		update_entity_frame(
			entity,
			currentFrameTimer
		);
	}
}*/
