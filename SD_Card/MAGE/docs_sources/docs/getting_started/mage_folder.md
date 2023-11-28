# `MAGE` Folder

There'll be a bunch of stuff in the `MAGE/` folder, but relevant to creating new content are:

`editor/index.html` — The [web encoder](../encoder#web-encoder). To generate a `game.dat`, you can open this file in a web browser and follow the instructions.

`game.dat` — This is the encoded data for your game. If you generated a `game.dat` using [web encoder](../encoder#web-encoder), you must move the resulting `game.dat` here for the [desktop build](../desktop_build) to see it; the [CLI encoder](../encoder#cli_encoder), however, will update the `game.dat` in place.

`replace_dat_file_with_downloaded.sh` — A shell script for grabbing the latest `game.dat` from your Downloads folder and moving it to your current directory.

`regenerate_dat_file.sh` — This shell script requires `node.js` to run (see: [What You'll Need](../getting_started/what_youll_need)). There are two versions of this file depending on which repo you started with, and note that the shell script from the [MGE VM](../getting_started/mge_vm) is slightly different.

`mage_dat.ksy` — Intended to be used with [Kaitai](../encoder#kaitai). This will help you identify unexpected game state you might be encountering.

`scenario_source_files/` — This is where your raw game data lives.

## `scenario_source_files`

::: tip
[MGS Natlang](../mgs/mgs_natlang) has dramatically simplified game scripting, but JSON remains the true underlying structure of game scenario data.
:::

The folders described below provide the only means for the encoder to tell JSON files apart. (On the other hand, MGS files represent multiple types of data, so all MGS files anywhere in the `scenario_source_files` folder are treated the same way.)

JSON file names should be prefixed with the type of MGE data they contain, even when they're placed inside the corresponding folder, as this will make them easier to debug during and after they're encoded.

Make sure all Tiled files are in the correct place before working on them or they'll break when you move them.

### Asset Folders

| folder | file types | purpose |
|---------------|------------|---------|
| `dialog/` | MGE [dialog](../dialogs) files (JSON) | RPG-style dialog messages for the main game screen |
| `entities/` | Tiled [tilesets](../tilesets) (JSON), [spritesheets](../tilesets) (PNG/GIF) | [entity](../entities) assets |
| `maps/` | Tiled [maps](../maps) (JSON) | map data (not including tilesets) |
| `mgs/` | [MGS Natlang](../mgs/mgs_natlang) files | these files need not be anywhere specific, but they're best kept together if nothing else |
| `serial_dialog/` | MGE [serial dialog](../serial_dialogs) files (JSON) | words to be printed on the serial terminal |
| `scripts/` | MGE [script](../scripts) files (JSON) | determines the bulk of the behavior of the game |
| `tilesets/` | Tiled [tilesets](../tilesets) (JSON), [spritesheets](../tilesets) (PNG/GIF) | non-entity assets, such as graphics for maps, dialog borders, etc. |

### `scenario.json`

This file tells the [encoder](../encoder) which JSON files to include for its scripts, dialogs, maps, and dialogSkins processing. ([MGS files](../mgs/mgs_natlang) are converted to JSON and bundled with this data automatically, and need not be individually declared.)

It will look something like this:

```json
{
  "scriptPaths": [
    "scripts/script-example-1.json",
    "scripts/script-example-2.json"
  ],
  "dialogPaths": [
    "dialog/dialog-example.json",
    "dialog/dialog-definitely-an-example.json",
    "dialog/dialog-examples-for-days.json"
  ],
  "serialDialogPaths": [
    "serial_dialog/serial_dialog-example.json"
  ],
  "dialogSkins": {
    "default": "tilesets/tileset-dialog_moon.json",
    "codec": "tilesets/tileset-dialog_codec.json",
    "menu": "tilesets/tileset-dialog_transparent_menu.json"
  }
}
```

`scriptPaths`, `dialogPaths`, and `serialDialogPaths` contain arrays (square brackets). Each array will simply contain a list of all file paths you want the game encoder to see.

`maps` and `dialogSkins` contain object literals (curly braces), which contain name-value pairs. For those object literals, the "name" is the name of the map/dialogSkin for an action to use, and the "value" is the file path for the appropriate JSON file.

A `dialogSkin` called `default` is mandatory.

### `entity_types.json`

Identifies [character entities](../entity_types#character-entity) and assigns them various properties, such as:

- `tileset`: their tileset JSON file path
- `portrait`: the name of their portrait image, if not the same as their `entity_type` name (optional)
- `animations`: their [animation assignments](../tilesets/entity_management_system) (idle, walk, action, etc. — and north, south, west, east)

As an example (keeping in mind that the animation arrays have been closed so the overall structure is more clear):

```json
{
  "mage": {
    "tileset": "entity-mage.json",
    "animations": {
      "idle": [],
      "walk": [],
      "action": []
    }
  },
  "bender_sadbutt": {
    "tileset": "entity-bender_sadbutt.json",
    "portrait": "bender",
    "animations": {
      "idle": [],
      "walk": [],
      "action": [],
      "bite": []
    }
  }
}
```

Animations are much easier to do using the [web encoder](../encoder#web-encoder)'s [entity management system](../entity_management_system), but if you want to make changes to an entity's animations by hand, the structure is as follows:

```json
"idle": [
  {
    "tileid": 18,
    "flip_x": false
  },
  {
    "tileid": 16,
    "flip_x": true
  },
  {
    "tileid": 17,
    "flip_x": false
  },
  {
    "tileid": 16,
    "flip_x": false
  }
]
```

When animations are created within Tiled, they are assigned to a tile on the tileset. So for the above definitions, `tileid` refers to which tile the animation has been assigned to.

To find the `tileid`, count left-to-right and top-to-down, but remember to count starting from 0 instead of 1. Alternatively, you can select the correct tile in Tiled and see the tile ID that way.

`flip_x` will flip the sprites horizontally (and `flip_y` will flip vertically), but will otherwise make no changes to the animation on that tile.

The order of the object literals in the animation is fixed:

- North
- East
- South
- West

Each character entity should at least have an idle, walk, and action animation. (See: [Animations](../animations))

### `maps.json`

This file is new for the chapter 2+ version of the MGE. (The [maps](../maps)' names and paths used to be defined in `scenario.json`, but now they have their own file.)

[Map properties](../map_properties) defined in a map's Tiled JSON file (in the old way) are still honored, but it's recommended to move such properties to this file for easier access.

The first map given is the map run when the game is opened.

```json
{
  "sample": {
    "path": "maps/map-sample.json",
    "on_load": "on_load-sample",
    "on_look": "on_look-sample",
    "on_tick": "on_tick-sample",
    "directions": {
      "north": "on_go-sample-map",
      "south": "on_go-sample-map"
    }
  }
}
```

### `portraits.json`

Data for portraits, which reference tileset JSON files from the `entities/` folder. Portrait names should match associated [entity_type](../entity_types#character-entity) names, if any.

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

The top-level string is the name of the portrait. For most cases, it should be the same as the `entity_type` name for the intended [character entity](../entity_types#character-entity).

`tileset` is the file path for the [JSON file](../tilesets) [`portraits.json`](../getting_started/mage_folder#portraits-json) with the portrait image. The encoder assumes these JSON files will be inside `entities/`.

`tileid` is how you define which tile in the tileset you want to use. You can simply count the tiles in the tileset left-to-right and top-to-down, beginning from `0`, but it might be easier to simply select the appropriate tile within Tiled and see what it says the "ID" is.

Game portraits are determined to be in their default position when alignment is `BOTTOM_LEFT` (or `TOP_LEFT`), and the game automatically flips them when in the `BOTTOM_RIGHT` (or `TOP_RIGHT`) position. For normal RPG-style contexts, you'll want your entities facing the center of the screen, so if the portraits in your tileset image aren't facing the right, you should set `flip_x` to `true`.

You should at least have a `default` emote, but you can define any others as you like. Emotes are currently identified by their index / `id`.

The MGE supports animated emotes.
