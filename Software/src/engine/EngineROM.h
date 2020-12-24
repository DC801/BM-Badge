#ifndef ENGINE_ROM_H_
#define ENGINE_ROM_H_

void EngineROM_Init(void);
void EngineROM_Deinit(void);
bool EngineROM_Magic(const uint8_t *magic, uint8_t length);

uint32_t EngineROM_Read(uint32_t address, uint32_t length, uint8_t *data);
uint32_t EngineROM_Write(uint32_t address, uint32_t length, const uint8_t *data);
uint32_t EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data);

#endif
