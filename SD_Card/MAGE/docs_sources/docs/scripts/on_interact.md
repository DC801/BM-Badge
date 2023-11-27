# `on_interact`

See: [Script Slots](../scripts/script_slots)

If the player presses the interact button and the interact hitbox hits another [entity](../entities), that entity's `on_interact` [script](../scripts) will run. (You can watch this happen with [vector view](../debug_tools.md#vector-view).)

Scripts run in the `on_interact` slot will stop once they reach the end of their list of actions. Very commonly, a [character entity](../entities/entity_types#character-entity)'s `on_interact` script will be the start script of their [dialog](../dialogs) tree.

If the script in this slot jumps to another script at some point, interacting with that entity again will result in the last-used script being run again, not whatever the original `on_interact` script was. Therefore, if you wish an entity to begin all interactions with the first script in its interact tree, you must explicitly [reset](../actions/SET_ENTITY_INTERACT_SCRIPT) its `on_interact` script at the end of each of its script [branches](../techniques/beginnings_middles_and_ends).
