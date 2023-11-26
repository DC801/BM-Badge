# SET_MAP_TICK_SCRIPT

Sets the map's [on_tick](../scripts/on_tick) script.

## Example JSON

```json
{
  "action": "SET_MAP_TICK_SCRIPT",
  "script": "scriptName"
}
```

## MGS Natlang

### Example

```mgs
script {
  set map on_tick to scriptName;
}
```

### Dictionary entry

```
set map on_tick (to) $script:string (;)
```
