# CHECK_ENTITY_CURRENT_ANIMATION

Checks the id of the [[entities|entity]]'s [[entity properties|current animation]]. (See [[animations|entity animations]] for what numbers correspond to which animations.)

## Example JSON

```json
{
  "action": "CHECK_ENTITY_CURRENT_ANIMATION",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_byte": 2,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_CURRENT_ANIMATION",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_byte": 2,
  "jump_index": 12
}
```

## MGS Natlang

The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">current_animation</span> <span class="operator">is</span> <span class="number">2</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">current_animation</span> <span class="operator">is</span> <span class="number">2</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">current_animation</span> <span class="operator">is</span> <span class="operator">not</span> <span class="number">2</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">current_animation</span> <span class="operator">is</span> <span class="number">2</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">current_animation</span> <span class="operator">is</span> <span class="operator">not</span> <span class="number">2</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>

</pre>

### Dictionary entries:

```
if entity $entity:string current_animation is $expected_byte:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string current_animation is not $expected_byte:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string current_animation is $expected_byte:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string current_animation is not $expected_byte:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false
```

---

Back to [[Actions]]
