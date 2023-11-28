# Dialog Options (MGS)

```mgs{8-9}
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

Syntax:

```
> $label:quotedString : (goto) (script) $script:string
```

- You may have up to 4 dialog options per [dialog](../mgs/dialogs_mgs).
- As each of these "branches" results in a script jump, no dialog messages afterward will be seen. Therefore, dialog options must come last within the dialog.
- The **label** is the text that will be shown to the player. As the cursor (approximated with `>`) takes up some room, assume you will only have 39 characters instead of the usual 42.
	- The label behaves like [dialog messages](../mgs/dialog_messages_mgs) in terms of inserting variables (with `$` or `%`), escaped characters, etc.
	- **Must** be wrapped in [quotes](../mgs/variables_mgs#quoted-string).
- In the MGE, dialog options are displayed underneath the final dialog message. Therefore, final dialog message (before any options) should consist of a single line of no more than 42 characters.
- The words `goto` and `script` are optional. Any [string](../mgs/variables_mgs#string) given after the `:` (other than `goto` and `script`) is assumed to be the script name.