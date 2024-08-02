# Updating the Hardware

Steps for updating a physical Black Mage Game badge.

::: tip Note
The `game.dat` engine version must match the Mage Game Engine (MGE) being run. If you update the engine without updating the `game.dat`, for example, the badge will bluescreen.
:::

## Game Engine

Perform this step if you must upgrade the game engine itself. This is necessary if testing new engine features or if you are updating your badge from Chapter 1 to Chapter 2. (If you are testing new scenario data on the same engine version, this step is not necessary.)

::: warning
Purple "bootleg" badges do not carry the firmware to update in this way. Instead, you will need to have a JTAG Programmer, and will need to know how to use it. Please contact the DC801 Black Mage Badge game team if you want help updating a purple badge.
:::

To start the game in bootloader mode, hold down the hex digit `1` button while you power on the hardware. If bootloader mode was successfully triggered, the screen will be white and the LEDs will blink in a circular pattern.

If the hardware is plugged into a computer while it is in bootloader mode, it will appear as a drive called `DC801BOOT` or `NRF52BOOT`. Copy the new game engine UF2 (the filename doesn't matter) onto the drive.

Once the UF2 is copied, the drive will disconnect. If the badge does not restart automatically at this point, you may restart it now.

### Tips

- Plug into the badge on the USB-C port. This port is on the front, on the upper right side, near the capacitive button that looks like a hat. Do not use the micro USB port (available on some back plates) as this is for programming the lights.
- If the copy seems to be taking a long time (more than 2 minutes) or appears to suffer from other kinds of I/O problem, try using a different USB-C cable.
- Macs with Apple Silicon may display an error message when the drive unmounts, like `The operation can’t be completed because the device disappeared` or `The Finder can’t complete the operation because some data in “bm_badge.uf2” can’t be read or written. Error code -36` You may ignore these.

## `game.dat`

To install new scenario data on the hardware, prepare a microSD card (FAT32) with a folder called `MAGE` in the root directory. Copy the new `game.dat` into `MAGE/`, then insert the card into the slot on the hardware. (The microSD card slot is on the top of the badge, opposite the USB-C port.)

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

Press `MEM3` (the lowest button on the right side of the screen) to tell the hardware to flash the new data. The time it takes to copy will depend on the size of the `game.dat` file, but it may take a few minutes. (The Chapter 2 `game.dat`, released August 2024, takes about 90 seconds.)

The badge should reboot automatically once the write is completed.
