# Dialog Options (MGS)

NOTE: This syntax is used for [[MGS Natlang]] [[Dialogs (MGS)|dialogs]], not [[Dialogs (JSON)|JSON dialogs]].

```
> $label:quotedString : (goto) (script) $script:string
```

- You may have up to 4 dialog options per [[Dialogs (MGS)|dialog]].
- As each of these "branches" results in a script jump, no dialog messages afterward will be seen. Therefore, dialog options must come last within the dialog.
- The **label** is the text that will be shown to the player. As the cursor (approximated with `>`) takes up some room, assume you will only have 39 characters instead of the usual 42.
	- The label behaves like [[Dialog Messages (MGS)|dialog messages]] in terms of inserting variables (with `$` or `%`), escaped characters, etc.
	- **Must** be wrapped in [[Quoted String|quotes]].
- In the MGE, dialog options are displayed underneath the final dialog message. Therefore, final dialog message (before any options) should consist of a single line of no more than 42 characters.
- The words `goto` and `script` are optional. Any [[String]] given after the `:` (other than `goto` and `script`) is assumed to be the script name.

## Example

See: [[Dialog Example (MGS)]]