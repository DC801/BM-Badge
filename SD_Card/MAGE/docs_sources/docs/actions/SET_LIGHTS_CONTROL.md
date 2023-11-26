# SET_LIGHTS_CONTROL

Enables (or disables) manual control of the [hex editing](../hardware/hex_editor) LED lights on the badge. This includes all 8 bit lights underneath the screen and the 4 lights on either side of the screen.

Note that gaining control of the lights does not clear the light state by default; the lights currently on will remain on until set with [SET_LIGHTS_STATE](../actions/SET_LIGHTS_STATE).

## Example JSON

```json
{
  "action": "SET_LIGHTS_CONTROL",
  "enabled": true
}
```

## MGS Natlang

### Examples

```mgs
script {
  turn on lights control;
  turn lights control on;
}
```

### Dictionary entries

```
turn $enabled:boolean lights control (;)

turn lights control $enabled:boolean (;)
```
