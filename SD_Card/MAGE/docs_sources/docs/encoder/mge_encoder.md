# MGE Encoder

There are two encoders, but both produce exactly the same `game.dat` file. They are both deterministic.

What gets processed and encoded:

1. Everything in [`scenario.json`](../structure/scenario.json):
	- [script](../scripts)
	- [dialogs](../dialogs)
	- [serial dialogs](../dialogs/serial_dialogs)
	- dialogSkins
3. Portraits found in [`portraits.json`](../structure/portraits.json)
4. Entities found in [`entity_types.json`](../structure/entity_types.json)
5. Maps found in [`maps.json`](../structure/maps.json)
6. All MGS files within [`scenario_source_files`](../getting_started/scenario_source_files) (see [MGS Natlang](../mgs/mgs_natlang))

While every [script](../scripts) (and [dialog](../dialogs), [tileset](../tilesets), etc.) is available to the encoder, whether it gets encoded depends on whether it's being used by the game in some way; a script that isn't used by any maps, entities, or referenced any included script will be ignored. In other words, [entities](../entities/entity_types) must be placed on at least one [map](../maps) to be encoded.

## Web VS CLI Encoder

See: [Web Encoder](../encoder/web_encoder), [CLI Encoder](../encoder/cli_encoder)

## Using the `game.dat`

Once the encoder is finished producing a `game.dat` file, you can drag it into the [web build](../hardware/web_build) open in a web browser, or put it into the [`MAGE` Folder](../getting_started/mage_folder) so the [desktop build](../hardware/desktop_build) can see it.
