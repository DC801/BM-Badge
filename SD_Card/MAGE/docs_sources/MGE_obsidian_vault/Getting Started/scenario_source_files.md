# `scenario_source_files`

[[MGS Natlang]] has dramatically simplified game scripting, but JSON remains the true underlying structure for the encoder to build a `game.dat`.

The folders described below provide the only means for the encoder to tell JSON files apart. On the other hand, MGS files represent multiple types of data, so all MGS files anywhere in the `scenario_source_files` folder are treated the same way.

JSON files should be prefixed with the type of MGE data they contain, even when they're placed inside the corresponding folder, as this will make them easier to debug during and after they're encoded.

Make sure all Tiled files are in the correct place before working on them or they'll break when you move them.

## Subfolders

| folder | file types | purpose |
|---------------|------------|---------|
| `dialog/` | MGE [[dialogs|dialog]] files (JSON) | RPG-style dialog messages for the main game screen |
| `entities/` | Tiled [[Tilesets]] (JSON), [[tilesets|spritesheets]] (PNG/GIF) | [[entities|entity]] assets |
| `map/` | Tiled [[Maps]] (JSON) | map data (not including tilesets) |
| `mgs/` | [[MGS Natlang]] files | these files need not be anywhere specific, but they're best kept together |
| `serial_dialog/` | MGE [[serial dialogs|serial dialog]] files (JSON) | words to be printed on the serial terminal |
| `scripts/` | MGE [[scripts]] | determines the bulk of the behavior of the game |
| `tilesets/` | Tiled [[Tilesets]] (JSON), [[tilesets|spritesheets]] (PNG/GIF) | non-entity assets, such as graphics for maps, dialog borders, etc. |

## Important files

[[entity_types.json]] — Identifies [[character entity|character entities]] and assigns them various properties. This is where character animations are assigned to their MGE purposes (idle, walk, action, etc. — and north, south, west, east), and while this assignment can be done within the [[MGE Encoder]] using the [[Entity Management System]], the web browser cannot write to this file directly, and you will therefore need to copy the updated data into `entity_types.json` yourself.

[[maps.json]] — This file is new for the chapter 2+ version of the MGE. Map properties defined in a map's Tiled JSON file (in the old way) are still honored, but it's recommended to move such properties to this file for easier access. The first map given is the map run when the game is opened.

[[portraits.json]] — Data for portraits, and which reference tileset JSON files from the `entities/` folder. Portrait names should match associated [[character entity|entity_type]] names, if any.

[[scenario.json]] — This file tells the [[MGE Encoder]] which JSON files to include for its scripts, dialogs, maps, and dialogSkins processing. (MGS files are converted to JSON and bundled with this data automatically, and need not be individually declared.)
