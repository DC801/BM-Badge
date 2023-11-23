# Show Dialog Block

A [[Combination Block|combination]] of the action [[SHOW_DIALOG]] and a [[Dialog Block]]:

```
show dialog $string {}
// or
show dialog {}
```

Inside the curly braces may be any number of [[Dialogs (MGS)|dialogs]].

This block can be defined with or without a dialog name (whatever is given for [[String]]). Providing a name means other scripts are able to refer to that dialog, too, but this is rarely necessary. (When converting JSON files into [[MGS Natlang]], the dialog names are preserved.) When a dialog name isn't given, [[MGS Natlang]] generates one based on the file name and line number.

Both patterns are valid anywhere [[actions]] are allowed (i.e. inside [[script block|script blocks]]).

```mgs
exampleScript {
	show dialog {
		Bob "Hi there! I'm speaking to you!"
	}
}
```
