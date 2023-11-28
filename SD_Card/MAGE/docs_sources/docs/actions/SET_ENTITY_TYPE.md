# SET_ENTITY_TYPE

Sets an [entity](../entities)'s [entity_type](../entity_types#character-entity). (See: [Entity Properties](../entity_properties))

## Example JSON

```json
{
  "action": "SET_ENTITY_TYPE",
  "entity": "Entity Name",
  "entity_type": "old_man"
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" type to old_man;
}
```

### Dictionary entry

```
set entity $entity:string type (to) $entity_type:string (;)
```
