# One Script, Multiple Behaviors

See: [Handlers](../techniques/handlers)

Because a single [script slot](../scripts/script_slots) cannot run multiple threads, you must borrow another [entity](../entities)'s (or the [map](../maps)'s) [on_tick](../scripts/on_tick) if you want a single [script](../scripts) to trigger multiple simultaneous behaviors.

If you try to put all simultaneous behaviors into a single script, the actions will execute one after the other, but only after each action has completely finished. Three entities having a race would instead run the entire course one at a time, each waiting patiently for the runner before them to complete their route. And indeed, if one of the simultaneous behaviors has no stopping point, the actions listed afterwards will never execute at all.

The simultaneous behaviors must be managed by `on_tick` slots because [on_interact](../scripts/on_interact) and [on_load](../scripts/on_load) script slots cannot execute actions at arbitrary times.

When the simultaneous behaviors are finished, however, the `on_tick` slots must be then set to something else or the new behavior will loop indefinitely (unless that's what you want). Halt an `on_tick` script by [running](../RUN_SCRIPT) [null_script](../scripts/null_script) as its final action or by setting the target slot to a different `on_tick` script.

### Example: Timid Goats

In the BMG2020, there are a pair of baby goats cavorting in the grass. However, if the player approaches them, they will run to another spot.

Three entities are involved in this behavior (apart from the player themselves):

- Billy (a baby goat)
- Kid (a baby goat)
- Verthandi (the goat [handler](../techniques/handlers))

Each goat has an [on_tick](../scripts/on_tick) script that moves it around in a small jaggedy circle: the [vector shape](../maps/vector_objects) `high1` for Billy and `high2` for Kid.

What's important here is the **watcher**, Verthandi. Her `on_tick` script, `check_if_player_is_goat_high`, watches for if the player has entered the goat trigger area called `high`, at which point her `on_tick` script jumps to one called `move_goats_to_low`.

1. `move_goats_to_low` contains the following actions (executed by Verthandi):
	- Set entity tick script for Billy to `move_billy_to_low`
	- Set entity tick script for Kid to `move_kid_to_low` 
	- Set entity tick script for Verthandi to `check_if_player_is_goat_low`
2. `move_billy_to_low` (executed by Billy):
	- Walk Billy to the first point in geometry `low1`
	- Loop Billy along geometry `low1`
		- NOTE: this action will not end on its own.
3.  `move_kid_to_low` (executed by Kid):
	- Walk Kid to the first point in geometry `low2`
	- Loop Kid along geometry `low2`
		- NOTE: this action will not end on its own.

This setup does what we want because #2 and #3 are run in `on_tick` slots, and because they are executed by entities other than the one running the watch script, #1.

The end behavior is a reversal of the above: Verthandi is now watching for the player to enter a goat trigger area called `low`, and due to the final action inside #2 and #3, the goats are now looping along their "low" vector paths until their `on_tick` scripts are changed again by #1.
