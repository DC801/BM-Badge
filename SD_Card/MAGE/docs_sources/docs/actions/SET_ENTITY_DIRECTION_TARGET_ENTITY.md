# SET_ENTITY_DIRECTION_TARGET_ENTITY

Make an [entity](../entities) turn toward another.

## Example JSON

```json
{
  "action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
  "entity": "Entity Name",
  "target_entity": "Target Entity"
}
```

## MGS Natlang

### Example

```mgs
script {
  turn entity "Entity Name" toward entity "Target Entity";
}
```

### Dictionary entry

```
turn entity $entity:string toward entity $target_entity:string (;)
```

---

Back to [Actions](../actions)
