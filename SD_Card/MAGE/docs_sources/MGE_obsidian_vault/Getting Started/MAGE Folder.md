# `MAGE` Folder

There'll be a bunch of stuff in the `MAGE/` folder, but relevant to creating new content are:

`editor/index.html` — The [[web encoder]]. To generate a `game.dat`, you can open this file in a web browser and follow the instructions.

`game.dat` — This is the encoded data for your game. If you generated a `game.dat` using [[web encoder]], you must move the resulting `game.dat` here for the [[desktop build]] to see it; the [[CLI encoder]], however, will update the `game.dat` in place.

`replace_dat_file_with_downloaded.sh` — A shell script for grabbing the latest `game.dat` from your Downloads folder and moving it to your current directory.

`regenerate_dat_file.sh` — This shell script requires `node.js` to run (see: [[What You'll Need]]). (There are two versions of this file depending on which repo you started with, and note that the shell script from the [[MGE VM]] is slightly different.)

[[scenario_source_files]] — This is where your raw game data lives.

`mage_dat.ksy` — Intended to be used with [[Kaitai]]. This will help you identify unexpected game state you might be encountering.
