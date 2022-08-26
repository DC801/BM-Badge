cmake_minimum_required(VERSION 3.22)

project(BM-Badge)
set(CMAKE_CXX_STANDARD 17)

option(DESKTOP_BUILD "Build an executable for the desktop" TRUE)

if(${DESKTOP_BUILD})

elseif()
endif()

add_subdirectory(Software/GameEngine/src)
