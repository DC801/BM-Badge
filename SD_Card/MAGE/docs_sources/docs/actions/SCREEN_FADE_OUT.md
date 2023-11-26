# SCREEN_FADE_OUT

Fades the screen out to the given color.

Fades are slow on the hardware, so use these sparingly.

## Example JSON

```json
{
  "action": "SCREEN_FADE_OUT",
  "color": "#000",
  "duration": 1000
}
```

## MGS Natlang

### Example

```mgs
script {
  fade out camera to #000 over 1000ms;
}
```

### Dictionary entry

```
fade out camera to $color:color over $duration:duration (;)
```

---

Back to [Actions](../actions)
