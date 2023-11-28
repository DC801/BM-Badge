# Entities

Entities are a basic element of the DC801 Mage Game Engine (MGE) along with [actions](actions).

- All animated graphics must be entities, as ordinary [map](maps) tiles cannot move.
- Any single tile object placed on a [map](maps) will be one of the three [entity types](entity_types), automatically determined by the type of tile you are placing.
- All entities have all the same [entity properties](entity_properties) available to them (visible as a pair of rows on the hex editor in the game — 32 bytes total). They will all therefore have an [`on_interact`](script_slots#on-interact) and [`on_tick`](script_slots#on-tick) [script slot](script_slots), various render flags, etc.
	- These properties are defined when placed in a Tiled map, but they can be modified during gameplay with [script](scripts) [actions](actions) or by the player via the [hex editor](hex_editor).
- Entities need not have a name, nor a unique name. Scripts targeting an entity by name will simply use the first the [encoder](encoder) found with that name.
- All entity state (apart from the player's name) is reset when a [map load](map_loads) occurs.