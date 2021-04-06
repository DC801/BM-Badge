#!/bin/bash

node ./editor/cli/cli.js &&
echo "Success generating dat file ./game.dat" &&
mkdir -p ../../Software/output/MAGE/ &&
cp ./game.dat ../../Software/output/MAGE/game.dat &&
echo "Success copying ./game.dat into ../../Software/output/MAGE/game.dat"
