# Operator

One of the [MGS Natlang variable](../../mgs/variables_mgs) types.

An exhaustive list:

- equal sign: `=`
- plus: `+`
- hyphen: `-`
	- If a `-` is directly before a [number](../../mgs/variables/number), the number will become negative. Be sure to put a space between a `-` and a number if you want the `-` to be interpreted as an operator.
- asterisk: `*`
- forward slash: `/`
- percent sign: `%`
- question mark: `?`
- curly braces: `{` and `}` (for block boundaries)
- parentheses: `(` and `)` (for macros)

[Actions](../../Actions) that call for an operator will also accept the corresponding bare words `SET`, `ADD` etc.
