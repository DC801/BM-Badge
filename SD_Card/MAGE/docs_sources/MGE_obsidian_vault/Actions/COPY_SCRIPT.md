# COPY_SCRIPT

The [[MGE encoder]] literally copies all the actions from the copied [[scripts|script]] and inserts them where `COPY_SCRIPT` is being used. This happens recursively.

`COPY_SCRIPT` converts and adapts [[labels|label]] references, jumps that eventually become action indices, when copied. Feel free to use `COPY_SCRIPT` for literally any script you want!

See: [[COPY_SCRIPT_uses]]

## Example JSON

```json
{
  "action": "COPY_SCRIPT",
  "script": "scriptName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">copy</span> <span class="script">scriptName</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
copy (script) $script:string (;)
```

---

Back to [[Actions]]
