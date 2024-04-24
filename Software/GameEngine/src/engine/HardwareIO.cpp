#include "EngineIO.h"
#include "main.h"
#include "EngineSerial.h"

void EngineIO::Update(const GameClock::time_point& curTime)
{
   auto newValue = get_keyboard_mask();
   serial->HandleInput();

   lastDelta = curTime - lastUpdate;
   lastUpdate = curTime;
}