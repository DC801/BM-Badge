# Scripts (JSON)

NOTE: With the introduction of [[MGS Natlang]], you need not write [[scripts]] with JSON, but it still may be useful to understand the JSON structure for debugging purposes. See: [[Script Block]]

## Example Script File

(DEPRECATED: `goto index` and other features of [[MGS Natlang]] make this kind of script management unnecessary; this page is a historical artifact!)

#updateme

Remember that strings, including property names, must always be enclosed in double quotes. Numbers and booleans (`true`/`false`) must not have quotes. Multiple items in a single object literal or array must be separated by commas.

	01	{
	02		"show_dialog-alice-start": [
	03			{
	04				"action": "CHECK_SAVE_FLAG",
	05				"save_flag": "alice-backstory",
	06				"expected_bool": true,
	07				"success_script": "show_dialog-alice-summary"
	08			},
	09			{
	10				"name": "SHOW_DIALOG",
	11				"dialog": "dialog-alice-start"
	12			},
	13			{
	14				"name": "SET_SAVE_FLAG",
	15				"save_flag": "alice-backstory",
	16				"bool_value": true
	17			}
	18		],
	19		"show_dialog-alice-summary": [
	20			{
	21				"name": "SHOW_DIALOG",
	22				"dialog": "dialog-alice-summary"
	23			},
	24			{
	25				"name": "SET_ENTITY_INTERACT_SCRIPT",
	26				"entity": "%SELF%",
	27				"script": "show_dialog-alice-start"
	28			}
	29		]
	30	}

This demonstrates the simple branching that scripts use to produce different entity behaviors.

In this case, we want Alice to give her backstory the first time you speak to her, and a summary of her backstory thereafter.

When we interact with Alice, her [[on_interact]] script is run: `show_dialog-alice-start`, which is found on line 2. During the course of this script, we set a save flag (`alice-backstory`) to `true` (line 14). After the last action is run, the script ends.

The next interaction will run the last `on_interact` script used, which happens to be her start script again. But this time, since `alice-backstory` is `true`, the script immediately branches, and instead the game runs the script called `show_dialog-alice-summary`, found on line 19.

After showing the alternate dialog, the script sets Alice's `on_interact` script to her start script (line 25). Note that if we didn't do this, interacting with her after hearing her backstory summary would result in `show_dialog-alice-summary` being run again, which in this case is actually what we want. But if there were more than one branch in Alice's logic, failing to reset the `on_interact` would result in the other branches being completely ignored. Therefore, all branches should end by setting the entity's `on_interact` script to their start script.

![flowchart of Alice's behavior](media/script-alice.png)

For scripts with very complex branching, it can be beneficial to plot them out (and color code them!). This chart was done with [diagrams.net](https://app.diagrams.net/), but other graphics software (or a pen and paper) might be used instead.

For subsequent examples, I'll be using this flow-chart-esque format to demonstrate script behaviors. For these charts, each column represents a different script (named at the top of each column by a rectangle), and the script under the stick figure indicates the entity's default `on_interact` script.
