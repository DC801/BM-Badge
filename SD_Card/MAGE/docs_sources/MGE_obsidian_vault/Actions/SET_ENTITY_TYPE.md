# SET_ENTITY_TYPE

Sets an [[entities|entity]]'s [[character entity|entity_type]]. (See: [[Entity Properties]])

## Example JSON

```json
{
  "action": "SET_ENTITY_TYPE",
  "entity": "Entity Name",
  "entity_type": "old_man"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">type</span> <span class="operator">to</span> <span class="string">old_man</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string type (to) $entity_type:string (;)
```

---

Back to [[Actions]]
