# SET_ENTITY_DIRECTION_RELATIVE

Turns the [entity](../entities) in 90° increments. Positive numbers are clockwise turns, and negative numbers are counterclockwise turns. (E.g. turn them '2' to flip them around 180°)

This action can be chained with another similar one for complex behaviors. For example, to turn an entity away from the player, you can first set the entity's direction [toward the player](../SET_ENTITY_DIRECTION_TARGET_ENTITY), then immediately rotate it 2 turns.

## Example JSON

```json
{
  "action": "SET_ENTITY_DIRECTION_RELATIVE",
  "entity": "Entity Name",
  "relative_direction": 3
}
```

## MGS Natlang

### Example

```mgs
script {
  rotate entity "Entity Name" 3;
}
```

### Dictionary entry

```
rotate entity $entity:string $relative_direction:number (;)
```

---

Back to [Actions](../actions)
