
======================
SLPCTRL driver
======================
Sleep modes are used to shut down peripherals and clock domains in the device in order to save power. The Sleep Controller (SLPCTRL) controls and handles the transitions between active modes and sleep modes.

NOTE: To actually enter sleep, the user need to invoke the sleep instruction.

Features
--------
* Initialization

Applications
------------
* Power saving by controlling the sleep modes.

Dependencies
------------
* CLKCTRL for clocks
* UPDI for debug

Concurrency
-----------
N/A

Limitations
-----------
N/A

Knows issues and workarounds
----------------------------
N/A

