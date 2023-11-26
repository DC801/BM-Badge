# SLOT_LOAD

This brings the [save data](../scripts/save_data) associated with that slot into RAM.

The slot is set to `0` by default.

## Example JSON

```json
{
  "action": "SLOT_LOAD",
  "slot": 2
}
```

## MGS Natlang

### Example

```mgs
script {
  load slot 2;
}
```

### Dictionary entry

```
load slot $slot:number (;)
```
