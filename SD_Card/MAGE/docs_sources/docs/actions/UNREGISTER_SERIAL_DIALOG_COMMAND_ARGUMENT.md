# UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT

This action unregisters the specified argument from an [already-registered serial command](../REGISTER_SERIAL_DIALOG_COMMAND).

## Example JSON

```json
{
  "action": "UNREGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT",
  "argument": "castle",
  "command": "map"
}
```

## MGS Natlang

### Example

```mgs
script {
  unregister map + castle;
}
```

### Dictionary entry

```
unregister $command:string + $argument:string (;)
```
