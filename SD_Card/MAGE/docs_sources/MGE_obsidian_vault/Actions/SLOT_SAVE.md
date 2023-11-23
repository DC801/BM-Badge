# SLOT_SAVE

This action saves the [[Save Data|game state]] into the current slot (the last slot loaded).

It is not possible to write save data into an arbitrary slots, nor is it possible to copy data from one save slot into another.

Things that are saved:

- player name (string)
- `MEM` button offsets (the player can change the `MEM` button mapping)
- current map id (NOTE: this is saved, but not currently used upon load)
- the warp state string
- hex editor clipboard contents (up to 32 bytes)
- save flags (booleans)
- script variables (integers)

## Example JSON

```json
{
  "action": "SLOT_SAVE"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">save</span> <span class="target">slot</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
save slot (;)
```

---

Back to [[Actions]]
