# Animation Entity

One of the three [entity types](../entities/entity_types).

If you place a animated tile from a [tileset](../Tilesets) onto an object layer in a Tiled [map](../maps), it will become an **animation entity**.

NOTE: If the tile's `Class` (formerly `Type`) property is something defined within [entity_types.json](../structure/entity_types.json), it will instead become a [character entity](../entities/character_entity).

- **`PrimaryIdType`**: `1` (`animation`)
- **`PrimaryId`**: the `id` of the animation the entity is playing
- **`SecondaryId`**: does nothing

When the game is [encoded](../encoder/mge_encoder), all animations are basically shoved together into a single list, so the `id` for `PrimaryId` is fairly subject to change at the whim of the encoder. Therefore, you will probably never want to use the `PrimaryId` to choose a specific animation — instead you will place the desired animation tile from a tileset onto a map with Tiled.

Animation entities are most useful for animated props, e.g. a water fountain, a torch flickering on a wall, a birthday cake with a moving candle flame. Such entities need not use any of the [entity properties](../entity_properties) available to them, though they could.

While NPCs will likely need to be character entities, simpler ones might work perfectly well as animation entities, e.g. WOPR in the BMG2020.
