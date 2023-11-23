# `on_tick`

See: [[Script Slots]]

`on_tick` [[scripts]] continuously evaluate every game tick. Once an `on_tick` script reaches the end of its list of actions, the script will return to the beginning of the currently set script and run again on the next game tick.

A [[Maps|map]]'s `on_tick` script slot is a logical place for a script that watches for whether the player enters a [[doors|doorway]], but `on_tick` scripts are useful for other kinds of watch scripts, too, such as changing an entity's idle behavior after a condition has been met.

`on_tick` slots are what you should use if you want to be able to interrupt or abort a script at an arbitrary place or time e.g. with a button press, or when the player crosses a [[Vector Objects|collision trigger]], etc.

To terminate an `on_tick` script, it must [[RUN_SCRIPT|run]] [[null_script]] as one of its actions, or another script must tell it to switch to `null_script`.
