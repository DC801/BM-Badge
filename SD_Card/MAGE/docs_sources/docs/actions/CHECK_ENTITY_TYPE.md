# CHECK_ENTITY_TYPE

Checks whether a [character entity](../entities/character_entity) is currently the given [entity_type](../entities/entity_properties).

This action is useful because you can check entity types by name, which is easy and convenient (e.g. check if the entity "Delmar" is the type `old_man`). Otherwise you'd have to use a mix of [CHECK_ENTITY_PRIMARY_ID](../actions/CHECK_ENTITY_PRIMARY_ID) and [CHECK_ENTITY_PRIMARY_ID_TYPE](../actions/CHECK_ENTITY_PRIMARY_ID_TYPE) and also know in advance which ints you're checking for.

## Example JSON

```json
{
  "action": "CHECK_ENTITY_TYPE",
  "entity": "Entity Name",
  "entity_type": "old_man",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_TYPE",
  "entity": "Entity Name",
  "entity_type": "old_man",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" type is old_man) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" type is old_man then goto successScript;
  if entity "Entity Name" type is old_man then goto index 12;
  if entity "Entity Name" type is old_man then goto label labelName;
  if entity "Entity Name" type is not old_man then goto successScript;
  if entity "Entity Name" type is not old_man then goto index 12;
  if entity "Entity Name" type is not old_man then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string type is $entity_type:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string type is $entity_type:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string type is $entity_type:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string type is not $entity_type:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string type is not $entity_type:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string type is not $entity_type:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
