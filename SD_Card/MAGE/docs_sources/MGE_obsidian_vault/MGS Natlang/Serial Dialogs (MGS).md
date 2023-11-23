# Serial Dialogs (MGS)

(For the JSON equivalent, see [[Serial Dialogs (JSON)]])

The [[Serial Dialogs|serial dialog]] structure for [[MGS Natlang]], found within [[serial dialog block|serial dialog blocks]] (and related [[Combination Block|combination blocks]]).

Serial dialogs contain text meant to be shown via the serial console ([[terminal]]). They are called serial "dialogs" because they are similar to [[dialogs]] in many respects, but they are made up of messages alone and needn't be used for dialog specifically.

## Structure

1. [[Serial Dialog Parameters (MGS)|Serial dialog parameter]]: 0+
2. [[Serial Dialog Messages (MGS)|Serial dialog message]]: 1+
3. [[Serial Dialog Options (MGS)|Serial dialog option]]: 0+

NOTE: unlike with conventional [dialogs](#dialog), serial dialog blocks cannot contain more than one serial dialog. In other words, inside a serial dialog block, no parameters can be given after a serial message, and nothing can come after a serial option (except more options).

See: [[Serial Dialog Block]]
