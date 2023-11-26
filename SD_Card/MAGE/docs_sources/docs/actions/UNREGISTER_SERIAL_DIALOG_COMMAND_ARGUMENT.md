# UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT

This action unregisters the specified argument from an [already-registered serial command](REGISTER_SERIAL_DIALOG_COMMAND).

## Example JSON

```json
{
  "action": "UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT",
  "argument": "castle",
  "command": "map"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">unregister</span> <span class="string">map</span> <span class="operator">+</span> <span class="string">castle</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
unregister $command:string + $argument:string (;)
```

---

Back to [Actions](actions)
