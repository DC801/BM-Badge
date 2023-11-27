# Serial Dialogs (MGS)

(For the JSON equivalent, see [Serial Dialogs (JSON)](../dialogs/serial_dialogs_json))

The [serial dialog](../dialogs/serial_dialogs) structure for [MGS Natlang](../mgs/mgs_natlang), found within [serial dialog blocks](../mgs/serial_dialog_block) (and related [combination blocks](../mgs/combination_block)).

Serial dialogs contain text meant to be shown via the serial console ([terminal](../terminal.md)). They are called serial "dialogs" because they are similar to [dialogs](../dialogs) in many respects, but they are made up of messages alone and needn't be used for dialog specifically.

## Structure

1. [Serial dialog parameter](../mgs/serial_dialog_parameters_mgs): 0+
2. [Serial dialog message](../mgs/serial_dialog_messages_mgs): 1+
3. [Serial dialog option](../mgs/serial_dialog_options_mgs): 0+

NOTE: unlike with conventional [dialogs](../dialogs), serial dialog blocks cannot contain more than one serial dialog. In other words, inside a serial dialog block, no parameters can be given after a serial message, and nothing can come after a serial option (except more options).

## Example

An example [MGS Natlang](../mgs/mgs_natlang) [serial dialog block](../mgs/serial_dialog_block):

```mgs
serial dialog sample {
  wrap messages to 60
  "Hey, can anyone hear me? Hello?"
  # "Yes, I can hear you." : goto script sampleYes
  # "What did you say?" : goto script sampleNo
}
```

becomes:

```
Hey, can anyone hear me? Hello?
    0: Yes, I can hear you.
    1: What did you say?

>_
```

In the above case, the player is locked out of further action until they give the answer `0` or `1`. Failure results in a repeat of the whole serial dialog.
