# WALK_ENTITY_ALONG_GEOMETRY

Moves the [entity](../entities) along the [geometry object](../vector_objects) named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.

NOTE: Unless you want the entity to teleport to the geometry's origin point, you should probably use [WALK_ENTITY_TO_GEOMETRY](../actions/WALK_ENTITY_TO_GEOMETRY) first.

## Example JSON

```json
{
  "action": "WALK_ENTITY_ALONG_GEOMETRY",
  "duration": 1000,
  "entity": "Entity Name",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example

```mgs
script {
  walk entity "Entity Name" along geometry "vector object name" over 1000ms;
}
```

### Dictionary entry

```
walk entity $entity:string along geometry $geometry:string over $duration:duration (;)
```
