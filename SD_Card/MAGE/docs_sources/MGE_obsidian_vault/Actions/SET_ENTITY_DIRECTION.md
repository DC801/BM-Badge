# SET_ENTITY_DIRECTION

Turns an [[entities|entity]] toward the `north`, `south`, `east`, or `west`.

## Example JSON

```json
{
  "action": "SET_ENTITY_DIRECTION",
  "direction": "north",
  "entity": "Entity Name"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">turn</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="language-constant">north</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
turn entity $entity:string $direction:bareword (;)
```

---

Back to [[Actions]]
