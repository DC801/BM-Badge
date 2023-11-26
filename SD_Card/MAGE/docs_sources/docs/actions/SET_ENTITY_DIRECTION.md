# SET_ENTITY_DIRECTION

Turns an [entity](../entities) toward the `north`, `south`, `east`, or `west`.

## Example JSON

```json
{
  "action": "SET_ENTITY_DIRECTION",
  "direction": "north",
  "entity": "Entity Name"
}
```

## MGS Natlang

### Example

```mgs
script {
  turn entity "Entity Name" north;
}
```

### Dictionary entry

```
turn entity $entity:string $direction:bareword (;)
```

---

Back to [Actions](../actions)
