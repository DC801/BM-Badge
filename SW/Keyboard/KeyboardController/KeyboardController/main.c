#define F_CPU 20000000

#include <atmel_start.h>
#include <util/delay.h>
#include "key_scan.h"

extern volatile uint8_t measurement_done_touch;

// Map of keys, see bm_board.h for bit definitions
// First 4 bytes are the physical buttons and cap sense
// Last two bytes are the X Y coords of the touch screen position
uint8_t keyState[6] = { 0 };



//
// General usage
// 
// Monitor the KEY_INT line for a high pulse.  Pulses are guaranteed to be at least 10ms and may be a bit longer.
// Upon reception of a high pulse, a key has changed state.  You will then need to query the chip via I2C to get
// the key status.  In practice, I found the quickest I could change the key state was about every 50ms, so
// you have a little bit of time to get the key map but not long.
//
// Releasing a key will also generate a KEY_INT pulse
//
// Touch screen will not currently generate a KEY_INT pulse on change, you will have to poll for changes.
//
// To read via I2C, the master needs to read address 0x23.  Register is ignored, and write requests are ignored
// You can read up to 6 bytes here.  If you do not wish to receive the touch screen location, just read
// the first 4 bytes and treat as a 32 bit number.
//
// bm_board.h has an enum with the bit offset of each key.  Any bit that is 'set' means that key is currently
// down.  Not set means the key is not being pressed.  Multiple keys may be set at the same time.
//

int main(void){
	
	bool keyChange = false;
	
	// Init the system
	system_init();
	touch_init();
	I2C_0_slave_init();
	
	ADC_0_enable();
	
	cpu_irq_enable();
	
	while(1){

		// Drop the button change flag		
		keyChange = false;
		
		// First, the physical buttons
		
		// For each row, set the row low, and then scan the cols for any low values
		// A low value indicates that the key is down at that col
		// Since we know which row we are looking at, this tells us the row,col val for any key
		// that may be down
		//
		// No debouncing right now, but shouldn't be a problem since the CPU has to poll us
		// via I2C to get the key.
		for(uint8_t row = 0; row <= 4; row++){
			
			setRow(row);
			
			// OK, scan the cols
			for(int col = 0; col <= 5; col++){
				
				// Determine if there is actually a key here
				// We have 26 keys, but the grid is 5x6, so there are 4 locations with no
				// actual key
				uint8_t keyOffset = getKeyOffset(row, col);
				if(keyOffset != NO_KEY){
					
					// Read the value of the key at this location
					bool keyVal = readCol(col);
					
					// If the state is not the same as the old state, save it and raise the key changed flag
					if(keyVal != getKeyState(keyState, keyOffset)){
						keyChange = true;
						setKeyState(keyState, keyOffset, keyVal);
					}
				}
			}
		}
		
		// Now the cap touch button
		touch_process();
		if(measurement_done_touch == 1){
			measurement_done_touch = 0;
			
			// Grab the old value
			bool oldVal = getKeyState(keyState, HAX);
			bool newVal;
			
			// Determine the current value.  We only have one cap sense button, which is id 0
			if((get_sensor_state(0) & KEY_TOUCHED_MASK) != 0){
				// Someone is touching it.  Spooky.
				newVal = true;
			}
			else{
				// No touch
				newVal = false;
			}
			
			if(oldVal != newVal){
				// Cap touch has changed
				setKeyState(keyState, HAX, newVal);
				keyChange = true;
			}
			
		}
		
		// Get the touch screen values
		// 4 is X, 5 is Y - but the screen is rotated 90 degrees so we swap the two
		keyState[4] = ts_getY();
		keyState[5] = ts_getX();
	
		// If a key has changed, pull the key change pin high to signal the BMD to scan us for the key state 
		if(keyChange){
			KEY_INT_set_level(true);
		}
		else{
			KEY_INT_set_level(false);
		}
				
		// Slight delay between reads, mostly to make sure the key change flag stays set for at least this long
		_delay_ms(10);
		
	}
}
