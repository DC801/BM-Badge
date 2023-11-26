# SET_HEX_EDITOR_STATE

Setting this to true opens the [hex editor](../hardware/hex_editor). (Does the hex editor need to be enabled?) #verifyme 

## Example JSON

```json
{
  "action": "SET_HEX_EDITOR_STATE",
  "bool_value": true
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="language-constant">open</span> <span class="target">hex</span> <span class="target">editor</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
$bool_value:boolean hex editor (;)
```

---

Back to [Actions](../actions)
