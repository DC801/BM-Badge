# SET_SERIAL_DIALOG_COMMAND_VISIBILITY

This action hides (or unhides) a [command](commands) from the list provided by the default serial command HELP.

## Example JSON

```json
{
  "action": "SET_SERIAL_DIALOG_COMMAND_VISIBILITY",
  "command": "map",
  "is_visible": false
}
```

## MGS Natlang

### Examples

```mgs
script {
  hide command map;
  unhide command map;
}
```

### Dictionary entries

```
hide command $command:string (;)
	// built-in value: is_visible = false

unhide command $command:string (;)
	// built-in value: is_visible = true
```
