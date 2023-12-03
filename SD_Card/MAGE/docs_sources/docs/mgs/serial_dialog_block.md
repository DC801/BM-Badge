---
next: variables_mgs.md
---

# Serial Dialog Block

To define an [MGS Natlang](../mgs/mgs_natlang) [serial dialog](../serial_dialogs), start a new [block](../mgs/blocks) at the root level:

```
serial dialog $string {}
```

Similar to [dialog blocks](../mgs/dialog_block), serial dialog blocks allow you to name and populate a serial dialog. Serial dialogs are shown in the serial console instead of the badge's physical screen.

These blocks aren't being defined inside a [script body](../mgs/script_block), so a serial dialog name is required. (The name is whatever is given for [string](../mgs/variables_mgs#string).)

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

## Show Serial Dialog Block

A [combination](../mgs/blocks#combination-blocks) of the action [SHOW_SERIAL_DIALOG](../actions/SHOW_SERIAL_DIALOG) and a serial dialog block:

```
show serial dialog $serialDialogName:string {}
// or
show serial dialog {}
```

Inside the curly braces may be any number of [serial dialogs](../mgs/serial_dialogs_mgs).

This block can be defined with or without a serial dialog name (whatever is given for [string](../mgs/variables_mgs#string)). When a serial dialog name isn't given, one is generated based on the file name and line number. (Providing a name means other scripts are able to refer to that serial dialog, too, but this is rarely necessary.)

Both patterns are valid anywhere [actions](../actions) are allowed (i.e. inside [script blocks](../mgs/script_block)).

```mgs
exampleScript {
  show serial dialog {
    "Bootup sequence completed!"
  }
}
```
