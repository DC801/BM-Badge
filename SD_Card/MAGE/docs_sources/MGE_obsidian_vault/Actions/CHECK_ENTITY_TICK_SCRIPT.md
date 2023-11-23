# CHECK_ENTITY_TICK_SCRIPT

Checks an [[entities|entity]]'s [[on_tick]] [[script slots|script]] (by the [[scripts|script]]'s name).

## Example JSON

```json
{
  "action": "CHECK_ENTITY_TICK_SCRIPT",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_script": "scriptName",
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_TICK_SCRIPT",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_script": "scriptName",
  "jump_index": 12
}
```

## MGS Natlang

The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">on_tick</span> <span class="operator">is</span> <span class="script">scriptName</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">on_tick</span> <span class="operator">is</span> <span class="script">scriptName</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">on_tick</span> <span class="operator">is</span> <span class="script">scriptName</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">on_tick</span> <span class="operator">is</span> <span class="script">scriptName</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">on_tick</span> <span class="operator">is</span> <span class="operator">not</span> <span class="script">scriptName</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">on_tick</span> <span class="operator">is</span> <span class="operator">not</span> <span class="script">scriptName</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">on_tick</span> <span class="operator">is</span> <span class="operator">not</span> <span class="script">scriptName</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="">;</span>

</pre>

### Dictionary entries:

```
if entity $entity:string on_tick is $expected_script:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string on_tick is $expected_script:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string on_tick is $expected_script:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string on_tick is not $expected_script:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string on_tick is not $expected_script:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string on_tick is not $expected_script:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```

---

Back to [[Actions]]
