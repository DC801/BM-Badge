# SHOW_DIALOG

Plays the named [dialog](../dialogs).

While a dialog screen is showing, the player can only advance to the next dialog message or choose a multiple choice option within that dialog (if any); the player cannot hack, interact with another [entity](../entities), move, etc.

This action is also available as a [combination block](../mgs/combination_block): [show dialog block](../mgs/dialog_block#show-dialog-block).

A script can close an open dialog with [CLOSE_DIALOG](../actions/CLOSE_DIALOG).

## Example JSON

```json
{
  "action": "SHOW_DIALOG",
  "dialog": "dialogName"
}
```

## MGS Natlang

### Example

```mgs
script {
  show dialog dialogName;
}
```

### Dictionary entry

```
show dialog $dialog:string (;)
```
