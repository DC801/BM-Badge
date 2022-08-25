#ifndef DRV_ILI9341_H_
#define DRV_ILI9341_H_

#ifdef __cplusplus
extern "C" {
#endif
	
#ifdef DC801_EMBEDDED
//#define ST7735_INVERTED_Y_OFFSET	1

extern uint16_t ili9341_color565(uint8_t r, uint8_t g, uint8_t b);
extern void ili9341_init();
extern bool ili9341_is_busy();
extern void ili9341_push_color(uint16_t color);
extern void ili9341_push_colors(uint8_t *p_colors, int32_t size);
extern nrfx_err_t ili9341_push_colors_fast(uint8_t *p_colors, int32_t size);
extern void ili9341_set_addr(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1);
extern void ili9341_start();
extern void ili9341_draw_pixel(uint16_t x, uint16_t y, uint16_t color);
extern void ili9341_fill_rect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color);

/**
 * Force and update of the display, update inverted status and redraw from internal memory
 */
extern void ili9341_update();

#endif

#ifdef __cplusplus
}
#endif

#endif
