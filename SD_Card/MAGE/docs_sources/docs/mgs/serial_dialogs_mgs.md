# Serial Dialogs (MGS)

(For the JSON equivalent, see [Serial Dialogs (JSON)](dialogs/serial_dialogs_json))

The [serial dialog](dialogs/serial_dialogs) structure for [MGS Natlang](mgs/mgs_natlang), found within [serial dialog blocks](mgs/serial_dialog_block) (and related [combination blocks](mgs/combination_block)).

Serial dialogs contain text meant to be shown via the serial console ([terminal](hardware/terminal)). They are called serial "dialogs" because they are similar to [dialogs](dialogs) in many respects, but they are made up of messages alone and needn't be used for dialog specifically.

## Structure

1. [Serial dialog parameter](mgs/serial_dialog_parameters_mgs): 0+
2. [Serial dialog message](mgs/serial_dialog_messages_mgs): 1+
3. [Serial dialog option](mgs/serial_dialog_options_mgs): 0+

NOTE: unlike with conventional [dialogs](#dialog), serial dialog blocks cannot contain more than one serial dialog. In other words, inside a serial dialog block, no parameters can be given after a serial message, and nothing can come after a serial option (except more options).

See: [Serial Dialog Block](mgs/serial_dialog_block)
