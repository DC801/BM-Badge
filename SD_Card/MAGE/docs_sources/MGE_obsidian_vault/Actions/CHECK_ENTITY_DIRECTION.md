# CHECK_ENTITY_DIRECTION

Checks whether an [[entities|entity]] is facing one of the four cardinal directions: `north`, `south`, `east`, or `west`.

## Example JSON

```json
{
  "action": "CHECK_ENTITY_DIRECTION",
  "direction": "north",
  "entity": "Entity Name",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_DIRECTION",
  "direction": "north",
  "entity": "Entity Name",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">direction</span> <span class="operator">is</span> <span class="language-constant">north</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">direction</span> <span class="operator">is</span> <span class="language-constant">north</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">direction</span> <span class="operator">is</span> <span class="operator">not</span> <span class="language-constant">north</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">direction</span> <span class="operator">is</span> <span class="language-constant">north</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">direction</span> <span class="operator">is</span> <span class="language-constant">north</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">direction</span> <span class="operator">is</span> <span class="operator">not</span> <span class="language-constant">north</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">direction</span> <span class="operator">is</span> <span class="operator">not</span> <span class="language-constant">north</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="">;</span>

</pre>

### Dictionary entries:

```
if entity $entity:string direction is $direction:bareword
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string direction is $direction:bareword
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string direction is $direction:bareword
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string direction is not $direction:bareword
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string direction is not $direction:bareword
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string direction is not $direction:bareword
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```

---

Back to [[Actions]]
