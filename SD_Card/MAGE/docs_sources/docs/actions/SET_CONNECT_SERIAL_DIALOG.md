# SET_CONNECT_SERIAL_DIALOG

Sets the serial connection message to the named [serial dialog](../dialogs/serial_dialogs). (The connection message is sent whenever a serial console is newly connected to the badge hardware.)

This action is also available as a [combination block](../mgs/combination_block).

## Example JSON

```json
{
  "action": "SET_CONNECT_SERIAL_DIALOG",
  "serial_dialog": "serialDialogName"
}
```

## MGS Natlang

### Example

```mgs
script {
  set serial connect message to serialDialogName;
}
```

### Dictionary entry

```
set serial connect (message) (to) $serial_dialog:string (;)
```

---

Back to [Actions](../actions)
