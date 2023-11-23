# Vector View

Vector view, one of the [[Debug Tools]] in the game, is triggered in-game by pressing `XOR` and `MEM0` (the top two buttons on each side of the screen) at the same time. On desktop, press `F1` and `F5` instead.

NOTE: Currently, vector view cannot be toggled when [[hex editor]] [[SET_HEX_EDITOR_STATE|control]] is off.

## Visible in Vector View

### [[Vector Objects]]

- vector paths
- vector shapes
- vector points (displayed as Xs)

These lines are green ordinarily, but will turn red if the player entity is "inside" them.

### Entity Vectors

Entity hit boxes are half the length and half the height of the [[entities|entity]]'s tile size, and are positioned at the bottom-center of the sprite. This box is green by default, but the entity that was most recently interacted with (either with the interact button or hack button) will have a red hitbox instead.

The entity's position is considered to be the center of its hitbox as defined above, and is marked by a blue X.

### Interaction Hitboxes

When the player presses the hack button or [[on_interact|interact]] button, a rectangle is cast in front of the player entity. After a successful interaction, the hitbox will be blue, and will be yellow otherwise.

### Collision Vectors

Tiles on the map will have their [[Tile Collisions|vector collision shapes]] drawn in green, unless the engine has determined they are close enough to the player that collision for that tile will need to be checked, after which they will be drawn in yellow. Red lines indicate a collision was detected on that tile.

The player's collision spokes (drawn in purple) are projected in front of the player entity. When they cross a tile's collision geometry, a collision is detected, and the corresponding knockback vector is drawn as a red line extending in the opposite direction.

### Collision details

In the upper-left corner of the screen is a more detailed view of the actual math behind the collision algorithm. Map makers creating original scenarios can safely ignore this part of vector view.
