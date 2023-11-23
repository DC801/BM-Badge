# Conditional Gotos

Consists of actions from the check [[entity properties]] and check [[Variable Types|variables]] categories. The "conditions" portion of each [[actions|action]] can be inserted into any of the following patterns:

1. [[If and else]]: `if (` ... `) { }`
	- NOTE: This expands to the [[labels|label]] jump pattern automatically.
2. [[Scripts|Script]] jump version: `if` ... `then goto (script) $success_script:string`
3. Label jump version: `if` ... `then goto label $success_script:string`
	- This pattern is to be used with bareword [[labels]].
4. Index jump version: `if` ... `then goto index $success_script:number`
	- Refers to the target [[actions|action]] by the absolute index within the script.
	- This is not recommended for scripts written by hand, as [[COPY_SCRIPT]] and automatic syntax expansion may result in an unexpected number of actions in your scripts.
