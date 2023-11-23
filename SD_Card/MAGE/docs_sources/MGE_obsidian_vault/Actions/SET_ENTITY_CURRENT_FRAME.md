# SET_ENTITY_CURRENT_FRAME

Set the frame of the current [[animations|animation]].

This is useful for staggering the animations of [[entities]] that have identical animation timings.

## Example JSON

```json
{
  "action": "SET_ENTITY_CURRENT_FRAME",
  "byte_value": 1,
  "entity": "Entity Name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">animation_frame</span> <span class="operator">to</span> <span class="number">1</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string animation_frame (to) $byte_value:number (;)
```

---

Back to [[Actions]]
