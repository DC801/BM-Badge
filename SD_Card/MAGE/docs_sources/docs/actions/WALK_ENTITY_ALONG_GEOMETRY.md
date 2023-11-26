# WALK_ENTITY_ALONG_GEOMETRY

Moves the [entity](entities) along the [geometry object](maps/vector_objects) named (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`) over a period of time.

NOTE: Unless you want the entity to teleport to the geometry's origin point, you should probably use [WALK_ENTITY_TO_GEOMETRY](actions/WALK_ENTITY_TO_GEOMETRY) first.

## Example JSON

```json
{
  "action": "WALK_ENTITY_ALONG_GEOMETRY",
  "duration": 1000,
  "entity": "Entity Name",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">walk</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="">along</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span> <span class="">over</span> <span class="number">1000ms</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
walk entity $entity:string along geometry $geometry:string over $duration:duration (;)
```

---

Back to [Actions](actions)
