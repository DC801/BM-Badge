/*****************************************************************************
 * (C) Copyright 2017 AND!XOR LLC (http://andnxor.com/).
 *
 * PROPRIETARY AND CONFIDENTIAL UNTIL AUGUST 1ST, 2017 then,
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Contributors:
 * 	@andnxor
 * 	@zappbrandnxor
 * 	@hyr0n1
 * 	@andrewnriley
 * 	@lacosteaef
 * 	@bitstr3m
 *****************************************************************************/
#ifndef DRV_ST7735_H_
#define DRV_ST7735_H_

#define ST7735_WIDTH  				128
#define ST7735_HEIGHT 				128
#define ST7735_X_OFFSET				2
#define ST7735_Y_OFFSET				1
#define ST7735_INVERTED_Y_OFFSET	1

extern uint16_t st7735_color565(uint8_t r, uint8_t g, uint8_t b);
extern void st7735_init();
extern bool st7735_is_busy();
extern void st7735_push_color(uint16_t color);
extern void st7735_push_colors(uint8_t *p_colors, int32_t size);
extern nrfx_err_t st7735_push_colors_fast(uint8_t *p_colors, int32_t size);
extern void st7735_set_addr(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1);
extern void st7735_start();
extern void st7735_draw_pixel(uint16_t x, uint16_t y, uint16_t color);
extern void st7735_fill_rect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color);

/**
 * Force and update of the display, update inverted status and redraw from internal memory
 */
extern void st7735_update();

#endif
