# MUTATE_VARIABLES

Manipulate the value of a specific [variable](../scripts/integer_variables) by using the value of another variable.

See [operations](../structure/operations).

## Example JSON

```json
{
  "action": "MUTATE_VARIABLES",
  "operation": "ADD",
  "source": "otherVar",
  "variable": "varName"
}
```

## MGS Natlang

### Example:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">mutate</span> <span class="string">varName</span> <span class="operator">+</span> <span class="string">otherVar</span><span class="terminator">;</span>

</pre>

### Dictionary entry:

```
mutate $variable:string $operation:operator $source:string (;)
```

---

Back to [Actions](../actions)
