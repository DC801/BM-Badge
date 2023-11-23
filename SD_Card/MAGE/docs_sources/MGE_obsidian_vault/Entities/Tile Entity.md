# Tile Entity

One of the three [[entity types]].

If you place a static (unanimated) tile from a [[Tilesets|tileset]] onto an object layer in a Tiled [[Maps|map]], it will become a **tile entity**.

>NOTE: If the tile's "Type" property is something defined within [[entity_types.json]], it will instead become a [[character entity]].

- **`PrimaryIdType`**: `0` (`tileset`)
- **`PrimaryId`**: the `id` of the tileset the entity is using
- **`SecondaryId`**: the `id` of the tile on the tileset (the Nth tile, counting left to right and top to down, 0-indexed)

These are a simple way of making props interactable.

If you don't want an interactable prop to be be Y-indexed with other entities when drawn, you could instead put the prop in the map geometry itself and create a [[null entity]] for the interactable aspects.
