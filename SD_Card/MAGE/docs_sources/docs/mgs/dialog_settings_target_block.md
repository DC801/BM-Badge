# Dialog Settings Target Block

One of the [blocks](../mgs/block) in [MGS Natlang](../mgs/mgs_natlang), occurring exclusively inside [dialog settings blocks](../mgs/dialog_settings_block).

Several choices:

- `default {}`
	- Describes the default behavior for all [dialogs](../mgs/dialogs_mgs) in the same file.
- `entity $string {}`
	- Describes the default dialog settings for a specific [entity](../entities).
- `label $bareword {}`
	- Defines a dialog identifier shortcut or alias to a specific set of settings.
	- The label name *must* be a [bareword](../mgs/variables/bareword), not a [quoted string](../mgs/variables/quoted_string).
	- Dialog labels only exist in [MGS Natlang](../mgs/mgs_natlang) (not the MGE itself), so they do not apply to other entity references (such as the target of an action).

**Block contents**: any number of [dialog parameters](../mgs/dialog_parameters_mgs) ([dialog property](../dialogs/dialog_properties) and [value](../mgs/variables_mgs) pairs) — in any order. No commas or semicolons needed. (For now!)

## Example

```mgs
label PLAYER {
  entity "%PLAYER%"
  alignment BR
}
```

This is a common use case for dialog settings, after which you can use `PLAYER` instead of `entity "%PLAYER%"` as a [dialog identifier](../mgs/dialog_identifier) for [dialogs](../mgs/dialogs_mgs).

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
