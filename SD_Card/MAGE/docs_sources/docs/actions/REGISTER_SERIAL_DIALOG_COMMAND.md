# REGISTER_SERIAL_DIALOG_COMMAND

Once a command is registered, the player can enter the command into the serial console and the corresponding script will run in a unique serial script slot.

- **Plain variant**: registers the command in general and identifies the script to run when the command is typed without any additional arguments. This variant must be used before *any* arguments can be registered (including `fail`).
- **Fail variant**: identifies a script for custom "unknown argument" behavior (in the event the player attempts to use an unregistered argument for this command).

Commands must be a single word.

## Example JSON

```json
{
  "action": "REGISTER_SERIAL_DIALOG_COMMAND",
  "command": "map",
  "is_fail": false,
  "script": "scriptName"
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">register</span> <span class="string">map</span> <span class="control">-></span> <span class="script">scriptName</span><span class="terminator">;</span>
  <span class="verb">register</span> <span class="string">map</span> <span class="target">fail</span> <span class="control">-></span> <span class="script">scriptName</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
register $command:string -> (script) $script:string (;)
	// built-in value: is_fail = false

register $command:string fail -> (script) $script:string (;)
	// built-in value: is_fail = true
```

---

Back to [Actions](../actions)
