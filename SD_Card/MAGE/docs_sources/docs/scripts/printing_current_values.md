# Printing Current Values

The values of [integer variables](variables.md#integer-variables) and the **current names** of any [entity](../entities) can be inserted into a dialog message, dialog label, or similar places.

## Current Variable Value

Enclose the name of the variable in dollar signs: `"I have $appleCount$ apples for sale today!"`

```mgs
exampleScript {
  mutate appleCount = 10;
  show serial dialog { "I have $appleCount$ apples for sale today!" }
}
```

becomes

```
I have 10 apples for sale today!

>_
```


For text wrapping, it's recommended that these names be counted as taking up 5 characters. ([MGS Natlang](../mgs/mgs_natlang) will wrap text automatically.)

## Current Entity Name

Wrap an entity's **given name** (the name assigned to it in Tiled) in percent signs (`%`) to insert the entity's name as it currently exists in RAM: `"Hi, there! My name is %Bob%!"`

Unlike with [relative entity references](../entities/relative_references.md) (like [`%SELF%`](../entities/relative_references.md#self) and [`%PLAYER%`](../entities/relative_references.md#player)), this usage will not work when trying to target an entity with an action. Instead, use the entity's given name.

For text wrapping, it's recommended that these names be counted as taking up 12 characters. ([MGS Natlang](../mgs/mgs_natlang) will wrap text automatically.)
