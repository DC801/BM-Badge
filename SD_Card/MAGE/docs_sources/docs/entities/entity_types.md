# Entity Types

In the MGE, there are three types of [entities](entities). Each have a `PrimaryIdType`:

- `0` = [tile](entities/tile_entity) (`tileset`)
- `1` = [animation](entities/animation_entity) (`animation`)
- `2` = [character](entities/character_entity) (`entity_type`)

The an entity's `PrimaryIdType` is determined by the properties of the tile being placed in a Tiled [map](maps).

One key difference between the three entity types: for the first two types (tile and animation), the tile will rotate when the entity changes which direction it is "facing," whereas the last type (character) will instead choose the correct [animation](tilesets/animations) among those it was [assigned](entity_management_system) (north, south, east, or west). Therefore entities that are meant to have standard character animations (like the sheep below) or that need to retain their appearance when moving around the map (like the rake below) *must* be the third type.

| rotating tiles | assigned animations|
| --- | --- |
| sheep (animation) | sheep (character) |
| ![rotating rake](media/sheep-rotating.gif) | ![stable rake](media/sheep-stable.gif) |
| rake (tile) | rake (character) |
| ![rotating rake](media/rake-rotating.gif) | ![stable rake](media/rake-stable.gif) |

In addition, there is currently no way to [control animations](SET_ENTITY_CURRENT_ANIMATION) with scripts unless the entity is a character entity. (See the the modem and bookcase in BMG2020.)
