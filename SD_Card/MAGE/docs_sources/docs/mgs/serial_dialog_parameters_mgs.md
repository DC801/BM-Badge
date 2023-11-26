# Serial Dialog Parameters (MGS)

NOTE: This syntax is used for [MGS Natlang](../mgs/mgs_natlang) [serial dialogs](../mgs/serial_dialogs_mgs), not [JSON serial dialogs](../dialogs/serial_dialogs_json).

Serial dialog parameters are a [serial dialog property](../dialogs/serial_dialog_properties) and value pair. Multiple serial dialog parameters can occur back-to-back in a single [MGS Natlang serial dialog](../mgs/serial_dialogs_mgs) or a [serial dialog settings block](../mgs/serial_dialog_settings_block).

- `wrap (messages) (to) $number`.
	- [Number](../mgs/variables/number): the number of chars to auto wrap the contents of serial dialog messages.
	- 80 is default.

(Yeah, there's only one for the moment!)

## Example

See: [Serial Dialog Example (MGS)](../mgs/serial_dialog_example_mgs)
