# SET_LIGHTS_STATE

Turns on (or off) a specific LED light on the badge. The lights immediately around the screen can only be controlled this way when the lights are set to manual mode (see [SET_LIGHTS_CONTROL](../actions/SET_LIGHTS_CONTROL)); otherwise, those lights are strictly used for hex editor features.

If working with JSON, you can set the `lights` property to an array of strings instead of a single string if you wish to control multiple lights in one action. (Currently, lights must be toggled individually in MGS Natlang.)

See [LED IDs](../enums#led-ids) for a list of valid `lights` values.

## Example JSON

```json
{
  "action": "SET_LIGHTS_STATE",
  "enabled": true,
  "lights": "MEM3"
}
```

## MGS Natlang

### Examples

```mgs
script {
  turn on light MEM3;
  turn light MEM3 on;
}
```

### Dictionary entries

```
turn $enabled:boolean light $lights:string (;)

turn light $lights:string $enabled:boolean (;)
```
