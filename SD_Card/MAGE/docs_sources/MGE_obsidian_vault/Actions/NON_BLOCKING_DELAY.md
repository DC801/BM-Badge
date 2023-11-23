# NON_BLOCKING_DELAY

This pauses the current [[scripts|script]] while allowing all other aspects of the game to continue unimpeded.

Use this if you want to pad the actions an [[entities|entity]] is performing so they don't all occur on the same game tick.

For cinematic [[cutscenes]], you will almost certainly need to disable [[SET_PLAYER_CONTROL|player control]] before using this action, otherwise the player will be able to walk away in the middle. (Don't forget to turn it on again when finished.)

## Example JSON

```json
{
  "action": "NON_BLOCKING_DELAY",
  "duration": "400ms"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">wait</span> <span class="number">400ms</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
wait $duration:duration (;)
```

---

Back to [[Actions]]
