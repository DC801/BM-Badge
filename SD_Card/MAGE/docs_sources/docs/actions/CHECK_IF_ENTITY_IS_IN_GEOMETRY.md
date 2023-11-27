# CHECK_IF_ENTITY_IS_IN_GEOMETRY

Checks whether an [entity](../entities) is inside the named [geometry](../maps/vector_objects).

This action can behave erratically if any of the vertices in the geometry object are subject to [coordinate overflow](../maps/vector_objects#coordinate-overflow).

## Example JSON

```json
{
  "action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
  "entity": "Entity Name",
  "expected_bool": true,
  "geometry": "vector object name",
  "success_script": "successScript"
},
{
  "action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
  "entity": "Entity Name",
  "expected_bool": true,
  "geometry": "vector object name",
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax#if-and-else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" is inside geometry "vector object name") {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" is inside geometry "vector object name" then goto successScript;
  if entity "Entity Name" is inside geometry "vector object name" then goto index 12;
  if entity "Entity Name" is inside geometry "vector object name" then goto label labelName;
  if entity "Entity Name" is not inside geometry "vector object name" then goto successScript;
  if entity "Entity Name" is not inside geometry "vector object name" then goto index 12;
  if entity "Entity Name" is not inside geometry "vector object name" then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string is inside geometry $geometry:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string is inside geometry $geometry:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string is inside geometry $geometry:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string is not inside geometry $geometry:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string is not inside geometry $geometry:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string is not inside geometry $geometry:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
