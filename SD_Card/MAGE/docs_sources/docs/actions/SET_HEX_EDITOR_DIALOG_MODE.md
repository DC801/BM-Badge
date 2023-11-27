# SET_HEX_EDITOR_DIALOG_MODE

When on, this reduces the number of rows in the [hex editor](../hex_editor), which makes room for [dialog](../dialogs) boxes. (The portrait image can still cover up hex cells, though.)

NOTE: This action has been disabled in the MGE to prevent accidental soft locks.

## Example JSON

```json
{
  "action": "SET_HEX_EDITOR_DIALOG_MODE",
  "bool_value": true
}
```

## MGS Natlang

### Examples

```mgs
script {
  turn on hex dialog mode;
  turn hex dialog mode on;
}
```

### Dictionary entries

```
turn $bool_value:boolean hex dialog mode (;)

turn hex dialog mode $bool_value:boolean (;)
```
