# `on_load`

See: [[Script Slots]]

A [[Maps|map]]'s `on_load` script runs when a map is first loaded. Like an [[on_interact]] script, once the [[scripts|script]] reaches the end of its list of [[actions]], the script stops.

These are useful for identifying and re-implementing the "permanent" changes the player has done on that map, as well as making decisions as to whether a [[cutscenes|cutscene]] should be played on that map upon [[map loads|load]] (e.g. at the beginning of the game).
