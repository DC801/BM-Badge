# SET_ENTITY_MOVEMENT_RELATIVE

This adds a rotation to an [entity](../entities)'s [animations](../animations). This is different from turning an entity toward something or someone (see [SET_ENTITY_DIRECTION](../actions/SET_ENTITY_DIRECTION) and related actions); this action applies a rotation to *all* an entity's animations, including while the entity is in motion. In short, use this action to make an entity walk backwards or strafe (walk sideways).

This number cannot be negative.

## Example JSON

```json
{
  "action": "SET_ENTITY_MOVEMENT_RELATIVE",
  "entity": "Entity Name",
  "relative_direction": 3
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" relative_direction to 3;
}
```

### Dictionary entry

```
set entity $entity:string relative_direction (to) $relative_direction:number (;)
```
