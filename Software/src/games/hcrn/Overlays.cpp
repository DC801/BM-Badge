//
//  Overlays.cpp
//  DC801
//
//  Created by DC801 for DEFCON27.

#include <cstdint>
#include <cstdio>
#include <cstring>

#include "GameEngine.h"
#include "hcrn_common.h"
#include "sprites_raw.h"

void GameEngine::WriteMessage(const char* message, uint16_t fontcolor, GFXfont font, area_t area)
{
    // util_gfx_set_color(fontcolor);
    // util_gfx_set_font(font);

    canvas.setTextArea(&area);
    // util_gfx_cursor_area_set(area);
    // util_gfx_set_cursor(area.xs, area.ys+1);

    for (size_t i = 0; i < strlen(message); ++i)
    {
    	// 30ms delay
        nrf_delay_ms(30);

        // skip on USER_BUTTON_B
        if (getButton(false) == USER_BUTTON_B)
        {
            canvas.printMessage(message, font, fontcolor, area.xs, area.ys + 1);
            // util_gfx_set_cursor(area.xs, area.ys+1);
            // util_gfx_print(message);
            i = strlen(message);
        }
        else
        {
            canvas.write_char(message[i], font);
            // util_gfx_print_char(message[i]);
        }
    }
}

int GameEngine::DrawInput(int inputs, int16_t HEIGHT_OFFSET, uint16_t bgcolor, uint16_t fontcolor, uint16_t highlight)
{
    uint32_t start = millis();
    uint8_t input[8] = { 0 };
    uint8_t idx = 0;

    //height offset for all input items
    area_t inputs_area = {5, (int16_t) (HEIGHT_OFFSET - 4), 124, 124};
    canvas.setTextArea(&inputs_area);
    // util_gfx_cursor_area_set(inputs_area);

    int offset = 24 + (8 - inputs) * 5;
    int button = USER_BUTTON_B;

    // util_gfx_set_font(FONT_ALIEN);
    // util_gfx_set_color(fontcolor);

    do
    {
        if (button)
        {
            if (button == USER_BUTTON_LEFT)
            {
                idx -= ((idx == 0) ? (0) : (1));
            }
            else if (button == USER_BUTTON_RIGHT)
            {
                idx += (idx == (inputs - 1) ? (0) : (1));
            }
            else if (button == USER_BUTTON_UP)
            {
                input[idx] = (input[idx] + 1) % 16;
            }
            else if (button == USER_BUTTON_DOWN)
            {
                input[idx] = ((input[idx] == 0) ? (15) : (input[idx] - 1));
            }

            canvas.fillRect(3, HEIGHT_OFFSET - 4, 121, 20, bgcolor);
            // util_gfx_fill_rect(3, HEIGHT_OFFSET-4 ,121, 20, bgcolor);

            for (int i = 0; i < inputs; ++i)
            {
                const char msg[] = { (char)('0' + input[i]), 0 };
                canvas.printMessage(msg, SFAlienEncountersSolid5pt7b, fontcolor, offset + (i * 10) + 1, HEIGHT_OFFSET + 4);

                // util_gfx_set_cursor(offset + i * 10 + 1, HEIGHT_OFFSET + 4);
                // util_gfx_print_char('0' + input[i]);
            }

            if (inputs)
            {
                int x = offset + idx * 10;
                canvas.drawRect(x, HEIGHT_OFFSET, 10, 12, highlight);
                // util_gfx_draw_rect(x, HEIGHT_OFFSET, 10, 12, highlight);

                canvas.drawTriangle(x + 3, HEIGHT_OFFSET - 2,  x + 7, HEIGHT_OFFSET - 2,  x + 5, HEIGHT_OFFSET - 4,  highlight);
                canvas.drawTriangle(x + 2, HEIGHT_OFFSET + 13, x + 7, HEIGHT_OFFSET + 13, x + 5, HEIGHT_OFFSET + 15, highlight);
                // util_gfx_draw_triangle(x + 3, HEIGHT_OFFSET - 2,  x + 7, HEIGHT_OFFSET - 2,  x + 5, HEIGHT_OFFSET - 4,  highlight);
                // util_gfx_draw_triangle(x + 2, HEIGHT_OFFSET + 13, x + 7, HEIGHT_OFFSET + 13, x + 5, HEIGHT_OFFSET + 15, highlight);
            }

            //wait for release
            while (isButtonDown(button))
            {
                nrf_delay_ms(10);
            }
        }

        app_usbd_event_queue_process();
        button = getButton(false);
    } while(button != USER_BUTTON_A);

    while (isButtonDown(USER_BUTTON_A))
    {
        nrf_delay_ms(10);
    }

    uint32_t ret = 0;
    for (int i = 0; i < inputs; ++i)
    {
        ret += input[i] << ((inputs - i - 1) * 4);
    }

    lastTime += millis_elapsed(millis(), start);
    return ret;
}

void GameEngine::DrawInputText(char* response, int inputs, uint8_t start_char, uint8_t numOfChars, uint8_t initialize_char, int16_t HEIGHT_OFFSET, uint16_t bgcolor, uint16_t fontcolor, uint16_t highlight)
{
    uint32_t start = millis();

    uint8_t input[10] =
    {
        initialize_char,
        initialize_char,
        initialize_char,
        initialize_char,
        initialize_char,
        initialize_char,
        initialize_char,
        initialize_char,
        initialize_char,
        initialize_char
    };

    if (initialize_char == (uint8_t)801)
    {
        input[0] = 'H';
        input[1] = 'E';
        input[2] = 'L';
        input[3] = 'G';
        input[4] = 'A';
        input[5] = '_';
        input[6] = '_';
        input[7] = '8';
        input[8] = '0';
        input[9] = '1';
	}

    uint8_t idx = 0 ;

    //height offset for all input items
    area_t inputs_area = {5, (int16_t) (HEIGHT_OFFSET - 4), 124, 124};
    canvas.setTextArea(&inputs_area);
    // util_gfx_cursor_area_set(inputs_area);

    int offset = 24 + (8-inputs) * 5;
    int button = USER_BUTTON_B;

    // util_gfx_set_font(FONT_VERAMONO_5PT); //FONT_ALIEN TODO: get font alien working
    // util_gfx_set_color(fontcolor);

    do
    {
        if (button)
        {
            if (button == USER_BUTTON_LEFT)
            {
                idx -= idx == 0?0:1;
            }
            else if (button == USER_BUTTON_RIGHT)
            {
                idx += idx==(inputs-1)?0:1;
            }
            else if (button == USER_BUTTON_DOWN)
            {
                input[idx] = (((input[idx] - start_char) + 1) % numOfChars) + start_char;
            }
            else if (button == USER_BUTTON_UP)
            {
                input[idx] = input[idx]==start_char?(numOfChars + start_char -1):(input[idx]-1);
            }

            canvas.fillRect(3, HEIGHT_OFFSET - 4, 121, 20, bgcolor);
            // util_gfx_fill_rect(3, HEIGHT_OFFSET - 4 ,121, 20, bgcolor);

            for (int i = 0; i < inputs; ++i)
            {
                const char msg[] = { (char)('0' + input[i]), 0 };
                canvas.printMessage(msg, SFAlienEncountersSolid5pt7b, fontcolor, offset + (i * 10) + 1, HEIGHT_OFFSET + 4);
                // util_gfx_set_cursor(offset + i * 10 + 1, HEIGHT_OFFSET + 4);
                // util_gfx_print_char(input[i]);
            }

            if (inputs)
            {
                int x = offset + (idx * 10);

                canvas.drawRect(x, HEIGHT_OFFSET, 10, 12, highlight);
                // util_gfx_draw_rect(x, HEIGHT_OFFSET, 10, 12, highlight);
                canvas.drawTriangle(x + 3, HEIGHT_OFFSET - 2,  x + 7, HEIGHT_OFFSET - 2,  x + 5, HEIGHT_OFFSET - 4,  highlight);
                // util_gfx_draw_triangle(x + 3, HEIGHT_OFFSET - 2,  x + 7, HEIGHT_OFFSET - 2,  x + 5, HEIGHT_OFFSET - 4,  highlight);
                canvas.drawTriangle(x + 2, HEIGHT_OFFSET + 13, x + 7, HEIGHT_OFFSET + 13, x + 5, HEIGHT_OFFSET + 15, highlight);
                // util_gfx_draw_triangle(x + 2, HEIGHT_OFFSET + 13, x + 7, HEIGHT_OFFSET + 13, x + 5, HEIGHT_OFFSET + 15, highlight);
            }

            //wait for release
            while (isButtonDown(button))
            {
                nrf_delay_ms(10);
            }
        }

        app_usbd_event_queue_process();
        button = getButton(false);
    } while(button != USER_BUTTON_A);

    while (isButtonDown(USER_BUTTON_A))
    {
        nrf_delay_ms(10);
    }

    uint32_t ret = 0;
    for (int i = 0; i< inputs; ++i)
    {
    	response[i] = input[i];
    	printf("response[%d]: %c\n", i, response[i]);
    }

    response[inputs] = '\0'; // terminate string with null
    lastTime += millis_elapsed(millis(), start);
}

bool GameEngine::DrawThisOrThat(const char* query, area_t query_area, const char* response_one, const char* response_two, uint16_t bgcolor, uint16_t fontcolor, uint16_t highlight)
{
    // Variable setup
    area_t response_one_area = {8, 87, 126, 106}; // Area for the first answer
    area_t response_two_area = {8, 107, 126, 126}; // Area for the 2nd answer

    uint16_t space_away = 10; // Space in the y direction from the edge (gives room for arrow selector)
    bool selected = 0;

    uint32_t start = millis();

    WriteMessage(query, fontcolor, practical8pt7b, query_area);

    // instant write. no need for skipping.
    canvas.setTextArea(&response_one_area);
    // util_gfx_cursor_area_set(response_one_area);
    canvas.printMessage(response_one, practical8pt7b, fontcolor, response_one_area.xs + 10, response_one_area.ys + 1);
    // util_gfx_set_cursor(response_one_area.xs+10, response_one_area.ys+1);
    // util_gfx_print(response_one);

    // instant write. no need for skipping.
    canvas.setTextArea(&response_two_area);
    // util_gfx_cursor_area_set(response_two_area);
    canvas.printMessage(response_two, practical8pt7b, fontcolor, response_two_area.xs + 10, response_two_area.ys + 1);
    // util_gfx_set_cursor(response_two_area.xs+10, response_two_area.ys+1);
    // util_gfx_print(response_two);

    canvas.drawTriangle(4, 88, 6, 90, 4, 92, fontcolor);
    // util_gfx_draw_triangle(4, 88, 6, 90, 4, 92, fontcolor);

    while (getButton(false) != USER_BUTTON_A)
    {
        if ((getButton(false) != USER_BUTTON_DOWN) || (getButton(false) != USER_BUTTON_UP))
        {
            switch(selected)
            {
                case 0:
                    if (getButton(false) == USER_BUTTON_DOWN)
                    {
                        canvas.drawTriangle(4, 88, 6, 90, 4, 92, bgcolor);
                        // util_gfx_draw_triangle(4, 88, 6, 90, 4, 92, bgcolor);
                        canvas.drawTriangle(4, 108, 6, 110, 4, 112, highlight);
                        // util_gfx_draw_triangle(4, 108, 6, 110, 4, 112, highlight);

                        selected = 1;
                        nrf_delay_ms(10);
                    }

                    break; //optional

                case 1:
                    if (getButton(false) == USER_BUTTON_UP)
                    {
                        canvas.drawTriangle(4, 88, 6, 90, 4, 92, highlight);
                        // util_gfx_draw_triangle(4, 88, 6, 90, 4, 92, highlight);
                        canvas.drawTriangle(4, 108, 6, 110, 4, 112, bgcolor);
                        // util_gfx_draw_triangle(4, 108, 6, 110, 4, 112, bgcolor);

                        selected = 0;
                        nrf_delay_ms(10);
                    }

                    break; //optional
    		}
    	}

        app_usbd_event_queue_process();
    }

    //debounce
    while (isButtonDown(USER_BUTTON_A))
    {
        nrf_delay_ms(10);
    }

    lastTime += millis_elapsed(millis(), start);
    return selected;
}

uint8_t GameEngine::DrawManyOptions(const char *options[], area_t area, uint16_t bgcolor, uint16_t fontcolor, uint16_t highlight)
{
    uint32_t start = millis();
    nrf_delay_ms(10);

    uint8_t font_height = 12;
    // uint8_t font = FONT_PRACTICAL;

    // Get option size.
    int numInputs = 0;

    for (int i = 0; ; i++)
    {
        if (options[i] == NULL)
        {
            numInputs = i - 1;
            break;
        }
    }

    uint16_t space_away = 8; // Space in the y direction from the edge (gives room for arrow selector)
    uint8_t selected = 0;

    // Set font & color
    // util_gfx_set_color(fontcolor);
    // util_gfx_set_font(font);

    area_t text_area = area;

    for (uint8_t i = 0; i <= numInputs; i++)
    {
        canvas.setTextArea(&text_area);
        // util_gfx_cursor_area_set(text_area);
        canvas.printMessage(options[i], practical8pt7b, fontcolor, text_area.xs + space_away, text_area.ys + 1);
        // util_gfx_set_cursor(text_area.xs+space_away, text_area.ys+1);
        // util_gfx_print(options[i]);

        text_area.ys += font_height;
    }

    canvas.drawTriangle(area.xs, area.ys + 1, area.xs + 2, area.ys + 3, area.xs, area.ys + 5, highlight);
    // util_gfx_draw_triangle(area.xs, area.ys + 1, area.xs + 2, area.ys + 3, area.xs, area.ys + 5, highlight);
    nrf_delay_ms(100);

    int height = selected  * font_height;

    while (getButton(false) != USER_BUTTON_A)
    {
        if ((getButton(false) != USER_BUTTON_DOWN) || (getButton(false) != USER_BUTTON_UP))
        {
            if (getButton(false) == USER_BUTTON_DOWN)
            {
                // Erase
                canvas.drawTriangle(area.xs, area.ys + height + 1, area.xs + 2, area.ys + height + 3, area.xs, area.ys + height + 5, bgcolor);
                // util_gfx_draw_triangle(area.xs, area.ys + height + 1, area.xs + 2, area.ys + height + 3, area.xs, area.ys + height + 5, bgcolor);

                if (selected == numInputs)
                {
                    selected = 0;
                }
                else
                {
                    selected += 1;
                }

                height = selected * font_height;

                // Draw new
                canvas.drawTriangle(area.xs, area.ys + height + 1, area.xs + 2, area.ys + height + 3, area.xs, area.ys + height + 5, highlight);
                // util_gfx_draw_triangle(area.xs, area.ys + height + 1, area.xs + 2, area.ys + height + 3, area.xs, area.ys + height + 5, highlight);
                nrf_delay_ms(100);
            }
            else if (getButton(false) == USER_BUTTON_UP)
            {
                // Erase
                canvas.drawTriangle(area.xs, area.ys + height + 1, area.xs + 2, area.ys + height + 3, area.xs, area.ys + height + 5, bgcolor);
                // util_gfx_draw_triangle(area.xs, area.ys + height + 1, area.xs + 2, area.ys + height + 3, area.xs, area.ys + height + 5, bgcolor);

                if (selected == 0)
                {
                    selected = numInputs;
                }
                else
                {
                    selected -= 1;
                }

                height = selected * font_height;

                // Draw new
                canvas.drawTriangle(area.xs, area.ys + height + 1, area.xs + 2, area.ys + height + 3, area.xs, area.ys + height + 5, highlight);
                // util_gfx_draw_triangle(area.xs, area.ys + height + 1, area.xs + 2, area.ys + height + 3, area.xs, area.ys + height + 5, highlight);
                nrf_delay_ms(100);
            }
    	}

        app_usbd_event_queue_process();
    }

    while (getButton(false) != USER_BUTTON_A)
    {
        app_usbd_event_queue_process();
    }

    //debounce
    while (isButtonDown(USER_BUTTON_A))
    {
        nrf_delay_ms(10);
    }

    lastTime += millis_elapsed(millis(), start);
    return selected;
}

void GameEngine::DrawDialogBackground(const char* avatar, uint16_t bgcolor, uint16_t outer_bevel, uint16_t inner_bevel)
{
    canvas.fillRect(0, 64, WIDTH, HEIGHT - 64, bgcolor);
    // util_gfx_fill_rect(0, 64, 128, 128, bgcolor);
    canvas.drawRect(0, 32, 35, 33, outer_bevel);
    // util_gfx_draw_rect(0, 32, 35, 33, outer_bevel);
    canvas.drawRect(1, 33, 35, 33, inner_bevel);
    // util_gfx_draw_rect(1, 33, 35, 33, inner_bevel);
    canvas.drawRect(0, 64, 127, 63, outer_bevel);
    // util_gfx_draw_rect(0, 64, 127, 63, outer_bevel);
    canvas.drawRect(1, 65, 127, 63, inner_bevel);
    // util_gfx_draw_rect(1, 65, 127, 63, inner_bevel);

    if (avatar)
    {
        if (strncmp("HCRN/tinker.bmp", avatar, strlen(avatar)) == 0)
        {
            //util_gfx_draw_bmp(, 2, 34, RGB(0,0,0));

            canvas.drawImage(2, 34, 32, 32, bomb_raw);
            // util_gfx_draw_raw_int16(2, 34, 32, 32, bomb_raw);
        }
        else
        {
            // TODO: add this
            // canvas.drawBitmapFromFile(avatar, 2, 34);
            // util_gfx_draw_bmp_file(avatar, 2, 34);
        }
    }
    else
    {
        canvas.fillRect(2, 34, 32, 32, 0);
        // util_gfx_fill_rect(2, 34, 32, 32, st7735_color565(0, 0, 0));
    }
}

void GameEngine::DrawTerminalBackground(uint16_t bgcolor, uint16_t outer_bevel, uint16_t inner_bevel)
{
    canvas.clearScreen(bgcolor);
    // util_gfx_fill_screen(bgcolor);
    canvas.fillRect(0, 0, 127, 127, outer_bevel);
    // util_gfx_draw_rect(0, 0, 127, 127, outer_bevel);
    canvas.fillRect(1, 1, 125, 125, inner_bevel);
    // util_gfx_draw_rect(1, 1, 125, 125, inner_bevel);
    canvas.fillRect(2, 2, 123, 123, outer_bevel);
    // util_gfx_draw_rect(2, 2, 123, 123, outer_bevel);
}

void GameEngine::ShowDialog(const char* message, const char* avatar, bool page)
{
    area_t area = {3, 67, 126, 126};
    uint32_t start = millis();
    uint16_t fontcolor = st7735_color565(220, 220, 220);

    DrawDialogBackground(avatar, st7735_color565(30, 30, 200), st7735_color565(180, 180, 180), st7735_color565(90, 90, 90));

    WriteMessage(message, fontcolor, practical8pt7b, area);

    if (page)
    {
        canvas.drawTriangle(118, 125, 120, 127, 122, 125, fontcolor);
        // util_gfx_draw_triangle(118, 125, 120, 127, 122, 125, fontcolor);
    }

    canvas.blt();
    while (getButton(false) != USER_BUTTON_A)
    {
        app_usbd_event_queue_process();
    }

    //debounce
    while (isButtonDown(USER_BUTTON_A))
    {
        nrf_delay_ms(10);
    }

    lastTime += millis_elapsed(millis(), start);
}

bool GameEngine::DialogRequestResponse(const char* query, const char* response_one, const char* response_two, const char* avatar)
{
    uint16_t fontcolor = st7735_color565(220, 220, 220);
    uint16_t dialog_background_color = st7735_color565(30, 30, 200);
    area_t query_area = {3, 67, 126, 85}; // Area for the question

    DrawDialogBackground(avatar, dialog_background_color, st7735_color565(180, 180, 180), st7735_color565(90, 90, 90));

    return DrawThisOrThat(query, query_area, response_one, response_two, dialog_background_color, fontcolor, fontcolor);
}

void GameEngine::TerminalRequestName(const char* query, int inputs, char* response)
{
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);
    uint16_t highlight = st7735_color565(168, 126, 229);
    uint16_t outer_bevel = st7735_color565(90, 90, 90);
    uint16_t inner_bevel = st7735_color565(180, 180, 180);

    DrawTerminalBackground(bgcolor, outer_bevel, inner_bevel);

    area_t query_area = {5, 5, 126, 64}; // Area for the query
    WriteMessage(query, fontcolor, practical8pt7b, query_area);
    DrawInputText(response, inputs, 32, 64, (uint8_t) 801, 92, bgcolor, fontcolor, highlight);
}

void GameEngine::TerminalBoot(void)
{
#ifndef DEBUGMODE // Don't show if debug mode is enabled. it's annoyingly slow
    // setup colors
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);
    uint16_t highlight = st7735_color565(168, 126, 229);
    uint16_t outer_bevel = st7735_color565(90, 90, 90);
    uint16_t inner_bevel = st7735_color565(180, 180, 180);

    area_t area = {4, 5, 124, 124}; // Area for the options
    uint8_t font_height = 10;

    area_t first_screen_area = area; // first_screen_area for the options
    DrawTerminalBackground(bgcolor, outer_bevel, inner_bevel);
    WriteMessage("INIT: version 10204", fontcolor, practical8pt7b, first_screen_area);
    nrf_delay_ms(1500);

    first_screen_area.ys = first_screen_area.ys + (font_height * 2);
    WriteMessage("[ OK ]:Mounted /home\n[ OK ]:Mounted /opt", fontcolor, practical8pt7b, first_screen_area);
    nrf_delay_ms(1420);

    first_screen_area.ys = first_screen_area.ys + (font_height * 2);
    WriteMessage("[ OK ]:Setting hostname\nto TaSheep", fontcolor, practical8pt7b, first_screen_area);

    first_screen_area.ys = first_screen_area.ys + (font_height * 2);
    nrf_delay_ms(1400);
    WriteMessage("$ /opt/mcrn/terminal\nstarting", fontcolor, practical8pt7b, first_screen_area);

    first_screen_area.ys = first_screen_area.ys + (font_height * 2);
    canvas.setTextArea(&first_screen_area);

    for (uint8_t i = 0; i <= 6; i++)
    {
        nrf_delay_ms(600);

        canvas.write_char('.', practical8pt7b);
        // util_gfx_print_char('.');
    }

    nrf_delay_ms(1200);
#endif
}

uint8_t GameEngine::TerminalMenu(const char* header, const char *options[])
{
    // setup colors
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);
    uint16_t highlight = st7735_color565(168, 126, 229);
    uint16_t outer_bevel = st7735_color565(90, 90, 90);
    uint16_t inner_bevel = st7735_color565(180, 180, 180);

    area_t area = { 4, 5, 124, 124 }; // Area for the options
    uint8_t font_height = 10;

    DrawTerminalBackground(bgcolor, outer_bevel, inner_bevel);
    WriteMessage(header, fontcolor, practical8pt7b, area);

    area_t first_text_area = area; // first_screen_area for the options.
    first_text_area.ys = first_text_area.ys + (font_height * 1);

    return DrawManyOptions(options, first_text_area, bgcolor, fontcolor, highlight);
}

int GameEngine::ShowTerminal(const char* message, int inputs)
{
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);
    uint16_t highlight = st7735_color565(168, 126, 229);
    uint16_t outer_bevel = st7735_color565(90, 90, 90);
    uint16_t inner_bevel = st7735_color565(180, 180, 180);

    uint32_t start = millis();
    ShowTerminalNoResponse(message);

    if (inputs < 1)
    {
        while (getButton(false) != USER_BUTTON_A)
        {
            app_usbd_event_queue_process();
        }

        //debounce
        while (isButtonDown(USER_BUTTON_A))
        {
            nrf_delay_ms(10);
        }

        lastTime += millis_elapsed(millis(), start);
        return 0;
    }
    else
    {
    	return DrawInput(inputs, 84, bgcolor, fontcolor, highlight);
    }
}

void GameEngine::ShowTerminalText(const char* message, int inputs, char* response)
{
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);
    uint16_t highlight = st7735_color565(168, 126, 229);
    uint16_t outer_bevel = st7735_color565(90, 90, 90);
    uint16_t inner_bevel = st7735_color565(180, 180, 180);

    uint32_t start = millis();
    ShowTerminalNoResponse(message);
    DrawInputText(response, inputs, 65, 26, 65, 84, bgcolor, fontcolor, highlight);
}

void GameEngine::ShowTerminalNoResponse(const char* message)
{
    // setup area
    area_t area = {5, 5, 124, 124};
    // setup colors
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);
    uint16_t highlight = st7735_color565(168, 126, 229);
    uint16_t outer_bevel = st7735_color565(90, 90, 90);
    uint16_t inner_bevel = st7735_color565(180, 180, 180);

    DrawTerminalBackground(bgcolor, outer_bevel, inner_bevel);
    WriteMessage(message, fontcolor, practical8pt7b, area);
}

int GameEngine::ShowTerminalCaptcha(const char* above_captcha_message, const char* below_captcha_message, int inputs, const char* captcha)
{
    // setup areas
    area_t above_captcha_area = {5, 5, 124, 44};
    area_t below_captcha_area = {5, 92, 124, 103};
    // setup colors
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);
    uint16_t highlight = st7735_color565(168, 126, 229);
    uint16_t outer_bevel = st7735_color565(90, 90, 90);
    uint16_t inner_bevel = st7735_color565(180, 180, 180);

    // draw terminal
    DrawTerminalBackground(bgcolor, outer_bevel, inner_bevel);

    // write first message
    WriteMessage(above_captcha_message, fontcolor, practical8pt7b, above_captcha_area);

    // Draw Captcha
    canvas.fillRect(8, 45, 112, 41, st7735_color565(90, 90, 90));
    // util_gfx_draw_rect(8, 45, 112, 41, st7735_color565(90, 90, 90));
    canvas.fillRect(9, 46, 110, 39, st7735_color565(180, 180, 180));
    // util_gfx_draw_rect(9, 46, 110, 39, st7735_color565(180, 180, 180));
    canvas.fillRect(10, 47, 108, 37, st7735_color565(90, 90, 90));
    // util_gfx_draw_rect(10, 47, 108, 37, st7735_color565(90, 90, 90));

    if (captcha)
    {
        // TODO: Implement this
        // util_gfx_draw_bmp_file(captcha, 11, 48);
    }
    else
    {
        canvas.fillRect(11, 46, 106, 35, 0);
        // util_gfx_fill_rect(11, 46, 106, 35, st7735_color565(0, 0, 0));
    }

    // write second message
    WriteMessage(below_captcha_message, fontcolor, practical8pt7b, below_captcha_area);

    int response = DrawInput(inputs, 107, bgcolor, fontcolor, highlight);
    return response;
}

bool GameEngine::TerminalRequestResponse(const char* query, const char* response_one, const char* response_two) {
    // setup colors
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);
    uint16_t highlight = st7735_color565(168, 126, 229);
    uint16_t outer_bevel = st7735_color565(90, 90, 90);
	uint16_t inner_bevel = st7735_color565(180, 180, 180);
	area_t query_area = {5, 5, 124, 85}; // Area for the question

	DrawTerminalBackground(bgcolor, outer_bevel, inner_bevel);
    return DrawThisOrThat(query, query_area, response_one, response_two, bgcolor, fontcolor, fontcolor);
}

void GameEngine::ShowTerminalError(const char* message, const char* error_message, int8_t error_lines_down)
{
    // setup area
    area_t area = {5, 5, 124, (int16_t) (10 * error_lines_down + 5)};
    area_t error_area = {5, (int16_t) (10 * error_lines_down + 5), 124, 124};
    // setup colors
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);
    uint16_t error_color = st7735_color565(255, 0, 0);
    uint16_t highlight = st7735_color565(168, 126, 229);
    uint16_t outer_bevel = st7735_color565(90, 90, 90);
    uint16_t inner_bevel = st7735_color565(180, 180, 180);

    DrawTerminalBackground(bgcolor, outer_bevel, inner_bevel);
    WriteMessage(message, fontcolor, practical8pt7b, area);

    canvas.drawRect(10, 47, 80, 1, error_color);
    // util_gfx_draw_rect(10, 47, 80, 2, error_color);
    nrf_delay_ms(10);

    canvas.drawRect(24, 5, 16, 4, error_color);
    // util_gfx_draw_rect(24, 5, 16, 4, error_color);
    nrf_delay_ms(10);

    canvas.drawRect(120, 30, 1, 25, error_color);
    // util_gfx_draw_rect(120, 30, 1, 25, error_color);
    nrf_delay_ms(10);

    WriteMessage(error_message, error_color, practical8pt7b, error_area);

    while (getButton(false) != USER_BUTTON_A)
    {
        app_usbd_event_queue_process();
    }

    //debounce
    while (isButtonDown(USER_BUTTON_A))
    {
        nrf_delay_ms(10);
    }
}

void GameEngine::DrawPopup(area_t area, int padding_x, int padding_y)
{
    printf("DrawPopup({ %d, %d, %d, %d})\n", area.xs, area.ys, area.xe, area.ye);
    // setup area
    // = {36, 92, 100, 110};
    // {32, 80, 69, 32}
    // setup colors
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);
    uint16_t outer_bevel = st7735_color565(90, 90, 90);
    uint16_t inner_bevel = st7735_color565(180, 180, 180);

    canvas.fillRect(area.xs - padding_x, area.ys - padding_y, area.xe-area.xs + padding_x * 2, area.ye-area.ys + padding_y * 2, bgcolor);
    // util_gfx_fill_rect(area.xs - padding_x, area.ys - padding_y, area.xe-area.xs + padding_x*2, area.ye-area.ys + padding_y*2, bgcolor);
    canvas.fillRect(area.xs - padding_x, area.ys - padding_y, area.xe-area.xs + padding_x * 2, area.ye-area.ys + padding_y * 2, outer_bevel);
    // util_gfx_draw_rect(area.xs - padding_x, area.ys - padding_y, area.xe-area.xs + padding_x*2, area.ye-area.ys + padding_y*2, outer_bevel);
    canvas.fillRect(area.xs - padding_x, area.ys - padding_y, area.xe-area.xs + padding_x * 2, area.ye-area.ys + padding_y * 2, inner_bevel);
    // util_gfx_draw_rect(area.xs - padding_x, area.ys - padding_y, area.xe-area.xs + padding_x*2, area.ye-area.ys + padding_y*2, inner_bevel);
}

void GameEngine::Scanning(bool found)
{
    // setup area
    area_t text_area = {36, 93, 100, 110};
    // setup colors
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);

    DrawPopup({36, 82, 100, 108}, 4, 2);

    canvas.setTextArea(&text_area);
    // util_gfx_set_color(fontcolor);
    // util_gfx_cursor_area_set(text_area);
    // util_gfx_set_font(FONT_PRACTICAL);
    // util_gfx_set_cursor(text_area.xs, text_area.ys+1);

    uint8_t r;
    nrf_drv_rng_rand(&r,1);

    r %= 3;
    r += 1;

    for (int i = 0; i < r; i++)
    {
        canvas.printMessage("- SCANNING -", practical8pt7b, fontcolor, text_area.xs, text_area.ys);
        // util_gfx_print("- SCANNING -");
        nrf_delay_ms(450);

        canvas.fillRect(36, 82, 64, 26, bgcolor);
        // util_gfx_fill_rect(36, 82, 64, 26, bgcolor);
        canvas.printMessage("\\ SCANNING \\", practical8pt7b, fontcolor, text_area.xs, text_area.ys);
        // util_gfx_set_cursor(text_area.xs, text_area.ys+1);
        // util_gfx_print("\\ SCANNING \\");
        nrf_delay_ms(450);

        canvas.fillRect(36, 82, 64, 26, bgcolor);
        // util_gfx_fill_rect(36, 82, 64, 26, bgcolor);
        canvas.printMessage("/ SCANNING /", practical8pt7b, fontcolor, text_area.xs, text_area.ys);
        // util_gfx_set_cursor(text_area.xs, text_area.ys+1);
        // util_gfx_print("/ SCANNING /");
        nrf_delay_ms(450);

        canvas.fillRect(36, 82, 64, 26, bgcolor);
        // util_gfx_fill_rect(36, 82, 64, 26, bgcolor);
        // util_gfx_set_cursor(text_area.xs, text_area.ys+1);
    }

    if (found)
    {
    	text_area.xs += 16;
    	WriteMessage("Found!", fontcolor, practical8pt7b, text_area);
    }
    else
    {
    	text_area.xs += 6;
    	WriteMessage("Not Found", fontcolor, practical8pt7b, text_area);
    }

    while (getButton(false) != USER_BUTTON_A)
    {
        app_usbd_event_queue_process();
    }

    //debounce
    while (isButtonDown(USER_BUTTON_A))
    {
        nrf_delay_ms(10);
    }
}

void GameEngine::ShowAlert(const char* message) {
    uint32_t start = millis();
    int8_t font_width = 6;
    int8_t font_height = 9;

    int8_t chars_wide = 0;
    int8_t rows_tall = 1;

    for (int i = 0; message[i] != '\0'; i++)
    {
        if (message[i] == '\n')
        {
            rows_tall += 1;
        }
        else
        {
            chars_wide += 1;
        }
    }

    printf("(%d * %d) / %d\n", chars_wide, font_width, rows_tall);

    int8_t text_area_width = (chars_wide * font_width) / rows_tall;
    int8_t text_area_height = (rows_tall * font_height);

    printf("textW: %d, textH: %d\n", text_area_width, text_area_height);

    int8_t text_area_x = ((WIDTH - text_area_width) / 2);
    int8_t text_area_y = (99 - text_area_height);

    // setup area
    area_t text_area = { text_area_x, text_area_y, (int16_t) (text_area_x + text_area_width), (int16_t) (text_area_y + text_area_height) };

    // setup colors
    uint16_t bgcolor = st7735_color565(31, 37, 38);
    uint16_t fontcolor = st7735_color565(82, 163, 204);

    DrawPopup(text_area, 4, 6);
    WriteMessage(message, fontcolor, practical8pt7b, text_area);

    while (getButton(false) != USER_BUTTON_A)
    {
        app_usbd_event_queue_process();
    }

    //debounce
    while (isButtonDown(USER_BUTTON_A))
    {
        nrf_delay_ms(10);
    }

    lastTime += millis_elapsed(millis(), start);
}
