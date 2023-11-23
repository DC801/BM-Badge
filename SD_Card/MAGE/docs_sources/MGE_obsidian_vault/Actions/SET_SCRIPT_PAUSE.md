# SET_SCRIPT_PAUSE

Pauses or unpauses a [[scripts|script]]. In practice, this is most useful for temporarily pausing an [[entities|entity]]'s [[on_tick]] script during its [[on_interact]] event.

Entity variant: Any entity name can be used in all the normal ways ([[%PLAYER%]] etc.). Scripts slots for these are `on_tick`, `on_interact`, and [[on_look]].

Map variant: Script slots for these are [[on_load]], [[on_tick]], and [[commands|on_command]].

## Example JSON

```json
{
  "action": "SET_SCRIPT_PAUSE",
  "bool_value": true,
  "entity": "Entity Name",
  "script_slot": "on_tick"
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">pause</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="string">on_tick</span><span class="terminator">;</span>
  <span class="verb">pause</span> <span class="sigil">map</span> <span class="target">on_tick</span><span class="terminator">;</span>
  <span class="verb">unpause</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="string">on_tick</span><span class="terminator">;</span>
  <span class="verb">unpause</span> <span class="sigil">map</span> <span class="target">on_tick</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
pause entity $entity:string $script_slot:bareword (;)
	// built-in value: bool_value = true

pause map $script_slot:bareword (;)
	// built-in value: bool_value = true
	// built-in value: entity = %MAP%

unpause entity $entity:string $script_slot:bareword (;)
	// built-in value: bool_value = false

unpause map $script_slot:bareword (;)
	// built-in value: bool_value = false
	// built-in value: entity = %MAP%
```

---

Back to [[Actions]]
