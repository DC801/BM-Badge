# Serial Dialog Block

To define an [[MGS Natlang]] [[serial dialogs|serial dialog]], start a new [[Block|block]] at the root level:

```mgs
serial dialog $string {}
```

Similar to [[dialog block|dialog blocks]], serial dialog blocks allow you to name and populate a serial dialog. Serial dialogs are shown in the serial console instead of the badge's physical screen.

These blocks aren't being defined inside a  [[Script Block|script body]], so a serial dialog name is required. (The name is whatever is given for [[String]].)

Inside the curly braces may be any number of [[Serial Dialogs (MGS)]].

The pair to the above usage is the action [[SHOW_SERIAL_DIALOG]]:

```mgs
serial dialog bootTalk {
  "Bootup sequence completed!"
}
exampleScript {
  show serial dialog bootTalk;
}
```

This usage is comparable to what is done with raw JSON.

## Combination Block

However, to [[Combination Block|combine]] these two usages into one, you'll want to use a [[show serial dialog block]]:

```mgs
exampleScript {
  show serial dialog {
    "Bootup sequence completed!"
  };
}
```
