# SET_ENTITY_DIRECTION_TARGET_ENTITY

Make an [[entities|entity]] turn toward another.

## Example JSON

```json
{
  "action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
  "entity": "Entity Name",
  "target_entity": "Target Entity"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">turn</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="">toward</span> <span class="sigil">entity</span> <span class="string">"Target Entity"</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
turn entity $entity:string toward entity $target_entity:string (;)
```

---

Back to [[Actions]]
