# Script Slots

Multiple [script](../scripts) can run at the same time (strictly speaking, they all take turns one after the other during any single game tick), but you cannot arbitrarily run an indefinite number of scripts. Instead, entities and maps have "script slots" that are each able to run one script.

- Each [entity](../entities) has:
	- one [on_interact](../scripts/on_interact) slot
	- one [on_tick](../scripts/on_tick) slot
	- one [on_look](../scripts/on_look) slot
- The currently-loaded [map](../maps) has:
	- one [on_load](../scripts/on_load) slot
	- one [on_tick](../scripts/on_tick) slot
	- one [on_look](../scripts/on_look) slot
- There is also [command](../hardware/commands) slot for the serial [terminal](../hardware/terminal).

#verifyme — do the `on_look` slots use the `command` slot? They have their own space on the entity struct, so....

## One Slot, One Script

Importantly, a script slot can only run one script — if a script jumps to another script (either with [RUN_SCRIPT](../actions/RUN_SCRIPT) or by script jumping via some kind of logic check) the current script is *completely abandoned* and the new script is run instead. It is therefore important to check the order in which actions are given, as any action listed after a script change will be ignored.

There is no nested callback structure, no child function returning something to its parent function, nor anything like that.

Nor is it possible to do more than one logic check simultaneously. If you want to check multiple conditions at once, you must branch to a different script for each aspect of the fail condition and let the remainder of the original script contain the actions for the success condition. [MGS Natlang](../mgs/mgs_natlang) simplifies this a little bit by allowing multiple conditions to be written per behavior block, but these conditions can only be linked with OR (`||`) not AND (`&&`) for this reason; the [if and else](../mgs/advanced_syntax/if_and_else) macro expands each OR condition into an individual logic check and jump, jumping to a common [label](../mgs/advanced_syntax/labels) index for all shared `{}` behavior.
