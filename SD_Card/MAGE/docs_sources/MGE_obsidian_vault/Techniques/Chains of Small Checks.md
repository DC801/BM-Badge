# Chains of Small Checks

#updateme

This is most likely required for a [[maps|map]]'s [[on_load]] script, but there are other times you might want a chain of small optional behaviors at the beginning of a script. For an example, here are some of the things the BMG2020 main map must check when loaded:

- Is it a brand new game? If so, branch: put the player in their bedroom in the mage house. (Script diverts to a dead end.)
- Has Bob Moss's quest been completed? If so, teleport him off screen to [[Hiding an Entity|hide]] him. (Resume remainder of script either way.)
- Has the rake ever been laked? If so, teleport rake to lake. (Resume remainder of script either way.)
- Has the goat Billy ever been unglitched? If so, unglitch again now. (Resume remainder of script either way.)
- (more glitch checks)
- Have the sheep been returned to their pen at some point? If so, return them again now. (Resume remainder of script either way.)
- Has Bender's ass been restored? If so, restore it again now. (Resume remainder of script either way.)
- Has the "walk to lodge" cutscene been seen before? If not, play it now. (Script diverts to a dead end.)
- (more cutscene checks)
- Is the [[warp_state]] `enter_from-greenhouse`? If so, branch: run the `enter_from-greenhouse` script, which teleports the player to the greenhouse door and walks the player down a few pixels. (Script diverts to a dead end.)
- (more [[warp_state]] checks)

Unfortunately, the only way to do this is with a lot of tiny scripts. (This is one reason you might want to put `on_load` in the script name for all scripts like this — so you know what kind of a chain you're looking at.)

![flowchart of a series of small scripts](media/script-chain.png)

For chains like this, it can be beneficial to aggressively split scripts so that you can quickly and easily identify each step of logic, which makes it easier to tune branching or insert additional checks. Abstracting the initial [[on_load]] script will help, too — so the script running the logic check can be named appropriately while allowing the name of the map's `on_load` script to remain consistent (rather than having to manage the name of the map's `on_load` script from within Tiled).

To genericize a chain:

- **[Start Script]**
	- Run <span style="color: #f00;">**"X Check"**</span>
- <span style="color: #f00;">**[X Check]**</span>
	- Check if X happened. If yes, run <span style="color: #900">**"Fix X"**</span>
	- Run <span style="color: #00f;">**"Y Check"**</span>
- <span style="color: #900;">**[Fix X]**</span>
	- Fix X
	- Run <span style="color: #00f;">**"Y Check"**</span>
- <span style="color: #00f;">**[Y Check]**</span>
	- Check if Y happened. If yes, run <span style="color: #009;">**"Fix Y"**</span>
	- Run <span style="color: #0a0;">**"Z Check"**</span>
- <span style="color: #009;">**[Fix Y]**</span>
	- Fix Y
	- Run <span style="color: #0a0;">**"Z Check"**</span>
- Etc.
