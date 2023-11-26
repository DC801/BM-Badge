# MGE Encoder Console

Both versions of the [MGE Encoder](encoder/mge_encoder) will tell you when something has gone wrong during the encoding process, and many errors should be self explanatory, e.g. `"No object named X could be found on map Y!"`

The error `Script: X could not be found in scenario.json` does not necessarily mean there is something wrong with [scenario.json](structure/scenario.json), only that the encoder couldn't find a [script](scripts) by that name in any MGS file or in any of the script JSON files `scenario.json` knows about.

If you get the error "unexpected token" it means one of your files has invalid JSON, and you'll need to check your JSON files for invalid syntax. (A good text editor should have some kind of color coding to help you spot such errors.)
