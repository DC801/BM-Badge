# `on_look`

See: [Script Slots](../scripts/script_slots)

`on_look` [script](../scripts) are run when the player uses the `look` command in the [terminal](../hardware/terminal).

`look` on its own triggers the [map](../maps)'s `on_look` script. `look` + the [current name](../scripts/printing_current_values) of an [entity](../entities) will trigger that entity's `on_look` script.

If multiple entities in a map have the same **given name** (the name assigned to that entity within Tiled), and one or more of those entities have had their name changed, `look`ing at any of them will use the [current name](../scripts/printing_current_values) of the first entity the map found with the shared **given name**.

`on_look` scripts can be overridden with a manual [command](../hardware/commands) registration.
