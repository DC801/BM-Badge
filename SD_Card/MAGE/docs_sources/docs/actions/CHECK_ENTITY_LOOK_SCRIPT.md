# CHECK_ENTITY_LOOK_SCRIPT

Checks an [entity](../entities)'s [`on_look`](../script_slots#on-look) [script](../script_slots) (by the [script](../scripts)'s name).

## Example JSON

```json
{
  "action": "CHECK_ENTITY_LOOK_SCRIPT",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_script": "scriptName",
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_LOOK_SCRIPT",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_script": "scriptName",
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" on_look is scriptName) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" on_look is scriptName then goto successScript;
  if entity "Entity Name" on_look is scriptName then goto index 12;
  if entity "Entity Name" on_look is scriptName then goto label labelName;
  if entity "Entity Name" on_look is not scriptName then goto successScript;
  if entity "Entity Name" on_look is not scriptName then goto index 12;
  if entity "Entity Name" on_look is not scriptName then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string on_look is $expected_script:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string on_look is $expected_script:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string on_look is $expected_script:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string on_look is not $expected_script:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string on_look is not $expected_script:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string on_look is not $expected_script:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
