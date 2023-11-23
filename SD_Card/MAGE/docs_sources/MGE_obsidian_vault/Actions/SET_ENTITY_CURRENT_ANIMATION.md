# SET_ENTITY_CURRENT_ANIMATION

The [[entities|entity]] will switch to the given [[animations|animation]], which will loop indefinitely.

If an entity is compelled to move around on the map, it will abort this animation playback. (I.e. when the entity stops moving again, it will revert to its default animation, not the one given by this action.)

See [[animations|entity animations]] for what numbers correspond to which animations.

## Example JSON

```json
{
  "action": "SET_ENTITY_CURRENT_ANIMATION",
  "byte_value": 1,
  "entity": "Entity Name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">current_animation</span> <span class="operator">to</span> <span class="number">1</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string current_animation (to) $byte_value:number (;)
```

---

Back to [[Actions]]
