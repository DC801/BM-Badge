# REGISTER_SERIAL_DIALOG_COMMAND

Once a command is registered, the player can enter the command into the serial console and the corresponding script will run in a unique serial script slot.

- **Plain variant**: registers the command in general and identifies the script to run when the command is typed without any additional arguments. This variant must be used before *any* arguments can be registered (including `fail`).
- **Fail variant**: identifies a script for custom "unknown argument" behavior (in the event the player attempts to use an unregistered argument for this command).

Commands must be a single word.

## Example JSON

```json
{
  "action": "REGISTER_SERIAL_DIALOG_COMMAND",
  "command": "map",
  "is_fail": false,
  "script": "scriptName"
}
```

## MGS Natlang

### Examples

```mgs
script {
  register map -> scriptName;
  register map fail -> scriptName;
}
```

### Dictionary entries

```
register $command:string -> (script) $script:string (;)
	// built-in value: is_fail = false

register $command:string fail -> (script) $script:string (;)
	// built-in value: is_fail = true
```
