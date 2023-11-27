# Variables

There are only a few Mage Game Engine (MGE) variables available for [script](../scripts) to use.

Variables don't have to be declared before they can be used; simply using an [action](../actions) that sets or checks one will cause the encoder to include it in the `game.dat`.

::: warning
This means typos can be hard to spot. If you set `birthdayparty` but check `birthday_party`, the encoder will create and store both variables as if they were separate things.

If you find a variable isn't triggering logic checks in the ways you expect, you might want to verify that it's spelled the same wherever it's set/used.
:::

All variables are persistent between [map loads](../maps/map_loads) because all are all included in the [save data](../scripts/save_data).

::: details For some dubious alternatives...
Every [property](../entities/entity_properties) on every [entity](../entities) is available for scripts to read and/or change, and might be used like normal variables. However, in practice, these might have limited utility because the player can [change these values directly](../hex_editor.md) and these values are reset upon [map load](../maps/map_loads).
:::

## `warp_state`

This is a global **string** that is designated for controlling player spawn behavior on a map's [`on_load`](../scripts/on_load) script. When you [leave a room](../techniques/doors) (or otherwise trigger a new [map](../maps) to load), the `warp_state` string should be set to something that indicates the exit/entrance point so the next map can teleport the player entity to the appropriate [spawn point](../techniques/spawn_points).

Handling player spawn points is the original purpose for `warp_state`, but there's nothing stopping you from using it for other things, too.

NOTICE: You only get 1 such string!

## Integer Variables

**Integer** variables are technically `uint16_t`, meaning they can be any whole number between `0` and `65535`. (NOTE: no negative numbers.)

The default value for these is `0`.

You may have up to 255 of these. You need not declare them before you use them; simply using them will allow the encoder to initialize them.

## Save Flags

Save flags are **booleans** with arbitrary names (strings) that can be used for various logic checks. You may have up to 65535 of these.

Common use cases for save flags include tracking whether the player has:

- heard specific entities' backstories
- seen specific [cutscenes](../techniques/cutscenes)
- completed specific puzzles
- found specific secrets

You will likely need to employ [chains of small checks](../techniques/chains_of_small_checks) at the beginning of your [map](../maps)'s [`on_load`](../scripts/on_load) [script](../scripts) to initialize the map based on the states of save flags like those above.

Save flags persist through map loads because they are part of the save game data.

## Variable Types

- String (1 max): [warp_state](variables#warp-state)
- Integers (255 max): [integer variables](variables.md#integer-variables) (uint16_t)
- Booleans (65,535 max): [save flags](variables.md#save-flags)

## Other State

These states are not preserved in game saves, and they are all `true` by default. #verifyme

Control of the player entity can be removed or restored with the action [SET_PLAYER_CONTROL](../actions/SET_PLAYER_CONTROL). When player control is off, the player cannot move, use the hex editor, or engage with entities. This is useful if you want to force the player entity to walk along a specific path for a [cutscene](../techniques/cutscenes), or want to make sure the player doesn't walk away from a conversation where an NPC pauses speaking for a minute to (for instance) pace back and forth.

Similarly, the hex editor can be enabled/disabled with the action [SET_HEX_EDITOR_CONTROL](../actions/SET_HEX_EDITOR_CONTROL), and the copy function for the hex editor can be enabled/disabled with the action [SET_HEX_EDITOR_CONTROL_CLIPBOARD](../actions/SET_HEX_EDITOR_CONTROL_CLIPBOARD).

#updateme What other state control actions are there?
