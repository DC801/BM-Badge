# SET_ENTITY_SECONDARY_ID

Sets an [entity](../entities)'s [secondary_id](../entities/entity_properties).

This action will not be useful unless the entity is a [tile entity](../entities/tile_entity) (`primary_id_type`: `1`).

## Example JSON

```json
{
  "action": "SET_ENTITY_SECONDARY_ID",
  "entity": "Entity Name",
  "u2_value": 2
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">secondary_id</span> <span class="operator">to</span> <span class="number">2</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string secondary_id (to) $u2_value:number (;)
```

---

Back to [Actions](../actions)
