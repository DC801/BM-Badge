
======================
RTC driver
======================
The RTC peripheral offers two timing functions: the Real-Time Counter (RTC) and a Periodic Interrupt Timer (PIT). RTC and PIT can be used at the same time. 

NOTE: RTC and PIT share the same clock source, but PIT actually count on the un-prescaled clock source directly.

Features
--------
* Initialization

Applications
------------
* Periodic Interrupt
* Delayed Applications

Dependencies
------------
* CLKCTRL/CLK for clocks
* PORT for I/O lines and connections
* EVSYS for events
* CPUINT/PMIC for Interrupt
* UPDI/PDI/JTAG for debug 

Note
----
* ISR will be generated only when Global Interrupt checkbox and driver_isr Harness checkbox are enabled

Concurrency
-----------
N/A

Limitations
-----------
N/A

Knows issues and workarounds
----------------------------
N/A

