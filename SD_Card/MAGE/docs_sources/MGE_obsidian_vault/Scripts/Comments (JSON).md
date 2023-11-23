# Comments (JSON)

If a JSON property isn't used by an [[actions|action]], it will be entirely ignored by the [[MGE Encoder]]. This is the only way documentation or notes can be written in JSON script files, since JSON doesn't support comments.

Below is an example, where `"summary"` and `"to do"` are being used for the script writer's notes:

```json
"show_dialog-example": [
  {
    "name": "SHOW_DIALOG",
    "dialog": "dialog-example-start",
    "summary": "Oh, hi player! This is an example dialog summary!"
  },
  {
    "name": "SET_ENTITY_INTERACT_SCRIPT",
    "entity": "%SELF%",
    "script": "show_dialog-example-end",
    "to do": "redo with save flags so the branching persists"
  }
]
```

Putting a small segment of dialog (enough to identify it) with each [[SHOW_DIALOG]] segment makes it *dramatically* easier to manage them.
