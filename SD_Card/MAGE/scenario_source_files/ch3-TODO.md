# Ch3 brainstorming

## Puzzle framing device

Depending on how filesystem-y we can pretend to be on the hardware side, we might have to lean on NPCs as stand-ins for unix commands. The player would speak to them, choose among several to accompany them into puzzle rooms, or daisy chain them (perhaps up to 3 or 4 deep) to solve puzzles in the vein of Gobliiins or Trine.

Graphics for Emacs, Vim, and Nano are done; the thought being, if you need a text editor, you can choose between them (with no real consequence) and they can follow you around.

### Taking the metaphor to logical conclusions

- NPC = unix command
- Rooms = directories (?)
- File = what?
    - Clickables in the room?
- Permissions = locks

### Common Unix commands

Might try a few basic CTFs to see what they normally entail

- Man: tells you about what commands do
- Ls: lists what's in the room?
    - Seems dumb to need to bring it everywhere, otherwise you'd need to know exactly what the files are in advance.
    - Perhaps it's not an NPC but a skill, like the Flash HM.
    - Or maybe you unlock args for it.
- Rm: kills files

Seems to me that having certain ones don't work well as NPCs, e.g. `ls`. You just need it too muc if you don't know exactly what files are there to start with. With visual rooms it wouldn't make sense at all to work in the dark.

Maybe the computer is broken, so the programs are stuck in corporeal form until you get enough McGuffin to "free" them, then you can use them like a normal program? (While still trying to avoid using the serial terminal for this, since we couldn't exactly do that for ch2 anyway. Dang it, this is a dead end, isn't it?)

## Goals

- Teach player intermediate filesystem skills.
    - Might need to teach beginner skills, too, given *gestures vaguely at everything*
- Should be a pretend filesystem, like Exa Punks is pretend assembly.
    - This makes it easier to pretend, since we can't pretend very well.
- Make the player interact with Unix programs like NPCs.
    - They can associate personalities and appearances to them, as well as their uses as applied in metaphor for the puzzle.
- Teaching basic CTF strategies is a plus.