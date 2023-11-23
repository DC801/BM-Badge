# Conditional Gotos

Consists of actions from the check entity properies and check variables categories. All "conditions" can be inserted into either of the following patterns:

1. [[If and Else]]: `if (` ... `) { }`
	- NOTE: This expands to the label jump pattern automatically.
2. Script jump version: `if` ... `then goto (script) $success_script:string`
3. Label jump version: `if` ... `then goto label $success_script:string`
	- This pattern is to be used with bareword [[labels]].
4. Index jump version: `if` ... `then goto index $success_script:number`
	- Refers to the target action by the absolute index within the script.
	- This is not recommended for scripts written by hand, as \`COPY_SCRIPT\` and automatic syntax expansion may result in an unexpected number of actions in your scripts.

The example syntax in the following entries is to be inserted into the "condition" part of the patterns above.