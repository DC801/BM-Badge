# DC801 DC28 Party Badge
Party badge and BLE hardware board in SAFEMODE

# Hardware
The DC801 SAFEMODE badge brings you an expandable iteration of our robust platform. Yeah, you read that right. If you thought last year’s badge was cool, this one really whips the llama’s ass.

    - Core CPU is the Nordic nRF52840 SoC, on the u-blox BMD-340 module
    - 256k RAM, 1M internal flash, Arm Cortex-M4 with FPU @ 64Mhz
    - Bluetooth 5 with Bluetooth mesh and Zigbee support
    - Temperature sensor
    - 27 buttons with NKRO via a dedicated Microchip ATiny1617 microcontroller, with UPDI programming support
    - 19 LEDs
    - SD card socket
    - 32MB of quad-spi flash
    - NAU8810 audio codec and speaker
    - 2.4" 240x320 TFT LCD screen with touch panel
    - LiPo battery with on-board charging
    - USB-C interface supporting USB endpoints
    - SAO 1.69bis and Saintcon MiniBadge expansion headers
    - Support for the DC801 'ART Board' front board expansion
    - JTAG via both standard ARM interface as well as Tag Connect
    - Exciting new artwork and sandwich design


Board design is in Kicad

See the [Hardware](/Hardware/README.md) directory for more info, schematics and etc.

# SD Card

Format your SD card as FAT32 and copy the contents of [SD_Card](SD_Card) into it.
This year's badge game engine allows for you to run custom games from binary files on the SD card.

# Software
 - Environment is GNU ARM GCC with your choice of IDE (We're currently using CLion and VSCode)
 - Need a J-Link Segger JTAG programmer to program the chip directly.
 - Custom game engine purpose-built for the badge that can automatically load custom games from the SD Card.
 - Included in the [SD_Card/MAGE](/SD_Card/MAGE) directory is a binary encoder that allows you to generate your own games with our engine using open source tools such as the Tiled Map Editor and our custom json scripting language.
 - Instructions to set up your own dev environment and desktop testing build of our game engine in [EnvironmentSetup.mc](/EnvironmentSetup.md).


# DC28 dev team

Project owner
- [@nemus](https://twitter.com/Nemus801)

Software Team
- [@_bashNinja](https://twitter.com/_bashNinja)
- [@admiral_potato](https://twitter.com/admiral_potato)
- [@corfidbizna](https://twitter.com/corfidbizna)
- [kiyoshigawa](https://twa.ninja/)
- [@newzie1](https://twitter.com/newzie1)
- [@tazmodius](https://twitter.com/tazmodius)

Hardware Team
- [@dvdfreitag](https://twitter.com/dvdfreitag)
- [@hamster](https://twitter.com/hamster)

Honorable Mention
- [@pips801](https://twitter.com/pips801)
