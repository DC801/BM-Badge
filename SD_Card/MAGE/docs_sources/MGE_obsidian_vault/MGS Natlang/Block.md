# Block

A basic unit of [[MGS Natlang structure]].

The contents (body) of each [[MGS Natlang]] block is enclosed in a pair of matching curly braces:

```
BLOCK DECLARATION { BLOCK BODY }
```

Some block types can (or must) be nested within others. Note that blocks cannot be nested arbitrarily.

## Block Types

The following list includes all block nesting relationships.

Indented entries can only be used within the parent's block body. Unindented entries occur at the document root level. Items in parentheses are not blocks themselves, but are used only inside their parent block's contents.

- [[Dialog Settings Block]]: `settings (for) dialog {}`
	- [[Dialog Settings Target Block]]: `<TARGET> {}`
		- *([[Dialog Parameters (MGS)]])*
- [[Serial Dialog Settings Block]]: `settings (for) serial dialog {}`
	- *([[Serial Dialog Parameters (MGS)]])*
- [[Dialog Block]]: `dialog $string {}`
	- *([[Dialogs (MGS)]])*
- [[Serial Dialog Block]]: `serial dialog $string {}`
	- *([[Serial Dialogs (MGS)]])*
- [[Script Block]]: `$string {}`
	- [[Combination Block]]
	- *([[Actions]])*
	- *([[Labels]])*

([[Macros]] are not included in the list above.)

