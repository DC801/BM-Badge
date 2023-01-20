#include "mage_rom.h"

std::unique_ptr<MageROM>& ::ROM()
{
   static auto romPtr = std::make_unique<MageROM>();
   return romPtr;
}