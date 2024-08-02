---
tags: [ 'entity types', 'entity properties', 'hex editor', encoder', 'maps' ]
prev: vector_objects.md
---

# Entities

Entities are a basic element of the Mage Game Engine (MGE).

- All animated graphics must be entities, as ordinary [map](maps) tiles cannot change appearance or move.
- Any single tile object placed in one of a [map](maps)'s object layers will be one of the three [entity types](entity_types), automatically determined by the type of tile being placed.
- All entities have all the same [entity properties](entity_properties) available to them (visible as a pair of rows on the [hex editor](hex_editor) in the game — 32 bytes total). They will all therefore have an [`on_interact`](script_slots#on-interact) and [`on_tick`](script_slots#on-tick) [script slot](script_slots), various render flags, etc.
	- These properties are defined when placed in a Tiled map, but they can be modified during gameplay with [script](scripts) [actions](actions) or by the player via the [hex editor](hex_editor).
- Entities need not have a name, nor a unique name. Scripts targeting an entity by name will simply use the first the [encoder](encoder) found with that name.
- All entity state (apart from the player's name) is reset when a [map load](map_loads) occurs.
