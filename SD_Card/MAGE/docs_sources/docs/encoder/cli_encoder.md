# CLI Encoder

The command line interface for the [MGE encoder](encoder/mge_encoder).

If you have Node.js installed, you can run the shell script `regenerate_dat_file.sh` to generate a new `game.dat` file. There are two versions of this file:

1. BM-Badge version:
	- `cd` into `MAGE/`.
	- Run the shell script. The `game.dat` will be made from the `scenario_source_files/` in `MAGE/`.
2. [Sample repo](getting_started/mge_vm) version:
	- first argument: the `scenario_source_files/` folder to read from
	- second argument: where to write the `game.dat`
	- This version of the shell script also launches the game automatically.
 