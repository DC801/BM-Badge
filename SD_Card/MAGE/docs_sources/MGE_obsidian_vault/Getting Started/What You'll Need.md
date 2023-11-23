# What You'll Need

The MGE is data driven, meaning you won't need special hardware or a compiler to generate game content for your DC801 black mage badge. All you'll need are:

## Text Editor

You will need a text editor. (NOTE: a word processor like Apple's Pages or Microsoft Word will not work for this!)

While any program might work for this, we strongly recommend an IDE with project management features like syntax parsing and Git integration. Our strong recommendation, especially for beginners, is [Visual Studio Code](https://code.visualstudio.com/) (Mac, Linux, or Windows), which is free and open source. Importantly, we have prepared a VSCode Marketplace plugin for [[MGS Natlang]] syntax highlighting, which will make it much easier to work with MGS game script files.

`.mgs` syntax highlighting can be manually added to a handful of other text editors, too. (See [[MGS Natlang]] for up-to-date details and instructions.) The following can manage decent support as of late 2023:

- [Sublime Text](sublimetext.com)
- [JetBrains' IDEs](https://www.jetbrains.com/) (excellent but not inexpensive)
- [TextMate](macromates.com) (Mac only)

## Graphics Editor

Any graphics program capable of pixel art can be used to make sprite sheets or tilesets. But if you need custom animation, we highly recommend investing in [Aseprite](https://www.aseprite.org/), which is about $20. It specializes in sprite animations, and it makes previewing animations and exporting sprite sheets quite painless.

If you don't want to make art from scratch, a good source of premade tilesets is [OpenGameArt.org](https://OpenGameArt.org).

## Tiled

Tiled, which can be found at [mapeditor.org](www.mapeditor.org), is a free, cross-platform map and tileset editor that can export and edit JSON files. This how the bulk of maps, tilesets, entity animations, [[Tile Collisions]], and choreography are defined.

## Git

~~While strictly optional, it's always nice to version control your projects,~~ If you are not using Git to version control your projects, you bring dishonor and suffering on your house, especially if working with multiple people. We recommend [Sublime Merge](https://www.sublimemerge.com/) if you're just getting started with Git, particularly if you're using VSCode, as VSCode's version control interface is a little bare bones. If you're already using one of [JetBrains' IDEs](https://www.jetbrains.com/), you can use their excellent built-in Git tools.

## Web Browser

The [[Web Encoder]] can be run with Node.js (see below) or in a web browser. They will both take the game files from your [[scenario_source_files]] folder and export a `game.dat` for the Mage Game Engine to use.

The web version of the encoder, however, also has an [[Entity Management System]] for managing animation assignments, so while you might use the Node encoder most of the time, chances are you'll still want to use the web version regularly.

You will likely also want to use the [[Web Build]] of the MGE to test your game data, as this is much simpler than setting up a Linux environment to run the game natively and much faster than using a microSD card to move the `game.dat` to the real badge after every revision.

## Node.js (optional)

If you find yourself constantly making small changes to your content and regenerating your `game.dat` very frequently, it may be worthwhile to install [Node.js](nodejs.org) so you can use the [[CLI Encoder|CLI version of the encoder]] instead.

We recommend using Node's long-term support (i.e. even numbered) versions.

## MicroSD Card (optional)

To put a new `game.dat` onto the badge, you'll need a microSD card formatted to FAT32. (This is only necessary if you're using the real badge hardware; for everyone else, there's the [[Web Build]].)

## Linux (optional)

The tools listed above can be run in any environment, but at the moment (late 2023), you need Linux to run the game natively on your computer.

A virtual machine will be sufficient for this. For your convenience, we have prepared a VM image with project files and tooling in place for you to start a new MGE project (see: [[MGE VM]]) — but know that you will likely need to update everything, as the VM was prepared for the chapter 1 engine.

## `MAGE/` Folder

Content creation will involve creating, modifying, and using files within the `MAGE` folder (inside the `SD_Card` folder, inside the project repo). See: [[MAGE folder]]
