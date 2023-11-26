# SET_HEX_EDITOR_CONTROL

This action enables or disables player access to to the [hex editor](../hardware/hex_editor). This is on by default.

## Example JSON

```json
{
  "action": "SET_HEX_EDITOR_CONTROL",
  "bool_value": true
}
```

## MGS Natlang

### Examples

```mgs
script {
  turn on hex control;
  turn hex control on;
}
```

### Dictionary entries

```
turn $bool_value:boolean hex control (;)

turn hex control $bool_value:boolean (;)
```
