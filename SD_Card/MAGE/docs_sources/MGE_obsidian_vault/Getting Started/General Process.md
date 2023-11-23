# General Process

An example production pipeline. The exact order can vary a bit, and previous steps might be revisited at any point.

1. Prepare entities. For each entity:
	1. Acquire or produce [[Tilesets|spritesheets]].
	2. In Tiled, [[Creating a Tileset JSON File|make a tileset JSON file]].
		1. Put it in `scenario_source_files/entities/`.
		2. For [[character entity|character entities]], set the `Class` property for all tiles to what you want the entity's `entity_type` name to be.
		3. Set frames and timings for your [[Animations]], if any.
			1. For [[character entity|character entities]], prepare [[Animations]] for at least idle, walking, and action.
	3. For each [[character entity]]:
		1. Use the [[Web Encoder]] to [[Entity Management System|assign animations and NSEW directions]].
		2. Paste updated entity data into [[entity_types.json]].
	4. Prepare dialog portraits.
		1. In Tiled, [[Creating a Tileset JSON File|make a tileset JSON file]] for the talk portrait images.
			1. Put it in `scenario_source_files/entities/`.
		2. Prepare [[portraits.json]].
		3. Assign portraits to their entities in [[entity_types.json]] if the portrait name does not match an [[character entity|entity_type]] name.
3. Prepare map(s). For each map:
	1. Acquire or produce [[Tilesets]].
	2. In Tiled, [[Creating a Tileset JSON File|make a tileset JSON file]].
		1. Put it in `scenario_source_files/tilesets/`.
		2. Set [[Tile Collisions]] for each tile.
	3. In Tiled, [[Maps|create a map]] using the tileset(s) from above.
	4. Place entities on the map.
		1. Set [[entity properties]], e.g.
			1. `Name`
			2. `is_player`
			3. [[on_tick]] script
			4. [[on_interact]] script
			5. [[on_look]] script
	5. [[Vector Objects|Draw vector shapes]], e.g.
		1. Walk paths
		2. Doorways
		3. "Walking out the door" paths
		4. Camera targets
	6. Add the map to [[maps.json]], and supply properties like its [[on_load]] and [[on_tick]] scripts.
4. Prepare dialog skin(s). For each skin:
	1. Acquire or produce [[Tilesets]].
	2. In Tiled, [[Creating a Tileset JSON File|make a tileset JSON file]].
		1. Put it in `scenario_source_files/tilesets/`.
	3. Add dialogSkin file(s) to [[scenario.json]].
5. Prepare game behavior. You can either use MGS or JSON for this, or even a mix.
	1. For MGS files: write [[MGS Natlang]]. (See the natlang docs!)
	2. For JSON files (note: you must add each JSON file to [[scenario.json]] or the game encoder won't see it):
		1. Prepare [[dialogs]] inside `scenario_source_files/dialogs/`.
		1. Prepare [[serial dialogs]] inside `scenario_source_files/serial_dialogs/`.
		2. Prepare [[scripts]] inside `scenario_source_files/scripts/`.
			1. Plan logic with flowcharts (optional)
			2. Example scripts:
				1. Doorway watchers
				2. "Walking out the door" behavior
				3. Entity dialog
				4. Cutscenes
6. Encode the `game.dat` using the [[Web Encoder]] or the [[CLI Encoder]].
7. Test the game in one of three ways:
	1. [[Web Build]]:
		1. Remember to use the web build appropriate for the version of the encoder you're using!
		2. Drag the new `game.dat` into the browser window.
		3. Run the game.
	2. Desktop build (see [[MGE VM]]):
		2. Move `game.dat` to the right place.
		3. Run the game.
	3. Verify on real badge hardware.
		1. Copy `game.dat` onto a microSD card.
		2. Insert the microSD card into hardware.
		3. Flash the game.
		4. Run the game.
