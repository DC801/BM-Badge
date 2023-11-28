# PLAY_ENTITY_ANIMATION

The [entity](../entities) will play the given [animation](../animations) the given number of times, and then will return to its default animation.

A [script](../scripts) that runs this action will not execute any further actions until the play count has been satisfied.

If an entity is compelled to move around on the map, it will abort this animation playback.

See [entity animations](../animations) for what numbers correspond to which animations.

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

### Example

```mgs
script {
  play entity "Entity Name" animation 3 twice;
}
```

### Dictionary entry

```
play entity $entity:string animation $animation:number $play_count:quantity (;)
```
