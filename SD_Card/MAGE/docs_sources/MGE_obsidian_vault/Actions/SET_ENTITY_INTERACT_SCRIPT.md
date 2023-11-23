# SET_ENTITY_INTERACT_SCRIPT

Sets an [[entities|entity]]'s [[on_interact]] script.

If you use this action to change the [[script slots|script slot]] that is currently running the action, any actions given afterward may not execute depending on what they are.

Because entity properties are reset when a map is loaded, and because entities retain the last script that was run in their `on_interact` slot, you should restore an entity's original interact script at the end of their interact script tree if there are any script jumps involved.

## Example JSON

```json
{
  "action": "SET_ENTITY_INTERACT_SCRIPT",
  "entity": "Entity Name",
  "script": "scriptName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">set</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">on_interact</span> <span class="operator">to</span> <span class="string">scriptName</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
set entity $entity:string on_interact (to) $script:string (;)
```

---

Back to [[Actions]]
