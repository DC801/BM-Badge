# `warp_state`

See: [[Variable Types]]

This is a global string that is designated for controlling player spawn behavior on a map's [[on_load]] script. When you [[doors|leave a room]] (or otherwise trigger a new [[Maps|map]] to load), the `warp_state` string should be set to something that indicates the exit/entrance point so the next map can teleport the player entity to the appropriate [[Spawn Points|spawn point]].

Handling player spawn points is the original purpose for `warp_state`, but there's nothing stopping you from using it for other things, too.
