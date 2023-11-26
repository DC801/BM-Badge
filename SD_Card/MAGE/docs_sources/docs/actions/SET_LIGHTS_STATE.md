# SET_LIGHTS_STATE

Turns on (or off) a specific LED light on the badge. The lights immediately around the screen can only be controlled this way when the lights are set to manual mode (see [SET_LIGHTS_CONTROL](../actions/SET_LIGHTS_CONTROL)); otherwise, those lights are strictly used for hex editor features.

If working with JSON, you can set the `lights` property to an array of strings instead of a single string if you wish to control multiple lights in one action. (Currently, lights must be toggled individually in MGS Natlang.)

See [LED IDs](../structure/led_ids) for a list of valid `lights` values.

## Example JSON

```json
{
  "action": "SET_LIGHTS_STATE",
  "enabled": true,
  "lights": "MEM3"
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">turn</span> <span class="language-constant">on</span> <span class="sigil">light</span> <span class="language-constant">MEM3</span><span class="terminator">;</span>
  <span class="verb">turn</span> <span class="sigil">light</span> <span class="language-constant">MEM3</span> <span class="language-constant">on</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
turn $enabled:boolean light $lights:string (;)

turn light $lights:string $enabled:boolean (;)
```

---

Back to [Actions](../actions)
