# Keyboard Controller

This is the keyboard controller for the DC801 BM-Badge platform.

# Hardware

The microcontroller is an [attiny1617](https://www.microchip.com/wwwproducts/en/ATTINY1617) ([datasheet](http://ww1.microchip.com/downloads/en/devicedoc/attiny3217_1617-data-sheet-40001999b.pdf))

Connected to this microcontroller is a 5x6 grid of physical buttons, one capacitive touch button, and a 4 wire resistive touch screen.

Communication with the main processor is via a GPIO for an interrupt line, and a I2C bus, configured as a slave device.

# Key Scanning

The grid consists of 5 rows and 6 columns, but there is only 26 buttons present.  Please refer to the board schematic for the specific layout.

The method for scanning the buttons is pretty simple:

- Set all rows as outputs and to a 'high' state
- Set all cols as inputs with pull up resistors
- Set one row to a 'low' state
- Scan all the cols for state
- If the stored state is different than the current state, emit a key interrupt on the GPIO
- Save the new state
- Lather, rinse, and repeat

# Cap Touch

The wizard's hat is configured as a capacitive touch button using the native Atmel PTC stuff.  There is a 1k resistor between the device and the button.

The button is read every scan for a touch, and will emit a key interrupt if the state changes.

# Resistive touch screen

The touch screen consists of 4 lines, labeled X+, X-, Y+, and Y-.  These lines are connected in a star pattern.  To determine a touch position:

- Set X+ high, and X- low
- Set Y+ and Y- as inputs with no pullups
- Configure the ADCMUX to sense with the Y+ pin
- Measure the voltage present on Y+

To measure for X, swap the X and Y lines in the above and read again.

Basically, you are setting up a voltage gradient across the screen, and where your finger touches the screen forms a voltage divider in proportion to the position across the gradient.

# Software

The software skeleton was created using [Atmel START](https://start.atmel.com/).  From there it was customized in [Atmel Studio](https://www.microchip.com/mplab/avr-support/atmel-studio-7) to support the specific functions required.

# Usage

The chip listens on I2C slave address 0x23.  You don't need to set a register or write to the device first, just start reading data.

The data returned is a snapshot of the current state of the buttons and touch panel.  It is in the format of 6 bytes - the first 4 are treated as a 32 bit value.  Each bit offset in this value describes the state of a button.

See the bm_board.h file for the bit offsets.

Bytes 5 and 6 are the X and Y positions of the touch screen.  Note that even when not touching, it will return a value that is not zero.

You don't need to read all 6 bytes if you don't care about the touch screen, just read 4 bytes.

The Key Interrupt GPIO will strobe low when a key changes state.  It is typically at a 'high' level.  
It will stay low for at least 10ms.  You will then need to read the I2C bus to find out the key state.  In practice it takes about 50ms to toggle a button on and off tapping as quick as you can.

Since the Key Interrupt is tied to the nRF52840 pin for nRESET, it is set to be normally high.  If you don't want your application to reset when a key interrupt comes in, you need to make sure you remove "CONFIG_GPIO_AS_PINRESET" from your application Makefile. See [this page](https://devzone.nordicsemi.com/f/nordic-q-a/18170/how-can-i-disable-reset-of-p0-21) for further info.

Keypresses are not stored or buffered, you must read the state before it changes or ignore the keypress.

Touch screen touch events do not generate an interrupt. 
