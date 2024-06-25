# REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT

This action registers an argument (and a script) for an [already-registered serial command](../actions/REGISTER_SERIAL_DIALOG_COMMAND).

Arguments can be multiple words. In-game, if the second word is `at` or `to` it is ignored, e.g. `> warp to my house` (after running `register "warp" + "my house"`).

## Example JSON

```json
{
  "action": "REGISTER_SERIAL_DIALOG_COMMAND_ARGUMENT",
  "argument": "castle",
  "command": "map",
  "script": "scriptName"
}
```

## MGS Natlang

### Example

```mgs
script {
  register map + castle -> scriptName;
}
```

### Dictionary entry

```
register $command:string + $argument:string -> (script) $script:string (;)
```
