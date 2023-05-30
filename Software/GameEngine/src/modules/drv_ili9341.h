#ifndef DRV_ILI9341_H_
#define DRV_ILI9341_H_

#ifdef DC801_EMBEDDED

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif //__cplusplus

#include <config/custom_board.h>
#include <app_error.h>
#include <nrf_delay.h>
#include <nrf_drv_spi.h>
#include <nrf_error.h>
#include <nrf_gpio.h>
#include <nrfx_spim.h>

    //#define ST7735_INVERTED_Y_OFFSET	1

    void ili9341_init();
    bool ili9341_is_busy();
    void ili9341_push_colors(uint8_t* p_colors, uint32_t size);
    nrfx_err_t ili9341_push_colors_fast(uint8_t* p_colors, uint32_t size);
    void ili9341_set_addr(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1);
    void ili9341_start();
    void ili9341_draw_pixel(uint16_t x, uint16_t y, uint16_t color);
    void ili9341_fill_rect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color);

    /**
     * Force and update of the display, update inverted status and redraw from internal memory
     */
    void ili9341_update();

#ifdef __cplusplus
}
#endif //__cplusplus


#endif // DC801_EMBEDDED
#endif // DRV_ILI9341_H_ 
