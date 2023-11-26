# CHECK_ENTITY_INTERACT_SCRIPT

Checks an [entity](../entities)'s [`on_interact`](../scripts/on_interact) [script](../scripts/script_slots) (by the [script](../scripts)'s name).

## Example JSON

```json
{
  "action": "CHECK_ENTITY_INTERACT_SCRIPT",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_script": "scriptName",
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_INTERACT_SCRIPT",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_script": "scriptName",
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" on_interact is scriptName) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" on_interact is scriptName then goto successScript;
  if entity "Entity Name" on_interact is scriptName then goto index 12;
  if entity "Entity Name" on_interact is scriptName then goto label labelName;
  if entity "Entity Name" on_interact is not scriptName then goto successScript;
  if entity "Entity Name" on_interact is not scriptName then goto index 12;
  if entity "Entity Name" on_interact is not scriptName then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string on_interact is $expected_script:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string on_interact is $expected_script:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string on_interact is $expected_script:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string on_interact is not $expected_script:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string on_interact is not $expected_script:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string on_interact is not $expected_script:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
