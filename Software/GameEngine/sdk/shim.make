SDK_TARGET ?= $(PRJ_ROOT)/output/libnordic-shim.a
SRC_ROOT := $(PRJ_ROOT)

SDK_SRCS := $(wildcard $(PRJ_ROOT)/shim/*.c)
SDK_SRCS += $(wildcard $(PRJ_ROOT)/shim/*.cpp)
SDK_SRCS += $(wildcard $(PRJ_ROOT)/shim/*.S)

NATIVE_INCLUDE_PATH = $(shell pkg-config --cflags-only-I sdl2) -I/usr/include
ifdef WEB
	NATIVE_INCLUDE_PATH =
endif
SDK_INCLUDES := -I$(PRJ_ROOT)/shim \
	-I$(PRJ_ROOT)/.. \
	-I$(PRJ_ROOT)/../src \
	-I$(PRJ_ROOT)/../src/modules/cmixer \
	-I$(PRJ_ROOT)/../src/engine \
	$(NATIVE_INCLUDE_PATH)

TOOLCHAIN = ""