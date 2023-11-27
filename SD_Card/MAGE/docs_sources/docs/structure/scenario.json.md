# `scenario.json`

Found in [`scenario_source_files`](../getting_started/scenario_source_files).

This file tells the [encoder](../encoder.md) which JSON files it should be encoding. It will look something like this:

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

Note that the entirety of the contents of `scenario.json` is enclosed in curly braces.

## MGS Files

[MGS files](../mgs/mgs_natlang) need not be declared like this. Simply put them somewhere within the `scenario_source_files` folder.
