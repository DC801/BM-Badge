# Creating a Tileset JSON File

The [MGE encoder](../encoder/mge_encoder) cannot use image files outright — there must be an associated JSON file (made with Tiled) that explicitly defines the image file path and various other properties.

Within Tiled:

1. Go to "File > New Tileset…"
2. Name the file. Prefix the name with `tileset-` or `entity-` as appropriate.
3. For "source," use the file explorer to choose the sprite sheet or tileset you want to use. (Please make sure the image file is in its final destination ahead of time. Moving it after assigning it can be a bit of a hassle.)
4. Set the tile width and height to the tile size of your image.
5. Save the tileset file:
	- Set the format to JSON.
	- Set the correct destination folder: `scenario_source_files/entities/` for entities and their portraits, and `scenario_source_files/tilesets/` for everything else. (Keep in mind that Tiled will default to the file path of the last file currently open!)

**Alternative method (advanced)**: if you are making pallet variations of the same sprite, and every other aspect (apart from the name and the image) are the same, you might copy the original tileset JSON file and manually change whatever is different between them.

## For Character Entities

All tiles within a [character entity](../entities/character_entity) tileset must have the "Class" (previously this was called "Type") property set to its `entity_type` name. You can find the "Class" property in the Properties view (i.e. panel/pane/frame), which you can make visible (if currently invisible) via "View > View and Toolbars > Properties."

> You can skip this part if you don't need the entity to be a character entity — if you want to leave it as an animation entity, such as a flickering candle or waving grass, it doesn't need to have an `entity_type` name at all. See: [Entity Types](../entities/entity_types)
