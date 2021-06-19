======================
TCA driver
======================
The capabilities of the 16-bit Timer/Counter type A (TCA) include accurate program execution timing,frequency and waveform generation, and command execution.

It consists of a base counter and a set of compare channels. The base counter can be used to count clock cycles or events, or let events control how it counts clock cycles. 
It has direction control and period setting that can be used for timing. The compare channels can be used together with the base counter to do compare match control,
frequency generation, and pulse width waveform modulation. 

The timer/counter is clocked by the peripheral clock with optional prescaling or from the event system.

The timer/Counter has a split mode feature that splits it into two 8-bit timer/counters with four compare channels each.

Features
--------
* Initialization

Applications
------------
* Frequency Generation
* Single-slope PWM (pulse width modulation)
* Dual-slope PWM
* Count on event

Dependencies
------------
* CLKCTRL for clock
* CPUINT for Interrupt
* EVSYS for events
* UPDI for debug
* PORT for Waveform Generation

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

