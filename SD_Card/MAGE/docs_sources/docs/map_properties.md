---
tags: [ 'maps.json', 'tiled', 'save flags', 'doors', 'game tick', 'entities', 'entity', 'doorways', 'terminal', 'command', 'look', 'register', 'go', 'exits', 'registration' ]
---

# Map Properties

Map properties reside either inside [`maps.json`](mage_folder#maps-json) (preferred) or inside a JSON map file (legacy). (To see the map's properties within Tiled, go to "Map > Map Properties….")

Example `maps.json`:

```json
{
  "sample1": {
    "path": "maps/map-sample1.json",
    "on_load": "on_load-sample",
    "on_look": "on_look-sample",
    "on_tick": "on_tick-sample",
    "directions": {
      "north": "on_go-sample-map",
      "south": "on_go-sample-map"
    }
  },
  "sample2": {
    "path": "maps/map-sample2.json"
  }
}
```

## `path`

Where the map JSON file is located and what it's called.

## `on_load`

The [`on_load`](script_slots#on-load) script plays when the map is first loaded, and will only run once.

This is best used for checking [save flags](variables#save-flags) and restoring state that is meant to be permanently changed.

## `on_tick`

The [`on_tick`](script_slots#on-tick) script will execute, allow all other scripts to take a turn, and then execute again on the next game tick.

Because the player cannot use the [hex editor](hex_editor) to directly alter which script is run in a map's `on_tick` slot like they can an entity's `on_tick` slot, this slot is fairly well protected — useful for doors.

## `on_look`

The [`on_look`](script_slots#on-look) script plays when you run the `look` [command](commands) in the [terminal](terminal) without any arguments.

NOTE: You can override this script if you [register](actions/REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT) a `look` command manually.

## `directions`

These scripts run when the command `go` is run with the named argument, e.g. `go north`.

These directions will be listed after a maps `on_look` script is triggered (e.g. `exits are...`). Unfortunately, this can result in confusion if you want multiple names per exit (e.g. `go north` and `go tunnel`), so here you should only include directions you want explicitly printed, and use manual [registrations](actions/REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT) for everything else.
