//
// Created by hamster on 8/2/18.
//

#ifndef DC26_BADGE_UART_H
#define DC26_BADGE_UART_H

#ifdef DC801_EMBEDDED

#include <config/custom_board.h>
#include <mdk/nrf52840_bitfields.h>
#include <hal/nrf_uart.h>
#include <app_uart.h>

#else

void uart_init(void);

bool jumpToGame(void);

#endif //DC801_EMBEDDED
#endif //DC26_BADGE_UART_H
