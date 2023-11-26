# MGE VM

> **WARNING**: This VM image was prepared for the Black Mage Game 2020 (chapter 1) version of the engine, back before there was a web build to use instead, so this information will have very limited utility now.
>
> Seriously, just use the web build now! It's so much easier! (See: [Web Build](../hardware/web_build))

## Download the VM image

The [VM image](../https://drive.google.com/file/d/1S3qmwfSq9DD3EdxqE4Bh8B2QsWe1d85-/view?usp=sharing), available to download from Google Drive, is approximately 6GB.

In case you need to `sudo` anything:

	username: dc801
	password: helga

## VirtualBox

1. Install [VirtualBox](../https://www.virtualbox.org/).
2. Go to File > Import Appliance, then find the .ova file you downloaded previously.
	- The expanded VM image will be about 12GB, but can become as large as 32GB (depending on what you do inside it), so keep that in mind when choosing where to put it.

## To Run the Game

### First Time

Double click `pull_latest_and_build.sh` to download and compile the latest version of the MGE. The game will launch itself. Close the window when finished.

### Thereafter

To run the game without compiling it again, double click `start_game.sh`.

## Game Development

You could do all your game development in your host OS, but you might have to be a bit clever to get the encoded `game.dat` inside the VM environment. Instead, consider doing your game development 100% inside the VM:

- Double click `open_ide.sh` to launch Visual Studio Code, which has been set up for you.
- Launch Chromium by clicking the "whisker menu" in the top-left corner of the screen, then click "Web Browser." (You'll need Chromium to use the [web encoder](../encoder/web_encoder).)

## Raw Game Data Folders

The VM already contains the raw game data for BMG2020 (found in the folder [MAGE/scenario_source_files](../scenario_source_files), which you could copy to use as a template for your own project, but we have also prepared a bare-bones [sample project repo](../https://github.com/AdmiralPotato/mage_game-external_scenario_source_files), which has all of the necessary structure but without the bloat of the finished game.

The [MGE encoder](../encoder/mge_encoder) is capable of generating a `game.dat` file from an arbitrary `scenario_source_files/` folder, so having multiple project folders is not a problem.
