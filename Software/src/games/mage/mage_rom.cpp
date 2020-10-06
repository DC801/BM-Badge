#include <inttypes.h>

#include "mage_rom.h"

#include "EngineROM.h"
#include "EnginePanic.h"
#include "FrameBuffer.h"

#pragma region MageHeader

MageHeader::MageHeader(uint32_t address)
{
	uint32_t size = 0;

	// Read count
	if (EngineROM_Read(address, sizeof(counts), (uint8_t *)&counts) != sizeof(counts))
	{
		goto MageHeader_Error;
	}

	// Endianness conversion
	convert_endian_u4(&counts);

	// Increment offset
	address += sizeof(counts);

	// Construct arrays
	offsets = std::make_unique<uint32_t[]>(counts);
	lengths = std::make_unique<uint32_t[]>(counts);

	// Size of array in bytes
	size = counts * sizeof(uint32_t);

	// Read arrays
	if (EngineROM_Read(address, size, (uint8_t *)offsets.get()) != size)
	{
		goto MageHeader_Error;
	}

	convert_endian_u4_buffer(offsets.get(), counts);
	address += counts * sizeof(uint32_t);

	if (EngineROM_Read(address, size, (uint8_t *)lengths.get()) != size)
	{
		goto MageHeader_Error;
	}

	convert_endian_u4_buffer(lengths.get(), counts);
	return;

MageHeader_Error:
	ENGINE_PANIC("Failed to read header data");
}

uint32_t MageHeader::count() const
{
	return counts;
}

uint32_t MageHeader::offset(uint8_t num) const
{
	if (!offsets) return 0;

	if (counts > num)
	{
		return offsets[num];
	}

	return 0;
}

uint32_t MageHeader::length(uint8_t num) const
{
	if (!lengths) return 0;

	if (counts > num)
	{
		return lengths[num];
	}

	return 0;
}

uint32_t MageHeader::size() const
{
	return sizeof(counts) + 			// Count
		counts * sizeof(uint32_t) +		// Offsets
		counts * sizeof(uint32_t);		// Lengths
}

bool MageHeader::valid() const
{
	if (offsets == nullptr || lengths == nullptr)
	{
		return false;
	}

	return true;
}

#pragma endregion

#pragma region MageMap

MageMap::MageMap(uint32_t address)
{
	uint32_t size = 0;
	uint32_t tilesPerLayer = 0;

	// Read name
	if (EngineROM_Read(address, 16, (uint8_t *)name) != 16)
	{
		goto MageMap_Error;
	}

	name[16] = 0; // Null terminate
	address += 16;

	if (EngineROM_Read(address, sizeof(tileWidth), (uint8_t *)&tileWidth) != sizeof(tileWidth))
	{
		goto MageMap_Error;
	}

	convert_endian_u2(&tileWidth);
	address += sizeof(tileWidth);

	if (EngineROM_Read(address, sizeof(tileHeight), (uint8_t *)&tileHeight) != sizeof(tileHeight))
	{
		goto MageMap_Error;
	}

	convert_endian_u2(&tileHeight);
	address += sizeof(tileHeight);

	if (EngineROM_Read(address, sizeof(width), (uint8_t *)&width) != sizeof(width))
	{
		goto MageMap_Error;
	}

	convert_endian_u2(&width);
	address += sizeof(width);

	if (EngineROM_Read(address, sizeof(height), (uint8_t *)&height) != sizeof(height))
	{
		goto MageMap_Error;
	}

	convert_endian_u2(&height);
	address += sizeof(height);
	tilesPerLayer = width * height;

	if (EngineROM_Read(address, sizeof(layerCount), &layerCount) != sizeof(layerCount))
	{
		goto MageMap_Error;
	}

	address += sizeof(layerCount) + sizeof(uint8_t); // Padding

	if (EngineROM_Read(address, sizeof(entityCount), (uint8_t *)&entityCount) != sizeof(entityCount))
	{
		goto MageMap_Error;
	}

	convert_endian_u2(&entityCount);
	address += sizeof(entityCount);

	entityGlobalIds = std::make_unique<uint16_t[]>(entityCount);
	size = sizeof(uint16_t) * entityCount;

	if (EngineROM_Read(address, size, (uint8_t *)entityGlobalIds.get()) != size)
	{
		goto MageMap_Error;
	}

	convert_endian_u2_buffer(entityGlobalIds.get(), entityCount);
	address += size + sizeof(uint16_t); // Padding

	mapLayerOffsets = std::make_unique<uint32_t[]>(layerCount);

	for (uint32_t i = 0; i < layerCount; i++)
	{
		mapLayerOffsets[i] = address;
		address += tilesPerLayer * (sizeof(uint16_t) + (2 * sizeof(uint8_t)));
	}

	return;

MageMap_Error:
	ENGINE_PANIC("Failed to read map data");
}

std::string MageMap::Name() const
{
	return std::string(name);
}

uint16_t MageMap::TileWidth() const
{
	return tileWidth;
}

uint16_t MageMap::TileHeight() const
{
	return tileHeight;
}

uint16_t MageMap::Width() const
{
	return width;
}

uint16_t MageMap::Height() const
{
	return height;
}

uint8_t MageMap::LayerCount() const
{
	return layerCount;
}

uint16_t MageMap::EntityCount() const
{
	return entityCount;
}

uint16_t MageMap::EntityId(uint16_t num) const
{
	if (!entityGlobalIds) return 0;

	if (entityCount > num)
	{
		return entityGlobalIds[num];
	}

	return 0;
}

uint32_t MageMap::LayerOffset(uint16_t num) const
{
	if (!mapLayerOffsets) return 0;

	if (layerCount > num)
	{
		return mapLayerOffsets[num];
	}

	return 0;
}

uint32_t MageMap::Size() const
{
	return sizeof(name) +
		sizeof(tileWidth) +
		sizeof(tileHeight) +
		sizeof(width) +
		sizeof(height) +
		sizeof(layerCount) +
		sizeof(entityCount) +
		(entityCount * sizeof(uint16_t)) +
		(layerCount * sizeof(uint32_t));
}

#pragma endregion

#pragma region MageTileset

MageTileset::MageTileset(uint32_t address)
{
	uint32_t tileCount = 0;

	if (EngineROM_Read(address, 16, (uint8_t *)name) != 16)
	{
		goto MageTileset_Error;
	}

	name[16] = 0; // Null terminate
	address += 16;

	if (EngineROM_Read(address, sizeof(imageIndex), (uint8_t *)&imageIndex) != sizeof(imageIndex))
	{
		goto MageTileset_Error;
	}

	convert_endian_u2(&imageIndex);
	address += sizeof(imageIndex);

	if (EngineROM_Read(address, sizeof(imageWidth), (uint8_t *)&imageWidth) != sizeof(imageWidth))
	{
		goto MageTileset_Error;
	}

	convert_endian_u2(&imageWidth);
	address += sizeof(imageWidth);

	if (EngineROM_Read(address, sizeof(imageHeight), (uint8_t *)&imageHeight) != sizeof(imageHeight))
	{
		goto MageTileset_Error;
	}

	convert_endian_u2(&imageHeight);
	address += sizeof(imageHeight);

	if (EngineROM_Read(address, sizeof(tileWidth), (uint8_t *)&tileWidth) != sizeof(tileWidth))
	{
		goto MageTileset_Error;
	}

	convert_endian_u2(&tileWidth);
	address += sizeof(tileWidth);

	if (EngineROM_Read(address, sizeof(tileHeight), (uint8_t *)&tileHeight) != sizeof(tileHeight))
	{
		goto MageTileset_Error;
	}

	convert_endian_u2(&tileHeight);
	address += sizeof(tileHeight);

	if (EngineROM_Read(address, sizeof(cols), (uint8_t *)&cols) != sizeof(cols))
	{
		goto MageTileset_Error;
	}

	convert_endian_u2(&cols);
	address += sizeof(cols);

	if (EngineROM_Read(address, sizeof(rows), (uint8_t *)&rows) != sizeof(rows))
	{
		goto MageTileset_Error;
	}

	convert_endian_u2(&rows);
	address += sizeof(rows);
	tileCount = rows * cols;
	tiles = std::make_unique<uint8_t[]>(tileCount);

	if (EngineROM_Read(address, tileCount, (uint8_t *)tiles.get()) != tileCount)
	{
		goto MageTileset_Error;
	}

	return;

MageTileset_Error:
	ENGINE_PANIC("Failed to load tileset data");
}

std::string MageTileset::Name() const
{
	return std::string(name);
}

uint16_t MageTileset::ImageIndex() const
{
	return imageIndex;
}

uint16_t MageTileset::ImageWidth() const
{
	return imageWidth;
}

uint16_t MageTileset::ImageHeight() const
{
	return imageHeight;
}

uint16_t MageTileset::TileWidth() const
{
	return tileWidth;
}

uint16_t MageTileset::TileHeight() const
{
	return tileHeight;
}

uint16_t MageTileset::Cols() const
{
	return cols;
}

uint16_t MageTileset::Rows() const
{
	return rows;
}

uint8_t MageTileset::Tile(uint32_t index) const
{
	if (!tiles) return 0;

	uint32_t tileCount = rows * cols;

	if (tileCount > index)
	{
		return tiles[index];
	}

	return 0;
}

uint32_t MageTileset::Size() const
{
	return 16 + (sizeof(uint16_t) * 7) + (rows * cols);
}

bool MageTileset::Valid() const
{
	if (imageWidth < 1) return false;
	if (imageHeight < 1) return false;
	if (tileWidth < 1) return false;
	if (tileHeight < 1) return false;
	if (cols < 1) return false;
	if (rows < 1) return false;

	return true;
}

#pragma endregion

#pragma region MageRom

// Initializer list, default construct values
//   Don't waste any resources constructing unique_ptr's
//   Each header is constructed with offsets from the previous
MageRom::MageRom()
{
	uint32_t offset = 8;

	mapIndex = 0;
	currentMapIndex = 0;

	mapHeader = MageHeader(offset);
	offset += mapHeader.size();

	tileHeader = MageHeader(offset);
	offset += tileHeader.size();

	animationHeader = MageHeader(offset);
	offset += animationHeader.size();

	entityTypeHeader = MageHeader(offset);
	offset += entityTypeHeader.size();

	entityHeader = MageHeader(offset);
	offset += entityHeader.size();

	imageHeader = MageHeader(offset);
	offset += imageHeader.size();

	map = MageMap(mapHeader.offset(currentMapIndex));

	tiles = std::make_unique<MageTileset[]>(tileHeader.count());

	for (uint32_t i = 0; i < tileHeader.count(); i++)
	{
		tiles[i] = MageTileset(tileHeader.offset(i));
	}
}

uint32_t MageRom::Size() const
{
	uint32_t size = sizeof(mapIndex) +
		sizeof(currentMapIndex) +
		mapHeader.size() +
		tileHeader.size() +
		animationHeader.size() +
		entityTypeHeader.size() +
		entityHeader.size() +
		imageHeader.size() +
		map.Size();

	for (uint32_t i = 0; i < tileHeader.count(); i++)
	{
		size += tiles[i].Size();
	}

	return size;
}

const MageTileset& MageRom::Tile(uint32_t index) const
{
	static MageTileset tile;
	if (!tiles) return tile;

	if (tileHeader.count() > index)
	{
		return tiles[index];
	}

	return tile;
}

const MageMap& MageRom::Map() const
{
	return map;
}

void MageRom::LoadMap()
{
	map = MageMap(mapHeader.offset(currentMapIndex));
}

void MageRom::DrawMap(uint8_t layer, int32_t camera_x, int32_t camera_y) const
{
	uint32_t tilesPerLayer = map.Width() * map.Height();

	for (uint32_t i = 0; i < tilesPerLayer; i++)
	{
		int32_t x = (int32_t)((map.TileWidth() * (i % map.Width())) - camera_x);
		int32_t y = (int32_t)((map.TileHeight() * (i / map.Width())) - camera_y);

		if ((x < (-map.TileWidth()) ||
			(x > WIDTH) ||
			(y < (-map.TileHeight())) ||
			(y > HEIGHT)))
		{
			continue;
		}

		uint32_t address = map.LayerOffset(layer);

		if (address == 0)
		{
			continue;
		}


		uint16_t tileId = 0;
		uint8_t tilesetId = 0;
		uint8_t flags = 0;

		address += i * (sizeof(tileId) + sizeof(tilesetId) + sizeof(flags));

		if (EngineROM_Read(address, sizeof(tileId), (uint8_t *)&tileId) != sizeof(tileId))
		{
			ENGINE_PANIC("Failed to fetch map layer tile info");
		}

		convert_endian_u2(&tileId);
		address += sizeof(tileId);

		if (tileId == 0)
		{
			continue;
		}

		tileId -= 1;

		if (EngineROM_Read(address, sizeof(tilesetId), &tilesetId) != sizeof(tilesetId))
		{
			ENGINE_PANIC("Failed to fetch map layer tile info");
		}

		address += sizeof(tilesetId);

		if (EngineROM_Read(address, sizeof(flags), &flags) != sizeof(flags))
		{
			ENGINE_PANIC("Failed to fetch map layer tile info");
		}

		const MageTileset &tileset = Tile(tilesetId);

		if (tileset.Valid() != true)
		{
			continue;
		}

		address = imageHeader.offset(tileset.ImageIndex());

		canvas.drawChunkWithFlags(
			address,
			x,
			y,
			tileset.TileWidth(),
			tileset.TileHeight(),
			(tileId % tileset.Cols()) * tileset.TileWidth(),
			(tileId / tileset.Cols()) * tileset.TileHeight(),
			tileset.ImageWidth(),
			0x0020,
			flags
		);

		/*address = imageHeader.offset(tileset.ImageIndex());
		uint32_t imageLength = imageHeader.length(tileset.ImageIndex());

		if ((address == 0) || (imageLength == 0))
		{
			continue;
		}

		#define IMAGEBUF_SIZE 256 / sizeof(uint16_t)
		uint32_t size = IMAGEBUF_SIZE;
		uint32_t xSections = 1;

		if (size > tileset.ImageWidth())
		{
			size = tileset.ImageWidth();
		}
		else
		{
			// 512 / 128 = 4 sections
			xSections = tileset.ImageWidth() / size;
		}

		for (uint32_t i = 0; i < tileset.ImageHeight(); i++)
		{
			for (uint32_t j = 0; j < xSections; j++)
			{
				uint16_t buffer[size];

				if (EngineROM_Read(address, size * sizeof(uint16_t), (uint8_t *)buffer) != size * sizeof(uint16_t))
				{
					ENGINE_PANIC("Failed to fetch tileset image");
				}

				convert_endian_u2_buffer(buffer, 128);

				canvas.drawImageWithFlags(
					x,
					y,
					size,
					1,
					buffer,
					(tileId % tileset.Cols()) * size,
					(tileId / tileset.Cols()),
					0,
					0x0020,
					flags
				);

				x += size;
				address += size * sizeof(uint16_t);
			}

			x = 0;
			y += 1;
		}*/

		//return;

		#undef IMAGEBUF_SIZE







		/*uint32_t yAdvance = 256 / (tileset.TileWidth() * sizeof(uint16_t));
		int32_t yCurrent = y;
		uint32_t length = 0;
		uint32_t read = 256;

		while (yCurrent < (y + tileset.TileHeight()))
		{
			uint16_t buffer[128];

			if (EngineROM_Read(address, read, (uint8_t *)buffer) != read)
			{
				ENGINE_PANIC("Failed to fetch tileset image");
			}

			convert_endian_u2_buffer(buffer, 128);

			canvas.drawImageWithFlags(
				x,
				yCurrent,
				tileset.TileWidth(),
				yAdvance,
				buffer,
				(tileId % tileset.Cols()) * tileset.TileWidth(),
				(tileId / tileset.Cols()) * yAdvance,
				tileset.TileWidth(),
				0x0020,
				flags
			);

			length += 256;
			address += 256;
			yCurrent += yAdvance;

			if (length > imageLength)
			{
				read = (length - imageLength);
			}

			break;
		}*/

		/*canvas.drawImageWithFlags(
			x,
			y,
			tileset.TileWidth(),
			tileset.TileHeight(),
			// TODO: Implement me
			// Get Image Chunk by index and offset
			get_image_by_index(tileset.ImageIndex()),
			(tileId % tileset.Cols()) * tileset.TileWidth(),
			(tileId / tileset.Cols()) * tileset.TileHeight(),
			tileset.ImageWidth,
			0x0020,
			flags
		);*/
	}
}

#pragma endregion

MageDataMemoryAddresses dataMemoryAddresses = {};

// MageTileset *allTilesets;
uint32_t mapIndex = 0;
uint32_t currentMapIndex = 0;
// MageMap currentMap = {};
// MageTileset *currentMapTilesets;
MageEntity *currentMapEntities;
uint16_t *currentMapEntityFrameTicks;
MageAnimationFrame *currentMapEntityFrames;
MageEntity **currentMapEntitiesSortedByRenderOrder;
uint8_t *data;

#define IDENTIFIER_LENGTH 8
#define HEADER_START 8

uint32_t count_with_offsets (
	uint8_t *data,
	uint32_t **count,
	uint32_t **offsets,
	uint32_t **lengths
)
{
	uint32_t offset = 0;
	*count = (uint32_t *) data + offset;
	offset += 1;
	convert_endian_u4(*count);

	*offsets = (uint32_t *) data + offset;
	offset += **count;
	convert_endian_u4_buffer(*offsets, **count);

	*lengths = (uint32_t *) data + offset;
	offset += **count;
	convert_endian_u4_buffer(*lengths, **count);

	return offset * sizeof(uint32_t); // but return the offset in # of bytes
}

void correct_image_data_endinness (
	uint8_t *data,
	uint32_t length
)
{
	convert_endian_u2_buffer(
		(uint16_t *) data,
		length / sizeof(uint16_t)
	);
}

uint32_t load_data_headers ()
{
	// seek past identifier
	uint32_t offset = HEADER_START;

	// TODO: Load entire header with size

	// mapHeader = MageHeader(offset);
	// offset += mapHeader.size();

	/*offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.mapCount,
		&dataMemoryAddresses.mapOffsets,
		&dataMemoryAddresses.mapLengths
	);

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.tilesetCount,
		&dataMemoryAddresses.tilesetOffsets,
		&dataMemoryAddresses.tilesetLengths
	);

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.animationCount,
		&dataMemoryAddresses.animationOffsets,
		&dataMemoryAddresses.animationLengths
	);

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.entityTypeCount,
		&dataMemoryAddresses.entityTypeOffsets,
		&dataMemoryAddresses.entityTypeLengths
	);

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.entityCount,
		&dataMemoryAddresses.entityOffsets,
		&dataMemoryAddresses.entityLengths
	);

	offset += count_with_offsets(
		data + offset,
		&dataMemoryAddresses.imageCount,
		&dataMemoryAddresses.imageOffsets,
		&dataMemoryAddresses.imageLengths
	);

	if (needs_endian_correction)
	{
		for (uint32_t i = 0; i < *dataMemoryAddresses.imageCount; i++)
		{
			correct_image_data_endinness(
				data + dataMemoryAddresses.imageOffsets[i],
				dataMemoryAddresses.imageLengths[i]
			);
		}
	}*/

	// printf("dataMemoryAddresses.mapCount: %" PRIu32 "\n", *dataMemoryAddresses.mapCount);
	// printf("dataMemoryAddresses.tilesetCount: %" PRIu32 "\n", *dataMemoryAddresses.tilesetCount);
	// printf("dataMemoryAddresses.animationCount: %" PRIu32 "\n", *dataMemoryAddresses.animationCount);
	// printf("dataMemoryAddresses.entityTypeCount: %" PRIu32 "\n", *dataMemoryAddresses.entityTypeCount);
	// printf("dataMemoryAddresses.entityCount: %" PRIu32 "\n", *dataMemoryAddresses.entityCount);
	// printf("dataMemoryAddresses.imageCount: %" PRIu32 "\n", *dataMemoryAddresses.imageCount);

	// printf("end of headers: %" PRIu32 "\n", offset);

	return offset;
}

/*void load_tilesets_headers (
	MageTileset *tilesetPointer,
	uint32_t tilesetIndex
)
{
	MageTileset tileset = {};
	uint8_t *tilesetData = data + dataMemoryAddresses.tilesetOffsets[tilesetIndex];
	// printf("tileset[%" PRIu32 "]: offset %" PRIu32 "\n", tilesetIndex, dataMemoryAddresses.tilesetOffsets[tilesetIndex]);
	// printf("tileset[%" PRIu32 "]: %p\n", tilesetIndex, tilesetData);

	tilesetData[15] = 0x00; // null terminate it so things don't go bad
	tileset.name = (char *) tilesetData;
	// printf("tileset.name: %s\n", tileset.name);

	uint32_t offset = 16;

	tileset.imageIndex = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.imageIndex);
	// printf("tileset.imageIndex: %p\n", tileset.imageIndex);
	// printf("tileset.imageIndex: %" PRIu16 "\n", *tileset.imageIndex);

	tileset.imageWidth = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.imageWidth);
	// printf("tileset.imageWidth: %p\n", tileset.imageWidth);
	// printf("tileset.imageWidth: %" PRIu16 "\n", *tileset.imageWidth);

	tileset.imageHeight = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.imageHeight);
	// printf("tileset.imageHeight: %p\n", tileset.imageHeight);
	// printf("tileset.imageHeight: %" PRIu16 "\n", *tileset.imageHeight);

	tileset.tileWidth = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.tileWidth);
	// printf("tileset.tileWidth: %p\n", tileset.tileWidth);
	// printf("tileset.tileWidth: %" PRIu16 "\n", *tileset.tileWidth);

	tileset.tileHeight = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.tileHeight);
	// printf("tileset.tileHeight: %p\n", tileset.tileHeight);
	// printf("tileset.tileHeight: %" PRIu16 "\n", *tileset.tileHeight);

	tileset.cols = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.cols);
	// printf("tileset.cols: %p\n", tileset.cols);
	// printf("tileset.cols: %" PRIu16 "\n", *tileset.cols);

	tileset.rows = (uint16_t *) (tilesetData + offset);
	offset += 2;
	convert_endian_u2(tileset.rows);
	// printf("tileset.rows: %p\n", tileset.rows);
	// printf("tileset.rows: %" PRIu16 "\n", *tileset.rows);

	offset += 2; // pad to to uint32_t alignment

	tileset.startOfTiles = dataMemoryAddresses.tilesetOffsets[tilesetIndex] + offset;
	*tilesetPointer = tileset;
}*/

void load_all_tilesets ()
{
	// printf("load_all_tilesets:\n");

	/*uint32_t tilesetCount = *dataMemoryAddresses.tilesetCount;
	allTilesets = (MageTileset *) malloc(tilesetCount * sizeof(MageTileset));

	for (uint32_t i = 0; i < tilesetCount; i++)
	{
		load_tilesets_headers(allTilesets + i, i);
	}*/
}

void allocate_current_map_entities(
	uint16_t *entityIndices,
	uint16_t entityCount
)
{
	currentMapEntities = (MageEntity *) calloc(entityCount, sizeof(MageEntity));
	currentMapEntityFrameTicks = (uint16_t *) calloc(entityCount, sizeof(uint16_t));
	currentMapEntitiesSortedByRenderOrder = (MageEntity **) calloc(entityCount, sizeof(void*));

	MageEntity *entityInROM;
	MageEntity *entityInRAM;
	uint16_t entityIndex;
	uint32_t offset;

	for (uint32_t i = 0; i < entityCount; i++)
	{
		entityIndex = *(entityIndices + i);
		offset = *(dataMemoryAddresses.entityOffsets + entityIndex);
		entityInRAM = currentMapEntities + i;
		entityInROM = (MageEntity *) (data + offset);
		// printf("name: %s\n", entityInROM->name);
		// printf("  entityIndex: %" PRIu16 "\n", entityIndex);
		// printf("  offset: %" PRIu32 "\n", offset);
		// printf("  entityInRAM pointer: %p\n", entityInRAM);
		// printf("  entityInROM pointer: %p\n", entityInROM);

		memcpy(
			entityInRAM,
			entityInROM,
			sizeof(MageEntity)
		);

		uint32_t entityTypeOffset;
		MageEntityType *entityType;
		char mageType[16] = "goose";
		if (entityInRAM->primaryType == ENTITY_PRIMARY_ENTITY_TYPE)
		{
			entityType = get_entity_type_by_index(entityInRAM->primaryTypeIndex);
			int32_t entityTypeNameComparison = strncmp(mageType, entityType->name, 16);
			// printf("Is this entity the player? A: %s; B %s\n", mageType, entityType->name);
			if (entityTypeNameComparison == 0)
			{
				playerEntity = entityInRAM;
			}
		}

		// printf("  primaryTypeIndex: %" PRIu16 "\n", entityInRAM->primaryTypeIndex);
		// printf("  secondaryTypeIndex: %" PRIu16 "\n", entityInRAM->secondaryTypeIndex);
		// printf("  scriptIndex: %" PRIu16 "\n", entityInRAM->scriptIndex);
		// printf("  x: %" PRIu16 "\n", entityInRAM->x);
		// printf("  y: %" PRIu16 "\n", entityInRAM->y);
	}
}

void load_map_headers (uint32_t incomingMapIndex)
{
	/*uint8_t *mapData = data + dataMemoryAddresses.mapOffsets[incomingMapIndex];
	// printf("mapData: %p\n", mapData);

	mapData[15] = 0x00; // null terminate it so things don't go bad
	currentMap.name = (char *) mapData;
	// printf("currentMap.name: %s\n", currentMap.name);

	uint32_t offset = 16;

	currentMap.tileWidth = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.tileWidth);
	// printf("currentMap.tileWidth: %p\n", currentMap.tileWidth);
	// printf("currentMap.tileWidth: %" PRIu16 "\n", *currentMap.tileWidth);

	currentMap.tileHeight = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.tileHeight);
	// printf("currentMap.tileHeight: %p\n", currentMap.tileHeight);
	// printf("currentMap.tileHeight: %" PRIu16 "\n", *currentMap.tileHeight);

	currentMap.width = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.width);
	// printf("currentMap.width: %p\n", currentMap.width);
	// printf("currentMap.width: %" PRIu16 "\n", *currentMap.width);

	currentMap.height = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.height);
	// printf("currentMap.height: %p\n", currentMap.height);
	// printf("currentMap.height: %" PRIu16 "\n", *currentMap.height);

	currentMap.layerCount = (mapData + offset);
	offset += 1;
	// printf("currentMap.layerCount: %p\n", currentMap.layerCount);
	// printf("currentMap.layerCount: %" PRIu8 "\n", *currentMap.layerCount);

	currentMap.padding = (mapData + offset);
	offset += 1;

	currentMap.entityCount = (uint16_t *) (mapData + offset);
	offset += 2;
	convert_endian_u2(currentMap.entityCount);
	// printf("currentMap.entityCount: %p\n", currentMap.entityCount);
	// printf("currentMap.entityCount: %" PRIu8 "\n", *currentMap.entityCount);

	currentMap.entityGlobalIds = (uint16_t *) (mapData + offset);
	offset += *currentMap.entityCount * 2;

	if (*currentMap.entityCount % 2 != 0)
	{
		offset += 2;
	}

	convert_endian_u2_buffer(currentMap.entityGlobalIds, *currentMap.entityCount);

	// printf("currentMap.entityGlobalIds: %p\n", currentMap.entityGlobalIds);
	// for (uint8_t i = 0; i < *currentMap.entityCount; i++) {
	// 	printf("currentMap.entityGlobalIds[%" PRIu8 "]: %" PRIu16 "\n", i, currentMap.entityGlobalIds[i]);
	// }

	allocate_current_map_entities(
		currentMap.entityGlobalIds,
		*currentMap.entityCount
	);

	currentMap.startOfLayers = (
		dataMemoryAddresses.mapOffsets[incomingMapIndex]
		+ offset
	);

	// printf("currentMap.startOfLayers %p\n", currentMap.startOfLayers);
	currentMapIndex = incomingMapIndex;*/
}

void correct_entity_type_endians ()
{
	uint32_t offset;
	MageEntityType *entityType;
	MageEntityTypeAnimationDirection *entityTypeAnimationDirection;
	// printf("correct_entity_type_endians:\n");

	for (uint32_t i = 0; i < *dataMemoryAddresses.entityTypeCount; i++)
	{
		offset = *(dataMemoryAddresses.entityTypeOffsets + i);
		entityType = (MageEntityType *) (data + offset);
		// printf("  name: %s\n", entityType->name);
		// printf("  animationCount: %" PRIu8 "\n", entityType->animationCount);

		for (uint32_t j = 0; j < (entityType->animationCount * 4); j++)
		{
			entityTypeAnimationDirection = &entityType->entityTypeAnimationDirection + j;
			convert_endian_u2(&entityTypeAnimationDirection->typeIndex);
			// printf("    typeIndex: %" PRIu16 "\n", entityTypeAnimationDirection->typeIndex);
		}
	}
}

void correct_animation_endians ()
{
	uint32_t offset;
	MageAnimation *animation;
	MageAnimationFrame *animationFrame;

	for (uint32_t i = 0; i < *dataMemoryAddresses.animationCount; i++)
	{
		offset = *(dataMemoryAddresses.animationOffsets + i);
		animation = (MageAnimation *) (data + offset);
		convert_endian_u2(&animation->tilesetIndex);
		convert_endian_u2(&animation->frameCount);

		// printf("tilesetIndex: %" PRIu16 "\n", animation->tilesetIndex);
		// printf("frameCount: %" PRIu16 "\n", animation->frameCount);

		for (uint32_t j = 0; j < animation->frameCount; j++)
		{
			animationFrame = &animation->animationFrames + j;
			convert_endian_u2(&animationFrame->tileIndex);
			convert_endian_u2(&animationFrame->duration);
			// printf("  tileIndex: %" PRIu16 "\n", animationFrame->tileIndex);
			// printf("  duration: %" PRIu16 "\n", animationFrame->duration);
			// printf("  j: %" PRIu32 "\n", j);
		}
	}
}

void correct_entity_endians ()
{
	uint32_t offset;
	MageEntity *entity;
	// printf("correct_entity_endians\n");

	for (uint32_t i = 0; i < *dataMemoryAddresses.entityCount; i++)
	{
		offset = *(dataMemoryAddresses.entityOffsets + i);
		entity = (MageEntity *) (data + offset);
		convert_endian_u2(&entity->primaryTypeIndex);
		convert_endian_u2(&entity->secondaryTypeIndex);
		convert_endian_u2(&entity->scriptIndex);
		convert_endian_u2(&entity->x);
		convert_endian_u2(&entity->y);

		// printf("name: %s\n", entity->name);
		// printf("  primaryTypeIndex: %" PRIu16 "\n", entity->primaryTypeIndex);
		// printf("  secondaryTypeIndex: %" PRIu16 "\n", entity->secondaryTypeIndex);
		// printf("  scriptIndex: %" PRIu16 "\n", entity->scriptIndex);
		// printf("  x: %" PRIu16 "\n", entity->x);
		// printf("  y: %" PRIu16 "\n", entity->y);
	}
}

MageEntityType* get_entity_type_by_index(uint8_t index)
{
	return index < *dataMemoryAddresses.entityTypeCount
		? (MageEntityType *) (data + ((uint32_t) *(dataMemoryAddresses.entityTypeOffsets + index)))
		: nullptr;
}

uint16_t* get_image_by_index(uint8_t index)
{
	return index < *dataMemoryAddresses.imageCount
		? (uint16_t *) (data + ((uint32_t) *(dataMemoryAddresses.imageOffsets + index)))
		: nullptr;
}

/*MageTileset* get_tileset_by_id(uint8_t index)
{
	return index < *dataMemoryAddresses.tilesetCount
		? (MageTileset *) (allTilesets + index)
		: nullptr;

	return nullptr;
}*/
