
======================
BOD driver
======================
The Brownout Detector (BOD) monitors the power supply and compares the voltage with two programmable threshold levels. One threshold level defines when to generate a Reset, the other threshold defines when to generate an interrupt request.

Features
--------
* Initialization

Applications
------------
* Ensure the supply voltage in the preferred range

Dependencies
------------
* CLKCTRL for clocks
* CPUINT for interrupt 

Concurrency
-----------
N/A

Limitations
-----------
N/A

Knows issues and workarounds
----------------------------
N/A

