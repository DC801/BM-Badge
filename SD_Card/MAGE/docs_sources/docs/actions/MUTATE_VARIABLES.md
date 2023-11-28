# MUTATE_VARIABLES

Manipulate the value of a specific [variable](../variables#integer-variables) by using the value of another variable.

See [operations](../enums#operations).

## Example JSON

```json
{
  "action": "MUTATE_VARIABLES",
  "operation": "ADD",
  "source": "otherVar",
  "variable": "varName"
}
```

## MGS Natlang

### Example

```mgs
script {
  mutate varName + otherVar;
}
```

### Dictionary entry

```
mutate $variable:string $operation:operator $source:string (;)
```
