# Serial Dialog Settings Block

One of the root level [blocks](../mgs/block) in [MGS Natlang](../mgs/mgs_natlang).

```mgs
settings for serial dialog {}
//or
settings serial dialog {}
```

Use these blocks to set global settings for [serial dialogs](../mgs/serial_dialogs_mgs).

**Block contents**: any number of [serial dialog parameters](../mgs/serial_dialog_parameters_mgs) ([serial dialog property](../dialogs/serial_dialog_properties) and value pairs) in any order. For example:

```mgs
settings for serial dialog {
  wrap messages to 80
}
```

## Behavior

Serial dialog settings are applied to serial dialogs in order as the parser encounters them; a serial dialog settings block partway down the file will affect only the serial dialogs afterward, and none before.

Parameters given in a serial dialog's body will override any other settings, however.

Settings only apply to multiple files with the use of [`include!()`](advanced_syntax#include).
