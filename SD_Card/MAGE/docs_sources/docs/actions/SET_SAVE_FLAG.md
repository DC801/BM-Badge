# SET_SAVE_FLAG

Set a [save flag](../variables#save-flags) to `true` or `false`.

## Example JSON

```json
{
  "action": "SET_SAVE_FLAG",
  "bool_value": true,
  "save_flag": "saveFlagName"
}
```

## MGS Natlang

### Example

```mgs
script {
  set flag saveFlagName to true;
}
```

### Dictionary entry

```
set flag $save_flag:string (to) $bool_value:boolean (;)
```
