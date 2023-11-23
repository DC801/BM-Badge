# LOOP_CAMERA_ALONG_GEOMETRY

(might not work yet — instead, make a null entity and lock the camera to it)

## Example JSON

```json
{
  "action": "LOOP_CAMERA_ALONG_GEOMETRY",
  "duration": "1000ms",
  "geometry": "vector object name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">loop</span> <span class="target">camera</span> <span class="">along</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span> <span class="">over</span> <span class="number">1000ms</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
loop camera along geometry $geometry:string over $duration:duration (;)
```

---

Back to [[Actions]]
