# CHECK_ENTITY_TYPE

Checks whether a [[character entity]] is currently the given `entity_type`.

This action is useful because you can check entity types by name, which is easy and convenient (e.g. check if the entity "Delmar" is the type `old_man`). Otherwise you'd have to use a mix of [[CHECK_ENTITY_PRIMARY_ID]] and [[CHECK_ENTITY_PRIMARY_ID_TYPE]] and also know in advance which ints you're checking for.

## Example JSON

```json
{
  "action": "CHECK_ENTITY_TYPE",
  "entity": "Entity Name",
  "entity_type": "old_man",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_TYPE",
  "entity": "Entity Name",
  "entity_type": "old_man",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">type</span> <span class="operator">is</span> <span class="string">old_man</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">type</span> <span class="operator">is</span> <span class="string">old_man</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">type</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">old_man</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">type</span> <span class="operator">is</span> <span class="string">old_man</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">type</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">old_man</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>

</pre>

### Dictionary entries:

```
if entity $entity:string type is $entity_type:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string type is not $entity_type:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string type is $entity_type:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string type is not $entity_type:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false
```

---

Back to [[Actions]]
