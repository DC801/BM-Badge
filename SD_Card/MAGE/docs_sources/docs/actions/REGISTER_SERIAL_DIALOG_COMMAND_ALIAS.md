# REGISTER_SERIAL_DIALOG_COMMAND_ALIAS

This action registers an "alias" for a [command](commands). For example, you might register `i` as an alias for `inventory`.

To unregister an alias, use [UNREGISTER_SERIAL_DIALOG_COMMAND_ALIAS](#unregister_serial_dialog_alias)

Aliases are not included in the list provided by the default serial command HELP, which lists all currently-registered commands.

## Example JSON

```json
{
  "action": "REGISTER_SERIAL_DIALOG_COMMAND_ALIAS",
  "command": "map"
}
```

## MGS Natlang

### Example

```mgs
script {
  register alias  = map;
}
```

### Dictionary entry

```
register alias $alias:string = $command:string (;)
```
