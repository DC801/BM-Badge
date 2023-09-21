/*
This class contains the MapControl class and all related subclasses
It is a structure used to hold the binary information in the ROM
in a more accessible way.
*/
#ifndef _MAGE_MAP_H
#define _MAGE_MAP_H

#include <array>
#include <functional>
#include <optional>
#include <span>
#include <tuple>
#include <vector>

#include "mage_camera.h"
#include "mage_entity_type.h"
#include "mage_tileset.h"
#include "shim_timer.h"
#include "EngineROM.h"
#include "mage_script_state.h"

class MageScript;
struct GoDirection
{
    char name[MAP_GO_DIRECTION_NAME_LENGTH]{ 0 };
    uint16_t mapLocalScriptId{ 0 };
    uint16_t padding{ 0 };
};

struct Tile
{
    uint16_t width{ 0 };
    std::span<uint8_t> indexedColors{};
    const MageColorPalette* colorPalette{ nullptr };
};

struct MageMapTile
{
    uint16_t tileId{ 0 };
    uint8_t tilesetId{ 0 };
    uint8_t flags{ 0 };
};

struct MapData
{
    MapData(uint32_t& address);
    static const inline int MapNameLength = 16;
    char name[MapNameLength]{ 0 };
    uint16_t tileWidth{ 0 };
    uint16_t tileHeight{ 0 };
    uint16_t cols{ 0 };
    uint16_t rows{ 0 };
    uint8_t playerEntityIndex{ 0 };
    uint16_t entityCount{ 0 };
    uint16_t geometryCount{ 0 };
    uint16_t scriptCount{ 0 };
    uint8_t goDirectionsCount{ 0 };

    MageScriptState onLoad;
    MageScriptState onLook;
    MageScriptState onTick;

    constexpr uint8_t colCount() const
    {
        return cols & 0xFF;
    }

    constexpr uint8_t rowCount() const
    {
        return rows & 0xFF;
    }

    //this is the hackable array of entities that are on the current map
    //the data contained within is the data that can be hacked in the hex editor.
    std::array<MageEntity, MAX_ENTITIES_PER_MAP> entities{};
    std::array<RenderableData, MAX_ENTITIES_PER_MAP> entityRenderableData{};

    std::vector<GoDirection> goDirections{};
    std::vector<const MageGeometry*> geometries{};

    struct MapLayer
    {
        MapLayer(const MageMapTile* layerStart, uint16_t cols, uint16_t rows)
            : tiles(std::span<const MageMapTile>(layerStart, cols* rows))
        {}
        std::span<const MageMapTile> tiles;
    };
    std::vector<std::span<const MageMapTile>> layers{};
    std::vector<const MageScript*> scripts{};
};

class MapControl
{
    friend class MageGameEngine;
    friend class MageScriptControl;
    friend class MageHexEditor;
public:
    MapControl(std::shared_ptr<TileManager> tileManager) noexcept
        : tileManager(tileManager)
    {}

    inline uint8_t* GetEntityDataPointer() { return (uint8_t*)currentMap->entities.data(); }
    void Load(uint16_t index);
    void DrawLayer(uint8_t layer, const EntityPoint& cameraPosition) const;
    void DrawGeometry(const EntityPoint& cameraPosition) const;
    void DrawEntities(const EntityPoint& cameraPosition) const;
    void UpdateEntities(const DeltaState& delta);

    void TryMovePlayer(ButtonState button);

    int16_t GetUsefulEntityIndexFromActionEntityId(uint8_t entityIndex, int16_t callingEntityId) const
    {
        if (entityIndex >= currentMap->entities.size() && entityIndex != MAGE_MAP_ENTITY)
        {
            return NO_PLAYER_INDEX;
        }

        switch (entityIndex)
        {
        default:
        case MAGE_MAP_ENTITY:
            return entityIndex;

        case MAGE_ENTITY_SELF:
            return callingEntityId;

        case MAGE_ENTITY_PLAYER:
            return currentMap->playerEntityIndex;
        }
    }

    void Draw(const EntityPoint& cameraPosition) const;

    inline std::string Name() const { return currentMap->name; }
    inline uint16_t TileWidth() const { return currentMap->tileWidth; }
    inline uint16_t TileHeight() const { return currentMap->tileHeight; }
    inline uint16_t Cols() const { return currentMap->cols; }
    inline uint16_t Rows() const { return currentMap->rows; }
    inline uint8_t LayerCount() const { return currentMap->layers.size(); }
    inline uint8_t FilteredEntityCount() const { return currentMap->entities.size(); }
    inline uint16_t GeometryCount() const { return currentMap->geometries.size(); }
    inline uint16_t ScriptCount() const { return currentMap->scripts.size(); }

    const MageGeometry* GetGeometry(uint16_t mapLocalGeometryId) const
    {
        if (currentMap->geometries.empty()) 
        { 
            return nullptr; 
        }
        return currentMap->geometries[mapLocalGeometryId % currentMap->geometries.size()];
    }

    inline std::optional<const MageEntity*> getPlayerEntity() const
    {
        if (currentMap->playerEntityIndex == NO_PLAYER_INDEX)
        {
            return std::nullopt;
        }
        return &getEntityByMapLocalId(currentMap->playerEntityIndex);
    }

    inline std::optional<MageEntity*> getPlayerEntity()
    {
        if (currentMap->playerEntityIndex == NO_PLAYER_INDEX)
        {
            return std::nullopt;
        }
        return &getEntityByMapLocalId(currentMap->playerEntityIndex);
    }

    inline RenderableData& getPlayerEntityRenderableData()
    {
        return currentMap->entityRenderableData[currentMap->playerEntityIndex];
    }

    inline std::optional<const MageEntity*> tryGetEntity(uint16_t id) const
    {
        return &currentMap->entities[id % currentMap->entities.size()];
    }

    inline std::optional<MageEntity*> tryGetEntity(uint16_t id)
    {
        return &currentMap->entities[id % currentMap->entities.size()];
    }

    inline RenderableData& getEntityRenderableData(uint16_t id)
    {
        return currentMap->entityRenderableData[id % currentMap->entityRenderableData.size()];
    }

    inline const MageEntity& getEntityByMapLocalId(uint16_t mapLocalId) const
    {
        return currentMap->entities[mapLocalId % currentMap->entities.size()];
    }

    inline MageEntity& getEntityByMapLocalId(uint16_t mapLocalId)
    {
        return currentMap->entities[mapLocalId % currentMap->entities.size()];
    }

    std::string getDirectionNames() const
    {
        std::string result = "";
        for (auto& dir : currentMap->goDirections)
        {
            result += "\t";
            result += dir.name;
        }
        return result;
    }

    uint16_t getDirectionScriptId(const std::string directionName) const
    {
        for (auto& dir : currentMap->goDirections)
        {
            if (dir.name == directionName)
            {
                return dir.mapLocalScriptId;
            }
        }
        return 0;
    }

    inline uint8_t getPlayerEntityIndex() const { return currentMap->playerEntityIndex; }


    //this is used by the loadMap action to indicate when a new map needs to be loaded.
    //when set to a value other than MAGE_NO_MAP, it will cause all scripts to stop and 
    //the new map will be loaded at the beginning of the next tick
    int32_t mapLoadId{ MAGE_NO_MAP };

    std::span<MageEntity> GetEntities() { return currentMap->entities; }
    void SetOnLoad(uint16_t scriptId)
    {
        currentMap->onLoad = MageScriptState{ scriptId, false, currentMap->onLoad.isGlobalExecutionScope };
    }
    void SetOnTick(uint16_t scriptId)
    {
        currentMap->onTick = MageScriptState{ scriptId, false, currentMap->onTick.isGlobalExecutionScope };
    }

    const MageScriptState& GetOnLook() const
    {
        return currentMap->onLook;
    }

    void OnLoad(MageScriptControl* scriptControl);
    void OnTick(MageScriptControl* scriptControl);
private:
    std::shared_ptr<TileManager> tileManager;
    std::unique_ptr<MapData> currentMap;

    bool isEntityDebugOn{ false };
    float playerSpeed{ 0.0f };
    bool playerIsMoving{ false };

}; //class MapControl

#endif //_MAGE_MAP_H
