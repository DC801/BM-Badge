# SET_ENTITY_PRIMARY_ID_TYPE

Sets an [entity](../entities)'s [primary_id_type](../entities/entity_properties): either (`0`) [tile](../entities/tile_entity), (`1`) [animation](../entities/animation_entity), or (`2`) [character](../entities/character_entity) (sometimes called `entity_type`).

## Example JSON

```json
{
  "action": "SET_ENTITY_PRIMARY_ID_TYPE",
  "byte_value": 1,
  "entity": "Entity Name"
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" primary_id_type to 1;
}
```

### Dictionary entry

```
set entity $entity:string primary_id_type (to) $byte_value:number (;)
```
