# CHECK_ENTITY_Y

Checks an [entity](../entities)'s [y](../entities/entity_properties) coordinate.

## Example JSON

```json
{
  "action": "CHECK_ENTITY_Y",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_u2": 32,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_Y",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_u2": 32,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" y is 32) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" y is 32 then goto successScript;
  if entity "Entity Name" y is 32 then goto index 12;
  if entity "Entity Name" y is 32 then goto label labelName;
  if entity "Entity Name" y is not 32 then goto successScript;
  if entity "Entity Name" y is not 32 then goto index 12;
  if entity "Entity Name" y is not 32 then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string y is $expected_u2:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string y is $expected_u2:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string y is $expected_u2:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string y is not $expected_u2:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string y is not $expected_u2:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string y is not $expected_u2:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
