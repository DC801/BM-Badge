# LOAD_MAP

Except for the player's name, all [entity properties](../entities/entity_properties) are reset to their original values when a new [map is loaded](../maps/map_loads).

If this action is told to load the current map, the current map will be reset. This behavior is equivalent to pressing `XOR` + `MEM3`.

For most normal [door](../techniques/doors) behavior, you will probably want to [set the warp state](../actions/SET_WARP_STATE) before using the this action.

## Example JSON

```json
{
  "action": "LOAD_MAP",
  "map": "mapName"
}
```

## MGS Natlang

### Example

```mgs
script {
  load map mapName;
}
```

### Dictionary entry

```
load map $map:string (;)
```
