# Dialog Block

To define an [MGS Natlang](../mgs/mgs_natlang) [dialog](../dialogs), start a new [block](../mgs/block) at the root level:

```
dialog $dialogName:string {}
```

As these dialog blocks aren't being defined inside a [script body](../mgs/script_block), a dialog name is required. (The name is whatever is given for [string](../mgs/variables/string).)

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

## Combination Block

You can [combine](../mgs/combination_block) these two usages into one with a [show dialog block](../mgs/show_dialog_block):

```mgs
exampleScript {
  show dialog {
    Bob "Hi there! I'm speaking to you!"
  }
}
```
