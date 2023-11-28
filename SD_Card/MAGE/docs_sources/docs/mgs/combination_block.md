# Combination Blocks

Inside an [MGS Natlang](../mgs/mgs_natlang) [script block](../mgs/script_block), some [actions](../actions) can be **combined** with their associated definition [block](../mgs/block). In other words, you can "call" a [dialog](../dialogs) or [serial dialog](../serial_dialogs) and define it in place.

For combination blocks of all types, a dialog name ([string](../mgs/variables_mgs#string)) is optional. Omitting dialog names is recommended to keep things clean.

Blocks that can be combined:

- [SHOW_DIALOG](../actions/SHOW_DIALOG) + [Dialog Block](../mgs/dialog_block) = [Show Dialog Block](../mgs/show_dialog_block)
- [SHOW_SERIAL_DIALOG](../actions/SHOW_SERIAL_DIALOG) + [Serial Dialog Block](../mgs/serial_dialog_block) = [Show Serial Dialog Block](../mgs/show_serial_dialog_block)

#verifyme -- what about `concat serial dialog` and `set serial connect message`? Do they have combination blocks, too?
