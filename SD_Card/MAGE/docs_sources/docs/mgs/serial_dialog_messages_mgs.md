# Serial Dialog Messages (MGS)

NOTE: This syntax is used for [MGS Natlang](mgs/mgs_natlang) [serial dialogs](mgs/serial_dialogs_mgs), not [JSON serial dialogs](dialogs/serial_dialogs_json).

A serial dialog message is any [quoted string](mgs/variables/quoted_string).

- To maximize compatibility, best to limit these to ASCII characters.
- Each message is printed on its own line.
- Some characters must be escaped in the message body, such as double quote (`\"`) (depending on the quotes you're using to wrap these).
	- `\t` (tabs) are auto-converted to four spaces.
	- `\n` (new lines) are honored, but since text is wrapped automatically, don't worry about hard wrapping your messages unless you want to put line breaks in arbitrary places.
- Word processor "smart" characters such as ellipses (…), emdashes (—), and smart quotes (“”) are auto converted to ASCII equivalents (`...`) (`--`) (`"`).
- These messages may be given ANSI [styles](mgs/serial_styles). Use the built-in styling syntax for best results.

## Example

See: [Serial Dialog Example (MGS)](mgs/serial_dialog_example_mgs)
