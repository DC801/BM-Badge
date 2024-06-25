# I keep forgetting how to do this so I may as well build a script for it

# you should already have git cloned emscripten on your desktop
pushd ~/Desktop/emsdk/
# Why 3.1.21 specifically? Because the SLD framebuffer is broken in later builds
./emsdk install 3.1.21
./emsdk activate 3.1.21
source emsdk_env.sh
popd
compiledb make DESKTOP=1 WEB=1
