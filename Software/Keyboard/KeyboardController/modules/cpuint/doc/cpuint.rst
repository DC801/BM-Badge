
======================
CPUINT driver
======================
The CPU Interrupt Controller (CPUINT) handles and prioritizes interrupt requests. When an interrupt request is acknowledged by the CPUINT, the program counter is set to point to the interrupt vector, and the interrupt handler can be executed.

Features
--------
* Initialization

Applications
------------
* Customize the scheduling of interrupt handling
* Ensure predictable interrupt response time

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

