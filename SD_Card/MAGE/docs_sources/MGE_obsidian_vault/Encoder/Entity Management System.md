# Entity Management System

The web encoder has a few entity management tools. To use them, you must first upload your `scenario_source_files/` folder to the [[Web Encoder]].

NOTE: Changes you make using these tools are not automatically perpetuated to the `game.dat`, nor are they automatically saved to your filesystem. To make your changes permanent:

1. Click the "Copy" button in the red box to put the new [[entity_types.json]] content into your clipboard.
2. Manually paste into your [[entity_types.json]] file, replacing all previous content.
3. Run the encoder again to perpetuate the changes to a new `game.dat`.

## New `entity_type`

In the "Entity Type Editor," type the name of the new `entity_type` ([[character entity]]) you wish to create, then click "Create."

You will then be given a drop-down list of tilesets that the encoder found. Select the one you want your new entity to use.

Tilesets will not appear in this list unless they are actually used by the game in some way, so to guarantee they appear, you might want to place them into one of your game maps first.

The animation pane and tileset pane will now appear.

## Edit Existing `entity_type`

To instead edit an existing `entity_type` ([[character entity]]), use the drop-down list to choose one, and then the animation and tileset panes will appear.

## Animation Pane

![the MGE encoder's animation pane](media/mge-encoder-animation-pane.gif)

There is one animation tile slot for each cardinal direction: north, east, south, west.

Each animation tile can be horizontally or vertically flipped, as well — simply click the arrows underneath the tile to flip it. (Click again to reverse the flip.)

To add an additional animation, press the "Add Animation" button. To remove one, click the red X.

Entities should have idle, walk, and action animations at the very least, but you can add more (to a point).

You cannot change animation names with this tool — you must make such changes to [[entity_types.json]] by hand after you're done with everything else.

## Tileset Pane

![the MGE encoder's tileset pane](media/mge-encoder-tileset-pane.png)

The tileset pane will show every tile in the tileset JSON file, and if any tiles contain animation data, they will have a red outline. (They should also be moving.)

You can change the tileset at any time by using the drop-down list.

## To Assign Animations

Animations will use the first tile in the tileset by default. To assign tileset tiles to animation tile slots, click on animation tile in the animation pane (on the left), then click a tileset tile in the tileset pane (on the right).

The selected tiles should have a green outline.
