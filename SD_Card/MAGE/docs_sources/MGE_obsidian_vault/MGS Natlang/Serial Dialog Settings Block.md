# Serial Dialog Settings Block

One of the root level [[Block|blocks]] in [[MGS Natlang]].

```mgs
settings (for) serial dialog {}
```

Use these blocks to set global settings for [[Serial Dialogs (MGS)]].

**Block contents**: any number of [[Serial Dialog Parameters (MGS)|serial dialog parameters]] ([[serial dialog properties|serial dialog property]] and value pairs) in any order.

## Behavior

Serial dialog settings are applied to serial dialogs in order as the parser encounters them; a serial dialog settings block partway down the file will affect only the serial dialogs afterward, and none before.

Parameters given in a serial dialog's body will override any other settings, however.
