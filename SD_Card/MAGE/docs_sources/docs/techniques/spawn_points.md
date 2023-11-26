# Spawn Points

For [doorway/warp behavior](techniques/doors), there are two ways to handle player spawn points:

1. **Default spawn points**: Player entities will spawn by default where an `is_player` entity was placed on a [map](maps) in Tiled. For maps with a single door, such as an NPC's house, this will be sufficient to control a player's spawning behavior — simply place a player entity at the entrance, facing the appropriate direction.
2. **Custom spawn points**: To control additional spawn points, you will need to create [vector objects](maps/vector_objects) to use as teleport destinations.

To prevent the player from instantly returning to where they came from, the player spawn point should not overlap with the doorway trigger in the new destination.
