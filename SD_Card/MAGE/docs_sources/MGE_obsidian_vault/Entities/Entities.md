# Entities

Entities are a basic element of the DC801 Mage Game Engine (MGE) along with [[actions]].

- All moving graphics must be entities, as ordinary [[Maps|map]] tiles cannot move.
- Any single tile object placed on a [[Maps|map]] will be one of the three [[entity types]], automatically determined by the type of tile you are placing.
- All entities have all the same [[entity properties]] available to them (visible as a pair of rows on the hex editor in the game — 32 bytes total). They will all therefore have an [[on_interact]] and [[on_tick]] [[Script Slots|script slot]], various render flags, etc.
	- These properties are defined when placed in a Tiled map, but they can be modified during gameplay with [[scripts|script]] [[actions]] or by the player via the [[hex editor]].
- Entities need not have a name, nor a unique name. Scripts targeting an entity by name will simply use the first the [[MGE Encoder]] found with that name.
- All entity state (apart from the player's name) is reset when a [[Map Loads|map load]] occurs.
## See Also

- [[Entity Types]]
	- [[Tile Entity]]
		- [[Null Entity]]
	- [[Animation Entity]]
	- [[Character Entity]]
- [[Entity Properties]]
- [[Relative Entity References]]
	- [[%PLAYER%]]
	- [[%SELF%]]
