# Debug Mode

Debug mode is triggered in-game by pressing `XOR` and `MEM1` (the top button on the left of the screen and the second button on the right) at the same time. On desktop: press `F1` and `F6` instead.

## Debug Entities

Normally, the MGE omits [[entities]] with the `is_debug` value of `true` when loading [[Maps]]. Such entities effectively do not exist in "production mode," and therefore will not be included in the list of entities in the [[hex editor]], will not appear anywhere on the map, cannot be the target of [[scripts]], etc.  #verifyme When debug mode is activated, however, the [[Map Loads|current map is reloaded]] and `is_debug` entities are included.

The chapter 1 version of the engine *must* use debug entities to trigger all debug scripts, as the serial [[terminal]] was not implemented yet, and there was not yet an action to check whether debug mode is on.

### Best Practice

When making debug entities, it helps a lot to give them dialog describing what they are doing to change the game state. Better still is putting the debug behavior behind a [[Multiple Choice Dialogs (JSON)|multiple choice dialog]] so that the debug entity can be disengaged without making any changes in case it is ever engaged by accident.

## Debug Scripting

New in the chapter 2+ version of the engine is a means of checking whether [[CHECK_DEBUG_MODE|debug mode is on]]. With this action, you can add additional behavior to your game that is quick to enable when play testing, but hidden from players by default.

### Debug Logging

Example:

```mgs
script {
	if (debug mode is true) {
		show seriral dialog { "DEBUG INFO!" }
	}
}
```

For your convenience, the `debug!()` was introduced to provide the same behavior but in a much briefer form:

```mgs
script {
	debug!("DEBUG INFO")
}
```

### Debug Commands

You can register debug [[commands]] in a map's [[on_load]], and if you put these registrations behind a check for debug mode, they won't get in the way of a play tester's experience.

We've found it useful to include debug logging when such a command is registered — both the name and a brief description of what the command does — so you won't have trouble remember which commands you've prepared for a given map.

## Debug Techniques

**Cutscene skippers** — When debugging later segments of the game, it's helpful to be able to trigger a script that bypasses otherwise-mandatory [[cutscenes]]. Such debug scripts should carefully mirror their real counterparts in terms of [[save flags]] set and the like, or you might find yourself having to debug the debuggers.

**Cutscene restorers** — Likewise, it sometimes helps to be able to play a cutscene over again. Or, if most or all [[cutscenes]] have been bypassed, it helps to turn on a specific one separately.

**Clean wipe** — When using scripts to emulate a fresh game state, be sure you have a good list of the [[save flags]] and [[integer variables]] (etc.) you have been using.

**Puzzle solvers** — While some puzzles can be simplified to accelerate play testing (such as naming the main character "Bub" when they will later need to be named "Bob"), it's much faster to make scripts to solve puzzles for you. (By the end of game development in BMG2020, there was a Debug Exa capable of solving or partially solving the majority of puzzles.)

**Choreography controller** — Whenever you have a small segment of choreography you want to polish, it helps to split the sequence into a separate script that you can trigger at will.
