# Syntax Colors

A syntax coloring grammar (tmLanguage) for [MGS Natlang](../mgs/mgs_natlang) is in development: https://github.com/alamedyang/magegamescript-syntax-highlighting

## Visual Studio Code

When you open an MGS file, VSCode will offer marketplace extensions for it. Alternatively, search for "MageGameScript Colors" in the Visual Studio Code extensions marketplace.

After installing the extension, all MGS files you open will have syntax coloring. VSCode will update the extension automatically whenever a new version comes out.

## Sublime Text

Visit the syntax colors repo above (or clone it locally), then find the `mgs.tmLanguage` file in the `syntaxes` folder. Move this file to wherever Sublime Text wants its coloring grammars in your operating system. After this, you can select MageGameScript under View > Syntax to style the text in your MGS files.

You will have to update the `mgs.tmLanguage` manually by repeating the above process when a new version is released.

## TextMate

A `tmbundle` version of the above grammar has been quickly prepared (as of Nov 2023), but may not have feature parity, is not automatically generated, and it is not bundled with the repo yet. Ask the DC801 badge game devs if you want a preview copy to try.

## IntelliJ

IntelliJ has a plugin, available by default, to install TextMate bundles. Acquire the `tmbundle` as explained above, and follow IntelliJ's documentation to install it.

## Other IDEs

Many other IDEs will accept TextMate grammars, but you will have to find and follow your IDE's specific instructions.
