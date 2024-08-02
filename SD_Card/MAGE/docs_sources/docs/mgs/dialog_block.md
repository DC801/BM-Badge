# Dialog Block

To define an [MGS Natlang dialog](../dialogs_mgs), start a new [block](../mgs/blocks) at the root level:

```
dialog $dialogName:string {}
```

As these dialog blocks aren't being defined inside a [script body](../mgs/script_block), a dialog name is required. (The name is whatever is given for [string](../mgs/variables_mgs#string).)

Inside the curly braces may be any number of [dialogs](../mgs/dialogs_mgs). For example:

```mgs
dialog bobTalk {
  Bob "Hi there! I'm speaking to you!"
}
```

The pair to the above usage is the action [SHOW_DIALOG](../actions/SHOW_DIALOG):

```mgs
exampleScript {
  show dialog bobTalk;
}
```

Defining the dialog externally and "calling" it within a script by name is comparable to what has to be done with game files in raw JSON.

## Show Dialog Block

A [combination](../mgs/blocks#combination-blocks) of the action [SHOW_DIALOG](../actions/SHOW_DIALOG) and a [dialog block](../mgs/dialog_block):

```
show dialog $dialogName:string {}
// or
show dialog {}
```

Inside the curly braces may be any number of [dialogs](../mgs/dialogs_mgs).

This block can be defined with or without a dialog name (whatever is given for [string](../mgs/variables_mgs#string)). Providing a name means other scripts are able to refer to that dialog, too, but this is rarely necessary. When a dialog name isn't given, one will be generated one based on the file name and line number.

Both patterns are valid anywhere [actions](../actions) are allowed (i.e. inside [script blocks](../mgs/script_block)).

```mgs
exampleScript {
  show dialog {
    Bob "Hi there! I'm speaking to you!"
  }
}
```
