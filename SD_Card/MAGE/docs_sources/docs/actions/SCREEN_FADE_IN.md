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

### Example

```mgs
script {
  fade in camera from #000 over 1000ms;
}
```

### Dictionary entry

```
fade in camera from $color:color over $duration:duration (;)
```
