# Scripts

A **script** is an array of [actions](actions) which will execute one after the other, top to bottom, when the script is run.

It doesn't strictly matter which file contains which script data, as long as the file is of the right type (either JSON or [MGS Natlang](mgs/mgs_natlang)). Scripts therefore must have completely unique names, even if they are inside different script files, or are in different types of script files.

## Relative References

See: [Relative Entity References](entities/relative_entity_references)

For all actions, [%SELF%](entities/SELF) refers to the entity running the script and [%PLAYER%](entities/PLAYER) refers to the player entity.

### Best Practice
Whether to use `%SELF%` or whether to specify the exact target entity for an action depends on the purpose of the script. General-purpose scripts should use `%SELF%`, naturally, but for [cutscenes](techniques/cutscenes) involving multiple characters you might want to specify the entity specifically in case the entity running the script has to change at some point, which would change all `%SELF%` references.

If a script involves a conversation between an entity and the player and no one else, however, it might be better to use `%SELF%` if only to limit strange choreography in the case of another entity being hacked to run the script instead.

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
