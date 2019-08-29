/*
 * tests.h
 *
 *  Created on: Jul 13, 2018
 *      Author: hamster
 */

#ifndef BOOTLOADER_TESTS_H_
#define BOOTLOADER_TESTS_H_


void testLEDs(void);
void testButtons(void);
void testBeeper(void);
void testSDCard(void);

FRESULT util_sd_load_file(char *path, uint8_t *p_buffer, uint32_t count);

void beep(int duration, int frequency);


#endif /* BOOTLOADER_TESTS_H_ */
