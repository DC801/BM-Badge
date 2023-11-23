# TELEPORT_ENTITY_TO_GEOMETRY

Moves the [[entities|entity]] instantly to the first vertex of the specified [[Vector Objects|geometry object]] (or the entity's assigned path if `geometry` is `%ENTITY_PATH%`).

## Example JSON

```json
{
  "action": "TELEPORT_ENTITY_TO_GEOMETRY",
  "entity": "Entity Name",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">teleport</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="">to</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
teleport entity $entity:string to geometry $geometry:string (;)
```

---

Back to [[Actions]]
