# Dialog Block

To define an [[MGS Natlang]] [[dialogs|dialog]], start a new [[Block|block]] at the root level:

```mgs
dialog $string {}
```

As these dialog blocks aren't being defined inside a [[Script Block|script body]], a dialog name is required. (The name is whatever is given for [[String]].)

Inside the curly braces may be any number of [[Dialogs (MGS)|dialogs]].

The pair to the above usage is the action [[SHOW_DIALOG]]:

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

However, to [[Combination Block|combine]] these two usages into one, you'll want to use a [[show dialog block]]:

```mgs
exampleScript {
  show dialog {
    Bob "Hi there! I'm speaking to you!"
  };
}
```
