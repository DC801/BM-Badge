# SET_ENTITY_NAME

Sets an [entity](entities)'s [name](entities/entity_properties).

## Example JSON

```json
{
  "action": "SET_ENTITY_NAME",
  "entity": "Entity Name",
  "string": "some kind of string"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">name</span> <span class="operator">to</span> <span class="string">"some kind of string"</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string name (to) $string:string (;)
```

---

Back to [Actions](actions)
