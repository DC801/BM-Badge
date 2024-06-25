# CLOSE_DIALOG

Ends any open [dialog](../dialogs).

Use this [action](../actions) when you want to trigger a dialog that may potentially interrupt a dialog in progress. Otherwise, the two dialogs may collide, which can result in a soft lock.

## Example JSON

```json
{
  "action": "CLOSE_DIALOG"
}
```

## MGS Natlang

### Example

```mgs
script {
  end dialog;
}
```

### Dictionary entry

```
end dialog (;)
```
