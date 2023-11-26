# SET_ENTITY_NAME

Sets an [entity](../entities)'s [name](../entities/entity_properties).

## Example JSON

```json
{
  "action": "SET_ENTITY_NAME",
  "entity": "Entity Name",
  "string": "some kind of string"
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" name to "some kind of string";
}
```

### Dictionary entry

```
set entity $entity:string name (to) $string:string (;)
```

---

Back to [Actions](../actions)
