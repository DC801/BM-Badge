---
tags: [ 'action', 'script', 'map loads', 'save data', 'strings', 'booleans', 'integers', 'negative numbers', 'doors', 'spawn points', 'cutscenes', 'on_load', 'given name' ]
prev: relative_references.md
---

# Variables

There are only a few Mage Game Engine (MGE) variables available for [scripts](scripts) to use. All variables are equally accessible to all scripts at all times (globals).

Variables don't have to be declared before they can be used; simply using an [action](actions) that sets or checks one will cause the encoder to include it in the `game.dat`.

::: warning
This means that typos in variable names can be hard to spot. If you set `birthdayparty` but check `birthday_party`, the encoder will create and store both variables as if they were separate things.

If you find a variable isn't triggering logic checks in the ways you expect, check your spelling!
:::

All variables are persistent between [map loads](map_loads) because all are all included in the [save data](variables#save-data).

::: details For some dubious alternatives...
Every [property](entity_properties) on every [entity](entities) is available for scripts to read and/or change, and might be used like normal variables. However, in practice, these might have limited utility because the player can [change these values directly](hex_editor) and these values are reset upon [map load](map_loads).
:::

## `warp_state`

This is a single **string** that is designated for controlling player spawn behavior on a map's [`on_load`](script_slots#on-load) script. When you [leave a room](techniques/doors) (or otherwise trigger a new [map](maps) to load), the `warp_state` string should be set to something that indicates the exit/entrance point so the next map can teleport the player entity to the appropriate [spawn point](techniques/spawn_points).

Handling player spawn points is the original purpose for `warp_state`, but there's nothing stopping you from using it for other things, too.

## Integer Variables

**Integer** variables are `uint16_t`, meaning they can be any whole number between `0` and `65535`. (No negative numbers, no `NaN`.) You may have up to 255 of these.

The default value is `0`.

## Save Flags

Save flags are **booleans** with arbitrary names (strings) that can be used for various logic checks. You may have up to 65535 of these.

Common use cases for save flags include tracking whether the player has:

- heard specific entities' backstories
- seen specific [cutscenes](techniques/cutscenes)
- completed specific puzzles
- found specific secrets

You will likely need to employ [chains of small checks](techniques/chains_of_small_checks) at the beginning of your [map](maps)'s [`on_load`](script_slots#on-load) [script](scripts) to initialize the map based on the states of save flags like those above.

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

[MGS Natlang](mgs/mgs_natlang) will wrap text automatically, but if wrapping by hand, it's recommended to count these as taking up 5 characters.

### Current Entity Name

Wrap an entity's **given name** (the name assigned to it in Tiled) in percent signs (`%`) to insert the entity's name as it currently exists in RAM: `"Hi, there! My name is %Bob%!"`

Unlike with [relative entity references](entities/relative_references) (like [`%SELF%`](relative_references#self) and [`%PLAYER%`](relative_references#player)), this usage will not work when trying to target an entity with an action.

[MGS Natlang](mgs/mgs_natlang) will wrap text automatically, but if wrapping by hand, it's recommended to count these as taking up 12 characters.

## Other State

These states are not preserved in game saves, but do persist through map loads (#verifyme). Control these with the actions listed:

- **player control**: whether the player can move, interact with entities, use the hex editor, or perform other actions ([SET_PLAYER_CONTROL](actions/SET_PLAYER_CONTROL))
- **hex editor control**: whether the player can open the hex editor ([SET_HEX_EDITOR_CONTROL](actions/SET_HEX_EDITOR_CONTROL))
- **hex editor clipboard control**: whether the player can use the hex editor clipboard ([SET_HEX_EDITOR_CONTROL_CLIPBOARD](actions/SET_HEX_EDITOR_CONTROL_CLIPBOARD))
- **auto lights control**: whether the LEDs around the screen are controlled automatically or manually ([SET_LIGHTS_CONTROL](actions/SET_LIGHTS_CONTROL))
- **serial dialog control**: whether the player can enter anything into the serial console ([SET_SERIAL_DIALOG_CONTROL](actions/SET_SERIAL_DIALOG_CONTROL))

A few other states can be checked and manipulated, but due to their nature, these are not included in game save data, nor do they persist between map loads:

- whether a dialog is open
- whether a serial dialog is open
- whether debug mode is on

## Save Data

The state that is preserved when a game is saved includes:

- The [warp_state](variables#warp-state) value
- All [save flag](variables#save-flags) values (booleans)
- All [integer variable](variables#integer-variables) values (uint16)
- The player's name (string)
- `MEM` button offsets (the player can change the `MEM` button mapping)
- hex editor clipboard contents (up to 32 bytes)
- current map id (NOTE: this is saved, but not currently used upon load; player position is captured and restored manually in the Black Mage Game)
