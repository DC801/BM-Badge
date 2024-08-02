# SET_HEX_EDITOR_CONTROL_CLIPBOARD

This action enables or disables the clipboard and copy functionality within the [hex editor](../hex_editor). It is enabled by default. (? #verifyme)

## Example JSON

```json
{
  "action": "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
  "bool_value": true
}
```

## MGS Natlang

### Examples

```mgs
script {
  turn on hex clipboard;
  turn hex clipboard on;
}
```

### Dictionary entries

```
turn $bool_value:boolean hex clipboard (;)

turn hex clipboard $bool_value:boolean (;)
```
