# CHECK_ENTITY_PATH

Checks the `path` name ([[Vector Objects|geometry]]) of an [[entities|entity]].

## Example JSON

```json
{
  "action": "CHECK_ENTITY_PATH",
  "entity": "Entity Name",
  "expected_bool": true,
  "geometry": "vector object name",
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_PATH",
  "entity": "Entity Name",
  "expected_bool": true,
  "geometry": "vector object name",
  "jump_index": 12
}
```

## MGS Natlang

The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">path</span> <span class="operator">is</span> <span class="string">"vector object name"</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">path</span> <span class="operator">is</span> <span class="string">"vector object name"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">path</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">"vector object name"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">path</span> <span class="operator">is</span> <span class="string">"vector object name"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">path</span> <span class="operator">is</span> <span class="operator">not</span> <span class="string">"vector object name"</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>

</pre>

### Dictionary entries:

```
if entity $entity:string path is $geometry:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string path is not $geometry:string
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string path is $geometry:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string path is not $geometry:string
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false
```

---

Back to [[Actions]]
