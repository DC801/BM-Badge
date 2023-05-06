#include "EngineSerial.h"
#include <iostream>
#include <regex>
#include <string>
#include <cstring>

bool was_command_entered = false;
void (*on_start_function_pointer)() = nullptr;
void (*on_command_function_pointer)(char *commandString) = nullptr;


#ifndef DC801_EMBEDDED
void EngineInputDesktopGetCommandStringFromStandardIn()
{
    memset(command_buffer, 0, COMMAND_BUFFER_SIZE);

    std::ios_base::sync_with_stdio(false);
    auto inChar = char{ 0 };
    auto charsRead = int{ 0 };
    auto lineRead = bool{ false };

    do
    {
        charsRead = std::cin.readsome(&inChar, 1);
        if (charsRead == 1)
        {
            if (inChar == '\n')
            {
                lineRead = true;
            }
            else
            {
                command_buffer[command_buffer_length] = inChar;
                command_buffer_length++;
                /*
                printf(
                    "stdin"
                    "bytes_read: %d"
                    "| value: %d"
                    "| char: %c"
                    "| command_buffer_length: %d"
                    "| string: %s\n",
                    bytes_read,
                    command_buffer[0],
                    command_buffer[0],
                    command_buffer_length,
                    command_buffer
                );
                */
            }
        }
    } while (charsRead != 0 && !lineRead);
    was_command_entered = command_buffer_length > 0;
}

#endif

void EngineSendSerialMessage (const char *message)
{
#ifdef DC801_EMBEDDED
    std::string message_with_crlf = std::regex_replace(
        message,
        std::regex("\n"),
        "\r\n"
    );
    send_serial_message(message_with_crlf.c_str());
#else
    printf("%s", message);
    fflush(stdout);
#endif
}

void EngineSerialRegisterEventHandlers (
    void (*on_start)(),
    void (*on_command)(char *commandString)
) {
    on_start_function_pointer = on_start;
    on_command_function_pointer = on_command;
}

void EngineHandleSerialInput ()
{
#ifdef DC801_EMBEDDED
    handle_usb_serial_input();
#else
    EngineInputDesktopGetCommandStringFromStandardIn();
#endif

    if(was_serial_started) {
        if(on_start_function_pointer != nullptr) {
            on_start_function_pointer();
        }
        was_serial_started = false;
    }
    if(was_command_entered) {
        if(on_command_function_pointer != nullptr) {
            on_command_function_pointer(command_buffer);
        }
        EngineSendSerialMessage("> ");
        memset(
            command_buffer,
            0,
            command_buffer_length
        );
        command_buffer_length = 0;
        was_command_entered = false;
    }
}


