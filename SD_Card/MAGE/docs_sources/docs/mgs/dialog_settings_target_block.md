# Dialog Settings Target Block

One of the [blocks](../mgs/blocks) in [MGS Natlang](../mgs/mgs_natlang), occurring exclusively inside [dialog settings blocks](../mgs/dialog_settings_block).

Several choices:

- `default {}`
	- Describes the default behavior for all [dialogs](../mgs/dialogs_mgs) in the same file.
- `entity $string {}`
	- Describes the default dialog settings for a specific [entity](../entities).
- `label $bareword {}`
	- Defines a dialog identifier shortcut or alias to a specific set of settings.
	- The label name *must* be a [bareword](../mgs/variables_mgs#bareword), not a [quoted string](../mgs/variables_mgs#quoted-string).
	- Dialog labels only exist in [MGS Natlang](../mgs/mgs_natlang) (not the MGE itself), so they do not apply to other entity references (such as the target of an action).

**Block contents**: any number of [dialog parameters](../mgs/dialogs_mgs#dialog-parameters) ([dialog property](../dialogs#properties) and [value](../mgs/variables_mgs) pairs) — in any order. No commas or semicolons needed. (For now!)

## Example

```mgs{2}
settings for dialog {
  label PLAYER {}
}
```

This is a common use case for dialog settings, after which you can use `PLAYER` instead of `entity "%PLAYER%"` as a [dialog identifier](dialogs_mgs#dialog-identifier) for [dialogs](../mgs/dialogs_mgs).

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
