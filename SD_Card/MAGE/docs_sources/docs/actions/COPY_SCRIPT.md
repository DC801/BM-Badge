# COPY_SCRIPT

The [MGE encoder](../encoder/mge_encoder) literally copies all the actions from the copied [script](../scripts) and inserts them where `COPY_SCRIPT` is being used. This happens recursively.

`COPY_SCRIPT` converts and adapts [label](../mgs/advanced_syntax/labels) references, jumps that eventually become action indices, when copied. Feel free to use `COPY_SCRIPT` for literally any script you want!

See: [COPY_SCRIPT_uses](../techniques/COPY_SCRIPT_uses)

## Example JSON

```json
{
  "action": "COPY_SCRIPT",
  "script": "scriptName"
}
```

## MGS Natlang

### Example

```mgs
script {
  copy scriptName;
}
```

### Dictionary entry

```
copy (script) $script:string (;)
```

---

Back to [Actions](../actions)
