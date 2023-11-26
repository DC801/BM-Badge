# CHECK_ENTITY_GLITCHED

Checks whether an [entity](entities) currently has it's "glitched" render flag set.

## Example JSON

```json
{
  "action": "CHECK_ENTITY_GLITCHED",
  "entity": "Entity Name",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_GLITCHED",
  "entity": "Entity Name",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](actions/conditional_gotos) portion of this action can be used inside an [if](mgs/advanced_syntax/if_and_else) condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="language-constant">glitched</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="language-constant">glitched</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="language-constant">glitched</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="language-constant">glitched</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="operator">not</span> <span class="language-constant">glitched</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="operator">not</span> <span class="language-constant">glitched</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="operator">not</span> <span class="language-constant">glitched</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
if entity $entity:string is glitched
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string is glitched
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string is glitched
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string is not glitched
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string is not glitched
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string is not glitched
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```

---

Back to [Actions](actions)
