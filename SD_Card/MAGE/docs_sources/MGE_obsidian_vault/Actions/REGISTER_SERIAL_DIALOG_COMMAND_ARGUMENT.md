# REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT

This action registers an argument (and a script) for an [[REGISTER_SERIAL_DIALOG_COMMAND|already-registered serial command]].

Arguments can be multiple words. In-game, if the second word is `at` or `to` it is ignored, e.g. `> warp to my house` (after running `register "warp" + "my house"`).

## Example JSON

```json
{
  "action": "REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT",
  "argument": "castle",
  "command": "map",
  "script": "scriptName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">register</span> <span class="string">map</span> <span class="operator">+</span> <span class="string">castle</span> <span class="control">-></span> <span class="script">scriptName</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
register $command:string + $argument:string -> (script) $script:string (;)
```

---

Back to [[Actions]]
