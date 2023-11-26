# SET_SCREEN_SHAKE

Shakes the camera a certain distance (`amplitude`) at a certain speed (`frequency`) and for a certain length of time (`duration`).

## Example JSON

```json
{
  "action": "SET_SCREEN_SHAKE",
  "amplitude": 32,
  "duration": 3000,
  "frequency": 200
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">shake</span> <span class="target">camera</span> <span class="number">200ms</span> <span class="number">32px</span> <span class="">for</span> <span class="number">3s</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
shake camera $frequency:duration $amplitude:distance for $duration:duration (;)
```

---

Back to [Actions](actions)
