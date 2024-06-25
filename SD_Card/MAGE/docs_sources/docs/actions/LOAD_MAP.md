# LOAD_MAP

See: [Map Loads](../map_loads)

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
