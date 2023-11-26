# `maps.json`

Found in [`scenario_source_files`](../getting_started/scenario_source_files).

This data used to reside (in part) in [`scenario.json`](../structure/scenario.json), but was moved to this file for the ch2+ Mage Game Engine (MGE), partially because of the new `directions` property, and partially because it was easier to coordinate script names like this.

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

[Map properties](../maps/map_properties) will still work if assigned to a [map](../maps) file within Tiled, as before, but we've found this format easier to work with.

## Map Properties

See: [map properties](../maps/map_properties.md)
