# SET_HEX_EDITOR_CONTROL

This action enables or disables player access to to the [hex editor](hardware/hex_editor). This is on by default.

## Example JSON

```json
{
  "action": "SET_HEX_EDITOR_CONTROL",
  "bool_value": true
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">turn</span> <span class="language-constant">on</span> <span class="target">hex</span> <span class="target">control</span><span class="terminator">;</span>
  <span class="verb">turn</span> <span class="target">hex</span> <span class="target">control</span> <span class="language-constant">on</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
turn $bool_value:boolean hex control (;)

turn hex control $bool_value:boolean (;)
```

---

Back to [Actions](actions)
