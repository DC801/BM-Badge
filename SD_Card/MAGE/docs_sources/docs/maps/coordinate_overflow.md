# Coordinate Overflow

If a [vertex](maps/vector_objects) crosses the left and/or top edge of the [map](maps) coordinate space, its coordinates will underflow (i.e. become a very, very high value). This can cause unexpected behavior in scripts trying to interact with the vector object.

This goes for the coordinates of [entities](entities), too, since they use the map coordinate space.
