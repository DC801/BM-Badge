# Combination Blocks

Inside an [[MGS Natlang]] [[script block]], some [[actions]] can be **combined** with their associated definition [[Block|block]]. In other words, you can "call" a [[dialogs|dialog]] or [[serial dialogs|serial dialog]] and define it in place.

For combination blocks of all types, a dialog name ([[String]] is optional. Omitting dialog names is recommended to keep things clean.

Blocks that can be combined:

- [[SHOW_DIALOG]] + [[Dialog Block]] = [[Show Dialog Block]]
- [[SHOW_SERIAL_DIALOG]] + [[Serial Dialog Block]] = [[Show Serial Dialog Block]]

#verifyme -- what about `concat serial dialog` and `set serial connect message`? Do they have combination blocks, too?
