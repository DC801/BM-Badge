# Blocks

A basic unit of [MGS Natlang structure](../mgs/mgs_natlang_structure).

The contents (body) of each [MGS Natlang](../mgs/mgs_natlang) block is enclosed in a pair of matching curly braces:

```
BLOCK DECLARATION { BLOCK BODY }
```

Some block types can (or must) be nested within others. Note that blocks cannot be nested arbitrarily.

## Block Types

The following list includes all block nesting relationships.

Indented entries can only be used within the parent's block body. Unindented entries occur at the document root level. Items in parentheses are not blocks themselves, but are used only inside their parent block's contents.

- [Dialog Settings Block](../mgs/dialog_settings_block): `settings (for) dialog {}`
	- [Dialog Settings Target Block](../mgs/dialog_settings_target_block): `<TARGET> {}`
		- *([Dialog Parameters](../mgs/dialogs_mgs#dialog-parameters))*
- [Serial Dialog Settings Block](../mgs/serial_dialog_settings_block): `settings (for) serial dialog {}`
	- *([Serial Dialog Parameters](../mgs/serial_dialogs_mgs#serial-dialog-parameters))*
- [Dialog Block](../mgs/dialog_block): `dialog $string {}`
	- *([Dialogs](../mgs/dialogs_mgs))*
- [Serial Dialog Block](../mgs/serial_dialog_block): `serial dialog $string {}`
	- *([Serial Dialogs](../mgs/serial_dialogs_mgs))*
- [Script Block](../mgs/script_block): `$string {}`
	- [Combination Block](#combination-blocks)
	- *([Actions](../actions))*
	- *([Labels](../mgs/advanced_syntax#labels))*

([Macros](../mgs/advanced_syntax#macros) are not included in the list above.)

## Combination Blocks

Inside an [MGS Natlang](../mgs/mgs_natlang) [script block](../mgs/script_block), some [actions](../actions) can be **combined** with their associated definition [block](../mgs/blocks). In other words, you can "call" a [dialog](../dialogs) or [serial dialog](../serial_dialogs) and define it in place.

For combination blocks of all types, a dialog name ([string](../mgs/variables_mgs#string)) is optional. Omitting dialog names is recommended to keep things clean.

Blocks that can be combined:

- [SHOW_DIALOG](../actions/SHOW_DIALOG) + [Dialog Block](../mgs/dialog_block) = [Show Dialog Block](../mgs/dialog_block#show-dialog-block)
- [SHOW_SERIAL_DIALOG](../actions/SHOW_SERIAL_DIALOG) + [Serial Dialog Block](../mgs/serial_dialog_block) = [Show Serial Dialog Block](../mgs/serial_dialog_block#show-serial-dialog-block)

#verifyme -- what about `concat serial dialog` and `set serial connect message`? Do they have combination blocks, too?
