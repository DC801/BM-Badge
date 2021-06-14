#!/bin/bash

nrfjprog -f nrf52 --recover 
nrfjprog --program dc801_bm_bootloader-0.5.1-2-g881dac1-dirty_s140_6.1.1.hex --sectoranduicrerase -f nrf52 --reset
