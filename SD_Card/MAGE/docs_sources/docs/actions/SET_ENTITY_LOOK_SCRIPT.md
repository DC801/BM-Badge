# SET_ENTITY_LOOK_SCRIPT

Sets an [entity](../entities)'s [`on_look`](../script_slots#on-look) script.

## Example JSON

```json
{
  "action": "SET_ENTITY_LOOK_SCRIPT",
  "entity": "Entity Name",
  "script": "scriptName"
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" on_look to scriptName;
}
```

### Dictionary entry

```
set entity $entity:string on_look (to) $script:string (;)
```
