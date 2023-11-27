# Show Serial Dialog Block

A [combination](../mgs/combination_block) of the action [SHOW_SERIAL_DIALOG](../actions/SHOW_SERIAL_DIALOG) and a [serial dialog block](../mgs/serial_dialog_block):

```
show serial dialog $serialDialogName:string {}
// or
show serial dialog {}
```

Inside the curly braces may be any number of [serial dialog](../mgs/serial_dialogs_mgs).

This block can be defined with or without a serial dialog name (whatever is given for [string](../mgs/variables/string)). Providing a name means other scripts are able to refer to that serial dialog, too, but this is rarely necessary. When a serial dialog name isn't given, one is generated based on the file name and line number.

Both patterns are valid anywhere [actions](../actions) are allowed (i.e. inside [script blocks](../mgs/script_block)).

```mgs
exampleScript {
  show serial dialog {
    "Bootup sequence completed!"
  }
}
```
