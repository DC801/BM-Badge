# Map Loads

The first map listed in [`maps.json`](getting_started/mage_folder#maps-json) is the map the game will load when first turned on. If you want the game to start on a different map (perhaps skipping an intro [cutscene](techniques/cutscenes) the player has seen before), you should handle this logic checking on the [maps](maps)' [`on_load`](script_slots#on-load) [script](scripts), and [load a different map](actions/LOAD_MAP) as appropriate.

Maps can be assigned an `on_load` script, which will run once when a map is loaded.

## To Reload the Current Map

- Toggle [debug mode](debug_tools#debug-mode): `XOR` + `MEM1` (or `F1` + `F6` on desktop)
- Soft reset current map: `XOR` + `MEM3` (or `F1` + `F8` on desktop)
- Target the current map with [LOAD_MAP](actions/LOAD_MAP)

## Game State

### Preserved

[Save data](variables#save_data), including the player name, persists between map loads, but no other entity state is preserved.

### Not Preserved

All [entity](entities) state is wiped apart from the player name. This includes every entity's appearance, [script slots](script_slots) (both their script assignments and their progress within their scripts), and location.

All [terminal](terminal) [commands](commands) are reset. For a command that needs to persist throughout the game, you must initialize them afresh at the beginning of the map load. (We recommend using [COPY_SCRIPT](actions/COPY_SCRIPT) on a separate [map initialization script](techniques/map_initialization_scripts) so that such logic checks can be shared between all relevant maps.)
