# Dialog Example (MGS)

An example [MGS Natlang](mgs/mgs_natlang) [dialog block](mgs/dialog_block), consisting of three [dialogs](mgs/dialogs_mgs):

```mgs
dialog exampleDialog {
  Bob1
  "So I heard about this club...."

  Bob2
  alignment BR
  "Oh, no. Don't you start."

  Bob1
  "No, no, I swear! Hear me out!"
  > "Fine. What club?"
    : goto bobContinueScript
  > "(walk away)"
    : goto bobLeaveScript
  > "(smack %Bob% with a rubber chicken)"
    : goto bobNoveltyScript
}
```

Note: white space doesn't matter, so the first option above could very well have been written this way:

```mgs
> "Fine. What club?" : goto bobContinueScript
```
