# Hiding an Entity

There are several ways to hide an [[entities|entity]]:

1. Teleport it off the visible [[Maps|map]].
	- In Tiled, place a [[Vector Objects|vector object]] off the top-left corner of the map, in the void beyond the map tiles. Teleport entities here to hide them.
	- The vector object could be anywhere, really, but due to [[Coordinate Overflow|coordinate wrapping]], the coordinates beyond the top-left corner are actually very, very large numbers, which might make it easier to keep them hidden. (It will at least make things more interesting for a player who is poking around.)
2. Teleport them behind something opaque.
3. Change them into an [[null entity|invisible tile]].

After hiding them, you might optionally change their name to something else and change all their [[script slots]] scripts to [[null_script]], particularly if there's a danger for the player to interact with them on accident.

No matter what, the player will be able to manipulate hidden entities, as they are never properly "unloaded." This is somewhat authentic in terms of how a real game might handle a similar problem, but if you really, truly want to deny the player access to them, you only have two choices:

1. Make a parallel map without them.
2. [[actors|Repurpose]] the entity into another. 

## Permanently Hiding Entities

When a map is loaded, entities will spawn in their default state. This includes their map coordinates. In other words, entities you have previously hidden will not remain hidden after the map is reloaded.

If you want an entity to be hidden permanently, you must [[Chains of Small Checks|manage this]] with the map's [[on_load]] and use a [[save flags|save flag]] to determine whether they are hiding.

## Un-Hiding an Entity

If an entity only shows up part way through the game, you must include it in the map from the start and un-hide it at the correct time.

Depending on your needs, you might either:

1. Have the entity offscreen (in the void) by default, and have the map's [[on_load]] teleport it to the correct place if [[save flags|conditions]] have been met.
2. Have the entity in the correct place by default, but have the map's `on_load` teleport it offscreen if [[save flags|conditions]] have *not* been met.
