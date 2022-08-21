cmake_minimum_required(VERSION 3.10)

project(game)

add_subdirectory(engine lib/engine)
add_subdirectory(games/mage lib/mageGame)
add_subdirectory(modules lib/modules)

find_package(SDL PATHS modules/sdl REQUIRED)
set(INCLUDEDIRS
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${SDL_NET_INCLUDE_DIRS}
)

set(SOURCEFILES
    common.h
    main.cpp
    main.h
    utility.cpp
    utility.h
)

add_executable(game ${SOURCEFILES})

if(TARGET SDL2::SDL2main)
    target_link_libraries(game PRIVATE SDL2::SDL2main)
endif()

# Link to the actual SDL2 library. SDL2::SDL2 is the shared SDL library, SDL2::SDL2-static is the static SDL libarary.
target_link_libraries(game PRIVATE SDL2::SDL2)
target_link_libraries(game ${SDL_LIBRARIES} mageGame engine modules) 