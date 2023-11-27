# CHECK_ENTITY_GLITCHED

Checks whether an [entity](../entities) currently has it's "glitched" render flag set.

## Example JSON

```json
{
  "action": "CHECK_ENTITY_GLITCHED",
  "entity": "Entity Name",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_GLITCHED",
  "entity": "Entity Name",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" is glitched) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" is glitched then goto successScript;
  if entity "Entity Name" is glitched then goto index 12;
  if entity "Entity Name" is glitched then goto label labelName;
  if entity "Entity Name" is not glitched then goto successScript;
  if entity "Entity Name" is not glitched then goto index 12;
  if entity "Entity Name" is not glitched then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string is glitched
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string is glitched
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string is glitched
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string is not glitched
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string is not glitched
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string is not glitched
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
