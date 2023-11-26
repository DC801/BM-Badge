# Multiple Choice Dialogs (JSON)

For the [MGS Natlang](../mgs/mgs_natlang) equivalent, see [Dialog Options (MGS)](../mgs/dialog_options_mgs).

For a multiple choice prompt in a [dialog](../dialogs/dialogs_json), there are additional dialog properties. An example:

```json
{
  "messages": [
    "Would you like to save the game?"
  ],
  "response_type": "SELECT_FROM_SHORT_LIST",
  "options": [
    {
      "label": "Yes",
      "script": "save_game-yes"
    },
    {
      "label": "No",
      "script": "save_game-no"
    }
  ]
}
```

Since there are five rows within the dialog box, you can have up to four `options`. But also take into account how many lines the string in `messages` is.

**`response_type`** — Currently only `SELECT_FROM_SHORT_LIST` is implemented.

**`label`** — How the multiple choice option appears within the game. Normally there is room for 42 characters per line, but since the select cursor takes up a few columns of space, you should instead plan on no more than 39 characters for each of these.

**`script`** — This is the name of the [script](../scripts) that runs if the player chooses that option.
