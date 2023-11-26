# SET_HEX_EDITOR_DIALOG_MODE

When on, this reduces the number of rows in the [hex editor](hardware/hex_editor), which makes room for [dialog](dialogs) boxes. (The portrait image can still cover up hex cells, though.)

NOTE: This action has been disabled in the MGE to prevent accidental soft locks.

## Example JSON

```json
{
  "action": "SET_HEX_EDITOR_DIALOG_MODE",
  "bool_value": true
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">turn</span> <span class="language-constant">on</span> <span class="target">hex</span> <span class="target">dialog</span> <span class="target">mode</span><span class="terminator">;</span>
  <span class="verb">turn</span> <span class="target">hex</span> <span class="target">dialog</span> <span class="target">mode</span> <span class="language-constant">on</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
turn $bool_value:boolean hex dialog mode (;)

turn hex dialog mode $bool_value:boolean (;)
```

---

Back to [Actions](actions)
