# CHECK_ENTITY_CURRENT_FRAME

Checks the frame (number) of the [entity](../entities)'s current [entity animations](../animations).

## Example JSON

```json
{
  "action": "CHECK_ENTITY_CURRENT_FRAME",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_byte": 2,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_CURRENT_FRAME",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_byte": 2,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" animation_frame is 2) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" animation_frame is 2 then goto successScript;
  if entity "Entity Name" animation_frame is 2 then goto index 12;
  if entity "Entity Name" animation_frame is 2 then goto label labelName;
  if entity "Entity Name" animation_frame is not 2 then goto successScript;
  if entity "Entity Name" animation_frame is not 2 then goto index 12;
  if entity "Entity Name" animation_frame is not 2 then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string animation_frame is $expected_byte:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string animation_frame is $expected_byte:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string animation_frame is $expected_byte:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string animation_frame is not $expected_byte:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string animation_frame is not $expected_byte:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string animation_frame is not $expected_byte:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
