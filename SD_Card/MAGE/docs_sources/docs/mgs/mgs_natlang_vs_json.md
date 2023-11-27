# MGS Natlang vs JSON

Also see:

- [Scripts](../scripts.md), [Scripts (JSON)](../scripts/scripts_json.md), [Scripts (MGS)](scripts_mgs.md)
- [Dialogs](../dialogs.md), [Dialogs (JSON)](../dialogs/dialogs_json.md), [Dialogs (MGS)](dialogs_mgs.md)

## JSON Script

```json
{
  "cutscene": [
    {
      "action": "SET_PLAYER_CONTROL",
      "bool_value": false
    },
    {
      "action": "WALK_ENTITY_ALONG_GEOMETRY",
      "entity": "%PLAYER%",
      "geometry": "approach-desk",
      "duration": 600
    },
    {
      "action": "NON_BLOCKING_DELAY",
      "duration": 400
    },
    {
      "action": "SET_ENTITY_DIRECTION_TARGET_ENTITY",
      "entity": "Trekkie",
      "target_entity": "%PLAYER%"
    },
    {
      "action": "SHOW_DIALOG",
      "dialog": "cutscene-dialog"
    }
  ]
}
```

While relatively human readable, the above is difficult to write in practice.

- It's bulky enough that you can't have very much scripting logic on your screen at once.
- It's easy to lose track of what you're doing as you must constantly reference named scripts and dialogs (and serial dialogs) in different files back and forth.
- JSON cannot be commented, so it's inconvenient to leave yourself supplementary information, such as the contents of a dialog you're referencing when scripting a cutscene.
- The parameters for MGE actions are not uniform, so it's easy to forget or confuse parameters if you're not copying and pasting actions from nearby.

## MGS Natlang Script

```mgs
cutscene {
  turn player control off;
  walk entity "%PLAYER%" along geometry approach-desk over 600ms;
  wait 400ms;
  turn entity Trekkie toward entity "%PLAYER%";
  show dialog cutscene-dialog;
}
```

This is far more approachable — more compact, and the nested relationship of the script and its actions is far easier to see at a glance. Human-friendly grammar constructions (e.g. `is inside` vs `is not inside`) makes it much easier to follow script branching logic.

## JSON Dialog

```json
{
  "cutscene-dialog": [
    {
      "alignment": "BOTTOM_LEFT",
      "entity": "Trekkie",
      "messages": [
        "Me want to wish you a happy birthday,\n%PLAYER%."
      ]
    },
    {
      "alignment": "BOTTOM_RIGHT",
      "entity": "%PLAYER%",
      "messages": [
        "Aww, gee, thanks, Farmer\n%Trekkie%!"
      ]
    }
  ]
}
```

Dialog JSON is more uniform than script JSON is, but its information density is even worse.

## MGS Natlang Dialog

```mgs
settings for dialog {
  default { alignment BL }
  label PLAYER { entity "%PLAYER%" alignment BR }
}
```

With MGS Natlang, you can create presets for common dialog settings (see above), after which, the dialogs themselves become very lightweight:

```mgs
dialog cutscene-dialog {
  Trekkie
  "Me want to wish you a happy birthday, %PLAYER%."

  PLAYER
  "Aww, gee, thanks, Farmer %Trekkie%!"
}
```

## MGS Natlang (Combined)

However, where MGS Natlang really shines is in combining both script data and dialog data together:

```mgs
settings for dialog {
  default { alignment BL }
  label PLAYER { entity "%PLAYER%" alignment BR }
}
cutscene {
  turn player control off;
  walk entity "%PLAYER%" along geometry approach-desk over 600ms;
  turn entity Trekkie toward entity "%PLAYER%";
  show dialog {
    Trekkie "Me want to wish you a happy birthday, %PLAYER%."
    PLAYER "Aww, gee, thanks, Farmer %Trekkie%!"
  }
}
```

Now a dialog's content is no longer separated from its context. The dialog no longer needs a name, either, unless another script needs to refer to it, too.
