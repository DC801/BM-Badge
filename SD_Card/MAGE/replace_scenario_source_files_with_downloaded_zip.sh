#!/bin/bash

unset -v latest
for file in ~/Downloads/scenario_source_files*.zip; do
  [[ $file -nt $latest ]] && latest=$file
done

unzip -o "$latest"

echo "Success extracting " $latest " into ./"
