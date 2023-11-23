# SET_ENTITY_Y

Sets an [[entities|entity]]'s [[entity properties|y]] coordinate.

In practice, you will likely want to use [[Vector Objects|geometry vectors]] and teleport actions instead.

## Example JSON

```json
{
  "action": "SET_ENTITY_Y",
  "entity": "Entity Name",
  "u2_value": 2
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">y</span> <span class="operator">to</span> <span class="number">2</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string y (to) $u2_value:number (;)
```

---

Back to [[Actions]]
