#ifndef _MAGE_SCRIPT_STATE_H
#define _MAGE_SCRIPT_STATE_H

#include "mage_geometry.h"
#include <stdint.h>

//these are the types of scripts that can be on a map or entity:
enum class MageScriptType : uint8_t
{
   ON_LOAD = 0,
   ON_TICK,
   ON_INTERACT,
   ON_LOOK,
   ON_COMMAND
};
static const inline auto NUM_SCRIPT_TYPES = 5;

struct ResumeGeometry
{
   EntityPoint pointA{ 0,0 };
   EntityPoint pointB{ 0,0 };
   float length{ 0.0f };
   float lengthOfPreviousSegments{ 0.0f };
   uint8_t currentSegmentIndex{ 0 };
};


struct MageScript
{
   const char name[32];
   const uint32_t actionCount;


   struct Action
   {
      const uint8_t TypeId{ 0 };
      const uint8_t Args[MAGE_NUM_ACTION_ARGS]{ 0 };
   };

   const Action* GetAction(uint16_t actionId) const
   {
      if (actionId >= actionCount)
      {
         return nullptr;
      }

      auto actionPointer = (const char*)&actionCount + sizeof(uint32_t);
      return (const Action*)(actionPointer + actionId * sizeof(Action));
   }
};

//this is a structure to hold information about the currently executing scripts so they can resume
struct MageScriptState
{
   MageScriptState() noexcept = default;

   MageScriptState(uint16_t scriptGlobalId, const MageScript* script) noexcept
      : Id(scriptGlobalId),
      script(script)
   {}

   uint16_t Id{ 0 };

   const MageScript* script{ nullptr };
   //the action index to resume from - this is the action index for the script above, NOT a global actionTypeId.
   uint16_t currentAction{ 0 };
   //the number of loops until the next action in the script is to run
   uint16_t loopsToNextAction{ 0 };
   //the total number of loops from the start of the action until the next action
   uint16_t totalLoopsToNextAction{ 0 };

   //indicated whether or not an active script is running on this MageScriptState
   bool scriptIsRunning{ false };
   bool scriptIsPaused{ false };
   ResumeGeometry geometry{ 0 };
};

#endif