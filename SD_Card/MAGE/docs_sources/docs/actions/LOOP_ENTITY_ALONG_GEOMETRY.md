# LOOP_ENTITY_ALONG_GEOMETRY

Moves the [entity](../entities) along the [geometry object](../maps/vector_objects) object named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.

This action will loop forever, and cannot terminate on its own; no other action given below this one inside a script will execute after this action begins.

NOTE: Unless you want the entity to teleport to the geometry's origin point, you should probably use [WALK_ENTITY_TO_GEOMETRY](../actions/WALK_ENTITY_TO_GEOMETRY) first.

## Example JSON

```json
{
  "action": "LOOP_ENTITY_ALONG_GEOMETRY",
  "duration": 1000,
  "entity": "Entity Name",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example

```mgs
script {
  loop entity "Entity Name" along geometry "vector object name" over 1000ms;
}
```

### Dictionary entry

```
loop entity $entity:string along geometry $geometry:string over $duration:duration (;)
```

---

Back to [Actions](../actions)
