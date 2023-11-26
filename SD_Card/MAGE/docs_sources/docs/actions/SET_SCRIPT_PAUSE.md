# SET_SCRIPT_PAUSE

Pauses or unpauses a [script](../scripts). In practice, this is most useful for temporarily pausing an [entity](../entities)'s [`on_tick`](../scripts/on_tick) script during its [`on_interact`](../scripts/on_interact) event.

Entity variant: Any entity name can be used in all the normal ways ([`%PLAYER%`](../entities/PLAYER) etc.). Scripts slots for these are `on_tick`, `on_interact`, and [`on_look`](../scripts/on_look).

Map variant: Script slots for these are [`on_load`](../scripts/on_load), [`on_tick`](../scripts/on_tick), and [on_command](../hardware/commands).

## Example JSON

```json
{
  "action": "SET_SCRIPT_PAUSE",
  "bool_value": true,
  "entity": "Entity Name",
  "script_slot": "on_tick"
}
```

## MGS Natlang

### Examples

```mgs
script {
  pause entity "Entity Name" on_tick;
  pause map on_tick;
  unpause entity "Entity Name" on_tick;
  unpause map on_tick;
}
```

### Dictionary entries

```
pause entity $entity:string $script_slot:bareword (;)
	// built-in value: bool_value = true

pause map $script_slot:bareword (;)
	// built-in value: bool_value = true
	// built-in value: entity = %MAP%

unpause entity $entity:string $script_slot:bareword (;)
	// built-in value: bool_value = false

unpause map $script_slot:bareword (;)
	// built-in value: bool_value = false
	// built-in value: entity = %MAP%
```
