# SHOW_DIALOG

Plays the named [[dialogs|dialog]].

A script cannot execute any other actions until the dialog is entirely finished. To give a [[cutscenes|cutscene]] sophisticated choreography, you will need to either split the dialog into multiple pieces or prepare additional scripts to manage concurrent behavior.

While a dialog screen is showing, the player can only advance to the next dialog message or choose a multiple choice option within that dialog (if any); the player cannot hack, interact with another [[entities|entity]], move, etc.

This action is also available as a [[combination block]]: [[show dialog block]].

A script can close an open dialog with [[CLOSE_DIALOG]].

## Example JSON

```json
{
  "action": "SHOW_DIALOG",
  "dialog": "dialogName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">show</span> <span class="sigil">dialog</span> <span class="string">dialogName</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
show dialog $dialog:string (;)
```

---

Back to [[Actions]]
