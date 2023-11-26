# PAN_CAMERA_TO_GEOMETRY

Pans the camera to the first vertex of a [geometry object](../maps/vector_objects).

## Example JSON

```json
{
  "action": "PAN_CAMERA_TO_GEOMETRY",
  "duration": 1000,
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">pan</span> <span class="target">camera</span> <span class="">to</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span> <span class="">over</span> <span class="number">1000ms</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
pan camera to geometry $geometry:string over $duration:duration (;)
```

---

Back to [Actions](../actions)
