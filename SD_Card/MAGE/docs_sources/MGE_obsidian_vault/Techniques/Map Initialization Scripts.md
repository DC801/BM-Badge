# Map Initialization Scripts

A lot of the game's logic will need to be redone in every [[Maps|map]]'s [[on_load]] script since [[entity properties|entity state]] and other game state is reset when a [[Map Loads|map is loaded or reloaded]].

[[COPY_SCRIPT]] provides an easy means of reusing [[scripts|scripting]] behavior, comparable to functions.

**WARNING**: The chapter 1 version of the engine cannot use `COPY_SCRIPT` if the target script jumps to a second script, as only the actions from the first script will be copied! (See [[Beginnings, Middles, and Ends]])

#expandme 
