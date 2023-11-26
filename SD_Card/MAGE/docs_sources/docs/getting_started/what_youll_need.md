# What You'll Need

The MGE is data driven, meaning you won't need special hardware or a compiler to generate game content for your DC801 black mage badge. All you'll need are:

## Text Editor

You will need a text editor. (NOTE: a word processor like Apple's Pages or Microsoft Word will not work for this!)

While any text editor might do the trick, we strongly recommend an IDE with project management features like syntax parsing and Git integration. Our strong recommendation, especially for beginners, is [Visual Studio Code](../https://code.visualstudio.com/) (Mac, Linux, or Windows), which is free and open source. Importantly, we have prepared a VSCode Marketplace plugin for [MGS Natlang](../mgs/mgs_natlang) [syntax highlighting](../mgs/syntax_colors), which will make it much easier to work with MGS game script files.

`.mgs` syntax highlighting can be manually added to a handful of other text editors, too. (See [Syntax Colors](../mgs/syntax_colors) for up-to-date details and instructions.) The following can manage decent support as of late 2023:

- [Sublime Text](../sublimetext.com)
- [JetBrains' IDEs](../https://www.jetbrains.com/) (excellent IDE but not inexpensive)
- [TextMate](../macromates.com) (Mac only)

## Graphics Editor

Any graphics program capable of pixel art can be used to make sprite sheets or [tilesets](../tilesets). But if you need custom [animation](../tilesets/animations), we highly recommend investing in [Aseprite](../https://www.aseprite.org/), which is about $20. It specializes in sprite animations, and it makes previewing animations and exporting sprite sheets quite painless.

If you don't want to make art from scratch, a good source of premade tilesets is [OpenGameArt.org](../https://OpenGameArt.org).

## Tiled

Tiled, which can be found at [mapeditor.org](../www.mapeditor.org), is a free, cross-platform map and [tileset](../tilesets) editor that can export and edit JSON files. This how the bulk of [maps](../maps), [tilesets](../tilesets), [entity](../entities) [animations](../tilesets/animations), [tile collisions](../tilesets/tile_collisions), and [geometry](../maps/vector_objects) for [choreography](../techniques/cutscenes) are defined.

## Git

~~While strictly optional, it's always nice to version control your projects,~~ If you are not using Git to version control your projects, you bring dishonor and suffering on your house, especially if working with multiple people. We recommend [Sublime Merge](../https://www.sublimemerge.com/) if you're just getting started with Git, particularly if you're using VSCode, as VSCode's version control interface is fairly bare bones. If you're already using one of [JetBrains' IDEs](../https://www.jetbrains.com/), you can use their excellent built-in Git tools.

## Web Browser

The [web encoder](../encoder/web_encoder) can be run with Node.js (see below) or in a web browser. They will both take the game files from your [scenario_source_files](../getting_started/scenario_source_files) folder and export a `game.dat` for the Mage Game Engine to use.

The web version of the encoder, however, also has an [entity management system](../entity_management_system) for managing animation assignments, so while you might use the Node encoder most of the time, chances are you'll still want to use the web version regularly.

You will likely also want to use the [web build](../hardware/web_build) of the MGE to test your game data, as this is much simpler than setting up a Linux environment to run the game natively and much faster than using a microSD card to test the `game.dat` on the real badge after every revision.

## Node.js (optional)

If you find yourself constantly making small changes to your content and regenerating your `game.dat` very frequently, it may be worthwhile to install [Node.js](../nodejs.org) so you can use the [CLI version of the encoder](../encoder/cli_encoder) instead.

We recommend using Node's long-term support (i.e. even numbered) versions.

## MicroSD Card (optional)

To put a new `game.dat` onto the badge, you'll need a microSD card formatted to FAT32. (This is only necessary if you're using the real badge hardware; the [web build](../hardware/web_build) is sufficient for most cases.)

## Linux (optional)

The tools listed above can be run in any environment, but at the moment (late 2023), you need Linux to run the game natively on your computer.

A virtual machine will be sufficient for this. For your convenience, we have prepared a VM image with project files and tooling in place for you to start a new MGE project (see: [MGE VM](../getting_started/mge_vm)) — but know that you will likely need to update everything, as the VM was prepared for the chapter 1 engine.

## `MAGE/` Folder

Content creation will involve creating, modifying, and using files within the `MAGE` folder (inside the `SD_Card` folder, inside the project repo). See: [MAGE Folder](../getting_started/mage_folder)
