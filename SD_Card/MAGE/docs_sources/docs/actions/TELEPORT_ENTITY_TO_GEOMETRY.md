# TELEPORT_ENTITY_TO_GEOMETRY

Moves the [entity](../entities) instantly to the first vertex of the specified [geometry object](../maps/vector_objects) (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`).

## Example JSON

```json
{
  "action": "TELEPORT_ENTITY_TO_GEOMETRY",
  "entity": "Entity Name",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example

```mgs
script {
  teleport entity "Entity Name" to geometry "vector object name";
}
```

### Dictionary entry

```
teleport entity $entity:string to geometry $geometry:string (;)
```

---

Back to [Actions](../actions)
