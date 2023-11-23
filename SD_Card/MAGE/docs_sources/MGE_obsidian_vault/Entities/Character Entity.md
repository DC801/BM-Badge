# Character Entity

One of the three [[entity types]].

If you place a tile from a [[Tilesets|tileset]] onto an object layer in a Tiled [[Maps|map]], and the `Class` (formerly `Type`) property of the tile has been defined in [[entity_types.json]], it will become an **character entity**.

- **`PrimaryIdType`**: `2` (`entity_type`)
- **`PrimaryId`**: the `id` of the entity within [[entity_types.json]]
- **`SecondaryId`**: does nothing

In scripts, you need not manipulate `PrimaryId` to alter the appearance of a character entity, though there are certainly [[scripts]] that are capable of doing this. Instead, you can use [[actions]] with the argument `entity_type`, which is the name (string) of the character entity as defined within [[entity_types.json]]. (In the entity's [[tilesets|tileset]], this is what the property "Type" is set to.)

What's special about character entities is that they can have a number of [[animations]] [[Entity Management System|assigned]] to them and they will switch animations automatically depending on context (walking or not, facing north/south/east/west, etc.), as well as having other attributes, like a permanently assigned portrait image. **NPCs will therefore likely be this type.**

In the MGE, character entities will default to their idle animation regardless of whatever specific tile is being used within Tiled. (I.e. if you use a "walking animation" tile for the entity on the Tiled map, the entity will appear to be walking in Tiled, but not within the MGE.)

Character entities will face the north by default, but if the tile placed has been [[Entity Management System|assigned to a NSEW direction and a purpose]], the entity will instead face the direction associated with that tile.
