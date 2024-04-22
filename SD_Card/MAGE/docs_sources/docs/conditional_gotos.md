---
next: mgs/mgs_natlang.md
---

# Conditional Gotos

Consists of actions from the check [entity properties](entity_properties) and check [variables](variables) categories. The "conditions" portion of each of those [actions](actions) can be inserted into any of the following patterns:

1. [Zigzag](#zigzag-if--else) macro: `if ( ... ) { }`
	- NOTE: This expands to the label jump pattern automatically.
2. Script jump version: `if ... then goto (script) _`
3. Label jump version: `if ... then goto label _`
	- This pattern is to be used with bareword [labels](#labels).
4. Index jump version: `if ... then goto index _`
	- Refers to the target action by the absolute index within the script.
	- This is not recommended for scripts written by hand, as `COPY_SCRIPT` and automatic syntax expansion may result in an unexpected number of actions in your scripts.
