# Serial Dialog Parameters (MGS)

```mgs{2}
serial dialog sample {
  wrap messages to 60
  "Hey, can anyone hear me? Hello?"
  # "Yes, I can hear you." : goto script sampleYes
  # "What did you say?" : goto script sampleNo
}
```

Serial dialog parameters are a [serial dialog property](../serial_dialogs#properties) and value pair. Multiple serial dialog parameters can occur back-to-back in a single [MGS Natlang serial dialog](../mgs/serial_dialogs_mgs) or a [serial dialog settings block](../mgs/serial_dialog_settings_block).

- `wrap (messages) (to) $number`.
	- [Number](../mgs/variables_mgs#number): the number of chars to auto wrap the contents of serial dialog messages.
	- 80 is default.

```mgs{2}
serial dialog settings {
  wrap messages to 60
}
```

(Yeah, there's only one for the moment!)