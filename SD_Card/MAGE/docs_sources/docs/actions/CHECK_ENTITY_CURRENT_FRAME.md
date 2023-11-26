# CHECK_ENTITY_CURRENT_FRAME

Checks the frame (number) of the [entity](entities)'s current [entity animations](tilesets/animations).

## Example JSON

```json
{
  "action": "CHECK_ENTITY_CURRENT_FRAME",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_byte": 2,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_CURRENT_FRAME",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_byte": 2,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](actions/conditional_gotos) portion of this action can be used inside an [if](mgs/advanced_syntax/if_and_else) condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">animation_frame</span> <span class="operator">is</span> <span class="number">2</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">animation_frame</span> <span class="operator">is</span> <span class="number">2</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">animation_frame</span> <span class="operator">is</span> <span class="number">2</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">animation_frame</span> <span class="operator">is</span> <span class="number">2</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">animation_frame</span> <span class="operator">is</span> <span class="operator">not</span> <span class="number">2</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">animation_frame</span> <span class="operator">is</span> <span class="operator">not</span> <span class="number">2</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">animation_frame</span> <span class="operator">is</span> <span class="operator">not</span> <span class="number">2</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="">;</span>

</pre>

### Dictionary entries:

```
if entity $entity:string animation_frame is $expected_byte:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string animation_frame is $expected_byte:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string animation_frame is $expected_byte:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string animation_frame is not $expected_byte:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string animation_frame is not $expected_byte:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string animation_frame is not $expected_byte:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```

---

Back to [Actions](actions)
