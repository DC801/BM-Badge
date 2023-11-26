# SET_ENTITY_X

Sets an [entity](../entities)'s [x](../entities/entity_properties) coordinate.

In practice, you will likely want to use [geometry vectors](../maps/vector_objects) and teleport actions instead.

## Example JSON

```json
{
  "action": "SET_ENTITY_X",
  "entity": "Entity Name",
  "u2_value": 2
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" x to 2;
}
```

### Dictionary entry

```
set entity $entity:string x (to) $u2_value:number (;)
```

---

Back to [Actions](../actions)
