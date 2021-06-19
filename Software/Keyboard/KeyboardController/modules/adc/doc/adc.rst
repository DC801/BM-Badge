======================
ADC driver
======================

An Analog-to-Digital Converter(ADC) converts analog signals on any of its twelve single ended voltage inputs to digital values based on reference voltage.

Multiple reference voltages are supported by the ADC, both internal and external with difference voltage levels. The reference voltage have an impact on the accuracy, 
and should be selected to cover the full range of the analog input signal and never less than the expected maximum input voltage.

The ADC measurements can either be started by application software or an incoming Event from another peripheral. Using the Event System allows for predictable 
timing without software intervention. 

Window Compare mode allows the conversion result to be compared to a set of user defined threshold values with minimum software intervention.

There are two conversion modes supported by ADC, single shot and free running. In single shot mode the ADC only make one conversion when triggered by the application, 
in free running mode it continues to make conversion from it is triggered until it is stopped by the application.

Features
--------
* Initialization

Applications
------------
* Measurement of internal sensor. E.g., MCU internal temperature sensor value.
* Measurement of external sensor. E.g., Temperature, humidity sensor value.
* Sampling and measurement of a signal. E.g., sinusoidal wave, square wave.

Dependencies
------------
* ADC peripheral
* CLKCTRL/CLK for clock
* CPUINT/PMIC for Interrupt
* JTAG/PDI/UPDI for debug
* PORT for I/O Lines and Connections
* EVSYS for Events

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

