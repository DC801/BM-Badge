# SET_ENTITY_PATH

This assigns a [geometry object](../maps/vector_objects) to an [entity](../entities). Afterward, the entity can use `%ENTITY_PATH%` to refer to that path. (This assignment can also be done within Tiled.)

## Example JSON

```json
{
  "action": "SET_ENTITY_PATH",
  "entity": "Entity Name",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">path</span> <span class="operator">to</span> <span class="string">"vector object name"</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string path (to) $geometry:string (;)
```

---

Back to [Actions](../actions)
