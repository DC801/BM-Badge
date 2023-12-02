# Variables

There are only a few Mage Game Engine (MGE) variables available for [scripts](scripts) to use.

Variables don't have to be declared before they can be used; simply using an [action](actions) that sets or checks one will cause the encoder to include it in the `game.dat`. All these variables are globals — equally accessible to all scripts at all times.

::: warning
This means typos can be hard to spot. If you set `birthdayparty` but check `birthday_party`, the encoder will create and store both variables as if they were separate things.

If you find a variable isn't triggering logic checks in the ways you expect, check your spelling of everything.
:::

All variables are persistent between [map loads](map_loads) because all are all included in the [save data](variables#save_data).

::: details For some dubious alternatives...
Every [property](entity_properties) on every [entity](entities) is available for scripts to read and/or change, and might be used like normal variables. However, in practice, these might have limited utility because the player can [change these values directly](hex_editor) and these values are reset upon [map load](map_loads).
:::

## `warp_state`

This is a global **string** that is designated for controlling player spawn behavior on a map's [`on_load`](script_slots#on-load) script. When you [leave a room](techniques/doors) (or otherwise trigger a new [map](maps) to load), the `warp_state` string should be set to something that indicates the exit/entrance point so the next map can teleport the player entity to the appropriate [spawn point](techniques/spawn_points).

Handling player spawn points is the original purpose for `warp_state`, but there's nothing stopping you from using it for other things, too.

NOTICE: You only get 1 such string!

## Integer Variables

**Integer** variables are `uint16_t`, meaning they can be any whole number between `0` and `65535`. (NOTE: no negative numbers, no `NaN`.)

The default value for these is `0`.

You may have up to 255 of these. You need not declare them before you use them; simply using them will allow the encoder to initialize them.

## Save Flags

Save flags are **booleans** with arbitrary names (strings) that can be used for various logic checks. You may have up to 65535 of these.

Common use cases for save flags include tracking whether the player has:

- heard specific entities' backstories
- seen specific [cutscenes](techniques/cutscenes)
- completed specific puzzles
- found specific secrets

You will likely need to employ [chains of small checks](techniques/chains_of_small_checks) at the beginning of your [map](maps)'s [`on_load`](script_slots#on-load) [script](scripts) to initialize the map based on the states of save flags like those above.

Save flags persist through map loads because they are part of the save game data.

## Printing Current Values

The values of [integer variables](variables#integer-variables) and the **current names** of any [entity](entities) can be inserted into a dialog message, dialog label, or similar places.

### Current Variable Value

Enclose the name of the variable in dollar signs, like this: `$appleCount$`

```mgs
exampleScript {
  mutate appleCount = 10;
  show serial dialog { "I have $appleCount$ apples for sale today!" }
}
```

The above script will produce:

```
I have 10 apples for sale today!

>_
```

For text wrapping, it's recommended that these names be counted as taking up 5 characters. ([MGS Natlang](mgs/mgs_natlang) will wrap text automatically.)

### Current Entity Name

Wrap an entity's **given name** (the name assigned to it in Tiled) in percent signs (`%`) to insert the entity's name as it currently exists in RAM: `"Hi, there! My name is %Bob%!"`

Unlike with [relative entity references](entities/relative_references) (like [`%SELF%`](relative_references#self) and [`%PLAYER%`](relative_references#player)), this usage will not work when trying to target an entity with an action. Instead, use the entity's given name.

For text wrapping, it's recommended that these names be counted as taking up 12 characters. ([MGS Natlang](mgs/mgs_natlang) will wrap text automatically.)

## Other State

These states are not preserved in game saves, and they are all `true` by default. #verifyme

Control of the player entity can be removed or restored with the action [SET_PLAYER_CONTROL](actions/SET_PLAYER_CONTROL). When player control is off, the player cannot move, use the hex editor, or engage with entities. This is useful if you want to force the player entity to walk along a specific path for a [cutscene](techniques/cutscenes), or want to make sure the player doesn't walk away from a conversation where an NPC pauses speaking for a minute to (for instance) pace back and forth.

Similarly, the hex editor can be enabled/disabled with the action [SET_HEX_EDITOR_CONTROL](actions/SET_HEX_EDITOR_CONTROL), and the copy function for the hex editor can be enabled/disabled with the action [SET_HEX_EDITOR_CONTROL_CLIPBOARD](actions/SET_HEX_EDITOR_CONTROL_CLIPBOARD).

#updateme What other state control actions are there?

## Save Data

#expandme

The state that is preserved when a game is saved includes:

- The player entity's name
- The [warp_state](variables#warp-state) string
- All [save flags](variables#save-flags) (booleans)
- All [integer variables](variables#integer-variables) (uint16)
- …What else? #verifyme 
