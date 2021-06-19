
======================
CLKCTRL driver
======================
The Clock Controller peripheral (CLKCTRL) controls, distributes, and prescales the clock signals from the available oscillators. The CLKCTRL supports internal and external clock sources.

Features
--------
* Initialization

Applications
------------
* N/A

Dependencies
------------
* N/A 

Concurrency
-----------
N/A

Limitations
-----------
N/A

Knows issues and workarounds
----------------------------
Both 20MHz and 16MHz Oscillators are supported. The default Main Clock Source is 20MHz Internal Oscillator frequncy.
To use 16MHz Oscillator,
* Select 16MHz Internal Oscillator (OSC16M) option in Main Clock Source
* Manually change the fuse configuration. 
* Note : For AVRDA Family, The Internal High-Frequency Oscillator (OSCHF) supports output frequencies of 1, 2, 3 and 4 MHz and
multiples of 4, up to 32 MHz
