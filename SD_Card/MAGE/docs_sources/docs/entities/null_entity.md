# Null Entity

A null entity is a [tile entity](../entities/tile_entity) whose tile is entirely transparent. They're useful for implementing scripting behaviors not directly supported by the MGE, such as having an entity procedurally chase a moving (invisible) target.

A common use is to enable interaction behavior for things that aren't themselves entities. To do this, place a null entity on the map wherever you want interaction behavior to happen, then use the null entity's [on_interact](../scripts/on_interact) [script slot](../scripts/script_slots) for the interaction behavior.

**Disadvantages**: The null entity can be hacked into another tile (presumably one with pixel data), in which case a new object will seemingly appear out of nowhere.

NOTE: Currently you cannot click on transparent pixels in Tiled. To select a null entity, you'll have to use the Layer pallet.
