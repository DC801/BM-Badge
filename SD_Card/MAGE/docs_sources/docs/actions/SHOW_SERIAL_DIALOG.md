# SHOW_SERIAL_DIALOG

Outputs the named [serial dialog](../serial_dialogs) to a connected serial console.

The `concat` variant omits the newline at the end of each message, which can enable complex serial output using only MGE scripting logic. (Turn off [serial control](../actions/SET_SERIAL_DIALOG_CONTROL) first, then turn it back on again when finished.)

This action is also available as a [combination block](../mgs/combination_block): [show serial dialog block](../mgs/serial_dialog_block#show-serial-dialog-block).

## Example JSON

```json
{
  "action": "SHOW_SERIAL_DIALOG",
  "disable_newline": false,
  "serial_dialog": "serialDialogName"
}
```

## MGS Natlang

### Examples

```mgs
script {
  concat serial dialog serialDialogName;
  show serial dialog serialDialogName;
}
```

### Dictionary entries

```
concat serial dialog $serial_dialog:string (;)
	// built-in value: disable_newline = true

show serial dialog $serial_dialog:string (;)
	// built-in value: disable_newline = false
```
