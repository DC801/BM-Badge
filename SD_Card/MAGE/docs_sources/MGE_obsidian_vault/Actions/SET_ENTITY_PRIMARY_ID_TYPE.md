# SET_ENTITY_PRIMARY_ID_TYPE

Sets an [[entities|entity]]'s `primary_id_type`: either (`0`) [[tile entity|tile]], (`1`) [[animation entity|animation]], or (`2`) [[character entity|character]] (sometimes called `entity_type`).

## Example JSON

```json
{
  "action": "SET_ENTITY_PRIMARY_ID_TYPE",
  "byte_value": 1,
  "entity": "Entity Name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">primary_id_type</span> <span class="operator">to</span> <span class="number">1</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string primary_id_type (to) $byte_value:number (;)
```

---

Back to [[Actions]]
