# SET_CONNECT_SERIAL_DIALOG

Sets the serial connection message to the named [[serial dialogs|serial dialog]]. (The connection message is sent whenever a serial console is newly connected to the badge hardware.)

This action is also available as a [[combination block]].

## Example JSON

```json
{
  "action": "SET_CONNECT_SERIAL_DIALOG",
  "serial_dialog": "serialDialogName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="target">serial</span> <span class="target">connect</span> <span class="target">message</span> <span class="operator">to</span> <span class="string">serialDialogName</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set serial connect (message) (to) $serial_dialog:string (;)
```

---

Back to [[Actions]]
