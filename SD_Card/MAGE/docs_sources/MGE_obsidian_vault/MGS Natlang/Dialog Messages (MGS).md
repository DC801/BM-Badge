# Dialog Messages (MGS)

NOTE: This syntax is used for [[MGS Natlang]] [[Dialogs (MGS)|dialogs]], not [[Dialogs (JSON)|JSON dialogs]].

A dialog message is any [[quoted string]].

- Each message is a new "text screen" in the game.
- Only ASCII characters will be printed.
- Insert an entity's [[Printing Current Values|current name]] by wrapping their given name in `%`s.
	- [[%PLAYER%]] and [[%SELF%]] are also allowed, which target the player entity or the entity that is running the script, respectively.
	- Words wrapped in `%`s will count as 12 chars when the dialog message is auto-wrapped.
- Insert the current value of a MGE variable by wrapping its name in `$`s.
	- Words wrapped in `$`s will count as 5 chars when the dialog message is auto-wrapped.
- Some characters must be escaped in the message body, such as double quote (`\"`) (for messages wrapped in double quotes).
	- `\t` (tabs) are auto-converted to four spaces.
	- `\n` (new lines) are honored, but since text is wrapped automatically, don't worry about hard wrapping your messages unless you want to put line breaks in arbitrary places.
	- `%` and `$` are printable characters unless [[Printing Current Values|used in pairs]] within a single line, in which case the only way to print them is to escape them (e.g. `\%`).
- Word processor "smart" characters such as ellipses (…), em dashes (—), and smart quotes (“”) are auto converted to ASCII equivalents (`...`) (`--`) (`"`).

## Example

See: [[Dialog Example (MGS)]]
