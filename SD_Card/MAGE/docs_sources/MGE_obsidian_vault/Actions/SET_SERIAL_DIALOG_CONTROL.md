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

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">turn</span> <span class="target">serial</span> <span class="target">control</span> <span class="language-constant">on</span><span class="terminator">;</span>
  <span class="verb">turn</span> <span class="language-constant">on</span> <span class="target">serial</span> <span class="target">control</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
turn $bool_value:boolean serial control (;)

turn serial control $bool_value:boolean (;)
```

---

Back to [[Actions]]
