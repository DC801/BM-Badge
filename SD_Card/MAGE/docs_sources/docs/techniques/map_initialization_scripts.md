# Map Initialization Scripts

A lot of the game's logic will need to be redone in every [map](../maps)'s [`on_load`](../script_slots#on-load) script since [entity state](../entity_properties) and other game state is **reset** when a [map is loaded or reloaded](../map_loads).

[COPY_SCRIPT](../actions/COPY_SCRIPT) provides an easy means of reusing [scripting](../scripts) behavior, comparable to functions.

::: warning CHAPTER 1 WARNING
The chapter 1 version of the engine cannot use `COPY_SCRIPT` if the target script jumps to a second script, as only the actions from the first script will be copied! (See: [Beginnings, Middles, and Ends](../techniques/beginnings_middles_and_ends))
:::

#expandme 
