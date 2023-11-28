# Vector Objects

These can be used as paths or destinations for [entities](entities) or the camera. Place these on a [map](maps) with Tiled.

Additionally, the Mage Game Engine (MGE) can detect whether entities are within polygons, so polygons are also useful for script triggers such as [doorways](techniques/doors). Be sure to give these vector objects a name in the `Name` properties view so that scripts can identify them.

When a MGE entity is teleported to a vector object (or begins to walk along a vector object path), it is moved to the object's **origin**:

- **polyline**: first vertex placed
- **rectancle**: upper-left corner
- **circle**: rightmost point (0º)

All geometric shapes can be made visible when using [vector view](debug_tools#vector-view) while running the game.

## Coordinate Overflow

If a [vertex](vector_objects) crosses the left and/or top edge of the [map](maps) coordinate space, its coordinates will overflow (i.e. become a very, very high value). This can cause unexpected behavior in scripts trying to interact with the vector object.

This goes for the coordinates of [entities](entities), too, since they use the map coordinate space.