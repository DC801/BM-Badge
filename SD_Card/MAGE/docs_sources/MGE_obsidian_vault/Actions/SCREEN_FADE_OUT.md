# SCREEN_FADE_OUT

Fades the screen out to the given color.

Fades are slow on the hardware, so use these sparingly.

## Example JSON

```json
{
  "action": "SCREEN_FADE_OUT",
  "color": "#000",
  "duration": "1000ms"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">fade</span> <span class="">out</span> <span class="target">camera</span> <span class="">to</span> <span class="number">#000</span> <span class="">over</span> <span class="number">1000ms</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
fade out camera to $color:color over $duration:duration (;)
```

---

Back to [[Actions]]
