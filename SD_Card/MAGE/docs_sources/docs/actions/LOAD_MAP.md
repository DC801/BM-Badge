# LOAD_MAP

Except for the player's name, all [entity properties](../entities/entity_properties) are reset to their original values when a new [map is loaded](../maps/map_loads).

If this action is told to load the current map, the current map will be reset. This behavior is equivalent to pressing `XOR` + `MEM3`.

For most normal [door](../techniques/doors) behavior, you will probably want to [set the warp state](../SET_WARP_STATE) before using the this action.

## Example JSON

```json
{
  "action": "LOAD_MAP",
  "map": "mapName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">load</span> <span class="sigil">map</span> <span class="string">mapName</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
load map $map:string (;)
```

---

Back to [Actions](../actions)
