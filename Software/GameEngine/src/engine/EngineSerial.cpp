#include "EngineSerial.h"
#include <string>
#include <regex>

//#ifndef DC801_EMBEDDED
//#include <stdio.h>
//#include <unistd.h>
//#define FILE_DESCRIPTOR_STDIN 0
//void EngineInputDesktopGetCommandStringFromStandardIn()
//{
//   commandBuffer.fill(0);
//   memset(
//      commandBuffer,
//      0,
//      COMMAND_BUFFER_SIZE);
//   fcntl(FILE_DESCRIPTOR_STDIN, F_SETFL, fcntl(0, F_GETFL) | O_NONBLOCK);
//   auto bytes_read = read(FILE_DESCRIPTOR_STDIN, commandBuffer, COMMAND_BUFFER_MAX_READ);
//   if (bytes_read > 0)
//   {
//      // length - 1 to purge the newline character
//      commandBuffer_length = strlen(commandBuffer) - 1;
//      commandBuffer[commandBuffer_length] = 0x00;
//      commandEntered = commandBuffer_length > 0;
//      /*
//      printf(
//         "stdin"
//         "bytes_read: %d"
//         "| value: %d"
//         "| char: %c"
//         "| commandBuffer_length: %d"
//         "| string: %s\n",
//         bytes_read,
//         commandBuffer[0],
//         commandBuffer[0],
//         commandBuffer_length,
//         commandBuffer
//      );
//      */
//   }
//}
//
//#endif

void EngineSerial::SendMessage(const char* message)
{
#ifndef DC801_EMBEDDED
   printf("%s", message);
   fflush(stdout);
#else
   std::string message_with_crlf = std::regex_replace(
      message,
      std::regex("\n"),
      "\r\n"
   );
   send_serial_message(message_with_crlf.c_str());
#endif
}

void EngineSerial::HandleInput()
{
#ifdef DC801_EMBEDDED
   handle_usb_serial_input();
#else
   //EngineInputDesktopGetCommandStringFromStandardIn();
#endif
   if (started)
   {
      if (onStart != nullptr)
      {
         onStart();
      }
      started = false;
   }
   if (commandEntered)
   {
      if (onCommand != nullptr)
      {
         onCommand(commandBuffer.data());
      }
      SendMessage("");
      commandBuffer.fill(0);
      commandEntered = false;
   }
}
