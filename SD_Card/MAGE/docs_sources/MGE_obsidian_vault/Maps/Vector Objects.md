# Vector Objects

These can be used as paths or destinations for [[entities]] or the camera. Place these on a [[Maps|map]] with Tiled.

Additionally, the MGE can detect whether entities are within polygons, so polygons are also useful for script triggers such as doorways. Be sure to give these vector objects a name in the `Name` properties view so that scripts can identify them.

When a MGE entity is teleported to a vector object (or begins to walk along a vector object path), it is moved to the object's **origin**:

- **polyline**: first vertex placed
- **rectancle**: upper-left corner
- **circle**: rightmost point (0º)

All geometric shapes can be made visible in the game using one of the [[Debug Mode|debug modes]].
