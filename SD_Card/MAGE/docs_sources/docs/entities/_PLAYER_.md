# %PLAYER%

One of the [relative entity references](entities/relative_entity_references).

When used as the target of an [action](actions), `%PLAYER%` refers to the player entity (the entity marked `is_player` on the [map](maps) in Tiled).

When used in the body of a message (e.g. `"Hello, %PLAYER%!"`) it will use the [current name](scripts/printing_current_values) of the player entity.
