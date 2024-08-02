# CLOSE_SERIAL_DIALOG

Ends any [serial dialog](../serial_dialogs) that is awaiting user input, such as a [free response question or a multiple choice question](../serial-dialog#options).

## Example JSON

```json
{
  "action": "CLOSE_SERIAL_DIALOG"
}
```

## MGS Natlang

### Example

```mgs
script {
  end serial dialog;
}
```

### Dictionary entry

```
end serial dialog (;)
```
