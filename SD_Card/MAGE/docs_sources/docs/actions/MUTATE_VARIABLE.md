# MUTATE_VARIABLE

Manipulate the value of a specific [variable](../scripts/integer_variables) or set it to a new value.

See [operations](../structure/operations).

## Example JSON

```json
{
  "action": "MUTATE_VARIABLE",
  "operation": "ADD",
  "value": 1,
  "variable": "varName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">mutate</span> <span class="string">varName</span> <span class="operator">+</span> <span class="number">1</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
mutate $variable:string $operation:operator $value:number (;)
```

---

Back to [Actions](../actions)
