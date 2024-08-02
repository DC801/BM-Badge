---
prev: mgs/advanced_syntax.md
---

# Debug Tools

## Debug Mode

Debug mode is triggered in-game by pressing `XOR` and `MEM1` (the top button on the left of the screen and the second button on the right) at the same time. On desktop: press `F1` and `F6` instead. This counts as a [map reload](map_loads).

Turn off debug mode in the same way.

### Debug Entities

Normally, the Mage Game Engine (MGE) omits [entities](entities) with the `is_debug` value of `true` when loading [maps](maps). Such entities effectively do not exist in "production mode," and therefore will not be included in the list of entities in the [hex editor](hex_editor), will not appear anywhere on the map, cannot be the target of [script](scripts), etc. (#verifyme) When debug mode is activated, however, the [current map is reloaded](map_loads) with `is_debug` entities included.

The chapter 1 version of the engine *must* use debug entities to trigger debug scripts, as the serial [terminal](terminal) was not implemented yet, and there was not yet an action to check whether debug mode is on.

::: tip Best Practice
When making debug entities, it helps a lot to give them dialog describing what they are doing to change the game state. Better still is putting the debug behavior behind a [multiple choice dialog](dialogs#options) so that the debug entity can be disengaged without making any changes in case it is ever engaged by accident.
:::

### Debug Scripting

With [CHECK_DEBUG_MODE](actions/CHECK_DEBUG_MODE), you can add additional behavior to your game that is easy to enable when play testing but hidden from players by default.

#### Debug Logging

The [`debug!()` macro](mgs/advanced_syntax#debug) was introduced to provide the same behavior but in a much briefer form:

```mgs{2,3,4,6}
script {
  if (debug mode is true) {
    show serial dialog { "DEBUG INFO!" }
  }
  // these are equivalent
  debug!("DEBUG INFO")
}
```

#### Debug Commands

You can register debug [commands](commands) in a map's [`on_load`](script_slots#on-load), and if you put these registrations behind a check for debug mode, they won't get in the way of a play tester's experience.

We've found it useful to include debug logging when such a command is registered — both the name and a brief description of what the command does — so you won't have trouble remember which commands you've prepared for a given map.

### Debug Techniques

#### Cutscene Skippers

When debugging later segments of the game, it's helpful to be able to trigger a script that bypasses otherwise-mandatory [cutscenes](techniques/cutscenes). Such debug scripts should carefully mirror their real counterparts in terms of [save flags](variables#save-flags) set and the like, or you might find yourself having to debug the debuggers.

#### Cutscene Restorers

Likewise, it sometimes helps to be able to play a cutscene over again. Or, if most or all [cutscenes](techniques/cutscenes) have been bypassed, it helps to turn on a specific one separately.

#### Clean Wipe

When using scripts to emulate a fresh game state, be sure you have a good list of the [save flags](variables#save-flags) and [integer variables](variables#integer-variables) (etc.) you have been using.

#### Puzzle Solvers

While some puzzles can be simplified to accelerate play testing (such as naming the main character "Bub" when they will later need to be named "Bob"), it's much faster to make scripts to solve puzzles for you.

By the end of game development of Chapter 1 of the Black Mage Game, there was a "Debug Exa" capable of solving or partially solving the majority of puzzles.

#### Choreography Controller

Whenever you have a small segment of choreography you want to polish, it helps to split the sequence into a separate script that you can trigger at will.

## Vector View

One of the in-game debug tools, triggered by pressing `XOR` and `MEM0` (the top two buttons on each side of the screen) at the same time. On desktop, press `F1` and `F5` instead.

NOTE: Currently, vector view cannot be toggled when [hex editor](hex_editor) [control](actions/SET_HEX_EDITOR_STATE) is off.

### Visible Vectors

#### Vector Objects

[Vector objects](vector_objects) include:

- vector paths
- vector shapes
- vector points (displayed as Xs)

These lines are green ordinarily, but will turn red if the player entity is "inside" them.

#### Entity Vectors

Entity hit boxes are half the length and half the height of the [entity](entities)'s tile size, and are positioned at the bottom-center of the sprite. This box is green by default, but the entity that was most recently [interacted](script_slots#on-interact) with (either with the interact button or hack button) will have a red hitbox instead.

The entity's position is considered to be the center of its hitbox as defined above, and is marked by a blue X.

#### Interaction Hitboxes

When the player presses the hack button or [interact](script_slots#on-interact) button, a rectangle is cast in front of the player entity. After a successful interaction, the hitbox will be blue, and will be yellow otherwise.

#### Collision Vectors

Tiles on the map will have their [vector collision shapes](tilesets#tile-collisions) drawn in green, unless the engine has determined they are close enough to the player that collision for that tile will need to be checked, after which they will be drawn in yellow. Red lines indicate a collision was detected on that tile.

The player's collision spokes (drawn in purple) are projected in front of the player entity. When they cross a tile's collision geometry, a collision is detected, and the corresponding knockback vector is drawn as a red line extending in the opposite direction.

#### Collision Details

In the upper-left corner of the screen is a more detailed view of the actual math behind the collision algorithm. Map makers creating original scenarios can safely ignore this part of vector view.
