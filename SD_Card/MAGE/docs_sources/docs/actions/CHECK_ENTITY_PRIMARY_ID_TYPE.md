# CHECK_ENTITY_PRIMARY_ID_TYPE

Checks an [entity](../entities)'s [primary_id_type](../entities/entity_types): either (`0`) [tile](../entities/tile_entity), (`1`) [animation](../entities/animation_entity), or (`2`) [character](../entities/character_entity) (sometimes called `entity_type`).

## Example JSON

```json
{
  "action": "CHECK_ENTITY_PRIMARY_ID_TYPE",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_byte": 2,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_PRIMARY_ID_TYPE",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_byte": 2,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" primary_id_type is 2) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" primary_id_type is 2 then goto successScript;
  if entity "Entity Name" primary_id_type is 2 then goto index 12;
  if entity "Entity Name" primary_id_type is 2 then goto label labelName;
  if entity "Entity Name" primary_id_type is not 2 then goto successScript;
  if entity "Entity Name" primary_id_type is not 2 then goto index 12;
  if entity "Entity Name" primary_id_type is not 2 then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string primary_id_type is $expected_byte:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string primary_id_type is $expected_byte:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string primary_id_type is $expected_byte:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string primary_id_type is not $expected_byte:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string primary_id_type is not $expected_byte:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string primary_id_type is not $expected_byte:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
