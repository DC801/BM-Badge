#!/bin/bash

URL=https://developer.arm.com/-/media/Files/downloads/gnu/12.2.mpacbti-rel1/binrel/arm-gnu-toolchain-12.2.mpacbti-rel1-x86_64-arm-none-eabi.tar.xz
PACKAGENAME=gcc-arm-none-eabi-12
INSTALLPATH=/opt/$PACKAGENAME

echo "Entering temporary directory..."
mkdir tmp
pushd tmp

echo "Downloading..."
curl -fSL -A "Mozilla/4.0" -o gcc-arm-none-eabi.tar.xz "$URL"

echo "Extracting..."
tar -xJf gcc-arm-none-eabi.tar.xz

echo "Installing to $INSTALLPATH..."
sudo mkdir $INSTALLPATH
sudo mv *-arm-none-eabi/* $INSTALLPATH

echo "Linking to /usr/bin"
sudo ln -s $INSTALLPATH/bin/* /usr/bin/

echo "Removing temporary files..."
popd
rm -rf tmp

echo "Done."