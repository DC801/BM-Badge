# Scripts

A **script** is an array of [actions](actions) which will execute one after the other, top to bottom, when the script is run.

It doesn't strictly matter which file contains which script data, as long as the file is of the right type (either JSON or [MGS Natlang](mgs/mgs_natlang)). Scripts therefore must have completely unique names, even if they are inside different script files, or are in different types of script files.

## Relative References

See: [Relative Entity References](entities/relative_entity_references)

For all actions, [`%SELF%`](entities/SELF) refers to the entity running the script and [`%PLAYER%`](entities/PLAYER) refers to the player entity.

::: tip Best Practice: `%SELF%` or the entity's given name?
Scripts involving only one entity (or one entity and the player) will do best to use `%SELF%`. For [cutscenes](techniques/cutscenes) involving multiple characters, however, you might want to specify the entity specifically (by its given name) in case you have to change which entity is running the script.
:::

## Also See

- [Script Slots](scripts/script_slots)
	- [`on_interact`](scripts/on_interact)
	- [`on_tick`](scripts/on_tick)
	- [`on_load`](scripts/on_load)
	- [`on_look`](scripts/on_look)
- [null_script](scripts/null_script)
- [Variable Types](scripts/variable_types)
	- [warp_state](scripts/warp_state)
	- [Integer Variables](scripts/integer_variables)
	- [Save Flags](scripts/save_flags)
	- [Printing Current Values](scripts/printing_current_values)
- [Comments (JSON)](scripts/comments_json)
- [Scripts (JSON)](scripts/scripts_json)
- [Script Block](mgs/script_block) ([MGS Natlang](mgs/mgs_natlang))
- [Actions](Actions)
