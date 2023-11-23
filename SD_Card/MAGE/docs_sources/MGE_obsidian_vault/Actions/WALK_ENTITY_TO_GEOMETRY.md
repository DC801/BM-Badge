# WALK_ENTITY_TO_GEOMETRY

Moves the [[entities|entity]] in a straight line from its current position to the first vertex of the [[Vector Objects|geometry object]] named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.

## Example JSON

```json
{
  "action": "WALK_ENTITY_TO_GEOMETRY",
  "duration": "1000ms",
  "entity": "Entity Name",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">walk</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="">to</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span> <span class="">over</span> <span class="number">1000ms</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
walk entity $entity:string to geometry $geometry:string over $duration:duration (;)
```

---

Back to [[Actions]]
