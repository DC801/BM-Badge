# CHECK_ENTITY_DIRECTION

Checks whether an [entity](../entities) is facing one of the four cardinal directions: `north`, `south`, `east`, or `west`.

## Example JSON

```json
{
  "action": "CHECK_ENTITY_DIRECTION",
  "direction": "north",
  "entity": "Entity Name",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_DIRECTION",
  "direction": "north",
  "entity": "Entity Name",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" direction is north) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" direction is north then goto successScript;
  if entity "Entity Name" direction is north then goto index 12;
  if entity "Entity Name" direction is north then goto label labelName;
  if entity "Entity Name" direction is not north then goto successScript;
  if entity "Entity Name" direction is not north then goto index 12;
  if entity "Entity Name" direction is not north then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string direction is $direction:bareword
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string direction is $direction:bareword
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string direction is $direction:bareword
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string direction is not $direction:bareword
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string direction is not $direction:bareword
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string direction is not $direction:bareword
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
