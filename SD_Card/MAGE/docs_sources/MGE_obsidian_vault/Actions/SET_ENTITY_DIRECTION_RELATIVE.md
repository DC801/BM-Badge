# SET_ENTITY_DIRECTION_RELATIVE

Turns the [[entities|entity]] in 90° increments. Positive numbers are clockwise turns, and negative numbers are counterclockwise turns. (E.g. turn them '2' to flip them around 180°)

This action can be chained with another similar one for complex behaviors. For example, to turn an entity away from the player, you can first set the entity's direction [[SET_ENTITY_DIRECTION_TARGET_ENTITY|toward the player]], then immediately rotate it 2 turns.

## Example JSON

```json
{
  "action": "SET_ENTITY_DIRECTION_RELATIVE",
  "entity": "Entity Name",
  "relative_direction": 3
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">rotate</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="number">3</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
rotate entity $entity:string $relative_direction:number (;)
```

---

Back to [[Actions]]