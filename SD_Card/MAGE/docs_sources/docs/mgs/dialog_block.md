# Dialog Block

To define an [MGS Natlang](../mgs/mgs_natlang) [dialog](../dialogs), start a new [block](../mgs/block) at the root level:

```mgs
script {
  show dialog $string {}
}
```

As these dialog blocks aren't being defined inside a [script body](../mgs/script_block), a dialog name is required. (The name is whatever is given for [string](../mgs/variables/string).)

Inside the curly braces may be any number of [dialogs](../mgs/dialogs_mgs).

The pair to the above usage is the action [SHOW_DIALOG](../actions/SHOW_DIALOG):

```mgs
dialog bobTalk {
  Bob "Hi there! I'm speaking to you!"
}
exampleScript {
  show dialog bobTalk;
}
```

This usage is comparable to what is done with raw JSON.

## Combination Block

However, to [combine](../mgs/combination_block) these two usages into one, you'll want to use a [show dialog block](../mgs/show_dialog_block):

```mgs
exampleScript {
  show dialog {
    Bob "Hi there! I'm speaking to you!"
  }
}
```
