# SET_ENTITY_CURRENT_FRAME

Set the frame of the current [animation](../tilesets/animations).

This is useful for staggering the animations of [entities](../entities) that have identical animation timings.

## Example JSON

```json
{
  "action": "SET_ENTITY_CURRENT_FRAME",
  "byte_value": 1,
  "entity": "Entity Name"
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" animation_frame to 1;
}
```

### Dictionary entry

```
set entity $entity:string animation_frame (to) $byte_value:number (;)
```
