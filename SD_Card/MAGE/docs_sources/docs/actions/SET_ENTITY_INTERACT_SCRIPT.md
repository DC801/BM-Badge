# SET_ENTITY_INTERACT_SCRIPT

Sets an [entity](../entities)'s [on_interact](../scripts/on_interact) script.

If you use this action to change the [script slot](../scripts/script_slots) that is currently running the action, any actions given afterward may not execute depending on what they are.

Because [entity properties](../entities/entity_properties) are reset when a [map is loaded](../maps/map_loads), and because entities retain the last script that was run in their `on_interact` slot, you should restore an entity's original interact script at the end of their interact script tree if there are any script jumps involved.

## Example JSON

```json
{
  "action": "SET_ENTITY_INTERACT_SCRIPT",
  "entity": "Entity Name",
  "script": "scriptName"
}
```

## MGS Natlang

### Example

```mgs
script {
  set entity "Entity Name" on_interact to scriptName;
}
```

### Dictionary entry

```
set entity $entity:string on_interact (to) $script:string (;)
```

---

Back to [Actions](../actions)
