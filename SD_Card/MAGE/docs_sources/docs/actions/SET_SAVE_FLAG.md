# SET_SAVE_FLAG

Set a [save flag](scripts/save_flags) to `true` or `false`.

## Example JSON

```json
{
  "action": "SET_SAVE_FLAG",
  "bool_value": true,
  "save_flag": "saveFlagName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">flag</span> <span class="string">saveFlagName</span> <span class="operator">to</span> <span class="language-constant">true</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set flag $save_flag:string (to) $bool_value:boolean (;)
```

---

Back to [Actions](actions)
