#include "FrameBuffer.h"

FrameBuffer::FrameBuffer() { }
FrameBuffer::~FrameBuffer() { }

FrameBuffer canvas;

void FrameBuffer::clearScreen(uint16_t color)
{

}


void FrameBuffer::drawPixel(int x, int y, uint16_t color)
{

}


void FrameBuffer::drawLine(int x1, int y1, int x2, int y2, uint16_t color)
{

}

void FrameBuffer::drawHorizontalLine(int x1, int y, int x2, uint16_t color)
{

}

void FrameBuffer::drawVerticalLine(int x, int y1, int y2, uint16_t color)
{

}


void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data)
{

}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data, uint16_t tansparent_color)
{

}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint8_t *data)
{

}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint8_t *data, uint16_t tansparent_color)
{

}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data, int fx, int fy, int pitch)
{

}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data, int fx, int fy, int pitch, uint16_t tansparent_color)
{

}


void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch)
{

}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch, uint16_t tansparent_color)
{

}


void FrameBuffer::fillCircle(int x, int y, int radius, uint16_t color)
{

}


void FrameBuffer::fillRect(int x, int y, int w, int h, uint16_t color)
{

}

void FrameBuffer::drawRect(int x, int y, int w, int h, uint16_t color)
{

}


void FrameBuffer::mask(int px, int py, int rad1, int rad2, int rad3)
{

}

void FrameBuffer::write_char(uint8_t c, GFXfont font)
{

}

void FrameBuffer::printMessage(const char *text, GFXfont font, uint16_t color, int x, int y)
{

}


void FrameBuffer::blt()
{

}
