# `on_load`

See: [Script Slots](../scripts/script_slots)

A [map](../maps)'s `on_load` script runs when a map is first loaded. Like an [on_interact](../scripts/on_interact) script, once the [script](../scripts) reaches the end of its list of [actions](../actions), the script stops.

These are useful for identifying and re-implementing the "permanent" changes the player has done on that map, as well as making decisions as to whether a [cutscene](../techniques/cutscenes) should be played on that map upon [load](../maps/map_loads) (e.g. at the beginning of the game).
