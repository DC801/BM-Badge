SRC_ROOT := $(PRJ_ROOT)/src

APP_SRCS := $(SRC_ROOT)/utility.c \
	$(SRC_ROOT)/modules/cmixer/cmixer.c \
	$(SRC_ROOT)/modules/drv_ili9341.c \
	$(SRC_ROOT)/modules/sd.c \
	$(SRC_ROOT)/modules/ble.c \
	$(SRC_ROOT)/modules/adc.c \
	$(SRC_ROOT)/modules/uart.c \
	$(SRC_ROOT)/modules/led.c \
	$(SRC_ROOT)/modules/i2c.c \
	$(SRC_ROOT)/modules/mutex.c \
	$(SRC_ROOT)/modules/keyboard.c \
	$(SRC_ROOT)/modules/rc4.c \
	$(SRC_ROOT)/modules/qspi.cpp \
	$(SRC_ROOT)/engine/EngineInput.cpp \
	$(SRC_ROOT)/engine/EngineROM.cpp \
	$(SRC_ROOT)/engine/EnginePanic.cpp \
	$(SRC_ROOT)/engine/convert_endian.cpp \
	$(SRC_ROOT)/engine/FrameBuffer.cpp \
	$(SRC_ROOT)/games/mage/mage_header.cpp \
	$(SRC_ROOT)/games/mage/mage_map.cpp \
	$(SRC_ROOT)/games/mage/mage_tileset.cpp \
	$(SRC_ROOT)/games/mage/mage_animation.cpp \
	$(SRC_ROOT)/games/mage/mage_entity_type.cpp \
	$(SRC_ROOT)/games/mage/mage_geometry.cpp \
	$(SRC_ROOT)/games/mage/mage_color_palette.cpp \
	$(SRC_ROOT)/games/mage/mage_game_control.cpp \
	$(SRC_ROOT)/games/mage/mage_hex.cpp \
	$(SRC_ROOT)/games/mage/mage_script_control.cpp \
	$(SRC_ROOT)/games/mage/mage_portrait.cpp \
	$(SRC_ROOT)/games/mage/mage_dialog_control.cpp \
	$(SRC_ROOT)/games/mage/mage_command_control.cpp \
	$(SRC_ROOT)/games/mage/mage.cpp \
	$(SRC_ROOT)/main.c

APP_INCLUDES := -I$(PRJ_ROOT) -I$(SRC_ROOT) -I$(SRC_ROOT)/modules -I$(SRC_ROOT)/modules/cmixer -I$(SRC_ROOT)/engine

ifdef EMBEDDED
    ifeq ($(OS),Windows_NT)
        # Placeholder
    else
        APP_SRCS += $(SRC_ROOT)/modules/usb.c
    endif
endif

ifdef DESKTOP
    ifeq ($(OS),Windows_NT)
        # Placeholder
    else
        SDL_INCLUDE = $(shell pkg-config --cflags-only-I sdl2)
        NATIVE_INCLUDE_PATH = -I/usr/include
        ifdef WEB
            SDL_INCLUDE =
            NATIVE_INCLUDE_PATH =
        endif
        APP_INCLUDES += $(SDL_INCLUDE) $(NATIVE_INCLUDE_PATH)
        APP_SRCS += $(SRC_ROOT)/engine/EngineWindowFrame.cpp
    endif
endif

LINKER_SCRIPT ?= $(PRJ_ROOT)/badge_gcc_nrf52.ld
