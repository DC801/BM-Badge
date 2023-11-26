# CHECK_ENTITY_SECONDARY_ID

Checks whether an [entity](../entities) has the given [secondary_id](../entity types).

This entity property is only useful on [tile entities](../entities/tile_entity), where the `secondary_id` determines which tile in the tileset is displayed.

Tiles are referenced by their index, starting at the top and going toward the right (0-indexed). Click on the tile within Tiled to see its ID.

## Example JSON

```json
{
  "action": "CHECK_ENTITY_SECONDARY_ID",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_u2": 32,
  "success_script": "successScript"
},
{
  "action": "CHECK_ENTITY_SECONDARY_ID",
  "entity": "Entity Name",
  "expected_bool": true,
  "expected_u2": 32,
  "jump_index": 12
}
```

## MGS Natlang

The [condition](../actions/conditional_gotos) portion of this action can be used inside an [if](../mgs/advanced_syntax/if_and_else) condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">secondary_id</span> <span class="operator">is</span> <span class="number">32</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">secondary_id</span> <span class="operator">is</span> <span class="number">32</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">secondary_id</span> <span class="operator">is</span> <span class="number">32</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">secondary_id</span> <span class="operator">is</span> <span class="number">32</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">secondary_id</span> <span class="operator">is</span> <span class="operator">not</span> <span class="number">32</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">secondary_id</span> <span class="operator">is</span> <span class="operator">not</span> <span class="number">32</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="">;</span>
  <span class="control">if</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">secondary_id</span> <span class="operator">is</span> <span class="operator">not</span> <span class="number">32</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="">;</span>

</pre>

### Dictionary entries:

```
if entity $entity:string secondary_id is $expected_u2:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if entity $entity:string secondary_id is $expected_u2:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if entity $entity:string secondary_id is $expected_u2:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if entity $entity:string secondary_id is not $expected_u2:number
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if entity $entity:string secondary_id is not $expected_u2:number
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if entity $entity:string secondary_id is not $expected_u2:number
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```

---

Back to [Actions](../actions)
