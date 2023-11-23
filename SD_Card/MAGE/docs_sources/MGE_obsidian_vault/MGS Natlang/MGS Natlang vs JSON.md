# MGS Natlang vs JSON

#updateme 

### Original script JSON

```json
{
  "on_tick-greenhouse": [
    {
      "action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
      "entity": "%PLAYER%",
      "geometry": "door-greenhouse",
      "success_script": "leave-greenhouse",
      "expected_bool": true
    },
    {
      "action": "COPY_SCRIPT",
      "script": "ethernettle-uproot-check",
      "comment": "some kind of comment"
    }
  ]
}
```

While relatively human readable, the above is difficult to write in practice.

- It's bulky enough that you can't have very much scripting logic on your screen at once.
- It's easy to lose track of what you're doing as you must constantly reference named scripts and dialogs (and serial dialogs) in different files back and forth.
- JSON cannot be commented, so it's inconvenient to leave yourself supplementary information, such as the contents of a dialog you're referencing when scripting a cutscene.
- The parameters for MGE actions are not uniform, so it's easy to forget or confuse parameters if you're not copying and pasting actions from nearby.

### MGS Natlang (script)

```mgs
on_tick-greenhouse {
  if entity "%PLAYER%" is inside geometry door-greenhouse
    then goto leave-greenhouse;
  copy script ethernettle-uproot-check;
  // some kind of comment
}
```

Apart from the fact that the MGS Natlang won't receive any syntax coloring by default, this is more approachable.

It's more compact, and the nested relationship of the script and its actions is far easier to see at a glance. Human-friendly grammar constructions (e.g. `is inside` vs `is not inside`) makes it much easier to follow script branching logic.

### Original dialog JSON

```json
{
  "exampleDialogName": [
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

### MGS Natlang (dialog)

```mgs
settings for dialog {
  default {
    alignment BL
  }
  label PLAYER {
    entity "%PLAYER%"
    alignment BR
  }
}
```

With MGS Natlang, you can create presets for common dialog settings (see above), after which, the dialogs themselves become very lightweight:

```ngs
dialog exampleDialogName {
  Trekkie
  "Me want to wish you a happy birthday, %PLAYER%."

  PLAYER
  "Aww, gee, thanks, Farmer %Trekkie%!"
}
```

Since MGS Natlang is white space agnostic, it can be as compact as you want:

```
dialog exampleDialog2 {
  PLAYER "Neat."
}
```

or even

```
dialog exampleDialog2 { PLAYER "Neat." }
```

### MGS Natlang (combined)

However, where MGS Natlang really shines is in combining both script data and dialog data together:

```mgs
settings for dialog {
  label PLAYER {
    entity "%PLAYER%"
    alignment BR
  }
}
show_dialog-wopr-backdoor {
  turn player control off;
  walk entity "%PLAYER%" along geometry wopr-walkin over 600ms;
  wait 400ms;
  turn player control on;
  show dialog {
    PLAYER
    "Whoa! It looks like I found some kind of back door."
  }
  set flag backdoor-found to true;
}
```

Now the dialog's content is no longer separated from its context. The dialog no longer needs a name, either, unless another script needs to refer to it, too.
