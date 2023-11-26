# Dialog Identifier

NOTE: This syntax is used for [MGS Natlang](../mgs/mgs_natlang) [dialogs](../mgs/dialogs_mgs), not [JSON dialogs](../dialogs/dialogs_json).

The **dialog identifier** identifies the "speaker" of the [Dialog Messages (MGS)](../mgs/dialog_messages_mgs) that immediately follow. For most cases, this will be a specific entity (with option #1 or #2), though you could also build up a dialog from its component pieces instead (with option #3).

The three options:

1. `$bareword`
	- The [bareword](../mgs/variables/bareword) identifier refers to a dialog label within a [dialog settings block](../mgs/dialog_settings_block).
		- If no dialog label is found, this is assumed to be an entity name instead. This usage also provides the entity name as an `entity` [parameter](../mgs/dialog_parameters_mgs) for the dialog.
		- Entity names with spaces or other special characters are not eligible for this usage.
	- REMINDER: A [quoted string](../mgs/variables/quoted_string) is NOT allowed here! This string *must* be a [bareword](../mgs/variables/bareword)!
2. `entity $string`
	- [String](../mgs/variables/string): an entity's given name (i.e. the entity's name within the Tiled map).
	- This usage also provides the entity name as an `entity` [parameter](../mgs/dialog_parameters_mgs) for the dialog.
	- The entities [%PLAYER%](../entities/PLAYER) and [%SELF%](../entities/SELF) must use this pattern (and not the bareword pattern) because they contain special characters. As this can be cumbersome, it's probably best to set up a [dialog settings](../mgs/dialog_settings_target_block) label for them so you can use a bareword as an identifier instead.
3. `name $string`
	- [String](../mgs/variables/string): the dialog's display name.
	- This usage also provides a `name` [parameter](../mgs/dialog_parameters_mgs) for the dialog.
	- If you don't want a name displayed, use an empty quoted string (`name ""`).

## Example

See: [Dialog Example (MGS)](../mgs/dialog_example_mgs)
