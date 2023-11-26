# SET_ENTITY_TICK_SCRIPT

Sets an [entity](../entities)'s [on_tick](../scripts/on_tick) script.

## Example JSON

```json
{
  "action": "SET_ENTITY_TICK_SCRIPT",
  "entity": "Entity Name",
  "script": "scriptName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">on_tick</span> <span class="operator">to</span> <span class="string">scriptName</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string on_tick (to) $script:string (;)
```

---

Back to [Actions](../actions)
