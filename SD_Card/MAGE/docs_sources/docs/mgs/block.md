# Block

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
		- *([Dialog Parameters](../mgs/dialog_parameters_mgs))*
- [Serial Dialog Settings Block](../mgs/serial_dialog_settings_block): `settings (for) serial dialog {}`
	- *([Serial Dialog Parameters](../mgs/serial_dialog_parameters_mgs))*
- [Dialog Block](../mgs/dialog_block): `dialog $string {}`
	- *([Dialogs](../mgs/dialogs_mgs))*
- [Serial Dialog Block](../mgs/serial_dialog_block): `serial dialog $string {}`
	- *([Serial Dialogs](../mgs/serial_dialogs_mgs))*
- [Script Block](../mgs/script_block): `$string {}`
	- [Combination Block](../mgs/combination_block)
	- *([Actions](../Actions))*
	- *([Labels](../mgs/advanced_syntax#labels))*

([Macros](../mgs/advanced_syntax#macros) are not included in the list above.)
