# SET_ENTITY_DIRECTION_TARGET_GEOMETRY

Make an [entity](../entities) turn toward a vector geometry on the map.

## Example JSON

```json
{
  "action": "SET_ENTITY_DIRECTION_TARGET_GEOMETRY",
  "entity": "Entity Name",
  "target_geometry": "vector object name"
}
```

## MGS Natlang

### Example

```mgs
script {
  turn entity "Entity Name" toward geometry "vector object name";
}
```

### Dictionary entry

```
turn entity $entity:string toward geometry $target_geometry:string (;)
```
