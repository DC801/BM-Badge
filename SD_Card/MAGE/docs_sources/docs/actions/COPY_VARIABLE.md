# COPY_VARIABLE

Copies the value of an [entity](../entities) [property](../entities/entity_properties) into a [variable](../scripts/integer_variables) or vice versa.

## Example JSON

```json
{
  "action": "COPY_VARIABLE",
  "entity": "Entity Name",
  "field": "x",
  "inbound": true,
  "variable": "varName"
}
```

## MGS Natlang

### Examples

```mgs
script {
  copy entity "Entity Name" x from variable varName;
  copy entity "Entity Name" x into variable varName;
  copy variable varName from entity "Entity Name" x;
  copy variable varName into entity "Entity Name" x;
}
```

### Dictionary entries

```
copy entity $entity:string $field:bareword from variable $variable:string (;)
	// built-in value: inbound = false

copy entity $entity:string $field:bareword into variable $variable:string (;)
	// built-in value: inbound = true

copy variable $variable:string from entity $entity:string $field:bareword (;)
	// built-in value: inbound = true

copy variable $variable:string into entity $entity:string $field:bareword (;)
	// built-in value: inbound = false
```
