# COPY_VARIABLE

Copies the value of an [[entities|entity]] [[Entity Properties|property]] into a [[Integer Variables|variable]] or vice versa.

## Example JSON

```json
{
  "action": "COPY_VARIABLE",
  "entity": "Entity Name",
  "field": "x",
  "inbound": true,
  "variable": "varName"
}
```

## MGS Natlang

### Examples:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">copy</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">x</span> <span class="">from</span> <span class="sigil">variable</span> <span class="string">varName</span><span class="terminator">;</span>
  <span class="verb">copy</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">x</span> <span class="">into</span> <span class="sigil">variable</span> <span class="string">varName</span><span class="terminator">;</span>
  <span class="verb">copy</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="">from</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">x</span><span class="terminator">;</span>
  <span class="verb">copy</span> <span class="sigil">variable</span> <span class="string">varName</span> <span class="">into</span> <span class="sigil">entity</span> <span class="string">"Entity Name"</span> <span class="target">x</span><span class="terminator">;</span>

</pre>

### Dictionary entries:

```
copy entity $entity:string $field:bareword from variable $variable:string (;)
	// built-in value: inbound = false

copy entity $entity:string $field:bareword into variable $variable:string (;)
	// built-in value: inbound = true

copy variable $variable:string from entity $entity:string $field:bareword (;)
	// built-in value: inbound = true

copy variable $variable:string into entity $entity:string $field:bareword (;)
	// built-in value: inbound = false
```

---

Back to [[Actions]]
