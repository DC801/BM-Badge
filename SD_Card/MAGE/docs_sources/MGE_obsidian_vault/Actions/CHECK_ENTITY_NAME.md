# CHECK_ENTITY_NAME

Checks an [[entities|entity]]'s [[Printing Current Values|current name]].

## Example JSON

```json
{
  "action": "CHECK_ENTITY_NAME",
  "entity": "Entity Name",
  "expected_bool": true,
  "string": "some kind of string",
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_NAME",
  "entity": "Entity Name",
  "expected_bool": true,
  "jump_index": 12,
  "string": "some kind of string"
}
```

## MGS Natlang

The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">name</span> <span class="operator">is</span> <span class="string">"some kind of string"</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">name</span> <span class="operator">is</span> <span class="string">"some kind of string"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">name</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">"some kind of string"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">name</span> <span class="operator">is</span> <span class="string">"some kind of string"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">name</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">"some kind of string"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>

</pre>

### Dictionary entries:

```
if entity $entity:string name is $string:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string name is not $string:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string name is $string:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string name is not $string:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false
```

---

Back to [[Actions]]