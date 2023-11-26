# Doors

(NOTE: This section might refer to jumping to a separate script after a logic check. This is a fossil from the days when all logic jumps resulted in script jumps; nowadays you should probably use [if and else](../mgs/advanced_syntax/if_and_else) instead.)

## Doors (NPCs)

To make an entity walk through a door, move them to the doorway and then [hide](../techniques/hiding_an_entity) them.

Entities cannot be unloaded once loaded on a map, so they will always exist no matter what (debug mode aside). You might make a different version of the map without such hidden entities, but this would require a fresh [map load](../maps/map_loads) — which is likely to be inconvenient, especially if multiple entities have to leave at multiple times.

## Doors (Player)

For doors to work, you'll need the following:

### Doorway Trigger

A doorway trigger is a [vector shape](../maps/vector_objects) placed on the map wherever you want to trigger warp or doorway behavior, e.g. a literal doorframe, a few tiles spanning the path out of town, etc.

The vector shape should be large enough that the player can't skip over it when running past it on low frame rate devices.

To allow the player access to the doorway, the tile(s) the door is on should not have any [collision data](../tilesets/tile_collisions). (If you use a door with alpha on top of a wall tile, for instance, the wall collision might keep the player from physically entering the doorway.)

Use [vector view](../debug/vector_view) to debug misbehaving door triggers.

### Doorway Watcher

A doorway watcher [`on_tick`](../scripts/on_tick) script with a [CHECK_IF_ENTITY_IS_IN_GEOMETRY](../actions/CHECK_IF_ENTITY_IS_IN_GEOMETRY) action for each vector doorway trigger in the map.

To prevent doorway watchers from being disabled by the player, such scripts should be run in the map's `on_tick` slot, not an entity's `on_tick` slot.

TIP: If there are certain doorways that unlock or lock at specific times in the story, you might want your map's `on_tick` script to run logic that determines which watch script to run, and/or include a [save flag](../scripts/save_flags) check to give the script an opportunity to jump to the appropriate one automatically if lock/unlock conditions change after the map is loaded.

When the [CHECK_IF_ENTITY_IS_IN_GEOMETRY](../actions/CHECK_IF_ENTITY_IS_IN_GEOMETRY) condition is met, the doorway watcher script should branch to an appropriate "entering a doorway" script.

### "Entering a Doorway" Script

1. If you need to set the [warp_state](../scripts/warp_state) string for this doorway, set it before anything else.
2. The next action depends on the doorway destination:
	1. **Another spot on the same map**: Teleport the player to the new spot.
		- You will likely still need to have "leaving a doorway" behavior of some kind, though it need not be a separate script.
	2. **A different map (e.g. a house, a dungeon, another zone on the overworld)**: The very last action should be [LOAD_MAP](../actions/LOAD_MAP).
		- This means all "leaving a doorway" behavior must be handled (or at least triggered) by the target map's [`on_load`](../scripts/on_load) script. See below.

Generally, entering a doorway requires no other padding or special handling unless you want to use fades.

### "Leaving a Doorway" Script

If a new map is loaded:
1. Do all other [logic checks](../techniques/chains_of_small_checks) first.
	- Not required, but definitely recommended. Of the things the [`on_load`](../scripts/on_load) is supposed to do, "leaving a doorway" tends to be the most complex in terms of actions required. If these behaviors are last then they can be dead-end branches, which simplifies the rest of the tree.
2. Use the [warp_state](../scripts/warp_state) string to determine which "leaving a doorway" script to run.

#### "Leaving a Doorway" Behavior

1. Move the player entity to the correct [spawn point](../techniques/spawn_points).
2. If the default direction of the player entity is different from what you would like, you should either:
	1. explicitly turn them the correct direction, or
	2. have them walk a brief distance in the correct direction out of the doorway.
		- Walking behavior should *definitely* be last in an [`on_load`](../scripts/on_load) script!
3. Turn player control back on.

### Doorway Fades

Fades are a little clunky on the hardware, so if using them for doorways, it might be better to limit them to the most important doorways alone, such as the edges of the map.

Because fades require two simultaneous behaviors, you will need two script slots. (Using the player's [`on_tick`](../scripts/on_tick) is logical, but not required; feel free to manage the player's behavior with another entity's `on_tick` script, instead.)

#### Entering a Doorway Script (with Fades)

1. Disable player control.
2. Set the player's `on_tick` to a script that walks them toward a vector point several tiles away.
	- To make the player's walk path as straight as possible, you can put this point far away and set the duration fairly high.
3. Begin the fade.
	- Set the duration lower than that of the player entity's walk.
4. Load the new map.

#### Leaving a Doorway Script (with Fades)

> Be sure to verify that the new map's [`on_load`](../scripts/on_load) will check the [warp_state](../scripts/warp_state) and branch to the the correct "leaving a doorway" script.

1. Set the player entity's [`on_tick`](../scripts/on_tick) to a script that walks them briefly in a line away from the doorway.
	- For the last action in this `on_tick` script, run [null_script](../scripts/null_script) (or set the `on_tick` to something else) to prevent it from looping.
2. Fade the screen back in.
	- Duration should be approximately that of the player entity's walk.
3. Turn player control back on.
