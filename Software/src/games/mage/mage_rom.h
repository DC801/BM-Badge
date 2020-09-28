#ifndef _MAGE_ROM_H
#define _MAGE_ROM_H

#include "mage.h"

extern MageDataMemoryAddresses dataMemoryAddresses;
extern MageTileset *allTilesets;
extern uint32_t mapIndex;
extern uint32_t currentMapIndex;
extern MageMap currentMap;
extern MageTileset *currentMapTilesets;
extern MageEntity *currentMapEntities;
extern uint16_t *currentMapEntityFrameTicks;
extern MageAnimationFrame *currentMapEntityFrames;
extern MageEntity **currentMapEntitiesSortedByRenderOrder;
extern uint8_t *data;

extern void init_rom ();
extern uint32_t load_data_headers ();
extern void load_tilesets_headers (
	MageTileset *tilesetPointer,
	uint32_t tilesetIndex
);
extern void load_all_tilesets ();
extern void load_map_headers (uint32_t incomingMapIndex);
void correct_entity_type_endians ();
void correct_animation_endians ();
void correct_entity_endians ();
extern MageEntityType* get_entity_type_by_index(uint8_t index);

#endif //_MAGE_ROM_H
