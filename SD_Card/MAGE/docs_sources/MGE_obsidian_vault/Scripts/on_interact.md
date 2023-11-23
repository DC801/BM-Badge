# `on_interact`

See: [[Script Slots]]

If the player presses the interact button and the interact hitbox hits another [[entities|entity]], that entity's `on_interact` [[scripts|script]] will run.

Scripts run in the `on_interact` slot will stop once they reach the end of their list of actions. Very commonly, a [[character entity]]'s `on_interact` script will be the start script of their [[dialogs|dialog]] tree.

If the script in this slot jumps to another script at some point, interacting with that entity again will result in the last-used script being run again, not whatever the original `on_interact` script was. Therefore, if you wish an entity to begin all interactions with the first script in its interact tree, you must explicitly [[SET_ENTITY_INTERACT_SCRIPT|reset]] its `on_interact` script at the end of each of its script [[Beginnings, Middles, and Ends|branches]].
