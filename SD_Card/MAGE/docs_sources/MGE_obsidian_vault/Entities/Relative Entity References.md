# Relative Entity References

- [[%SELF%]] — the entity running the script
- [[%PLAYER%]] — the player entity

Unlike relative entity names, you can use these two **relative entity references** everywhere, including the arguments of actions.

## Example

#updateme

Let's say we have two entities:

1. Bender
2. Strong Bad

Plus the `%PLAYER%` entity:

3. Bob

And the script:

```json
"dialog-introduction": [
	{
		"alignment": "BOTTOM_LEFT",
		"entity": "%SELF%",
		"messages": [
			"So you're %PLAYER%, huh?\nWell, My name is %SELF%!",
			"Got it memorized?"
		]
	}
]
```
If the entity Bender ran the script above, you would see the following dialog boxes:

> **Bender**:<br>
> So you're Bob, huh?<br>
> Well, my name is Bender!<br>

> **Bender**:<br>
> Got it memorized?

Because Bender was the entity running the script, the MGE interpreted `%SELF%` to be `Bender`.

If the same script were run by Strong Bad instead, the `%SELF%` reference would be `Strong Bad` instead:

> **Strong Bad**:<br>
> So you're Bob, huh?<br>
> Well, my name is Strong Bad!<br>

> **Strong Bad**:<br>
> Got it memorized?

#### Best Practice: Consistent References

All [entity references](#relative-entity-names-and-references) should be consistent within a dialog, whether they are relative or absolute references. If there are multiple dialogs inside the same script, they should be consistent with each other, as well.

If we change `entity` to `Bender` instead of `%SELF%`, but leave the `%SELF%` reference in the dialog `messages` alone, the conversation would appear correct if run by Bender, but no one else.

```json
"dialog-introduction": [
	{
		"alignment": "BOTTOM_LEFT",
		"entity": "Bender",
		"messages": [
			"So you're %PLAYER%, huh?\nWell, My name is %SELF%!",
			"Got it memorized?"
		]
	}
]
```

If Strong Bad runs the above dialog:

> **Bender**:<br>
> So you're Bob, huh?<br>
> Well, my name is Strong Bad!<br>

> **Bender**:<br>
> Got it memorized?<br>

**NOTE:** the `entity` property is already a relative reference, whereas `name` is not. So if Bender's in-game name were changed by the player or a script — let's change it to Flexo for the sake of this example — then the dialog would still appear consistent (as long as Bender was the one running the script):

> **Flexo**:<br>
> So you're Bob, huh?<br>
> Well, my name is Flexo!<br>

> **Flexo**:<br>
> Got it memorized?<br>

However, if you were using `name` instead of `entity`, then you would begin to have issues even when the correct entity is running the script:

```json
"dialog-introduction": [
	{
		"alignment": "BOTTOM_LEFT",
		"name": "Bender",
		"messages": [
			"So you're %PLAYER%, huh?\nWell, My name is %Bender%!",
			"Got it memorized?"
		]
	}
]
```

> **Bender**:<br>
> So you're Bob, huh?<br>
> Well, my name is Flexo!<br>

> **Bender**:<br>
> Got it memorized?<br>

In such a case, you would want to use `%Bender%` for `name` so that your dialog message and dialog label would be consistent.