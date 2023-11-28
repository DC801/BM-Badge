
# Encoder

There are two versions of the encoder, but both produce exactly the same `game.dat` file. They are both deterministic.

What gets encoded:

1. Everything listed in [`scenario.json`](getting_started/mage_folder#scenario-json):
	- [scripts](scripts)
	- [dialogs](dialogs)
	- [serial dialogs](serial_dialogs)
	- dialogSkins
3. Portraits found in [`portraits.json`](getting_started/mage_folder#portraits-json)
4. Entities found in [`entity_types.json`](getting_started/mage_folder#entity_types-json)
5. Maps found in [`maps.json`](getting_started/mage_folder#maps-json)
6. All [MGS files](mgs/mgs_natlang) within [`scenario_source_files`](getting_started/mage_folder#scenario_source_files)

These items are encoded if they're being used by the game in some way; a script that isn't used by any maps, entities, or referenced any included script will be ignored. In other words, entities must be placed on at least one map to be encoded.

Superfluous JSON properties are completely ignored by the encoder. This is the only way documentation or notes can be written in JSON, since JSON doesn't support comments.

```json
"show_dialog-example": [
  {
    "name": "SHOW_DIALOG",
    "dialog": "dialog-example-start",
    "summary": "Oh, hi player! This is an example dialog summary!"
  },
  {
    "name": "SET_ENTITY_INTERACT_SCRIPT",
    "entity": "%SELF%",
    "script": "show_dialog-example-end",
    "to do": "redo with save flags so the branching persists"
  }
]
```

## `game.dat`

The `game.dat` file is the binary file containing all your game scenario content, including images.

Note that [save data](variables#save_data) will persist when using the same `game.dat` file. (Will reflashing the `game.dat` on the hardware wipe the save data explicitly? Probably. #verifyme)

There is currently no way to bring save data from an old version of the `game.dat` to a new one, as the data structure of the save data is unlikely to be consistent between versions.

#### Run Your `game.dat`

- [Web build](web_build): Open the web build in your browser, then drag the `game.dat` into the browser window.
	- NOTE: If you play the game a little then drag the same `game.dat` in again, the game will appear to restart afresh — but in fact, save flags and the like may not be reset, **even when you didn't explicitly save inside the game**. Refresh the browser window to wipe existing game state.
- [Desktop build](desktop_build): If you use the [CLI encoder](#cli-encoder) to build the game, the `game.dat` will already be in the appropriate place to run the game. Otherwise, you must move your new `game.dat` to the [`MAGE` folder](getting_started/mage_folder).
	- (Does the same note above pertain to the desktop build, too? Probably? #verifyme)
- Badge: see [Updating the Hardware](updating_the_hardware)

Also see: [debug tools](debug_tools)

## CLI Encoder

If you have Node.js installed, you can run the shell script `regenerate_dat_file.sh` to generate a new `game.dat` file. There are two versions of this file:

1. BM-Badge version:
	- `cd` into `MAGE/`.
	- Run the shell script. The `game.dat` will be made from the `scenario_source_files/` in `MAGE/`.
2. [Sample repo](getting_started/mge_vm) version:
	- first argument: the `scenario_source_files/` folder to read from
	- second argument: where to write the `game.dat`
	- This version of the shell script also launches the game automatically.

This encoder is more useful than the web version when you want to test rapid iterations of your game data.

## Web Encoder

Open `SD_Card/MAGE/editor/index.html` with a web browser.

Once the page is open, you can either:

1. Drag your [`scenario_source_files`](getting_started/mage_folder#scenario_source_files) folder into the window.
2. Click the "browse" button and choose the `scenario_source_files` using your operating system's file browser.

Confirm that you want to upload the contents of the folder to your browser, and the encoder will do its magic. If successful, click the "Download game.dat" button, and you're done!

The `game.dat` will be sent to your default download location, so to play it on the desktop build, you'll first have to move it to the correct place by hand or run the shell script `replace_dat_file_with_downloaded.sh`. (`cd` into the `SD_Card/MAGE/` folder before using the shell script!)

This encoder is more useful for times you need to [debug something](debug_tools), or when you want to manage an entity's animations (see below).

### Entity Manager

A special feature of the web version of the encoder is the [entity management system](tilesets/entity_management_system), which you can use to assign animations to [character entities](entity_types#character-entity).

## Debugging

(Don't forget that the game has a built-in [hex editor](hex_editor), too!)

### Encoder Console

Both versions of the encoder will tell you when something has gone wrong during the encoding process, and many errors should be self explanatory, e.g. `"No object named X could be found on map Y!"`

The error `Script: X could not be found in scenario.json` does not necessarily mean there is something wrong with [`scenario.json`](getting_started/mage_folder#scenario-json), only that the encoder couldn't find a [script](scripts) by that name in any MGS file or in any of the script JSON files `scenario.json` knows about.

If you get the error "unexpected token" it means one of your files has invalid JSON, and you'll need to check your JSON files for invalid syntax. (A good text editor should have some kind of color coding to help you spot such errors.)

### Inspecting WIP Data

You can use the web encoder and your browser's JavaScript console to inspect various aspects about how the encoder interpreted your game files. (You could even interrupt the encoder *while* it collects and processes the data.)

- List of all [save flags](variables#save-flags)
- Number of colors in each tileset's pallet. If trying to reduce the file size of your `game.dat`, it can help to identify which tilesets have more colors than intended.
- …all the rest #expandme

This is most useful when the encoder throws an exception, because you can examine the state of data involved in triggering the error — the console messages alone might not identify which script or variable was causing the problem.

### Kaitai

Kaitai ([ide.kaitai.io](https://ide.kaitai.io)) is a tool that can parse and analyze binary data formats.

Available inside your [`MAGE` Folder](getting_started/mage_folder) is a file called `mage_dat.ksy`. You can drag this in a Kaitai window, along with your `game.dat`, to analyze in great detail the encoded structure of your game.

This tool lets you easily see the relationship between the hex value of a script/entity_type/dialog/etc. and its name. E.g. if an [entity](entities)'s [`on_tick`](script_slots#on-tick) was being changed unexpectedly, but you only knew the hex value that it's being changed to (perhaps using the [hex editor](hex_editor), using Kaitai to find the name of the script in question can help you track down the problem.
