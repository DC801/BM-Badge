# SET_ENTITY_PATH

This assigns a [geometry object](../maps/vector_objects) to an [entity](../entities). Afterward, the entity can use `%ENTITY_PATH%` to refer to that path. (This assignment can also be done within Tiled.)

## Example JSON

```json
{
  "action": "SET_ENTITY_PATH",
  "entity": "Entity Name",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" path to "vector object name";
}
```

### Dictionary entry

```
set entity $entity:string path (to) $geometry:string (;)
```
