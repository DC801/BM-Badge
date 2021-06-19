#!/bin/bash

# To erase everything and put just the bootload on, run this script...

nrfjprog -f nrf52 --recover 
nrfjprog --program dc801_bm_bootloader-0.5.1-6-gcd7b4cb_s140_6.1.1.hex --sectoranduicrerase -f nrf52 --reset
