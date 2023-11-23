# CHECK_FOR_BUTTON_PRESS

Checks whether a button was actively pressed down that game tick.

That is, the game keeps track of button state changes each game tick, and this action detects whether the target button had a change of state from *not pressed* to *pressed* that game tick. If the target button was *already pressed* when this action runs, this action will not result in a script branch.

To instead check the button's state (regardless of whether that state has changed) see [[CHECK_FOR_BUTTON_STATE]].

NOTE: The button states are reset when a [[map loads|new map is loaded]]. If listening for a button press in the new map, this action may very will trigger immediately, even if the button was held down through the map load.

See [[button IDs]] for a list of valid button values.

## Example JSON

```json
{
  "action": "CHECK_FOR_BUTTON_PRESS",
  "button_id": "SQUARE",
  "expected_bool": true,
  "success_script": "successScript"
},
{
  "action": "CHECK_FOR_BUTTON_PRESS",
  "button_id": "SQUARE",
  "expected_bool": true,
  "jump_index": 12
}
```

## MGS Natlang

The [[Conditional Gotos|condition]] portion of this action can be used inside an [[If and Else|if]] condition statement, e.g.

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="bracket">(</span><span class="sigil">button</span> <span class="language-constant">SQUARE</span><span class="bracket">)</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="control">if</span> <span class="sigil">button</span> <span class="language-constant">SQUARE</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">button</span> <span class="language-constant">SQUARE</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="sigil">button</span> <span class="language-constant">SQUARE</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="operator">not</span> <span class="sigil">button</span> <span class="language-constant">SQUARE</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="script">successScript</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="operator">not</span> <span class="sigil">button</span> <span class="language-constant">SQUARE</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">index</span> <span class="number">12</span><span class="terminator">;</span>
  <span class="control">if</span> <span class="operator">not</span> <span class="sigil">button</span> <span class="language-constant">SQUARE</span>
    <span class="control">then</span> <span class="control">goto</span> <span class="sigil">label</span> <span class="string">labelName</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
if button $button_id:bareword
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = true

if button $button_id:bareword
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = true

if button $button_id:bareword
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = true

if not button $button_id:bareword
    then goto (script) $success_script:string (;)
	// built-in value: expected_bool = false

if not button $button_id:bareword
    then goto index $jump_index:number (;)
	// built-in value: expected_bool = false

if not button $button_id:bareword
    then goto label $jump_index:bareword (;)
	// built-in value: expected_bool = false
```

---

Back to [[Actions]]
