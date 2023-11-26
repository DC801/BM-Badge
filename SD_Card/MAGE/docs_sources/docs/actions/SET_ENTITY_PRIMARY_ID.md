# SET_ENTITY_PRIMARY_ID

Sets an [entity](../entities)'s [primary_id](../entities/entity_properties).

You will overwhelmingly want to set the `entity_type` by name instead with [SET_ENTITY_TYPE](../actions/SET_ENTITY_TYPE).

## Example JSON

```json
{
  "action": "SET_ENTITY_PRIMARY_ID",
  "entity": "Entity Name",
  "u2_value": 2
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" primary_id to 2;
}
```

### Dictionary entry

```
set entity $entity:string primary_id (to) $u2_value:number (;)
```

---

Back to [Actions](../actions)
