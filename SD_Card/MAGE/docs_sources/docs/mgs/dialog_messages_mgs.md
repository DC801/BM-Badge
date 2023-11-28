# Dialog Messages (MGS)

A dialog message is any [quoted string](../mgs/variables_mgs#quoted-string).

```mgs{5-7}
dialog sampleDialog {
  SELF
  alignment BOTTOM_RIGHT
  emote 3
  "Messages..."
  "So many messages!"
  "Don't you think?"
  > "Not really." : goto script sampleScript1
  > "Definitely." : goto script sampleScript2
}
```

- Each message is a new "text screen" in the game.
- Only ASCII characters will be printed.
- Insert an entity's [current name](../variables#printing-current-values)) by wrapping their given name in `%`s.
	- [`%PLAYER%`](../relative_references#player) and [`%SELF%`](../relative_references#self) are also allowed, which target the player entity or the entity that is running the script, respectively.
	- Words wrapped in `%`s will count as 12 chars when the dialog message is auto-wrapped.
- Insert the current value of a MGE variable by wrapping its name in `$`s.
	- Words wrapped in `$`s will count as 5 chars when the dialog message is auto-wrapped.
- Some characters must be escaped in the message body, such as double quote (`\"`) (for messages wrapped in double quotes).
	- `\t` (tabs) are auto-converted to four spaces.
	- `\n` (new lines) are honored, but since text is wrapped automatically, don't worry about hard wrapping your messages unless you want to put line breaks in arbitrary places.
	- `%` and `$` are printable characters unless [used in pairs](../variables#printing-current-values)) within a single line, in which case the only way to print them is to escape them (e.g. `\%`).
- Word processor "smart" characters such as ellipses (…), em dashes (—), and smart quotes (“”) are auto converted to ASCII equivalents (`...`) (`--`) (`"`).
