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

### Example

```mgs
script {
  shake camera 200ms 32px for 3s;
}
```

### Dictionary entry

```
shake camera $frequency:duration $amplitude:distance for $duration:duration (;)
```

---

Back to [Actions](../actions)
