# Cutscenes

### General Tips

- Separate the [[scripts|script]] for the cutscene itself (unless you want to hide it behind mandatory logic checks somehow).
- Set a "saw the cutscene" [[save flags|save flag]] to `true` at the end of the cutscene so that an accidental (or deliberate) map reload doesn't cut off the end.
- Multi-segment cutscenes: since you can [[map loads|reset the map]] at any point, long cutscenes punctuated by periods of player control may need to use a different save flag for each piece, and then the map's [[on_load]] (or whatever) may need to check for each piece and make the correct changes (according to which parts of the cutscene have happened).
	- We actually did this for the TUESDAY cutscene in BMG2020. Otherwise, the player would have had to start the (long) cutscene over from scratch if they reset the map partway through — and since the "deja vu" book was in that room, there was a good chance of that.
### Credits Sequence

Traditional game credits can be accomplished with a separate credits [[Maps|map]] and a [[Tilesets|tileset]] for your credits text.

In your credit's `on_load`, you should probably [[SET_PLAYER_CONTROL|turn off player control]] (or at least [[SET_HEX_EDITOR_STATE|turn off the hex editor]]) before anything else happens.

To scroll the credits, lock the camera to a [[Vector Objects|vector path]] and pan it along the path (or pan it to a destination object). (Camera panning to vector objects currently unimplemented; instead, lock the camera to a [[null entity]] and make it do the correct motion.)

To cut to another credits page, space your text according to the screen size and create vector objects for the camera to teleport between. Optionally, [[SCREEN_FADE_IN|fade in]] and [[SCREEN_FADE_OUT|out]] between teleports.

Don't forget to [[SET_PLAYER_CONTROL|re-enable player control]] etc. when the credits are done!

(Feel free to experiment with other styles of game credits; you need not be bound to traditional cinematic tropes. E.g. some games have a "credits" building featuring characters that correspond to the game's developers, and who might say a few sentences about what their job was.)
