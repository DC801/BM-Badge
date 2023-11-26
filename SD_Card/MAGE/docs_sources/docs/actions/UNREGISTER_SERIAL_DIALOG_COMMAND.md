# UNREGISTER_SERIAL_DIALOG_COMMAND

- **Plain variant**: unregisters the given command *and* all registered arguments for that command (if any).
- **Fail variant**: only unregisters the `fail` script; other registered arguments (and the plain command itself) will remain intact.

## Example JSON

```json
{
  "action": "UNREGISTER_SERIAL_DIALOG_COMMAND",
  "command": "map",
  "is_fail": false
}
```

## MGS Natlang

### Examples

```mgs
script {
  unregister map;
  unregister map fail;
}
```

### Dictionary entries

```
unregister $command:string (;)
	// built-in value: is_fail = false

unregister $command:string fail (;)
	// built-in value: is_fail = true
```
