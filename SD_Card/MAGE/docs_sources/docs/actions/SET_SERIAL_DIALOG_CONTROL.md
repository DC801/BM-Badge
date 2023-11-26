# SET_SERIAL_DIALOG_CONTROL

When `off`, the serial terminal will ignore player input.

This is set to `on` (`true`) by default.

## Example JSON

```json
{
  "action": "SET_SERIAL_DIALOG_CONTROL",
  "bool_value": true
}
```

## MGS Natlang

### Examples

```mgs
script {
  turn on serial control;
  turn serial control on;
}
```

### Dictionary entries

```
turn $bool_value:boolean serial control (;)

turn serial control $bool_value:boolean (;)
```

---

Back to [Actions](../actions)
