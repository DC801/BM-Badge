---
tags: [ 'spritesheets', 'json', 'entities', 'entity', 'animations', 'character', 'tile', 'tileset', 'tiled', 'portraits', 'entity_type', 'collisions', 'vector objects', 'scripts', 'dialogs', 'serial dialogs', 'doors', 'doorways', 'cutscenes', 'encoder' ]
---

# General Process

An example production pipeline. The exact order can vary a bit, and previous steps might be revisited at any point.

## Entities

Prepare entities. For each entity:

1. Acquire or produce [spritesheets](tilesets).
2. In Tiled, [make a tileset JSON file](tilesets#creating-a-tileset-json-file).
	1. Put it in `scenario_source_files/entities/`.
	2. For [character entities](entity_types#character-entity), set the `Class` property for all tiles to what you want the entity's `entity_type` name to be.
	3. Set frames and timings for your [animations](animations), if any.
		1. For [character entities](entity_types#character-entity), prepare [animations](animations) for at least idle, walking, and action.
3. For each [character entity](entity_types#character-entity):
	1. Use the [web encoder](encoder#web-encoder) to [assign animations and NSEW directions](tilesets/entity_management_system).
	2. Paste updated entity data into [`entity_types.json`](mage_folder#entity_types-json).
4. Prepare dialog portraits.
	1. In Tiled, [make a tileset JSON file](tilesets#creating-a-tileset-json-file) for the talk portrait images.
		1. Put it in `scenario_source_files/entities/`.
	2. Prepare [`portraits.json`](mage_folder#portraits-json).
	3. Assign portraits to their entities in [`entity_types.json`](mage_folder#entity_types-json) if the portrait name does not match an [entity_type](entity_types#character-entity) name.

## Maps

Prepare map(s). For each map:

1. Acquire or produce [tilesets](tilesets).
2. In Tiled, [make a tileset JSON file](tilesets#creating-a-tileset-json-file).
	1. Put it in `scenario_source_files/tilesets/`.
	2. Set [tile collisions](tilesets#tile-collisions) for each tile.
3. In Tiled, [create a map](maps) using the tileset(s) from above.
4. Place entities on the map.
	1. Set [entity properties](entity_properties), e.g.
		1. `Name`
		2. `is_player`
		3. [`on_tick`](script_slots#on-tick) script
		4. [`on_interact`](script_slots#on-interact) script
		5. [`on_look`](script_slots#on-look) script
5. [Draw vector shapes](vector_objects), (see [Doors](techniques/doors)) e.g.
	1. Walk paths
	2. Doorways
	3. "Walking out the door" paths
	4. Camera targets
6. Add the map to [`maps.json`](mage_folder#maps-json), and supply properties like its [`on_load`](script_slots#on-load) and [`on_tick`](script_slots#on-tick) scripts.

## Dialog Skins

Prepare dialog skin(s). For each skin:

1. Acquire or produce [tilesets](tilesets).
2. In Tiled, [make a tileset JSON file](tilesets#creating-a-tileset-json-file).
	1. Put it in `scenario_source_files/tilesets/`.
3. Add dialogSkin file(s) to [`scenario.json`](mage_folder#scenario-json).

## Game Logic

Prepare game behavior. You can either use MGS or JSON for this, or even a mix.

1. For MGS files: write [MGS Natlang](mgs/mgs_natlang). (See the natlang docs!)
2. For JSON files (note: you must also add each JSON file to [`scenario.json`](mage_folder#scenario-json) or the game encoder won't see it):
	1. Prepare [dialogs](dialogs) inside `scenario_source_files/dialogs/`.
	2. Prepare [serial dialogs](serial_dialogs) inside `scenario_source_files/serial_dialogs/`.
	3. Prepare [scripts](scripts) inside `scenario_source_files/scripts/`.
		1. Plan logic with flowcharts (optional)

## Encode Game

Encode the `game.dat` using the [encoder](encoder) (either the [web](encoder#web-encoder) version or the [CLI](encoder#cli-encoder) version).

## Play Test

Test the game in one of three ways:

1. [Web build](web_build):
	1. Remember to use the web build appropriate for the version of the encoder you're using!
	2. Drag the new `game.dat` into the browser window.
	3. Run the game.
2. Desktop build (see [MGE VM](mge_vm)):
	1. Move `game.dat` to the right place.
	2. Run the game.
3. Verify on real badge hardware. See: [Updating the Hardware](updating_the_hardware)
	1. Copy `game.dat` onto a microSD card.
	2. Insert the microSD card into hardware.
	3. Flash the game.
	4. Run the game.
