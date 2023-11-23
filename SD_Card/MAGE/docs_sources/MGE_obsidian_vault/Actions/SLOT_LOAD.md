# SLOT_LOAD

This brings the [[save data]] associated with that slot into RAM.

The slot is set to `0` by default.

## Example JSON

```json
{
  "action": "SLOT_LOAD",
  "slot": 2
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">load</span> <span class="sigil">slot</span> <span class="number">2</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
load slot $slot:number (;)
```

---

Back to [[Actions]]
