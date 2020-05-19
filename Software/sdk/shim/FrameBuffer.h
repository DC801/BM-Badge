#ifndef FRAMEBUFFER_H
#define FRAMEBUFFER_H

#include <stdint.h>
#include "../../adafruit/gfxfont.h"

#define WIDTH		128
#define HEIGHT		128

#define RGB(r, g, b) ((((r) & 0xF8) << 8) | (((g) & 0xFC) << 3) | ((b) >> 3))


class FrameBuffer {
public:
    FrameBuffer();
    ~FrameBuffer();


    void clearScreen(uint16_t color);

    void drawPixel(int x, int y, uint16_t color);

    void drawLine(int x1, int y1, int x2, int y2, uint16_t color);
    void drawHorizontalLine(int x1, int y, int x2, uint16_t color);
    void drawVerticalLine(int x, int y1, int y2, uint16_t color);

    void drawImage(int x, int y, int w, int h, const uint16_t *data);
    void drawImage(int x, int y, int w, int h, const uint16_t *data, uint16_t tansparent_color);
    void drawImage(int x, int y, int w, int h, const uint8_t *data);
    void drawImage(int x, int y, int w, int h, const uint8_t *data, uint16_t tansparent_color);
    void drawImage(int x, int y, int w, int h, const uint16_t *data, int fx, int fy, int pitch);
    void drawImage(int x, int y, int w, int h, const uint16_t *data, int fx, int fy, int pitch, uint16_t tansparent_color);

    void drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch);
    void drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch, uint16_t tansparent_color);

    void fillCircle(int x, int y, int radius, uint16_t color);

    void fillRect(int x, int y, int w, int h, uint16_t color);
    void drawRect(int x, int y, int w, int h, uint16_t color);

    void mask(int px, int py, int rad1, int rad2, int rad3);
    void write_char(uint8_t c, GFXfont font);
    void printMessage(const char *text, GFXfont font, uint16_t color, int x, int y);

    void blt();

};

extern FrameBuffer canvas;


#endif //FRAMEBUFFER_H
