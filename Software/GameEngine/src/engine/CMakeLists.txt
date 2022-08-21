cmake_minimum_required(VERSION 3.10)

project(engine)

set(COMPILEDEFS
)
 
set(INCLUDEDIRS
    ${CMAKE_CURRENT_SOURCE_DIR}
)

set(SOURCEFILES
    convert_endian.cpp
    convert_endian.h
    EngineAudio.cpp
    EngineAudio.h
    EngineInput.cpp
    EngineInput.h
    EnginePanic.cpp
    EnginePanic.h
    EngineROM.cpp
    EngineROM.h
    EngineSerial.cpp
    EngineSerial.h
    EngineWindowFrame.cpp
    EngineWindowFrame.h
    FrameBuffer.cpp
    FrameBuffer.h
)

add_library(engine STATIC ${SOURCEFILES})
target_include_directories(engine PUBLIC ${INCLUDEDIRS})