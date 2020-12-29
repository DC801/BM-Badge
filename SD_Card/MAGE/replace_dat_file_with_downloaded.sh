#!/bin/bash

unset -v latest
for file in ~/Downloads/game*.dat; do
  [[ $file -nt $latest ]] && latest=$file
done

cp "$latest" ./game.dat
mkdir -p ../../Software/output/MAGE/
cp "$latest" ../../Software/output/MAGE/game.dat

echo "Success extracting " $latest " into ./"
