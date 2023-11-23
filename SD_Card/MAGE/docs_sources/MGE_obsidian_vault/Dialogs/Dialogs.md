# Dialogs

Dialogs are a visual novel or RPG style dialog system on the screen. These include portrait images, dialog box labels, and dialog messages.

Arbitrary [[actions]] cannot be performed by the [[scripts|script]] running an in-progress dialog. Therefore, if an [[entities|entity]] must change their behavior partway through a dialog message, you must split the dialog into multiple pieces or use another [[Script Slots|script slot]] to control the entities' behavior.

## Structure

### Dialog Name

All dialogs have a name, which is now [[scripts]] can target them with [[actions]]. This name must be **completely unique** throughout the entire game project files, both between JSON and MGS files.

In [[MGS Natlang]], dialogs can be defined and "called" in place, so name definitions can be omitted; however, as Natlang *becomes* JSON before it's handed off to the [[MGE Encoder]], these dialogs still need a name — and Natlang calculates one based on the file name and line number. This makes debugging dialogs a little more difficult, but dramatically easier to write. (You can still assign them names, or refer to dialogs without defining them, too, if you want to.)

## Format

Dialogs can have several [[Dialog Properties|properties]], but not all of them are required. Dialogs have different written structures between [[Dialogs (JSON)|JSON]] and [[MGS Natlang]] [[Dialogs (MGS)|dialogs]], however — the latter being much more compact.

## Also See

- [[Dialog Properties]]
- [[Multiple Choice Dialogs (JSON)]]
- [[Dialogs (JSON)]]
- [[Dialog Block]]
