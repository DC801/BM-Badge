# `portraits.json`

This JSON file looks like this:

```json
{
  "baker": {
    "tileset": "portraits-people.json",
    "emotes": {
      "default": {
        "tileid": 15,
        "flip_x": true
      }
    }
  },
  "bender": {
    "tileset": "portraits-people.json",
    "emotes": {
      "default": {
        "tileid": 21,
        "flip_x": true
      },
      "laugh": {
        "tileid": 22,
        "flip_x": true
      }
    }
  }
}
```

The top-level string is the name of the portrait. For most cases, it should be the same as the `entity_type` name for the intended [character entity](entities/character_entity).

`tileset` is the file path for the [JSON file](tilesets) [associated](structure/portraits.json) with the portrait image. The encoder assumes these JSON files will be inside `entities/`.

`tileid` is how you define which tile in the tileset you want to use. You can simply count the tiles in the tileset left-to-right and top-to-down, beginning from `0`, but it might be easier to simply select the appropriate tile within Tiled and see what it says the "ID" is.

Game portraits are determined to be in their default position when alignment is `BOTTOM_LEFT` (or `TOP_LEFT`), and the game automatically flips them when in the `BOTTOM_RIGHT` (or `TOP_RIGHT`) position. For normal RPG-style contexts, you'll want your entities facing the center of the screen, so if the portraits in your tileset image aren't facing the right, you should set `flip_x` to `true`.

You should at least have a `default` emote, but you can define any others as you like. Emotes are currently identified by their index / `id`.

The MGE supports animated emotes.
