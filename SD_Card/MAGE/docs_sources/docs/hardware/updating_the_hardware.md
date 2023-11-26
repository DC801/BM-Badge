# Updating the Hardware

## `game.dat`

To run the game on the hardware, prepare a microSD card (FAT32) with a folder called `MAGE` in the root directory. Copy the `game.dat` into `MAGE/`, then insert the card into the slot on the hardware.

If the hardware determines its `game.dat` is different from the one on the microSD card (or if you hold `MEM3` when turning on the badge), you will see:

```
The file `game.dat` on your SD card does not match
what is on your badge ROM chip.

 SD hash: [game.dat checksum #1]
ROM hash: [game.dat checksum #2]

Would you like to update your scenario data?
------------------------------------------------

> Press MEM0 to cancel

> Press MEM3 to update the ROM
```

Press `MEM3` (lowest button on the right side of the screen) to tell the hardware to flash the new `game.dat`. The time it takes to copy will depend on the size of the `game.dat`, but it should be somewhere in the ballpark of 20 seconds.

## Game Engine

To start the game in bootloader mode, hold down the hex digit `1` button while you power on the hardware. If bootloader mode was successfully triggered, the screen will be white and the LEDs will blink in a circular pattern.

If the hardware is plugged into a computer while it is in bootloader mode, it will appear as a drive called `DC801BOOT` (or `NRF52BOOT`). Copy the new game engine UF2 (the filename doesn't matter) onto the drive.

Once the UF2 is copied, the drive will disconnect and the badge will reboot automatically.
