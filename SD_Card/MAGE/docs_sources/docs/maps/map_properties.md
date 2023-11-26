# Map Properties

#updateme

To see the map's properties, go to "Map > Map Properties…."

**[on_load](scripts/on_load) (string)** — This identifies the script that is run when the [map loads](maps/map_loads).

**[on_tick](scripts/on_tick) (string)** — This identifies the script that is run for that map every game tick. `on_tick` scripts loop when finished.

Any [entity](entities)'s `on_tick` script is capable of watching for the player's movement into [doorways](techniques/doors), it is logical to assign this task to the map's `on_tick` script.

Because the player cannot directly alter which script is run in a map's `on_tick` slot like they can an entity's `on_tick` slot, actions run in this slot are fairly well protected.
