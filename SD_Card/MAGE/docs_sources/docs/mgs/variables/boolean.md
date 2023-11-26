# Boolean

One of the [MGS Natlang variable](mgs/variables_mgs) types.

A binary option.

- True: `true`, `yes`, `on`, `open`
- False: `false`, `no`, `off`, `closed`, `close`

Some actions will prefer specific pairs of booleans when being translated from JSON, but when translating the other way, any of the above words will work. E.g.

- `turn player control open;`
- `turn player control on;`
- `turn player control true;`

(This may change someday, so best use the one that feels most coherent.)
