# Web Encoder

The web interface for the [MGE encoder](../encoder/mge_encoder).

Open `SD_Card/MAGE/editor/index.html` with a web browser.

Once the page is open, you can either:

1. Drag your [`scenario_source_files`](../getting_started/scenario_source_files) folder into the window.
2. Click the "browse" button and choose the `scenario_source_files` using your operating system's file browser.

Confirm that you want to upload the contents of the folder to your browser, and the encoder will do its magic. If successful, click the "Download game.dat" button, and you're done!

The `game.dat` will be sent to your default download location, so to play it on the desktop build, you'll first have to move it to the correct place by hand or run the shell script `replace_dat_file_with_downloaded.sh`. (`cd` into the `SD_Card/MAGE/` folder before using the shell script!)

## Entity Manager

A special feature of the web version of the [MGE encoder](../encoder/mge_encoder) is the [entity management system](../encoder/entity_management_system), which you can use to assign animations to [character entities](../entities/character_entity).
