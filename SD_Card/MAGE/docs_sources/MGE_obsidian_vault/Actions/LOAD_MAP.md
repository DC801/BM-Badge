# LOAD_MAP

Except for the player's name, all [[entity properties]] are reset to their original values when a new [[map loads|map is loaded]].

If this action is told to load the current map, the current map will be reset. This behavior is equivalent to pressing `XOR` + `MEM3`.

For most normal [[doors|door]] behavior, you will probably want to [[SET_WARP_STATE|set the warp state]] before using the this action.

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

Back to [[Actions]]
