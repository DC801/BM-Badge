---
tags: [ 'VSCode', 'VS Code', 'Visual Studio Code', 'word processor', 'mac', 'windows', 'aseprite', 'opengameart.org', 'json', 'sublime merge', 'jetbrains' ]
---

# What You'll Need

The MGE is data driven, meaning you won't need special hardware or a compiler to generate game content for your Black Mage Badge. All you'll need are:

## Text Editor

You will need a text editor. (NOTE: a word processor like Apple's Pages or Microsoft Word will not suffice!)

What will work best is an IDE with project management features like syntax parsing and Git integration. Our recommendation, especially for beginners, is [Visual Studio Code](https://code.visualstudio.com/) (Mac, Linux, or Windows), which is free and open source. Importantly, we have prepared a VSCode Marketplace plugin for [MGS Natlang](mgs/mgs_natlang) [syntax highlighting](mgs/mgs_natlang#syntax-colors), which will make it much easier to work with MGS game script files.

`.mgs` syntax highlighting can be manually added to a handful of other text editors, too. (See [Syntax Colors](mgs/mgs_natlang#syntax-colors) for up-to-date details and instructions.) The following can manage decent support as of August 2024:

- [Sublime Text](https://sublimetext.com)
- [JetBrains' IDEs](https://www.jetbrains.com/) (excellent IDE but not inexpensive)
- [TextMate](https://macromates.com) (Mac only)

## Graphics Editor

Any graphics program capable of pixel art can be used to make sprite sheets or [tilesets](tilesets). But if you need custom [animation](animations), we recommend investing in [Aseprite](https://www.aseprite.org/), which is about $20. It specializes in sprite animations, and it makes previewing animations and exporting sprite sheets quite painless.

If you don't want to make art from scratch, a good source of premade tilesets is [OpenGameArt.org](https://OpenGameArt.org).

## Tiled

Tiled, which can be found at [mapeditor.org](https://www.mapeditor.org), is a free, cross-platform map and [tileset](tilesets) editor that can export and edit JSON files. This how the bulk of [maps](maps), [tilesets](tilesets), [entity](entities) [animations](animations), [tile collisions](tilesets#tile-collisions), and [geometry](vector_objects) for [choreography](techniques/cutscenes) are defined.

::: warning Use Tiled 1.9.2!
Newer versions of Tiled use a slightly different file structure that is not compatible with the current [encoder](encoder)! Please make sure to download version 1.9.2 specifically. Get it from their [Github releases](https://github.com/mapeditor/tiled/releases/tag/v1.9.2).
:::

## Git

~~While strictly optional, it's always nice to version control your projects,~~ If you are not using Git to version control your projects, you bring dishonor and suffering on your house, especially if working with multiple people. We recommend [Sublime Merge](https://www.sublimemerge.com/) if you're just getting started with Git, particularly if you're using VSCode, as VSCode's version control interface is limited. If you're already using one of [JetBrains' IDEs](https://www.jetbrains.com/), you can use their excellent built-in Git tools.

## Web Browser

The [web encoder](encoder#web-encoder) can be run with Node.js (see below) or in a web browser. They will both take the game files from your [`scenario_source_files`](mage_folder#scenario_source_files) folder and export a `game.dat` for the Mage Game Engine to use.

The web version of the encoder, however, also has an [entity management system](entity_management_system) for managing animation assignments, so while you might use the Node encoder most of the time, chances are you'll still want to use the web version regularly.

You will likely also want to use the [web build](web_build) of the MGE to test your game data, as this is much simpler than setting up a Linux environment to run the game natively and much faster than using a microSD card to test the `game.dat` on the real badge after every revision.

## Node.js (optional)

If you find yourself constantly making small changes to your content and regenerating your `game.dat` very frequently, it may be worthwhile to install [Node.js](https://nodejs.org) so you can use the [CLI version of the encoder](encoder#cli-encoder) instead.

We recommend using Node's long-term support (i.e. even numbered) versions.

## MicroSD Card (optional)

To put a new `game.dat` onto the badge, you'll need a microSD card formatted to FAT32. (This is only necessary if you're using the real badge hardware; the [web build](web_build) is sufficient for most cases.)

## Linux (optional)

The tools listed above can be run in any environment, but at the moment (August 2024), you need Linux to run the game natively on your computer.

A virtual machine will be sufficient for this. For your convenience, we have prepared a VM image with project files and tooling in place for you to start a new MGE project (see: [MGE VM](mge_vm)) — but know that you will likely need to update everything, as the VM was prepared for the chapter 1 engine.

## `MAGE/` Folder

Content creation will involve creating, modifying, and using files within the `MAGE` folder (inside the `SD_Card` folder, inside the project repo). See: [`MAGE` Folder](mage_folder)
