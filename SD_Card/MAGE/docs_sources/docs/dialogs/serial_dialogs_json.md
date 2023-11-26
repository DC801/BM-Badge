# Serial Dialogs (JSON)

NOTE: With the introduction of [MGS Natlang](../mgs/mgs_natlang), you need not write [serial dialogs](../dialogs/serial_dialogs) with JSON, but it still may be useful to understand the JSON structure for debugging purposes. See: [Serial Dialogs (MGS)](../mgs/serial_dialogs_mgs)

## Behavior

Dialogs do nothing on their own. To show them, you must use the [SHOW_SERIAL_DIALOG](../actions/SHOW_SERIAL_DIALOG) action within a [script](../scripts).

## Format

```json
{
  "serialDialog1": {
    "messages": [
      "Hi there!",
      "Each new message",
      "gets printed on a",
      "new line."
    ]
  },
  "serialDialog2": {
    "messages": [
      "THIS IS REALLY STRAIGHTFORWARD"
    ]
  }
}
```

The only default property on serial dialog messages is `messages`, an array of one or more strings.

These strings are not hard wrapped by default.
