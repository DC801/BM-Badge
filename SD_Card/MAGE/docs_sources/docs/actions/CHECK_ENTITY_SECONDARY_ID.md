# CHECK_ENTITY_SECONDARY_ID

Checks whether an [entity](../entities) has the given [secondary_id](../entity types).

This entity property is only useful on [tile entities](../entities/tile_entity), where the `secondary_id` determines which tile in the tileset is displayed.

Tiles are referenced by their index, starting at the top and going toward the right (0-indexed). Click on the tile within Tiled to see its ID.

## Example JSON

```json
{
  "action": "CHECK_ENTITY_SECONDARY_ID",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_u2": 32,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_SECONDARY_ID",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_u2": 32,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

```mgs
script {
  if (entity "Entity Name" secondary_id is 32) {}
}
```

### Examples

```mgs
script {
  if entity "Entity Name" secondary_id is 32 then goto successScript;
  if entity "Entity Name" secondary_id is 32 then goto index 12;
  if entity "Entity Name" secondary_id is 32 then goto label labelName;
  if entity "Entity Name" secondary_id is not 32 then goto successScript;
  if entity "Entity Name" secondary_id is not 32 then goto index 12;
  if entity "Entity Name" secondary_id is not 32 then goto label labelName;
}
```

### Dictionary entries

```
if entity $entity:string secondary_id is $expected_u2:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string secondary_id is $expected_u2:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string secondary_id is $expected_u2:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string secondary_id is not $expected_u2:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string secondary_id is not $expected_u2:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string secondary_id is not $expected_u2:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```
