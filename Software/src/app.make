SRC_ROOT := $(PRJ_ROOT)/src

APP_SRCS := $(SRC_ROOT)/utility.c \
	$(SRC_ROOT)/menu.c \
	$(SRC_ROOT)/user.c \
	$(SRC_ROOT)/nearby.c \
	$(SRC_ROOT)/extras.c \
	$(SRC_ROOT)/godmode.c \
	$(SRC_ROOT)/modules/drv_st7735.c \
	$(SRC_ROOT)/modules/gfx.c \
	$(SRC_ROOT)/modules/sd.c \
	$(SRC_ROOT)/modules/ble.c \
	$(SRC_ROOT)/modules/adc.c \
	$(SRC_ROOT)/modules/uart.c \
	$(SRC_ROOT)/modules/led.c \
	$(SRC_ROOT)/modules/i2c.c \
	$(SRC_ROOT)/modules/i2s.c \
	$(SRC_ROOT)/modules/rc4.c \
	$(SRC_ROOT)/modules/usb.c \
	$(SRC_ROOT)/games/Space_Invaders.cpp \
	$(SRC_ROOT)/games/Snake.c \
	$(SRC_ROOT)/games/PipsTheET.c \
	$(SRC_ROOT)/games/Tic-Tac-Toe.c \
	$(SRC_ROOT)/games/Wargames.c \
	$(SRC_ROOT)/games/hcrn/Arcade.cpp \
	$(SRC_ROOT)/games/hcrn/Boss.cpp \
	$(SRC_ROOT)/games/hcrn/FrameBuffer.cpp \
	$(SRC_ROOT)/games/hcrn/GameEngine.cpp \
	$(SRC_ROOT)/games/hcrn/Pickup.cpp \
	$(SRC_ROOT)/games/hcrn/Laser.cpp \
	$(SRC_ROOT)/games/hcrn/Marine.cpp \
	$(SRC_ROOT)/games/hcrn/NPC.cpp \
	$(SRC_ROOT)/games/hcrn/Obstacle.cpp \
	$(SRC_ROOT)/games/hcrn/Overlays.cpp \
	$(SRC_ROOT)/games/hcrn/Player.cpp \
	$(SRC_ROOT)/games/hcrn/Projectile.cpp \
	$(SRC_ROOT)/games/hcrn/Robot.cpp \
	$(SRC_ROOT)/games/hcrn/Room.cpp \
	$(SRC_ROOT)/games/hcrn/Scout.cpp \
	$(SRC_ROOT)/games/hcrn/Spider.cpp \
	$(SRC_ROOT)/games/hcrn/Terminal.cpp \
	$(SRC_ROOT)/games/hcrn/TNT.cpp \
	$(SRC_ROOT)/games/hcrn/Turret.cpp \
	$(SRC_ROOT)/games/hcrn/Sprite.cpp \
	$(SRC_ROOT)/games/hcrn/Zombie.cpp \
	$(SRC_ROOT)/games/hcrn/hcrn.cpp \
	$(SRC_ROOT)/games/mage/mage.cpp \
	$(SRC_ROOT)/games/serial.c \
	$(SRC_ROOT)/main.c

APP_INCLUDES := -I$(PRJ_ROOT) -I$(SRC_ROOT)

ifdef DESKTOP
    ifeq ($(OS),Windows_NT)
        # Placeholder
    else
        APP_INCLUDES += $(shell pkg-config --cflags-only-I sdl2)
    endif
endif

LINKER_SCRIPT ?= $(PRJ_ROOT)/badge_gcc_nrf52.ld
