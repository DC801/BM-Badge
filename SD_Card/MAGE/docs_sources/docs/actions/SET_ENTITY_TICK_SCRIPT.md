# SET_ENTITY_TICK_SCRIPT

Sets an [entity](../entities)'s [on_tick](../scripts/on_tick) script.

## Example JSON

```json
{
  "action": "SET_ENTITY_TICK_SCRIPT",
  "entity": "Entity Name",
  "script": "scriptName"
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" on_tick to scriptName;
}
```

### Dictionary entry

```
set entity $entity:string on_tick (to) $script:string (;)
```
