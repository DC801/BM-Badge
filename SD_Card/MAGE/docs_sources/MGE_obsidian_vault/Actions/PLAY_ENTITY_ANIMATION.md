# PLAY_ENTITY_ANIMATION

The [[entities|entity]] will play the given [[animations|animation]] the given number of times, and then will return to its default animation.

A [[scripts|script]] that runs this action will not execute any further actions until the play count has been satisfied.

If an entity is compelled to move around on the map, it will abort this animation playback.

See [[animations|entity animations]] for what numbers correspond to which animations.

## Example JSON

```json
{
  "action": "PLAY_ENTITY_ANIMATION",
  "animation": 3,
  "entity": "Entity Name",
  "play_count": 2
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">play</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="sigil">animation</span> <span class="number">3</span> <span class="number">twice</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
play entity $entity:string animation $animation:number $play_count:quantity (;)
```

---

Back to [[Actions]]
