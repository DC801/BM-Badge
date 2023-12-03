---
tags: [ 'mgs natlang', 'dialog names', 'actions', 'SHOW_SERIAL_DIALOG', 'given name', 'current name', 'text wrap', ]
---

# Serial Dialogs

**Serial dialogs** are a means to print messages on the serial [terminal](terminal) (new as of the chapter 2+ version of the MGE).

They need not function as [character](entities) [dialog](dialogs), strictly speaking; they can be anything, including [debug messages](debug_tools#debug-scripting), ASCII maps, room or character descriptions, etc.

Serial dialogs do nothing on their own. To show them, you must use the [SHOW_SERIAL_DIALOG](actions/SHOW_SERIAL_DIALOG) action within a [script](scripts).

Serial dialog names must be unique throughout the entire game project, though [MGS Natlang](mgs/mgs_natlang) will auto generate dialog names when they are not declared.

## Properties

The only required serial dialog property is `messages`, though there are two types of dialog options: multiple choice and free response.

Serial dialog messages are not wrapped by default (unless handled by [MGS Natlang](mgs/mgs_natlang)).

## JSON Structure

::: warning Slightly Deprecated
With the introduction of [MGS Natlang](mgs/mgs_natlang), you need not write serial dialogs with JSON, but it still may be useful to understand the JSON structure for debugging purposes.
:::

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

## Options

### Multiple Choice

After `messages`, you may include a second property named `options`.

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

These will appear in the [terminal](terminal) as numbered options.

```
What's your name?

    0: I'm not telling you!
    1: Wait. Tell me yours first.
    2: Oh, sure. My name is Bub.

>
```

If the player fails to choose one of the provided options, the serial dialog will repeat.

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
