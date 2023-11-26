# SET_ENTITY_DIRECTION_TARGET_GEOMETRY

Make an [entity](../entities) turn toward a vector geometry on the map.

## Example JSON

```json
{
  "action": "SET_ENTITY_DIRECTION_TARGET_GEOMETRY",
  "entity": "Entity Name",
  "target_geometry": "vector object name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">turn</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="">toward</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
turn entity $entity:string toward geometry $target_geometry:string (;)
```

---

Back to [Actions](../actions)
