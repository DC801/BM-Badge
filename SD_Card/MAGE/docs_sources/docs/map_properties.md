# Map Properties

Map properties reside either inside [`maps.json`](getting_started/mage_folder#maps-json) (preferred) or inside a JSON map file (legacy). To see the map's properties within Tiled, go to "Map > Map Properties…."

## `path`

Where the map JSON file is located and what it's called.

## `on_load`

The **[`on_load`](script_slots#on-load)** script plays when the map is first loaded. This is best used for checking [save flags](variables#save-flags) and restoring state that is meant to be permanently changed.

`on_load` scripts stop when finished.

## `on_tick`

The [`on_tick`](script_slots#on-tick) script plays every game tick. Best used for door triggers.

`on_tick` scripts will run once per game tick; they will loop once finished, after allowing other scripts to take a turn.

Any [entity](entities)'s `on_tick` script is capable of watching for the player's movement into [doorways](techniques/doors), but it is logical to assign this task to the map's `on_tick` script.

Because the player cannot directly alter which script is run in a map's `on_tick` slot like they can an entity's `on_tick` slot, actions run in this slot are fairly well protected, as well — useful for doors.

## `on_look`

The [`on_look`](script_slots#on-look) script plays when you run the `look` [command](commands) in the [terminal](terminal) without any arguments.

NOTE: You can override this script if you [register](actions/REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT) a `look` command manually.

## `directions`

The scripts that run when the command `go` is run with the named argument, e.g. `go north`.

These directions will be listed after a maps `on_look` script is triggered (e.g. `exits are...`). Unfortunately, this results in confusion if you want multiple names per exit, so here you should only include directions you want explicitly printed, and use manual [registrations](actions/REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT) for everything else.
