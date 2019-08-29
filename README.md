# DC801 DC27 Party Badge
Party badge and BLE hardware board

# Hardware
 - **Rigado BMD-340** Bluetooth low energy based on a Nordic nRF52840
   - 64MHz ARM® Cortex™ M4F CPU, 1MB of flash memory, 256kB RAM, USB 2.0
   - [https://www.rigado.com/bmd-340/](https://www.rigado.com/bmd-340/)
 ***
 - **Lots of I/O**
   - Speaker
   - 6 buttons
   - SPI LCD screen
   - JTAG interface
   - Micro USB
   - microSD card
   - 2 SAO connectors
   - 1 minibadges
   - USB 2.0
   - UART breakout
   - NFC tag

Board design is in Kicad

See the [Hardware](/Hardware/README.md) directory for more info, schematics and etc

You can view the complete design in [PDF format here](/Hardware/gerber/final/hcrn-complete.pdf)

# SD Card

Format your SD card as FAT32 and copy the contents of [SD_Card](SD_Card) into it

# Software
 - Environment is GNU ARM GCC with your choice of IDE (I used CLion)
 - Need a J-Link Segger JTAG programmer
 - Uses the softdevice s140
 - Badges shipped with a built-in [UF2 bootloader](/Software/Bootloader.md)

See the [Software](/Software) directory for more info


# DC27 dev team

Project owner
[@nemus](https://twitter.com/Nemus801)
Software Team
[@professor__plum](https://twitter.com/professor__plum)
[@_bashNinja](https://twitter.com/_bashNinja)
Hardware Team
[@dvdfreitag](https://twitter.com/dvdfreitag)
[@hamster](https://twitter.com/hamster)
Honorable Mention
[@SirGed](https://twitter.com/SirGed)

