# Dialog Settings Target Block

One of the [[Block|blocks]] in [[MGS Natlang]], occurring exclusively inside [[dialog settings block|dialog settings blocks]].

Several choices:

- `default {}`
	- Describes the default behavior for all [[Dialogs (MGS)|dialogs]] in the same file.
- `entity $string {}`
	- Describes the default dialog settings for a specific [[entities|entity]].
- `label $bareword {}`
	- Defines a dialog identifier shortcut or alias to a specific set of settings.
	- The label name *must* be a [[bareword]], not a [[quoted string]].
	- Dialog labels only exist in [[MGS Natlang]] (not the MGE itself), so they do not apply to other entity references (such as the target of an action).

**Block contents**: any number of [[Dialog Parameters (MGS)|dialog parameters]] ([[dialog properties|dialog property]] and [[Variables (MGS)|value]] pairs) — in any order. No commas or semicolons needed. (For now!)

## Example

```mgs
label PLAYER {
  entity "%PLAYER%"
  alignment BR
}
```

This is a common use case for dialog settings, after which you can use `PLAYER` instead of `entity "%PLAYER%"` as a [[dialog identifier]] for [[Dialogs (MGS)|dialogs]].

```mgs
// with label
dialog test {
  PLAYER "Dialog message"
}

// without label
dialog test {
  entity "%PLAYER%" "Dialog message"
}
```
