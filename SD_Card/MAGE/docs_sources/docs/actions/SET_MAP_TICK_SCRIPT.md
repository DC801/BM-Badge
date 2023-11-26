# SET_MAP_TICK_SCRIPT

Sets the map's [on_tick](scripts/on_tick) script.

## Example JSON

```json
{
  "action": "SET_MAP_TICK_SCRIPT",
  "script": "scriptName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="target">map</span> <span class="target">on_tick</span> <span class="operator">to</span> <span class="script">scriptName</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set map on_tick (to) $script:string (;)
```

---

Back to [Actions](actions)
