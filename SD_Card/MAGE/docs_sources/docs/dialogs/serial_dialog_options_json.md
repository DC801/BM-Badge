# Serial Dialog Options (JSON)

For the [MGS Natlang](mgs/mgs_natlang) equivalent, see [Serial Dialog Options (MGS)](mgs/serial_dialog_options_mgs).

## Multiple Choice

In the [entry for a serial dialog](dialogs/serial_dialogs_json), you can include a second property named `options`.

```json
{
  "serialDialog": {
    "messages": [ "What's your name?" ],
    "options": [
      {
        "label": "I'm not telling you!",
        "script": "refusalScript"
      },
      {
        "label": "Wait. Tell me yours first.",
        "script": "rebuttalScript"
      },
      {
        "label": "Oh sure. My name is %PLAYER%.",
        "script": "acceptanceScript"
      }
    ]
  }
}
```

These will appear in the [terminal](hardware/terminal) as numbered options.

```
What's your name?

    0: I'm not telling you!
    1: Wait. Tell me yours first.
    2: Oh, sure. My name is Bub.

>
```

If the player fails to choose one of the provided options, the dialog will repeat.

## Free Response

You can instead use the property `text_options` to create free response answers. At the prompt, the player can type any of the responses given to jump to the indicated script. If the player fails to type one of the choices, the next action below the [SHOW_SERIAL_DIALOG](actions/SHOW_SERIAL_DIALOG) script will execute instead, falling through.

```json
{
  "serialSphinx": {
    "messages": [
      "When you arrive at the Sphinx,",
      "it speaks in a slow, monotone voice:",
      "WHEN DO THE FLYING TOASTERS COME OUT?"
    ],
    "text_options": {
      "after dark": "sphinxSuccess",
      "before dark": "sphinxWTF"
    }
  }
}
```
