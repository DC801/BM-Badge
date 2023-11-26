# BLOCKING_DELAY

This pauses the entire game, including all other [script](../scripts) and [animations](../tilesets/animations), for the given duration.

As this might make the game appear broken, you should probably use a [NON_BLOCKING_DELAY](../actions/NON_BLOCKING_DELAY) instead.

## Example JSON

```json
{
  "action": "BLOCKING_DELAY",
  "duration": 1000
}
```

## MGS Natlang

### Example

```mgs
script {
  block 1000ms;
}
```

### Dictionary entry

```
block $duration:duration (;)
```

---

Back to [Actions](../actions)
