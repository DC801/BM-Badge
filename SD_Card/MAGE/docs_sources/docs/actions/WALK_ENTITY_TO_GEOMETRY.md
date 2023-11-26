# WALK_ENTITY_TO_GEOMETRY

Moves the [entity](../entities) in a straight line from its current position to the first vertex of the [geometry object](../maps/vector_objects) named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.

## Example JSON

```json
{
  "action": "WALK_ENTITY_TO_GEOMETRY",
  "duration": 1000,
  "entity": "Entity Name",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example

```mgs
script {
  walk entity "Entity Name" to geometry "vector object name" over 1000ms;
}
```

### Dictionary entry

```
walk entity $entity:string to geometry $geometry:string over $duration:duration (;)
```

---

Back to [Actions](../actions)
