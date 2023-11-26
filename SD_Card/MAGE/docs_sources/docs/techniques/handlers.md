# Handlers

(Also see: [One Script, Multiple Behaviors](techniques/one_script_multiple_behaviors))

To manage an entity's complex idle behavior, or to modify an entity's idle behavior over time, you can use another entity's [on_tick](scripts/on_tick) [slot](scripts/script_slots). We call this second entity a **handler**, because another entity is handling part of that entity's behavior.

It doesn't matter who the handler is, as long as their `on_tick` slot is free, but if you change who is acting as handler be sure to change it everywhere or you'll end up with multiple handlers working against each other!

## Example: Bender

In BMG2020, Bender has three idle behaviors, so there are three `set_handler` scripts:

1. Bender's default idle behavior, triggered with `set_handler-bender-on`:
	- Bender faces the player as the player moves around, and once in a while he plays the "I've got my eye on you" animation (while continuing to face the player).
	- In Tiled, Bender and his handler have these scripts set to their `on_tick` slots, so this is their default behavior.
	- Scripts:
		- Bender's `on_tick` is `face-player` — a general script that sets the entity's direction toward the player.
		- The handler's `on_tick` is `handler-bender-timer` — which waits a set amount of time, then makes Bender play his action animation.
2. Bender's idle behavior during conversations, triggered with `set_handler-bender-off`:
	- The handler no longer makes Bender play the "I've got my eye on you" animation. This change in behavior required so that his "bite my shiny metal ass" animation can play without interference.
	- Scripts:
		- The handler's `on_tick` is [null_script](scripts/null_script)
		- Bender's `on_tick` is [null_script](scripts/null_script)
3. Bender's "satisfied" idle behavior, triggered with `set_handler-bender-none`:
	- Bender "loiters," or looks around at his own pace, regardless of the player's position.
	- Because this behavior isn't complex, it only requires Bender's own `on_tick`.
	- Scripts:
		- The handler's `on_tick` is [null_script](scripts/null_script)
		- Bender's `on_tick` is `on_tick-bender-loiter` — a script that turns him in certain directions after certain amounts of time.

Whenever the player speaks to Bender, his idle behavior must be set to #2 at the very beginning of the conversation, and after the conversation is over, it must be set to #3 or #1 depending on whether his questline was finished or not. This management is done by using [COPY_SCRIPT](actions/COPY_SCRIPT) for the relevant `set_handler` scripts.

A handler is required because otherwise Bender could not both turn toward the player AND play his "I've got my eye on you" animation **at the same time**. Only the use of a handler makes this kind of complex behavior possible.

If #2 is triggered when the current idle behavior is #1, Bender's `on_tick` need not change, but changing it does no harm. But if #2 is triggered when the current idle behavior is #3, Bender's `on_tick` *must* be changed. It's always good to design scripts in such a way that they can be used in as many different circumstances as possible (rather than making a series of almost-identical scripts tuned to each possible application).
