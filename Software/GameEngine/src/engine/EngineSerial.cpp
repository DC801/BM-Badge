#include "EngineSerial.h"
#include <iostream>
#include <regex>
#include <string>
#include <cstring>

void EngineSerial::SendMessage(const std::string& message)
{
#ifdef DC801_EMBEDDED
   std::string message_with_crlf = std::regex_replace(
      message,
      std::regex("\n"),
      "\r\n"
   );
   send_serial_message(message_with_crlf.c_str());
#else
   std::cout << message;
#endif
}

void EngineSerial::HandleInput()
{
   //handle_usb_serial_input();

<<<<<<< HEAD
#ifdef DC801_EMBEDDED
	handle_usb_serial_input();
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
		EngineSendSerialMessage("");
		memset(
			command_buffer,
			0,
			command_buffer_length
		);
		command_buffer_length = 0;
		was_command_entered = false;
	}
=======
   if (was_serial_started)
   {
      if (onStart != nullptr)
      {
         onStart();
      }
      was_serial_started = false;
   }

   if (was_command_entered)
   {
      if (onCommand != nullptr)
      {
         //onCommand(commandBuffer);
      }
      SendMessage("> ");
      //commandBuffer
      was_command_entered = false;
   }
>>>>>>> scriptFixes
}


