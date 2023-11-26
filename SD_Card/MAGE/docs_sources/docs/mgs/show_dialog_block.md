# Show Dialog Block

A [combination](../mgs/combination_block) of the action [SHOW_DIALOG](../actions/SHOW_DIALOG) and a [dialog block](../mgs/dialog_block):

```mgs
script {
  show dialog $string {}
  // or
  show dialog {}
}
```

Inside the curly braces may be any number of [dialogs](../mgs/dialogs_mgs).

This block can be defined with or without a dialog name (whatever is given for [string](../mgs/variables/string)). Providing a name means other scripts are able to refer to that dialog, too, but this is rarely necessary. (When converting JSON files into [MGS Natlang](../mgs/mgs_natlang), the dialog names are preserved.) When a dialog name isn't given, one will be generated one based on the file name and line number.

Both patterns are valid anywhere [actions](../actions) are allowed (i.e. inside [script blocks](../mgs/script_block)).

```mgs
exampleScript {
  show dialog {
    Bob "Hi there! I'm speaking to you!"
  }
}
```
