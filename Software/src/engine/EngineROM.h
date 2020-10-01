#ifndef ENGINE_ROM_H_
#define ENGINE_ROM_H_

#ifdef __cplusplus
extern "C" {
#endif

void EngineROM_Init(void);
uint32_t EngineROM_Read(uint32_t address, uint32_t length, uint8_t *data);
uint32_t EngineROM_Write(uint32_t address, uint32_t length, const uint8_t *data);
uint32_t EngineROM_Verify(uint32_t address, uint32_t length, const uint8_t *data);

#ifdef __cplusplus
}
#endif

#endif
