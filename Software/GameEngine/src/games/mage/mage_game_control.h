#ifndef _MAGE_GAME_CONTROL
#define _MAGE_GAME_CONTROL

#include "EngineROM.h"
#include "EngineInput.h"
#include "FrameBuffer.h"

#include "mage_animation.h"
#include "mage_entity_type.h"
#include "mage_camera.h"
#include "mage_defines.h"
#include "mage_header.h"
#include "mage_tileset.h"
#include <vector>

#define MAGE_COLLISION_SPOKE_COUNT 6

class MageEntityType;
class MageCamera;
class MageColorPalette;
class MageGeometry;
class TileManager;
enum MageEntityAnimationDirection : uint8_t;
/*
The MageGameControl object handles several important tasks. It's basically the
core of the entire MAGE() game, and contains all the important variables that
track the state of the game.

MageGameControl's first important function is to read all relevant data from
the ROM chip into RAM, and also to have helper functions to read additional
ROM data on demand as needed when updating variables.

MageGameControl also tracks the state of all hackable entities in the game, and
interprets the data contained in the array when deciding what needs to be drawn
to the screen.

Finally, MageGameControl handles the actual act of updating the state of the
game based on input data and rendering it all to the screen every frame.
*/

struct MageSaveGame
{
   const char* identifier = EngineROM::SaveIdentifierString;
   uint32_t engineVersion{ ENGINE_VERSION };
   uint32_t scenarioDataCRC32{ 0 };
   uint32_t saveDataLength{ sizeof(MageSaveGame) };
   char name[MAGE_ENTITY_NAME_LENGTH]{ DEFAULT_PLAYER_NAME };
   //this stores the byte offsets for the hex memory buttons:
   uint8_t memOffsets[MAGE_NUM_MEM_BUTTONS]{
      MageEntityField::x,
      MageEntityField::y,
      MageEntityField::primaryId, // entityType
      MageEntityField::direction,
   };
   uint16_t currentMapId{ DEFAULT_MAP };
   uint16_t warpState{ MAGE_NO_WARP_STATE };
   uint8_t clipboard[1]{ 0 };
   uint8_t clipboardLength{ 0 };
   uint8_t paddingA{ 0 };
   uint8_t paddingB{ 0 };
   uint8_t paddingC{ 0 };
   uint8_t saveFlags[MAGE_SAVE_FLAG_BYTE_COUNT] = { 0 };
   uint16_t scriptVariables[MAGE_SCRIPT_VARIABLE_COUNT] = { 0 };
};


class MageGameControl
{
   friend class MageGameEngine;
   friend class MageScriptActions;
   friend class MageCommandControl;
   friend class MageScriptControl;
   friend class MageDialogControl;
   friend class MageMap;
   friend class MageHexEditor;
   friend class MageEntity;
public:
   MageGameControl(MageGameEngine* gameEngine);

   //this is the index value of where the playerEntity is located within
   //the entities[] array and also the offset to it from hackableDataAddress
   uint8_t playerEntityIndex{ NO_PLAYER };

   uint8_t currentSaveIndex{ 0 };
   MageSaveGame currentSave{};

   //this lets us make it so that inputs stop working for the player
   bool playerHasControl{ false };
   bool playerHasHexEditorControl{ false };
   bool playerHasHexEditorControlClipboard{ false };
   bool isCollisionDebugOn{ false };
   bool isEntityDebugOn{ false };
   MageCamera camera;

   //returns the size in memory of the MageGameControl object.
   uint32_t Size() const;

   void setCurrentSaveToFreshState();
   void readSaveFromRomIntoRam(bool silenceErrors = false);
   void saveGameSlotSave();
   void saveGameSlotErase(uint8_t slotIndex);
   void saveGameSlotLoad(uint8_t slotIndex);

   const MageAnimation* getAnimation(uint16_t animationId) const
   {
      return animations[animationId % animations.size()];
   }

   //this will return the current map object.
   auto Map() { return map; }

   //this handles inputs that apply in ALL game states. That includes when
   //the hex editor is open, when it is closed, when in any menus, etc.
   void applyUniversalInputs();

   //this takes input information and moves the playerEntity around
   //If there is no playerEntity, it just moves the camera freely.
   void applyGameModeInputs(uint32_t deltaTime);
   void applyCameraEffects(uint32_t deltaTime);

   //this will check in the direction the player entity is facing and start
   //an on_interact script for an entity if any qualify.
   void handleEntityInteract(bool hack);

   //this will load a map to be the current map.
   void LoadMap(uint16_t index);

   //this will render the map onto the screen.
   void DrawMap(uint8_t layer);

   uint16_t getValidEntityTypeId(uint16_t entityTypeId) const
   {
      //always return a valid entity type for the entityTypeId submitted.
      return entityTypeId % entityTypes.size();
   }

   const MageEntityType* getValidEntityType(uint16_t entityTypeId) const;
   uint8_t getValidEntityTypeAnimationId(uint8_t entityTypeAnimationId, uint16_t entityTypeId) const;
   MageEntityAnimationDirection getValidEntityTypeDirection(MageEntityAnimationDirection direction);
   MageEntityAnimationDirection updateDirectionAndPreserveFlags(MageEntityAnimationDirection desired, MageEntityAnimationDirection previous);
   const MageGeometry getGeometryFromMapLocalId(uint16_t mapLocalGeometryId) const;
   const MageGeometry* getGeometry(uint16_t globalGeometryId) const;
   MageColorPalette* getValidColorPalette(uint16_t colorPaletteId);
   const MageEntity* getEntityByMapLocalId(uint8_t mapLocalEntityId) const;
   MageEntity* getEntityByMapLocalId(uint8_t mapLocalEntityId);

   std::string getString(uint16_t stringId, int16_t mapLocalEntityId);
   std::string getEntityNameStringById(int8_t mapLocalEntityId);


   //this returns the address offset for a specific script Id:
   uint32_t getScriptAddressFromGlobalScriptId(uint32_t scriptId);

   //this will update the current entities based on the current state of their state variables
   void UpdateEntities(uint32_t deltaTime);

   Point getPushBackFromTilesThatCollideWithPlayer();
   void copyNameToAndFromPlayerAndSave(bool intoSaveRam) const;

#ifndef DC801_EMBEDDED
   void verifyAllColorPalettes(const char* errorTriggerDescription);
#endif

   void logAllEntityScriptValues(const char* string);
   void updateEntityRenderableData(uint8_t mapLocalEntityId, bool skipTilesetCheck = true);
private:

   MageGameEngine* gameEngine;
   std::unique_ptr<MageDialogControl> dialogControl;

   //TODO: move all headers away from here
   std::unique_ptr<MageHeader> stringHeader;

   //this is where the current map data from the ROM is stored.
   std::shared_ptr<MageMap> map;
   std::unique_ptr<TileManager> tileManager;

   //this is an array of the animation data on the ROM
   //each entry is an indexed animation.
   std::vector<const MageAnimation*> animations;

   //this is an array of the entity types on the ROM
   //each entry is an indexed entity type.
   std::vector<const MageEntityType*> entityTypes;

   //a couple of state variables for tracking player movement:
   float mageSpeed{ 0.0f };
   bool isMoving{ false };

   Point playerVelocity = { 0,0 };
}; //class MageGameControl



#endif //_MAGE_GAME_CONTROL
