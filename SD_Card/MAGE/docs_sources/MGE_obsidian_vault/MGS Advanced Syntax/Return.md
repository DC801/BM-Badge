# Return

Advanced [[MGS Natlang]] syntax (specifically for [[Scripts (MGS)|MGS Natlang scripts]]).

`return` is a keyword that will end the current [[scripts|script]] early.

This will not prevent [[on_tick]] scripts from looping on the next game tick, however; if you want to stop an `on_tick` script for good, you must explicitly `goto null_script`.

## Returning a value

This keyword will not "return" a value to the script's "caller;" it simply sets the action index past the end of the script, causing it to immediately end.

If you want to emulate value-returning behavior, you might try assigning a value to a common variable as a script's last action, then have another script [[COPY_SCRIPT]] it and use the common variable like normal.
