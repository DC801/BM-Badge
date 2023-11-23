# Kaitai

Kaitai ([ide.kaitai.io](https://ide.kaitai.io)) is a tool that can parse and analyze binary data formats.

Available inside your [[MAGE folder]] is a file called `mage_dat.ksy`. You can drag this in a Kaitai window, along with your `game.dat`, to analyze in great detail the encoded structure of your game.

This tool lets you easily see the relationship between the hex value of a script/entity_type/dialog/etc. and its name. E.g. if an [[entities|entity]]'s [[on_tick]] was being changed unexpectedly, but you only knew the hex value that it's being changed to (perhaps using the [[hex editor]], using Kaitai to find the name of the script in question can help you track down the problem.