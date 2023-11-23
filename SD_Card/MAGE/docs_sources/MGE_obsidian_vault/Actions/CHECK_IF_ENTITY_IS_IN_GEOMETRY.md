# CHECK_IF_ENTITY_IS_IN_GEOMETRY

Checks whether an [[entities|entity]] is inside the named [[Vector Objects|geometry]].

This action can behave erratically if any of the vertices in the geometry object are subject to [[coordinate underflow]].

## Example JSON

```json
{
  "action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
  "entity": "Entity Name",
  "expected_bool": true,
  "geometry": "vector object name",
  "success_script": "successScript"
},
{
  "action": "CHECK_IF_ENTITY_IS_IN_GEOMETRY",
  "entity": "Entity Name",
  "expected_bool": true,
  "geometry": "vector object name",
  "jump_index": 12
}
```

## MGS Natlang

The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="">inside</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="">inside</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="">inside</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="">inside</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="operator">not</span> <span class="">inside</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="operator">not</span> <span class="">inside</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="operator">is</span> <span class="operator">not</span> <span class="">inside</span> <span class="sigil">geometry</span> <span class="string">"vector object name"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
if entity $entity:string is inside geometry $geometry:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string is inside geometry $geometry:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string is inside geometry $geometry:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string is not inside geometry $geometry:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string is not inside geometry $geometry:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string is not inside geometry $geometry:string
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```

---

Back to [[Actions]]
