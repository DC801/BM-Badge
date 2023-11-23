# Dialogs (JSON)

NOTE: With the introduction of [[MGS Natlang]], you need not write [[dialogs]] with JSON, but it still may be useful to understand the JSON structure for debugging purposes. See: [[Dialogs (MGS)]]

## Behavior

Dialogs do nothing on their own. To show them, you must use the [[SHOW_DIALOG]] action within a [[scripts|script]].

## Format

Easiest might be to copy an existing dialog file and make changes to it, particularly if you're not familiar with JSON.

A simplified explanation:

```json
{
  "dialog-sample1" : [],
  "dialog-sample2" : [],
  "dialog-another-one" : []
}
```

At the top level of the dialog file is an object literal (indicated by curly braces) which contains several **name-value** pairs separated by commas. (Note that the last name-value pair does not end with a comma because it is the last in the list.)

In this case, the **name** (a string, wrapped in double quotes) is the name of the dialog for `SHOW_DIALOG` to use, and the **value** is an array (marked by square brackets) containing the dialog data. The dialog name must be unique across all dialog files in the entire game.

Within the square brackets above can be any number of object literals (marked with curly braces), each containing a number of name-value pairs for the dialog message and its properties. To expand one of the sample dialogs:

```json
"dialog-sample1": [
  {
    "alignment": "BOTTOM_RIGHT",
    "entity": "%PLAYER%",
    "messages": []
  },
  {
    "alignment": "BOTTOM_LEFT",
    "entity": "Sample Entity",
    "messages": []
  }
]
```

In the example above, there are three dialog properties: `alignment`, `entity`, and `messages`. There are additional or alternate properties you might use, but these three are a reasonable minimum. (See: [[Dialog Properties]])

The property `messages` is an array containing the strings for the messages themselves (up to 255 total). Multiple messages within the array will be shown on subsequent dialog boxes, so you don't need a whole new object literal unless something else about the properties must change, such as a different character beginning to speak.

```json
{
  "messages": [
    "What's for dinner?",
    "Memory leek soup!",
    "....",
    "...Nah, just kidding. It's saag paneer."
  ]
}
```

Remember to wrap messages in double quotes and to separate them with commas.
