# SET_LIGHTS_CONTROL

Enables (or disables) manual control of the [[hex editor|hex editing]] LED lights on the badge. This includes all 8 bit lights underneath the screen and the 4 lights on either side of the screen.

Note that gaining control of the lights does not clear the light state by default; the lights currently on will remain on until set with [[SET_LIGHTS_STATE]].

## Example JSON

```json
{
  "action": "SET_LIGHTS_CONTROL",
  "enabled": true
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">turn</span> <span class="language-constant">on</span> <span class="target">lights</span> <span class="target">control</span><span class="terminator">;</span>
  <span class="verb">turn</span> <span class="target">lights</span> <span class="target">control</span> <span class="language-constant">on</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
turn $enabled:boolean lights control (;)

turn lights control $enabled:boolean (;)
```

---

Back to [[Actions]]
