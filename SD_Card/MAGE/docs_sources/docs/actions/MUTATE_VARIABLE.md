# MUTATE_VARIABLE

Manipulate the value of a specific [variable](../scripts/integer_variables) or set it to a new value.

See [operations](../structure/operations).

## Example JSON

```json
{
  "action": "MUTATE_VARIABLE",
  "operation": "ADD",
  "value": 1,
  "variable": "varName"
}
```

## MGS Natlang

### Example

```mgs
script {
  mutate varName + 1;
}
```

### Dictionary entry

```
mutate $variable:string $operation:operator $value:number (;)
```
