---
tags: [ 'entity', 'entities', 'game tick', 'scripts', 'command', 'null_script', 'terminal', 'RUN_SCRIPT' ]
next: actions.md
---

# Script Slots

Multiple [scripts](scripts) can run at the same time (strictly speaking, they all take turns one after the other during any single game tick), but you cannot arbitrarily run an indefinite number of scripts. Instead, entities and maps have "script slots" that are each able to run one script.

- Each [entity](entities) has:
	- one [`on_interact`](#on-interact) slot
	- one [`on_tick`](#on-tick) slot
	- one [`on_look`](#on-look) slot
- The currently-loaded [map](maps) has:
	- one [`on_load`](#on-load) slot
	- one [`on_tick`](#on-tick) slot
	- one [`on_look`](#on-look) slot
- There is also [command](commands) slot for the serial [terminal](terminal).

#verifyme — do the `on_look` slots use the `command` slot? They have their own space on the entity struct, so....

## `on_interact`

If the player presses the interact button and the interact hitbox hits another entity, that entity's `on_interact` script will run. (You can watch this happen with [vector view](debug_tools#vector-view).)

Scripts run in the `on_interact` slot will stop once they reach the end of their list of actions. Very commonly, a [character entity](entity_types#character-entity)'s `on_interact` script will be the start script of their [dialog](dialogs) tree.

If the script in this slot jumps to another script at some point, interacting with that entity again will result in the last-used script being run again, not whatever the original `on_interact` script was. Therefore, if you wish an entity to begin all interactions with the first script in its interact tree, you must explicitly [reset](actions/SET_ENTITY_INTERACT_SCRIPT) its `on_interact` script at the end of each of its script [branches](techniques/beginnings_middles_and_ends).

## `on_tick`

`on_tick` scripts continuously evaluate every game tick. Once an `on_tick` script reaches the end of its list of [actions](actions), the script will return to the beginning of the currently set script and run again on the next game tick.

::: danger
This means that if you [goto](actions/RUN_SCRIPT) the same script you started from as the `on_tick` script's last action, the script slot will NEVER give up its turn! You probably want to use [SET_ENTITY_TICK_SCRIPT](actions/SET_ENTITY_TICK_SCRIPT) or [SET_MAP_TICK_SCRIPT](actions/SET_MAP_TICK_SCRIPT) instead, which will set the target script for that slot but NOT immediately execute like [RUN_SCRIPT](actions/RUN_SCRIPT) would.
:::

A map's `on_tick` script slot is a logical place for a script that watches for whether the player enters a [doorway](techniques/doors), but `on_tick` scripts are useful for other kinds of watch scripts, too, such as changing an entity's idle behavior after a condition has been met.

`on_tick` slots are what you should use if you want to be able to interrupt or abort a script at an arbitrary place or time e.g. with a button press, or when the player crosses a [collision trigger](vector_objects), etc.

To terminate an `on_tick` script, it must [goto](actions/RUN_SCRIPT) [null_script](scripts#null_script) as one of its actions, or another script must tell it to switch to `null_script`.

## `on_load`

A maps's `on_load` script runs when a map is first loaded. Like an `on_interact` script, once the script reaches the end of its list of actions, the script stops.

These are useful for identifying and re-implementing the "permanent" changes the player has done on that map, as well as making decisions as to whether a [cutscene](techniques/cutscenes) should be played on that map upon [load](map_loads) (e.g. at the beginning of the game).

## `on_look`

`on_look` scripts are run when the player uses the `look` command in the [terminal](terminal).

`look` on its own triggers the maps's `on_look` script. `look` + the [current name](variables#printing-current-values) of an entity will trigger that entity's `on_look` script.

`on_look` scripts can be overridden with a manual [command](commands) registration.

## One Slot, One Script

Importantly, a script slot can only run one script — if a script jumps to another script (either with [RUN_SCRIPT](actions/RUN_SCRIPT) or by [script jumping via some kind of logic check](conditional_gotos)) the current script is *completely abandoned* and the new script is run instead. It is therefore important to check the order in which actions are given, as any action listed after a script jump will be ignored.

There is no call stack — no means for a script to jump to another script and then pick back up where it left off.

Nor is it possible to do more than one logic check simultaneously. If you want to check multiple conditions at once, you must branch to a different script for each aspect of the fail condition and let the remainder of the original script contain the actions for the success condition. [MGS Natlang](mgs/mgs_natlang) simplifies this by allowing multiple conditions to be written per behavior block, but these conditions can only be linked with OR (`||`) not AND (`&&`) for this reason.
