# SET_HEX_EDITOR_CONTROL_CLIPBOARD

This action enables or disables the clipboard and copy functionality within the [[hex editor]]. This is on by default. (? #verifyme)

## Example JSON

```json
{
  "action": "SET_HEX_EDITOR_CONTROL_CLIPBOARD",
  "bool_value": true
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">turn</span> <span class="target">hex</span> <span class="target">clipboard</span> <span class="language-constant">on</span><span class="terminator">;</span>
  <span class="verb">turn</span> <span class="language-constant">on</span> <span class="target">hex</span> <span class="target">clipboard</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
turn hex clipboard $bool_value:boolean (;)

turn $bool_value:boolean hex clipboard (;)
```

---

Back to [[Actions]]
