# SET_PLAYER_CONTROL

When player control is `on`, the player [entity](../entities) can move around as normal. When `off`, the player cannot move, hack, or [interact](../scripts/on_interact) with anything.

This is set to `on` (`true`) by default.

## Example JSON

```json
{
  "action": "SET_PLAYER_CONTROL",
  "bool_value": true
}
```

## MGS Natlang

### Examples

```mgs
script {
  turn on player control;
  turn player control on;
}
```

### Dictionary entries

```
turn $bool_value:boolean player control (;)

turn player control $bool_value:boolean (;)
```
