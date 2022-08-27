#include "shim_err.h"

#ifdef __cplusplus
extern "C" {
#endif

	bool st7735_is_busy()
	{
		return false;
	}

	uint16_t st7735_color565(uint8_t r, uint8_t g, uint8_t b)
	{
		return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
	}

	void st7735_init() { }

	void st7735_start() { }

	void st7735_draw_pixel(uint16_t x, uint16_t y, uint16_t color)
	{

	}

	void st7735_set_addr(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1)
	{

	}

	void st7735_push_color(uint16_t color)
	{

	}

	void st7735_push_colors(uint8_t* p_colors, int32_t size)
	{

	}

	void st7735_fill_rect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color)
	{

	}

	nrfx_err_t st7735_push_colors_fast(uint8_t* p_colors, int32_t size)
	{
		return NRFX_SUCCESS;
	}

#ifdef __cplusplus
}
#endif