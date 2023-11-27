# Syntax Colors

A syntax coloring grammar (tmLanguage) for [MGS Natlang](../mgs/mgs_natlang) is in development here: [github.com/alamedyang/magegamescript-syntax-highlighting](https://github.com/alamedyang/magegamescript-syntax-highlighting)

Syntax colors in this documentation were made possible by [shiki](https://v2.vuepress.vuejs.org/reference/plugin/shiki.html), a TextMate grammar plugin for VuePress.

## Supported IDEs

### Visual Studio Code

When you open an MGS file, VSCode will offer a [marketplace extension](https://marketplace.visualstudio.com/items?itemName=goat-and-bird.magegamescript-colors) for it.( Alternatively, search for "MageGameScript Colors" in the Visual Studio Code extensions marketplace.)

After installing the extension, all MGS files will have syntax coloring. VSCode will update the extension automatically whenever a new version comes out.

### Sublime Text

Visit the syntax colors repo above (or clone it locally), then find the `mgs.tmLanguage` file in the `syntaxes` folder. Move this file to wherever Sublime Text wants its coloring grammars in your operating system. After this, you can select MageGameScript under View > Syntax to style the text in your MGS files.

You will have to update the `mgs.tmLanguage` manually by repeating the above process when a new version is released.

### TextMate

A `tmbundle` version of the above grammar has been quickly prepared (as of Nov 2023), but may not have feature parity, is not automatically generated, and it is not bundled with the repo yet. Ask the DC801 badge game devs if you want a preview copy to try.

### IntelliJ

IntelliJ has a plugin, available by default, to install TextMate bundles. Acquire the `tmbundle` as explained above, and follow IntelliJ's documentation to install it.

### Other IDEs

Many other IDEs will accept TextMate grammars, but you will have to find and follow your IDE's specific instructions.

## Color Choices

Scope names (≈colors) for tokens were chosen to resemble similar scopes in other languages, particularly JavaScript.

### Spectrum Test

Colors were tested in all of VSCode's default themes, but were calibrated for the Dark+ theme specifically.

```mgs
// comment
/* also comment */
const!($constant = 9000)
nonStyledTextAKAColorless
scriptName {
  labelName: while (flag flagName is false) {
    show dialog {
      Identifier alignment TOP_RIGHT
      "What do ya know, %PLAYER%!\nSquare roots!"
    }
    show serial dialog { "<red>styled</>" }
  }
  goto script scriptName;
  load slot 9001;
}
```
