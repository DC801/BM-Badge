# CHECK_ENTITY_NAME

Checks an [entity](../entities)'s [current name](../scripts/printing_current_values).

## Example JSON

```json
{
  "action": "CHECK_ENTITY_NAME",
  "entity": "Entity Name",
  "expected_bool": true,
  "string": "some kind of string",
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_NAME",
  "entity": "Entity Name",
  "expected_bool": true,
  "jump_index": 12,
  "string": "some kind of string"
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" name is "some kind of string") {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" name is "some kind of string" then goto successScript;
  if entity "Entity Name" name is "some kind of string" then goto index 12;
  if entity "Entity Name" name is "some kind of string" then goto label labelName;
  if entity "Entity Name" name is not "some kind of string" then goto successScript;
  if entity "Entity Name" name is not "some kind of string" then goto index 12;
  if entity "Entity Name" name is not "some kind of string" then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string name is $string:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string name is $string:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string name is $string:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string name is not $string:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string name is not $string:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string name is not $string:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
