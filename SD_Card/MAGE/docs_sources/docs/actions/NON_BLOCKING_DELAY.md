# NON_BLOCKING_DELAY

This pauses the current [script](../scripts) while allowing all other aspects of the game to continue unimpeded.

Use this if you want to pad the actions an [entity](../entities) is performing so they don't all occur on the same game tick.

For cinematic [cutscenes](../techniques/cutscenes), you will almost certainly need to disable [player control](../actions/SET_PLAYER_CONTROL) before using this action, otherwise the player will be able to walk away in the middle. (Don't forget to turn it on again when finished.)

## Example JSON

```json
{
  "action": "NON_BLOCKING_DELAY",
  "duration": 400
}
```

## MGS Natlang

### Example

```mgs
script {
  wait 400ms;
}
```

### Dictionary entry

```
wait $duration:duration (;)
```

---

Back to [Actions](../actions)
