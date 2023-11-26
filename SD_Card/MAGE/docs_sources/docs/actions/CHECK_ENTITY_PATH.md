# CHECK_ENTITY_PATH

Checks the `path` name ([geometry](../maps/vector_objects)) of an [entity](../entities).

## Example JSON

```json
{
  "action": "CHECK_ENTITY_PATH",
  "entity": "Entity Name",
  "expected_bool": true,
  "geometry": "vector object name",
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_PATH",
  "entity": "Entity Name",
  "expected_bool": true,
  "geometry": "vector object name",
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" path is "vector object name") {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" path is "vector object name" then goto successScript;
  if entity "Entity Name" path is "vector object name" then goto index 12;
  if entity "Entity Name" path is "vector object name" then goto label labelName;
  if entity "Entity Name" path is not "vector object name" then goto successScript;
  if entity "Entity Name" path is not "vector object name" then goto index 12;
  if entity "Entity Name" path is not "vector object name" then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string path is $geometry:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string path is $geometry:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string path is $geometry:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string path is not $geometry:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string path is not $geometry:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string path is not $geometry:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```

---

Back to [Actions](../actions)
