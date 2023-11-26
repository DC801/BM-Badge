# Dialogs

Dialogs are a visual novel or RPG style dialog system for the screen. These include portrait images, dialog box labels, and dialog messages.

Arbitrary [actions](actions) cannot be performed by the [script](scripts) running a dialog. Therefore, if an [entity](entities) must change their behavior partway through a dialog message, you must split the dialog into multiple pieces or use another [script slot](scripts/script_slots) to control the entity's behavior.

## Structure

### Dialog Name

All dialogs have a name, which is how [scripts](scripts) can target them with [actions](actions). This name must be **completely unique** throughout the entire game project files, both between JSON and MGS files.

In [MGS Natlang](mgs/mgs_natlang), dialogs can be defined and "called" in place, so name definitions can be omitted; however, as Natlang *becomes* JSON before it's handed off to the [MGE encoder](encoder/mge_encoder), these dialogs still need a name — and Natlang calculates one based on the file name and line number. This makes debugging dialogs a little more difficult, but dramatically easier to write. (You can still assign them names, or refer to dialogs without defining them, too, if you want to.)

## Format

Dialogs can have several [properties](dialogs/dialog_properties), but not all of them are required. Dialogs have different written structures between [JSON](dialogs/dialogs_json) and [Natlang](mgs/dialogs_mgs), however — the latter being much more compact.
