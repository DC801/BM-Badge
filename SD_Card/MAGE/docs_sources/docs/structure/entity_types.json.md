# `entity_types.json`

This JSON file defines each `entity_type` name for each [character entity](../entities/character_entity), plus:

- `tileset`: their tileset JSON file path
- `portrait`: the name of their portrait image, if not the same as their `entity_type` name (optional)
- `animations`: their [animation assignments](../entity_management_system)

As an example (keeping in mind that the animation arrays have been closed so the overall structure is more clear):

```json
{
  "mage": {
    "tileset": "entity-mage.json",
    "animations": {
      "idle": [],
      "walk": [],
      "action": []
    }
  },
  "bender_sadbutt": {
    "tileset": "entity-bender_sadbutt.json",
    "portrait": "bender",
    "animations": {
      "idle": [],
      "walk": [],
      "action": [],
      "bite": []
    }
  }
}
```

### Animations

This part is much easier to do using the [web encoder](../encoder/web_encoder), but if you want to make changes to an [entity](../entities)'s [animations](../tilesets/animations) by hand, the structure is as follows:

```json
"idle": [
  {
    "tileid": 18,
    "flip_x": false
  },
  {
    "tileid": 16,
    "flip_x": true
  },
  {
    "tileid": 17,
    "flip_x": false
  },
  {
    "tileid": 16,
    "flip_x": false
  }
]
```

When animations are created within Tiled, they are assigned to a tile on the tileset. So for the above definitions, `tileid` refers to which tile the animation has been assigned to.

To find the `tileid`, count left-to-right and top-to-down, but remember to count starting from 0 instead of 1. Alternatively, you can select the correct tile in Tiled and see the tile ID that way.

`flip_x` will flip the sprites horizontally (and `flip_y` will flip vertically), but will otherwise make no changes to the animation on that tile.

The order of the object literals in the animation is fixed:

- North
- East
- South
- West

Each character entity should at least have an idle, walk, and action animation. (See: [Animations](../tilesets/animations))
