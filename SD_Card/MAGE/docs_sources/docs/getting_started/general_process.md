# General Process

An example production pipeline. The exact order can vary a bit, and previous steps might be revisited at any point.

## Entities

Prepare entities. For each entity:

1. Acquire or produce [spritesheets](../tilesets).
2. In Tiled, [make a tileset JSON file](../tilesets/creating_a_tileset_json_file).
	1. Put it in `scenario_source_files/entities/`.
	2. For [character entities](../entities/entity_types#character-entity), set the `Class` property for all tiles to what you want the entity's `entity_type` name to be.
	3. Set frames and timings for your [animations](../tilesets/animations), if any.
		1. For [character entities](../entities/entity_types#character-entity), prepare [animations](../tilesets/animations) for at least idle, walking, and action.
3. For each [character entity](../entities/entity_types#character-entity):
	1. Use the [web encoder](../encoder.md#web-encoder) to [assign animations and NSEW directions](../tilesets/entity_management_system.md).
	2. Paste updated entity data into [`entity_types.json`](../structure/entity_types.json).
4. Prepare dialog portraits.
	1. In Tiled, [make a tileset JSON file](../tilesets/creating_a_tileset_json_file) for the talk portrait images.
		1. Put it in `scenario_source_files/entities/`.
	2. Prepare [`portraits.json`](../structure/portraits.json).
	3. Assign portraits to their entities in [`entity_types.json`](../structure/entity_types.json) if the portrait name does not match an [entity_type](../entities/entity_types#character-entity) name.

## Maps

Prepare map(s). For each map:

1. Acquire or produce [tilesets](../tilesets).
2. In Tiled, [make a tileset JSON file](../tilesets/creating_a_tileset_json_file).
	1. Put it in `scenario_source_files/tilesets/`.
	2. Set [tile collisions](../tilesets/creating_a_tileset_json_file#tile-collisions) for each tile.
3. In Tiled, [create a map](../maps) using the tileset(s) from above.
4. Place entities on the map.
	1. Set [entity properties](../entities/entity_properties), e.g.
		1. `Name`
		2. `is_player`
		3. [`on_tick`](../scripts/on_tick) script
		4. [`on_interact`](../scripts/on_interact) script
		5. [`on_look`](../scripts/on_look) script
5. [Draw vector shapes](../maps/vector_objects), (see [Doors](../techniques/doors)) e.g.
	1. Walk paths
	2. Doorways
	3. "Walking out the door" paths
	4. Camera targets
6. Add the map to [`maps.json`](../structure/maps.json), and supply properties like its [`on_load`](../scripts/on_load) and [`on_tick`](../scripts/on_tick) scripts.

## Dialog Skins

Prepare dialog skin(s). For each skin:

1. Acquire or produce [tilesets](../tilesets).
2. In Tiled, [make a tileset JSON file](../tilesets/creating_a_tileset_json_file).
	1. Put it in `scenario_source_files/tilesets/`.
3. Add dialogSkin file(s) to [`scenario.json`](../structure/scenario.json).

## Game Logic

Prepare game behavior. You can either use MGS or JSON for this, or even a mix.

1. For MGS files: write [MGS Natlang](../mgs/mgs_natlang). (See the natlang docs!)
2. For JSON files (note: you must add each JSON file to [`scenario.json`](../structure/scenario.json) or the game encoder won't see it):
	1. Prepare [dialogs](../dialogs) inside `scenario_source_files/dialogs/`.
	1. Prepare [serial dialogs](../dialogs/serial_dialogs) inside `scenario_source_files/serial_dialogs/`.
	2. Prepare [script](../scripts) inside `scenario_source_files/scripts/`.
		1. Plan logic with flowcharts (optional)
		2. Example scripts:
			1. Doorway watchers
			2. "Walking out the door" behavior
			3. Entity dialog
			4. Cutscenes

## Encode Game

Encode the `game.dat` using the [encoder](../encoder.md) (either the [web](../encoder.md#web-encoder) version or the [CLI](../encoder.md#cli-encoder) version).

## Play Test

Test the game in one of three ways:

1. [Web build](../hardware/web_build):
	1. Remember to use the web build appropriate for the version of the encoder you're using!
	2. Drag the new `game.dat` into the browser window.
	3. Run the game.
2. Desktop build (see [MGE VM](../getting_started/mge_vm)):
	2. Move `game.dat` to the right place.
	3. Run the game.
3. Verify on real badge hardware.
	1. Copy `game.dat` onto a microSD card.
	2. Insert the microSD card into hardware.
	3. Flash the game.
	4. Run the game.
