# UNREGISTER_SERIAL_DIALOG_COMMAND

- **Plain variant**: unregisters the given command *and* all registered arguments for that command (if any).
- **Fail variant**: only unregisters the `fail` script; other registered arguments (and the plain command itself) will remain intact.

## Example JSON

```json
{
  "action": "UNREGISTER_SERIAL_DIALOG_COMMAND",
  "command": "map",
  "is_fail": false
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">unregister</span> <span class="string">map</span><span class="terminator">;</span>
  <span class="verb">unregister</span> <span class="string">map</span> <span class="target">fail</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
unregister $command:string (;)
	// built-in value: is_fail = false

unregister $command:string fail (;)
	// built-in value: is_fail = true
```

---

Back to [[Actions]]
