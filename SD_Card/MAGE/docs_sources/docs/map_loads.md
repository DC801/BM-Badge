---
tags: [ 'maps.json', 'cutscene', 'on_load', 'debug mde', 'save data', 'entity', 'entities', 'script slots', 'terminal', 'serial', 'COPY_SCRIPT' ]
---

# Map Loads

The first [map](maps) listed in [`maps.json`](mage_folder#maps-json) is the map the game will load when first turned on.

Maps can be assigned an [`on_load`](script_slots#on-load) [script](scripts), which will run once when a map is loaded.

## To Reload the Current Map

Do one of the following to reload the current map:

1. Toggle [debug mode](debug_tools#debug-mode): `XOR` + `MEM1` (or `F1` + `F6` on desktop)
2. Soft reset current map: `XOR` + `MEM3` (or `F1` + `F8` on desktop)
3. Target the current map with [LOAD_MAP](actions/LOAD_MAP). (This behavior is equivalent to #2)

## Game State

### Preserved

[Save data](variables#save_data), including the player name, persists between map loads.

### Not Preserved

All [entity](entities) state is reset (apart from the player name). This includes every entity's appearance, [script slots](script_slots) (both their script assignments and their progress within their scripts), and location.

All registered [terminal](terminal) [commands](commands) are reset. For a command that needs to persist throughout the game, you must initialize them afresh at the beginning of the map load. (We recommend using [COPY_SCRIPT](actions/COPY_SCRIPT) on a separate [map initialization script](techniques/map_initialization_scripts) so that such logic checks can be shared between all relevant maps.)
