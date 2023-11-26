# SET_ENTITY_GLITCHED

Set the glitched render flag on an [entity](../entities).

## Example JSON

```json
{
  "action": "SET_ENTITY_GLITCHED",
  "bool_value": true,
  "entity": "Entity Name"
}
```

## MGS Natlang

### Examples

```mgs
script {
  make entity "Entity Name" glitched;
  make entity "Entity Name" unglitched;
}
```

### Dictionary entries

```
make entity $entity:string glitched (;)
	// built-in value: bool_value = true

make entity $entity:string unglitched (;)
	// built-in value: bool_value = false
```
