#include "games/hcrn/FrameBuffer.h"

#ifndef min
#define min(a,b) ((a)<(b)?(a):(b))
#endif

#ifndef max
#define max(a,b) ((a)>(b)?(a):(b))
#endif

extern SDL_Window* window;
extern SDL_Renderer* renderer;

uint16_t frame[WIDTH * HEIGHT];
FrameBuffer canvas;

FrameBuffer::FrameBuffer() {}
FrameBuffer::~FrameBuffer() {}

void FrameBuffer::clearScreen(uint16_t color) {
	for (int i=0; i<WIDTH*HEIGHT; ++i)
		frame[i] = color;
}

void FrameBuffer::drawPixel(int x, int y, uint16_t color) {
	frame[y*WIDTH+x] = color;
}

void FrameBuffer::drawHorizontalLine(int x1, int y, int x2, uint16_t color) {
	int s1 = min(x1, x2);
	int s2 = max(x1, x2);
	for (int i=s1; i<=s2; ++i)
		frame[y*WIDTH+i]=color;
}
void FrameBuffer::drawVerticalLine(int x, int y1, int y2, uint16_t color) {
	int s1 = min(y1, y2);
	int s2 = max(y1, y2);
	for (int i=s1; i<=s2; ++i)
		frame[i*WIDTH+x]=color;
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data) {
	int idx=0;
    for (int j = y; j<y+h; ++j)
		for (int i=x; i<x+w; ++i)
			frame[j*WIDTH+i] = data[idx++];
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data, uint16_t tansparent_color) {
	int idx=0;
    for (int j = y; j<y+h; ++j)
		for (int i=x; i<x+w; ++i) {
			uint16_t c = data[idx++];
			if (c != tansparent_color)
				frame[j*WIDTH+i] = c;
		}

}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint8_t *data) {
	int idx=0;
    for (int j = y; j<y+h; ++j) {
		for (int i=x; i<x+w; ++i) {
			uint8_t d1 = data[idx++];
			uint8_t d2 = data[idx++];
			frame[j*WIDTH+i] = ((uint16_t) d1 << 8) | d2;
		}
    }
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint8_t *data, uint16_t tansparent_color) {
	int idx=0;
    for (int j = y; j<y+h; ++j){
		for (int i=x; i<x+w; ++i) {
			uint8_t d1 = data[idx++];
			uint8_t d2 = data[idx++];
			uint16_t c = ((uint16_t) d1 << 8) | d2;
			if (c != tansparent_color){
				frame[j*WIDTH+i] = c;
			}
		}
    }
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data, int fx, int fy, int pitch) {
    for (int i=0, idx = pitch*fy+fx; i<h; ++i, idx+=pitch) {
        memcpy(&frame[(y+i)*WIDTH + x], &data[idx], sizeof(uint16_t) * w);
    }
}

void FrameBuffer::drawImage(int x, int y, int w, int h, const uint16_t *data, int fx, int fy, int pitch, uint16_t tansparent_color) {

    for (int j=0; j<h; ++j)
        for (int i=0; i<w; ++i) {
            uint16_t c = data[pitch*(fy+j)+i+fx];
            if (c != tansparent_color)
                frame[(j+y)*WIDTH+i+x] = c;
        }
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch) {

    //TODO: replace with SD specific implimentation
    FILE *fd = fopen(filename, "rb");
    fseek(fd, (pitch*fy+fx)*sizeof(uint16_t), SEEK_SET);
    for (int i=0; i<h; ++i) {
        fread(&frame[(y+i)*WIDTH + x], sizeof(uint16_t), w, fd);
        fseek(fd, (pitch-w)*sizeof(uint16_t), SEEK_CUR);
    }
    fclose(fd);
}

void FrameBuffer::drawImageFromFile(int x, int y, int w, int h, const char* filename, int fx, int fy, int pitch, uint16_t tansparent_color) {
    uint16_t buf[w*h];

    //TODO: replace with SD specific implimentation
    FILE *fd = fopen(filename, "rb");
    fseek(fd, (pitch*fy+fx)*sizeof(uint16_t), SEEK_SET);
    for (int i=0; i<h; ++i) {
        fread(&buf[i*w], sizeof(uint16_t), w, fd);
        fseek(fd, (pitch-w)*sizeof(uint16_t), SEEK_CUR);
    }
    fclose(fd);

    drawImage(x, y, w, h, buf, tansparent_color);
}

void FrameBuffer::fillRect(int x, int y, int w, int h, uint16_t color){
	for (int j = y; j<y+h; ++j)
		for (int i=x; i<x+w; ++i)
			frame[j*WIDTH+x] = color;
}

void FrameBuffer::drawRect(int x, int y, int w, int h, uint16_t color) {
	drawHorizontalLine(x,y+h,x+w,color);
	drawHorizontalLine(x,y+h,x+w,color);
    drawVerticalLine(x,y,y+h,color);
    drawVerticalLine(x+w,y,y+h,color);
}

void FrameBuffer::drawLine(int x1, int y1, int x2, int y2, uint16_t color) {
	int dx=x2-x1;
	int dy=y2-y1;
	int y=y1;
	int p=2*dy-dx;

	for(int x=x1; x<x2; ++x) {
		frame[x+y*WIDTH]=color;
		if(p>=0) {
			y++;
			p+=2*dy-2*dx;
		}
		else {
			p+=2*dy;
		}
	}
}

void FrameBuffer::fillCircle(int x, int y, int radius, uint16_t color){
	int rad2=radius*radius;
	for (int j=y-radius;j<=y+radius; ++j) {
		int yd = fabs(y-j);
		int radx2 = rad2 - yd*yd;
		for (int i=x-radius;i<=x+radius; ++i) {
			int xd = fabs(x-i);
			int dist2 = xd*xd;
			if (dist2<=radx2)
				frame[i+j*WIDTH] = color;
		}
	}

}

void FrameBuffer::mask(int px, int py, int rad1, int rad2, int rad3) {
    int minx=px-rad3, maxx=px+rad3;
    int miny=py-rad3, maxy=py+rad3;
    for (int y=0; y<HEIGHT; ++y)
        for (int x=0; x<WIDTH; ++x) {
            if ((x<minx) || (x>maxx) || (y<miny) || (y>maxy))
                frame[x+y*WIDTH] = 0;
            else {
                int dx = abs(x-px);
                int dy = abs(y-py);
                int dist = dx*dx+dy*dy;
                if (dist > rad3*rad3)
                    frame[x+y*WIDTH] = 0;
                else if (dist > rad2*rad2)
                    frame[x+y*WIDTH] = (frame[x+y*WIDTH] >> 2) & 0xF9E7;
                else if (dist > rad1*rad1)
                    frame[x+y*WIDTH] = (frame[x+y*WIDTH] >> 1) & 0xFBEF;
            }
        }
}

void FrameBuffer::printMessage(const char *text, GFXfont font, uint16_t color, int x, int y) {
	// TODO: Add text with SDL
}

void FrameBuffer::blt() {

    //Replace this with device specific routine
    //util_gfx_draw_raw_async(0, 0, WIDTH, HEIGHT, frame);

    void* pixels;
    int pitch;
    SDL_Texture* tex = SDL_CreateTexture(renderer, SDL_PIXELFORMAT_RGB565, SDL_TEXTUREACCESS_STREAMING, WIDTH, HEIGHT);
    SDL_LockTexture(tex, NULL, &pixels, &pitch);
    memcpy(pixels, frame, WIDTH*HEIGHT*sizeof(uint16_t));
    SDL_UnlockTexture(tex);
    SDL_RenderCopy(renderer, tex, NULL, NULL);
    SDL_DestroyTexture(tex);
    SDL_RenderPresent(renderer);
}
