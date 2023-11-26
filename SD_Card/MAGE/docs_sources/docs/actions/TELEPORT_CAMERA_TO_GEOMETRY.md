# TELEPORT_CAMERA_TO_GEOMETRY

Moves the camera to the first vertex of the specified [geometry object](../maps/vector_objects).

## Example JSON

```json
{
  "action": "TELEPORT_CAMERA_TO_GEOMETRY",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">teleport</span> <span class="target">camera</span> <span class="">to</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
teleport camera to geometry $geometry:string (;)
```

---

Back to [Actions](../actions)
