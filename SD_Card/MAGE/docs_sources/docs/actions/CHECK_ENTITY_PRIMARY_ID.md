# CHECK_ENTITY_PRIMARY_ID

Checks whether an [entity](../entities) has the given [primary_id](../entity_types).

[CHECK_ENTITY_TYPE](../actions/CHECK_ENTITY_TYPE) is recommended instead.

## Example JSON

```json
{
  "action": "CHECK_ENTITY_PRIMARY_ID",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_u2": 32,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_PRIMARY_ID",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_u2": 32,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" primary_id is 32) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" primary_id is 32 then goto successScript;
  if entity "Entity Name" primary_id is 32 then goto index 12;
  if entity "Entity Name" primary_id is 32 then goto label labelName;
  if entity "Entity Name" primary_id is not 32 then goto successScript;
  if entity "Entity Name" primary_id is not 32 then goto index 12;
  if entity "Entity Name" primary_id is not 32 then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string primary_id is $expected_u2:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string primary_id is $expected_u2:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string primary_id is $expected_u2:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string primary_id is not $expected_u2:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string primary_id is not $expected_u2:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string primary_id is not $expected_u2:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
