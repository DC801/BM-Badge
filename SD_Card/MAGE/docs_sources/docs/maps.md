---
tags: [ 'tiled', 'json', 'animations', 'doors', 'doorways', 'coordinate overflow', 'entity properties' ]
prev: 'entity_management_system.md'
---

# Maps

## Creating a Map JSON File

Within Tiled:

1. Go to "File > New Map…"
2. Set the following properties:
	- Orientation: Orthogonal
	- Tile layer format: CSV
	- Tile render order: Right Down
3. Map size can be changed later, so don't worry about setting it correctly right now.
	- The map size limit for the MGE is quite large. Don't worry about surpassing this limit. (What is the limit though? #researchthis )
4. For Tile size, use the tile size for the tileset you intend to use for this map. (Black Mage Game tilesets are 32x32.)
5. Save the map file:
	- Set the format to JSON.
	- Make sure the file name ends with `.json`.
	- Set the correct destination folder: `scenario_source_files/maps/`. (Careful, as Tiled will default to the file path of the last file currently open. You don't want to move this file later!)

You will be using the Tileset view a lot when working on a map, which you can make visible (if invisible) via "View > View and Toolbars > Tileset."

For MGE maps, you'll be using tile layers and object layers alone:

## Tile Layers

Placing tiles is fairly intuitive, but know that you can press **X** to flip and **Z** to rotate a tile you are about to place. See [Tiled's documentation](https://doc.mapeditor.org/en/stable/manual/editing-tile-layers/) for more information.

In the MGE, the topmost tile layer is drawn on top of entities. All others are drawn underneath. (Entities themselves are Y-indexed when drawn.)

::: warning Appearance in Tiled vs MGE
Animations placed on a tile layer will *not* play back within the MGE, regardless of how things may appear within Tiled.

Similarly, placing a tile of the incorrect size on a map will result in divergent behavior between Tiled and the MGE. Make sure all tiles placed are the same size as the map's tileset.
:::

### MGE Tile Layer Considerations

Each additional layer adds overhead to the draw time. Currently, it's recommended to limit tile layers to three or less: one for the top (to appear above entities), and one or two for underneath (to appear below entities).

For the Black Mage Game, we use two base layers: one for the base terrain, and one for terrain doodads with alpha.

In addition, because each tile increases the draw time, it's best to remove tiles that are completely obscured by fully opaque tiles.

## Object Layers

Vector polygons and points are placed on object layers, but tiles can be placed this way, too, if you use the "Insert Tile" button on the vector section of the toolbar (shortcut **T**) — and this is how entities are added to a map.

Vector objects are susceptible to [coordinate overflow](vector_objects#coordinate-overflow), so try to keep objects and all their vertices inside the map coordinate space (unless you actually want to yeet an entity to outer space).

::: tip Best Practice
Particularly on maps with a lot going on, it's best to place objects on separate layers so you can easily hide or reveal specific objects, e.g.:

- the entities themselves
- door and exit paths
- cutscene paths and camera points

It doesn't matter how many layers there are in terms of accommodating the [encoder](encoder), but it's best to place the layer for entities just below the topmost tile layer, at least, for the most accurate visual preview.
:::

### Placing Entities

Entities are placed as tiles on an object layer with the "Insert Tile" button (shortcut **T**). The [type of entity](entity_types) placed and a few of its [entity properties](entity_properties) are determined by which tile you use, but other entity properties must be explicitly set.

Entities are Y-indexed in the MGE, meaning they are rendered in front of or behind other entities according to their Y position. For entities being used as environment props, this can result in odd behavior (e.g. the player appearing underneath a bundle of cables if they walk too far behind it).

Each map can have a maximum of 64 entities.
