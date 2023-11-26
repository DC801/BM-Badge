# Save Flags

(Also see: [Variable Types](scripts/variable_types))

Save flags are booleans with arbitrary names (strings) that can be used for various logic checks. You may have up to 65535 of these.

Common use cases for save flags include tracking whether the player has:

- heard specific entities' backstories
- seen specific [cutscenes](techniques/cutscenes)
- completed specific puzzles
- found specific secrets

You will likely need to employ [chains of small checks](techniques/chains_of_small_checks) at the beginning of your [map](maps)'s [on_load](scripts/on_load) [script](scripts) to initialize the map based on the states of save flags like those above.

Save flags persist through map loads because they are part of the save game data.
