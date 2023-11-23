# Entity Types

In the MGE, there are three types of [[entities]]. Each have a `PrimaryIdType`:

- `0` = [[Tile Entity|tile]] (`tileset`)
- `1` = [[Animation Entity|animation]] (`animation`)
- `2` = [[Character Entity|character]] (`entity_type`)

The an entity's `PrimaryIdType` is determined by the properties of the tile being placed in a Tiled [[Maps|map]].

One key difference between the three entity types: for the first two types (tile and animation), the tile will rotate when the entity changes which direction it is "facing," whereas the last type (character) will instead choose the correct animation among those it was [[Entity Management System]] (north, south, east, or west). Therefore entities that are meant to have standard character animations (like the sheep below) or that need to retain their appearance when moving around the map (like the rake below) *must* be the third type.

| rotating tiles | assigned animations|
| --- | --- |
| sheep (animation) | sheep (character) |
| ![rotating rake](media/sheep-rotating.gif) | ![stable rake](media/sheep-stable.gif) |
| rake (tile) | rake (character) |
| ![rotating rake](media/rake-rotating.gif) | ![stable rake](media/rake-stable.gif) |

In addition, there is currently no way to control animations with scripts unless the entity is a character entity. (See the the modem and bookcase in BMG2020.)
