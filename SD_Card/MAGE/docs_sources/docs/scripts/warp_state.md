# `warp_state`

See: [Variable Types](../scripts/variable_types)

This is a global string that is designated for controlling player spawn behavior on a map's [`on_load`](../scripts/on_load) script. When you [leave a room](../techniques/doors) (or otherwise trigger a new [map](../maps) to load), the `warp_state` string should be set to something that indicates the exit/entrance point so the next map can teleport the player entity to the appropriate [spawn point](../techniques/spawn_points).

Handling player spawn points is the original purpose for `warp_state`, but there's nothing stopping you from using it for other things, too.
