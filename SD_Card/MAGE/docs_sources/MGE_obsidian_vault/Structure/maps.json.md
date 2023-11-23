# `maps.json`

This data used to reside (in part) in [[scenario.json]], but was moved to this file for the ch2+ Mage Game Engine (MGE), partially because of the new `directions` property.

```json
{
  "sample": {
    "path": "maps/map-sample.json",
    "on_load": "on_load-sample",
    "on_look": "on_look-sample",
    "on_tick": "on_tick-sample",
    "directions": {
      "north": "on_go-sample-map",
      "south": "on_go-sample-map"
    }
  }
}
```

[[Map properties]] will still work if assigned to a [[Maps|map]] file within Tiled, as before, but we've found this format easier to work with.

## Map Properties

- `path` — where the map JSON file is located and what it's called
- [[on_load]] — the script that plays when the map is first loaded; best used for checking [[save flags]] and restoring state that is meant to be permanently changed
- [[on_look]] — the script that plays when you run the `look` [[command]] in the [[terminal]] without any arguments
	- note: you can override this script if you [[command|register]] a `look` command manually
- [[on_tick]] — the script that plays every game tick; best used for door triggers
- `directions` — the scripts that run when the command `go` is run with the named argument, e.g. `go north`
	- these directions will be listed after a maps `on_look` script is triggered (e.g. `exits are...`)
