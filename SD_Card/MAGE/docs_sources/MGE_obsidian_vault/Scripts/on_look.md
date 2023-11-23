# `on_look`

See: [[Script Slots]]

`on_look` [[scripts]] are run when the player uses the `look` command in the [[terminal]].

`look` on its own triggers the [[Maps|map]]'s `on_look` script. `look` + the [[Printing Current Values|current name]] of an [[entities|entity]] will trigger that entity's `on_look` script.

If multiple entities in a map have the same **given name** (the name assigned to that entity within Tiled), and one or more of those entities have had their name changed, `look`ing at any of them will use the [[Printing Current Values|current name]] of the first entity the map found with the shared **given name**.

`on_look` scripts can be overridden with a manual [[commands|command]] registration.
