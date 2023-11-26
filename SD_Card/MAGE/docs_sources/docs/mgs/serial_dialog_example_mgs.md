# Serial Dialog Example (MGS)

An example [MGS Natlang](../mgs/mgs_natlang) [serial dialog block](../mgs/serial_dialog_block):

```mgs
serial dialog sample {
	"Hey, can anyone hear me? Hello?"
	# "Yes, I can hear you." : goto script sampleYes
	# "What did you say?" : goto script sampleNo
}
```

becomes:

```
Hey, can anyone hear me? Hello?
	0: Yes, I can hear you.
	1: What did you say?

>_
```

In the above case, the player is locked out of further action until they give the answer `0` or `1`. Failure results in a repeat of the whole serial dialog.
