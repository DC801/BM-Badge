# SET_ENTITY_CURRENT_ANIMATION

The [entity](../entities) will switch to the given [animation](../tilesets/animations), which will loop indefinitely.

If an entity is compelled to move around on the map, it will abort this animation playback. (I.e. when the entity stops moving again, it will revert to its default animation, not the one given by this action.)

See [entity animations](../tilesets/animations) for what numbers correspond to which animations.

## Example JSON

```json
{
  "action": "SET_ENTITY_CURRENT_ANIMATION",
  "byte_value": 1,
  "entity": "Entity Name"
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" current_animation to 1;
}
```

### Dictionary entry

```
set entity $entity:string current_animation (to) $byte_value:number (;)
```

---

Back to [Actions](../actions)
