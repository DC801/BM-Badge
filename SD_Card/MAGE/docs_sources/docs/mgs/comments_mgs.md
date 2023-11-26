## Comments (MGS)

[MGS Natlang](../mgs/mgs_natlang) supports two kinds of comments. Both can appear anywhere in an MGS file or inside any [block](../mgs/block).

### Inline comment

<pre class="HyperMD-codeblock mgs">

  <span class="script">testScript</span> <span class="bracket">{</span>
    <span class="verb">wait</span> <span class="number">1000ms</span><span class="terminator">;</span>
    <span class="verb">wait</span> <span class="number">1000ms</span><span class="terminator">;</span> <span class="comment">// inline comment</span>
  <span class="bracket">}</span>

</pre>

This is the only time that line breaks are syntactic in Natlang. Inline comments start with `//` and end either with a line break or the end of the document.

Fun fact: the MGS Natlang translator (JSON -> Natlang) will take [extraneous properties from actions](../scripts/comments_json) and the like and turn them into inline comments automatically.

### Block comment

<pre class="HyperMD-codeblock mgs">

  <span class="comment">/*
  Block comment:
  Everything inside is a comment!
  The lexer ignores it all! WHEEE
  */</span>

</pre>

Anything between a `/*` and a `*/` is part of the block comment, allowing you to put line breaks and/or extensive text inside a comment.
