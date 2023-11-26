# Variable Types

There are only a few Mage Game Engine (MGE) variables available for [script](../scripts) to use.

Variables don't have to be declared before they can be used; simply using an [action](../actions) that sets or checks one will cause the encoder to include it in the `game.dat`.

NOTE: This means typos can be hard to spot — if you set the variable `birthdayparty` in a script but check the int `birthday_party` in another, the encoder won't notice anything is wrong, and will simply create and store both variables as if they were separate things. If you find a variable isn't triggering logic checks in the ways you expect, you might want to verify that it's spelled the same wherever it's set/used.

All variables are persistent between [map loads](../maps/map_loads), and are all included in the [save data](../scripts/save_data).

## Variable Types

- String (1 max): [warp_state](../scripts/warp_state)
- Integers (255 max): [integer variables](../scripts/integer_variables) (uint16_t)
- Booleans (65,535 max): [save flags](../scripts/save_flags)

Every [property](../entities/entity_properties) on every [entity](../entities) is also available for scripts to read and/or change, and these could be used like traditional variables. But apart from the player's name, all entity properties are reset when a new map is loaded, so in practice they might have marginal utility.

## Other State

These states are not preserved in game saves, and they are all `true` by default. #verifyme

Control of the player entity can be removed or restored with the action [SET_PLAYER_CONTROL](../actions/SET_PLAYER_CONTROL). When player control is off, the player cannot move, use the hex editor, or engage with entities. This is useful if you want to force the player entity to walk along a specific path for a [cutscene](../techniques/cutscenes), or want to make sure the player doesn't walk away from a conversation where an NPC pauses speaking for a minute to (for instance) pace back and forth.

Similarly, the hex editor can be enabled/disabled with the action [SET_HEX_EDITOR_CONTROL](../actions/SET_HEX_EDITOR_CONTROL), and the copy function for the hex editor can be enabled/disabled with the action [SET_HEX_EDITOR_CONTROL_CLIPBOARD](../actions/SET_HEX_EDITOR_CONTROL_CLIPBOARD).

#updateme What other state control actions are there?
