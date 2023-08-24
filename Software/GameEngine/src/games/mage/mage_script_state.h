#ifndef _MAGE_SCRIPT_STATE_H
#define _MAGE_SCRIPT_STATE_H

#include "mage_geometry.h"
#include <stdint.h>

struct ResumeGeometry
{
    Point pointA{ 0,0 };
    Point pointB{ 0,0 };
    float length{ 0.0f };
    float lengthOfPreviousSegments{ 0.0f };
    uint8_t currentSegmentIndex{ 0 };
};

//this is a structure to hold information about the currently executing scripts so they can resume
struct MageScriptState
{
   MageScriptState() noexcept = default;

   MageScriptState(uint16_t scriptId, bool scriptIsRunning, bool isGlobalExecutionScope = false) noexcept
      :currentScriptId(scriptId),
      scriptIsRunning(scriptIsRunning),
      isGlobalExecutionScope(isGlobalExecutionScope)
   {}

   //indicated whether or not an active script is running on this MageScriptState
   bool scriptIsRunning{ false };
   bool isGlobalExecutionScope{ false };

   //the script Id to resume, scope determined by isGlobalExecutionScope
   // - if false, should be treated as mapLocalScriptId
   // - if true, should be treated as globalScriptId
   uint16_t currentScriptId{ 0 };
   //the action index to resume from - this is the action index for the script above, NOT a global actionTypeId.
   uint16_t actionOffset{ 0 };
   //the number of loops until the next action in the script is to run
   uint16_t loopsToNextAction{ 0 };
   //the total number of loops from the start of the action until the next action
   uint16_t totalLoopsToNextAction{ 0 };

   ResumeGeometry geometry{ 0 };
};

#endif