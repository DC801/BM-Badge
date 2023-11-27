# Serial Dialog Block

To define an [MGS Natlang](../mgs/mgs_natlang) [serial dialog](../dialogs/serial_dialogs), start a new [block](../mgs/block) at the root level:

```
serial dialog $string {}
```

Similar to [dialog blocks](../mgs/dialog_block), serial dialog blocks allow you to name and populate a serial dialog. Serial dialogs are shown in the serial console instead of the badge's physical screen.

These blocks aren't being defined inside a  [script body](../mgs/script_block), so a serial dialog name is required. (The name is whatever is given for [string](../mgs/variables/string).)

Inside the curly braces may be any number of [serial dialogs](../mgs/serial_dialogs_mgs). For example:

```mgs
serial dialog bootupTalk {
  "Bootup sequence completed!"
}
```

The pair to the above usage is the action [SHOW_SERIAL_DIALOG](../actions/SHOW_SERIAL_DIALOG):

```mgs
exampleScript {
  show serial dialog bootupTalk;
}
```

Defining the serial dialog externally and "calling" it within a script by name is comparable to what has to be done with game files in raw JSON.

## Combination Block

You can [combine](../mgs/combination_block) these two usages into one with a [show serial dialog block](../mgs/show_serial_dialog_block):

```mgs
exampleScript {
  show serial dialog {
    "Bootup sequence completed!"
  }
}
```
