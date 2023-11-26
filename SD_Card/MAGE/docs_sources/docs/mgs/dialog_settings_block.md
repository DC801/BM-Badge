# Dialog Settings Block

One of the root level [blocks](../mgs/block) in [MGS Natlang](../mgs/mgs_natlang).

```
settings (for) dialog {}
```

The `for` is optional:

```mgs
settings for dialog {}
//or
settings dialog {}
```

These are a means of defining [dialog properties](../dialogs/dialog_properties) ahead of time so the dialogs themselves can be very lean.

Inside the block body are [dialog settings target blocks](../mgs/dialog_settings_target_block) in any order.

#### Behavior

Dialog settings are applied to [dialogs](../dialogs) in order as the parser encounters them; a dialog settings block partway down the file will affect only the dialogs afterward, and none before.

- New settings will override old settings.
	- E.g. if you assign the player the alignment `TOP_RIGHT` and then `BOTTOM_RIGHT` back-to-back, dialogs will use `BOTTOM_RIGHT`.
- Entity settings will override global settings.
	- E.g. if you assign alignment `BOTTOM_LEFT` to the global defaults, and `BOTTOM_RIGHT` to the player entity, dialogs involving the player entity will use `BOTTOM_RIGHT`.
- Dialog label settings will override entity settings.
- Properties given in a dialog's body will override any other settings, however.
