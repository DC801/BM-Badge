# Ch2 Bling Mode (best practices)

(Note, this guide is for natlang (MGSv1), not mathlang (MGSv2).)

For those wanting to add a new bling mode to the game… including us!

## Types of bling

1. **Slideshow**: Displays a selection of bling "slides."
    1. **Auto mode**: Advances to the next slide after a set window of time. Press any button to exit.
    2. **Manual mode**: Switch slides with the left and right buttons on either joystick. Press `HAX` to exit.

- **Standalone**: Displays a specific bling from a choice of several options.
    - Press any button to exit most normal bling.
    - Press `HAX` to exit interactive bling.

## Preparing your bling map and its scripts

### Map's `on_tick`

Don't use the map's `on_tick` for anything. It's being used automatically to
detect when to return to the menu and/or switch to another bling slide.

Any custom `on_tick` behavior must be managed with a placeholder entity's
`on_tick` instead.

### Map's `on_load`

You must `COPY_SCRIPT` `on_load_bling_mode_map` in your map's `on_load`. This
will automatically put the map in a rotating mode (manual or auto) or a
standalone mode.

- Other `on_load` behaviors may happen after this, since `on_load_bling_mode_map` does not branch.
- If you want player control to be on (i.e. if you want the camera to be movable) you must turn it on _after_ copying `on_load_bling_mode_map`, as that script turns it off.
- Keep the hex editor off, as the `HAX` button is currently the universal way to leave all bling modes.

### Entities

Your map _must_ have an entity named "Timer" and another named "Math," even if
the map is not part of a rotating bling slideshow. This is because the encoder
cannot detect when these entities are not used, and it will look for them in
_every_ bling map.

- "Timer" is used to count down and advance the slideshow when time is up. (Auto slideshow only.)
- "Math" is used to determine what the next slide is. (Auto and manual slideshows.)

## Other preparation

1. Adjust the main menu to add a new option for the new bling map. (todo: decide what to do when this list gets very big)
    - If you're adding the bling map to the bling slideshow, you don't necessarily _need_ to add it as a new menu option, too, but you can if you want. (Probably best to keep the menu list short, though.)
2. Add a new `start_bling` script. See existing scripts for examples.
    - Before loading the bling map, set the flag `bling_hax_button_only`:
        - `true`: exit with JUST the `HAX` keypress. (E.g. bling maps with a moveable camera)
        - `false`: exit with ANY keypress.
        - Set this flag either way to avoid old values leaking into the new bling map's behavior.
3. For slideshow bling maps:
    - Increment `$maxBling`. (It should be one less than the total number of bling maps.)
    - Add the map to `bling_goto_branches` using the existing pattern.
        - The actual order within the script doesn't matter, just the numbers themselves.
        - Feel free to adjust the order of the existing bling slides. Naturally, `0` will be the first one loaded.
