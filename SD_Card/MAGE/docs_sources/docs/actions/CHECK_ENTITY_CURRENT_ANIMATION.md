# CHECK_ENTITY_CURRENT_ANIMATION

Checks the id of the [entity](../entities)'s [current animation](../entity_properties). (See [entity animations](../animations) for what numbers correspond to which animations.)

## Example JSON

```json
{
  "action": "CHECK_ENTITY_CURRENT_ANIMATION",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_byte": 2,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_CURRENT_ANIMATION",
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
  if (entity "Entity Name" current_animation is 2) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" current_animation is 2 then goto successScript;
  if entity "Entity Name" current_animation is 2 then goto index 12;
  if entity "Entity Name" current_animation is 2 then goto label labelName;
  if entity "Entity Name" current_animation is not 2 then goto successScript;
  if entity "Entity Name" current_animation is not 2 then goto index 12;
  if entity "Entity Name" current_animation is not 2 then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string current_animation is $expected_byte:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string current_animation is $expected_byte:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string current_animation is $expected_byte:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string current_animation is not $expected_byte:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string current_animation is not $expected_byte:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string current_animation is not $expected_byte:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
