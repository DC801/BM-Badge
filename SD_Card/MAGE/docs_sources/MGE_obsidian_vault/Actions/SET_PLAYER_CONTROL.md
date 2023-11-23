# SET_PLAYER_CONTROL

When player control is `on`, the player [[entities|entity]] can move around as normal. When `off`, the player cannot move, hack, or [[on_interact|interact]] with anything.

This is set to `on` (`true`) by default.

## Example JSON

```json
{
  "action": "SET_PLAYER_CONTROL",
  "bool_value": true
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">turn</span> <span class="language-constant">on</span> <span class="target">player</span> <span class="target">control</span><span class="terminator">;</span>
  <span class="verb">turn</span> <span class="target">player</span> <span class="target">control</span> <span class="language-constant">on</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
turn $bool_value:boolean player control (;)

turn player control $bool_value:boolean (;)
```

---

Back to [[Actions]]
