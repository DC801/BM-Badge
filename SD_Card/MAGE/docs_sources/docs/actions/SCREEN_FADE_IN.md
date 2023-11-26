# SCREEN_FADE_IN

Fades the screen in from the given color.

Fades are slow on the hardware, so use these sparingly.

## Example JSON

```json
{
  "action": "SCREEN_FADE_IN",
  "color": "#000",
  "duration": 1000
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">fade</span> <span class="">in</span> <span class="target">camera</span> <span class="">from</span> <span class="number">#000</span> <span class="">over</span> <span class="number">1000ms</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
fade in camera from $color:color over $duration:duration (;)
```

---

Back to [Actions](actions)
