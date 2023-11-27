# Entity Types

In the MGE, there are three types of [entities](../entities). Each have a `PrimaryIdType`:

- `0` = [tile](#tile-entity) (`tileset`)
- `1` = [animation](#animation-entity) (`animation`)
- `2` = [character](#character-entity) (`entity_type`)

The an entity's `PrimaryIdType` is determined by the properties of the tile being placed in a Tiled [map](../maps).

One key difference between the three entity types: for the first two types (tile and animation), the tile will rotate when the entity changes which direction it is "facing," whereas the last type (character) will instead choose the correct [animation](../tilesets/animations) among those it was [assigned](../tilesets/entity_management_system.md) (north, south, east, or west). Therefore entities that are meant to have standard character animations (like the sheep below) or that need to retain their appearance when moving around the map (like the rake below) *must* be the third type.

| rotating tiles | assigned animations|
| --- | --- |
| sheep (animation) | sheep (character) |
| ![rotating rake](../media/sheep-rotating.gif) | ![stable rake](../media/sheep-stable.gif) |
| rake (tile) | rake (character) |
| ![rotating rake](../media/rake-rotating.gif) | ![stable rake](../media/rake-stable.gif) |

In addition, there is currently no way to [control animations](../actions/SET_ENTITY_CURRENT_ANIMATION) with scripts unless the entity is a character entity. (See the the modem and bookcase in BMG2020.)

## Tile Entity

If you place a static (unanimated) tile from a [tileset](../Tilesets) onto an object layer in a Tiled [map](../maps), it will become a **tile entity**.

::: tip NOTE
If the tile's `Class` (formerly `Type`) property is something defined within [`entity_types.json`](../structure/entity_types.json), it will instead become a [character entity](#character-entity).
:::

- **`PrimaryIdType`**: `0` (`tileset`)
- **`PrimaryId`**: the `id` of the tileset the entity is using
- **`SecondaryId`**: the `id` of the tile on the tileset (the Nth tile, counting left to right and top to down, 0-indexed)

These are a simple way of making props interactable.

If you don't want an interactable prop to be be Y-indexed with other entities when drawn, you could instead put the prop in the map geometry itself and create a [null entity](#null-entity) for the interactable aspects.

### Null Entity

A null entity is a [tile entity](#tile-entity) whose tile is entirely transparent. They're useful for implementing scripting behaviors not directly supported by the MGE, such as having an entity procedurally chase a moving (invisible) target.

A common use is to enable interaction behavior for things that aren't themselves entities. To do this, place a null entity on the map wherever you want interaction behavior to happen, then use the null entity's [`on_interact`](../scripts/on_interact) [script slot](../scripts/script_slots) for the interaction behavior.

**Disadvantages**: The null entity can be hacked into another tile (presumably one with pixel data), in which case a new object will seemingly appear out of nowhere.

NOTE: Currently you cannot click on transparent pixels in Tiled. To select a null entity, you'll have to use the Layer pallet.

## Animation Entity

If you place a animated tile from a [tileset](../tilesets) onto an object layer in a Tiled [map](../maps), it will become an **animation entity**.

::: tip NOTE
If the tile's `Class` (formerly `Type`) property is something defined within [`entity_types.json`](../structure/entity_types.json), it will instead become a [character entity](#character-entity).
:::

- **`PrimaryIdType`**: `1` (`animation`)
- **`PrimaryId`**: the `id` of the animation the entity is playing
- **`SecondaryId`**: does nothing

When the game is [encoded](../encoder.md#web-encoder), all animations are basically shoved together into a single list, so the `id` for `PrimaryId` is fairly subject to change at the whim of the encoder. Therefore, you will probably never want to use the `PrimaryId` to choose a specific animation — instead you will place the desired animation tile from a tileset onto a map with Tiled.

Animation entities are most useful for animated props, e.g. a water fountain, a torch flickering on a wall, a birthday cake with a moving candle flame. Such entities need not use any of the [entity properties](../entities/entity_properties) available to them, though they could.

While NPCs will likely need to be character entities, simpler ones might work perfectly well as animation entities, e.g. WOPR in the BMG2020.

## Character Entity

If you place a tile from a [tileset](../tilesets) onto an object layer in a Tiled [map](../maps), and the `Class` (formerly `Type`) property of the tile has been defined in [`entity_types.json`](../structure/entity_types.json), it will become an **character entity**.

- **`PrimaryIdType`**: `2` (`entity_type`)
- **`PrimaryId`**: the `id` of the entity within [`entity_types.json`](../structure/entity_types.json)
- **`SecondaryId`**: does nothing

In scripts, you need not manipulate `PrimaryId` to alter the appearance of a character entity, though there are certainly [script](../scripts) that are capable of doing this. Instead, you can use [actions](../actions) with the argument `entity_type`, which is the name (string) of the character entity as defined within [`entity_types.json`](../structure/entity_types.json). (In the entity's [tileset](../tilesets), this is what the property "Type" is set to.)

What's special about character entities is that they can have a number of [animations](../tilesets/animations) [assigned](../tilesets/entity_management_system.md) to them and they will switch animations automatically depending on context (walking or not, facing north/south/east/west, etc.), as well as having other attributes, like a permanently assigned portrait image. **NPCs will therefore likely be this type.**

In the MGE, character entities will default to their idle animation regardless of whatever specific tile is being used within Tiled. (I.e. if you use a "walking animation" tile for the entity on the Tiled map, the entity will appear to be walking in Tiled, but not within the MGE.)

Character entities will face the north by default, but if the tile placed has been [assigned to a NSEW direction and a purpose](../tilesets/entity_management_system.md), the entity will instead face the direction associated with that tile.
