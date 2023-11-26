# SET_ENTITY_PRIMARY_ID

Sets an [entity](../entities)'s [primary_id](../entities/entity_properties).

You will overwhelmingly want to set the `entity_type` by name instead with [SET_ENTITY_TYPE](../actions/SET_ENTITY_TYPE).

## Example JSON

```json
{
  "action": "SET_ENTITY_PRIMARY_ID",
  "entity": "Entity Name",
  "u2_value": 2
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">primary_id</span> <span class="operator">to</span> <span class="number">2</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string primary_id (to) $u2_value:number (;)
```

---

Back to [Actions](../actions)
