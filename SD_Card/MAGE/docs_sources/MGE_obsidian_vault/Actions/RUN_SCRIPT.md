# RUN_SCRIPT

This action abandons the current [[scripts|script]] and jumps to the named script. In other words, actions provided after a `RUN_SCRIPT` action will not execute. (The MGS Natlang keyword `goto` was chosen to emphasize this.) The new script runs in the same script slot that called this action, and will begin to execute immediately.

If you want to replace the script in the current slot *without* executing the new script until the next game loop, you should instead use one of the `SET_` ... `_SCRIPT` actions.

## Example JSON

```json
{
  "action": "RUN_SCRIPT",
  "script": "scriptName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="control">goto</span> <span class="script">scriptName</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
goto (script) $script:string (;)
```

---

Back to [[Actions]]