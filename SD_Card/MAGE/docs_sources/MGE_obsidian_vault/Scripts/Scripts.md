# Scripts

A **script** is an array of [[actions]] which will execute one after the other, top to bottom, when the script is run.

It doesn't strictly matter which file contains which script data, as long as the file is of the right type (either JSON or [[MGS Natlang]]). Scripts therefore must have completely unique names, even if they are inside different script files, or are in different types of script files.

## Relative References

See: [[Relative Entity References]]

For all actions, [[%SELF%]] refers to the entity running the script and [[%PLAYER%]] refers to the player entity.

**Best Practice**: Whether to use `%SELF%` or whether to specify the exact target entity for an action depends on the purpose of the script. General-purpose scripts should use `%SELF%`, naturally, but for [[cutscenes]] involving multiple characters you might want to specify the entity specifically in case the entity running the script has to change at some point, which would change all `%SELF%` references.

If a script involves a conversation between an entity and the player and no one else, however, it might be better to use `%SELF%` if only to limit strange choreography in the case of another entity being hacked to run the script instead.

## Also See

- [[Script Slots]]
	- [[on_interact]]
	- [[on_tick]]
	- [[on_load]]
	- [[on_look]]
- [[null_script]]
- [[Variable Types]]
	- [[warp_state]]
	- [[Integer Variables]]
	- [[Save Flags]]
	- [[Printing Current Values]]
- [[Comments (JSON)]]
- [[Scripts (JSON)]]
- [[Script Block]] ([[MGS Natlang]])
- [[Actions]]
