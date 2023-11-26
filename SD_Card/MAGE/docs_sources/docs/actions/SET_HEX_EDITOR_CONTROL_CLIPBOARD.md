# SET_HEX_EDITOR_CONTROL_CLIPBOARD

This action enables or disables the clipboard and copy functionality within the [hex editor](../hardware/hex_editor). This is on by default. (? #verifyme)

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

---

Back to [Actions](../actions)
