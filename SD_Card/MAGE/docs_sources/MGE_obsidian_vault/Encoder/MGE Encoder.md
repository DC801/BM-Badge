# MGE Encoder

There are two encoders, but both produce exactly the same `game.dat` file. They are both deterministic.

What gets processed and encoded:

1. Everything in [[scenario.json]]:
	- [[scripts]]
	- [[dialogs]]
	- [[serial dialogs]]
	- dialogSkins
3. Portraits found in [[portraits.json]]
4. Entities found in [[entity_types.json]]
5. Maps found in [[maps.json]]
6. All MGS files within `scenario_source_files` (see [[MGS Natlang]])

While every [[scripts|script]] (and [[dialogs|dialog]], [[Tilesets|tileset]], etc.) is available to the encoder, whether it gets encoded depends on whether it's being used by the game in some way; a script that isn't used by any maps, entities, or referenced any included script will be ignored. In other words, [[Entity types|entities]] must be placed on at least one [[Maps|map]] to be encoded.

## Web VS CLI Encoder

See: [[Web Encoder]], [[CLI Encoder]]

## Using the `game.dat`

Once the encoder is finished producing a `game.dat` file, you can drag it into the [[web build]] open in a web browser, or put it into the [[MAGE Folder]] so the [[desktop build]] can see it.

