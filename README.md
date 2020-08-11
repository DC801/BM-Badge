# BM-Badge
The DC801 Badge Platform for DC28+

# Hardware
The DC801 BM-Badge brings you an expandable iteration of our robust platfomer

 - Core CPU is the Nordic nRF52840 SoC, on the u-blox BMD-340 module
   - [https://www.u-blox.com/en/product/bmd-34-series-open-cpu](https://www.u-blox.com/en/product/bmd-34-series-open-cpu)
   - 256k RAM, 1M internal flash, ARM® Cortex™ M4F CP @ 64Mhz
   - Bluetooth 5 with Bluetooth mesh and Zigbee support
   - Temperature sensor
 - 27 buttons with NKRO via a dedicated controller
   - Microchip ATiny1617 microcontroller, with UPDI programming support
   - [https://www.microchip.com/wwwproducts/en/ATtiny1617](https://www.microchip.com/wwwproducts/en/ATtiny1617)
 - 19 LEDs
 - SD card socket
 - 32MB of quad-spi flash
 - NAU8810 audio codec and speaker
 - 2.4" 240x320 TFT LCD screen with touch panel
 - LiPo battery with on-board charging
 - USB-C interface supporting USB endpoints
 - SAO 1.69bis and Saintcon MiniBadge expansion headers
 - Support for the DC801 ART front board expansion
 - JTAG via both standard ARM interface as well as Tag Connect
 - USB drag-and-drop programming via a UF2 interface (based on the [adafruit bootloader](https://github.com/adafruit/Adafruit_nRF52_Bootloader))
 - Exciting new artwork and sandwich design


Board design is in KiCad

See the [HW](/HW) directory for more info, schematics and etc

# ART - Asymmetric Resistive Token
Since this badge is a sandwich platform badge, we've include a template so that you can design your own front boards.

Check out the [Template](/HW/ART/Template) that you can create a new project in KiCad with.

# Software
 - Environment is GNU ARM GCC with your choice of IDE
 - Programmable via JTAG or USB bootloader 

See the [Software](/Software) directory for more info


