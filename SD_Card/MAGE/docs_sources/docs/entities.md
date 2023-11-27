# Entities

Entities are a basic element of the DC801 Mage Game Engine (MGE) along with [actions](actions).

- All moving graphics must be entities, as ordinary [map](maps) tiles cannot move.
- Any single tile object placed on a [map](maps) will be one of the three [entity types](entities/entity_types), automatically determined by the type of tile you are placing.
- All entities have all the same [entity properties](entities/entity_properties) available to them (visible as a pair of rows on the hex editor in the game — 32 bytes total). They will all therefore have an [`on_interact`](scripts/on_interact) and [`on_tick`](scripts/on_tick) [script slot](scripts/script_slots), various render flags, etc.
	- These properties are defined when placed in a Tiled map, but they can be modified during gameplay with [script](scripts) [actions](actions) or by the player via the [hex editor](hex_editor.md).
- Entities need not have a name, nor a unique name. Scripts targeting an entity by name will simply use the first the [MGE encoder](encoder.md) found with that name.
- All entity state (apart from the player's name) is reset when a [map load](maps/map_loads) occurs.
## See Also

- [Entity Properties](entities/entity_properties)
- [Entity Types](entities/entity_types)
	- [Tile Entity](entities/entity_types#tile-entity)
		- [Null Entity](entities/entity_types#null-entity)
	- [Animation Entity](entities/entity_types#animation-entity)
	- [Character Entity](entities/entity_types#character-entity)
- [Relative Entity References](entities/relative_references.md)
	- [`%PLAYER%`](entities/relative_references.md#player)
	- [`%SELF%`](entities/relative_references.md#self)
