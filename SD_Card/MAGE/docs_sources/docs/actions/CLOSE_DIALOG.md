# CLOSE_DIALOG

Ends any open [dialog](../dialogs).

Use this [action](../actions) when you want to trigger a dialog that may potentially interrupt a dialog in progress. Otherwise, the two dialogs may collide, which can result in a soft lock.

## Example JSON

```json
{
  "action": "CLOSE_DIALOG"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">close</span> <span class="target">dialog</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
close dialog (;)
```

---

Back to [Actions](../actions)
