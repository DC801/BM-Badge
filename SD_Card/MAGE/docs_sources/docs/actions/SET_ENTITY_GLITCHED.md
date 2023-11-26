# SET_ENTITY_GLITCHED

Set the glitched render flag on an [entity](entities).

## Example JSON

```json
{
  "action": "SET_ENTITY_GLITCHED",
  "bool_value": true,
  "entity": "Entity Name"
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">make</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="language-constant">glitched</span><span class="terminator">;</span>
  <span class="verb">make</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="language-constant">unglitched</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
make entity $entity:string glitched (;)
	// built-in value: bool_value = true

make entity $entity:string unglitched (;)
	// built-in value: bool_value = false
```

---

Back to [Actions](actions)
