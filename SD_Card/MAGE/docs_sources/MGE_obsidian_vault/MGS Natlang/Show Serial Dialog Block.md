# Show Serial Dialog Block

A [[Combination Block|combination]] of the action [[SHOW_SERIAL_DIALOG]] and a [[Serial Dialog Block]]:

```
show serial dialog $string {}
// or
show serial dialog {}
```

Inside the curly braces may be any number of [[Serial Dialogs (MGS)]].

This block can be defined with or without a serial dialog name (whatever is given for [[String]]). Providing a name means other scripts are able to refer to that serial dialog, too, but this is rarely necessary. (When converting JSON files into [[MGS Natlang]], the dialog names are preserved.) When a serial dialog name isn't given, [[MGS Natlang]] generates one based on the file name and line number.

Both patterns are valid anywhere [[actions]] are allowed (i.e. inside [[script block|script blocks]]).

```mgs
exampleScript {
	show serial dialog {
		"Bootup sequence completed!"
	}
}
```
