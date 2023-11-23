# SHOW_SERIAL_DIALOG

Outputs the named [[serial dialogs|serial dialog]] to a connected serial console.

The `concat` variant omits the newline at the end of each message, which can enable complex serial output using only MGE scripting logic. (Turn off [[SET_SERIAL_DIALOG_CONTROL|serial control]] first, then turn it back on again when finished.)

This action is also available as a [[combination block]]: [[show serial dialog block]].

## Example JSON

```json
{
  "action": "SHOW_SERIAL_DIALOG",
  "disable_newline": false,
  "serial_dialog": "serialDialogName"
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">concat</span> <span class="target">serial</span> <span class="target">dialog</span> <span class="string">serialDialogName</span><span class="terminator">;</span>
  <span class="verb">show</span> <span class="sigil">serial</span> <span class="sigil">dialog</span> <span class="string">serialDialogName</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
concat serial dialog $serial_dialog:string (;)
	// built-in value: disable_newline = true

show serial dialog $serial_dialog:string (;)
	// built-in value: disable_newline = false
```

---

Back to [[Actions]]
