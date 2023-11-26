# Dialog Block

To define an [MGS Natlang](../mgs/mgs_natlang) [dialog](../dialogs), start a new [block](../mgs/block) at the root level:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">show</span> <span class="identifier">dialog</span> <span class="variable-constant">$string</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

As these dialog blocks aren't being defined inside a [script body](../mgs/script_block), a dialog name is required. (The name is whatever is given for [string](../mgs/variables/string).)

Inside the curly braces may be any number of [dialogs](../mgs/dialogs_mgs).

The pair to the above usage is the action [SHOW_DIALOG](../actions/SHOW_DIALOG):

<pre class="HyperMD-codeblock mgs">

  <span class="identifier">dialog</span> <span class="string">bobTalk</span> <span class="bracket">{</span>
    <span class="dialog-identifier">Bob</span> <span class="string">"Hi there! I'm speaking to you!"</span>
  <span class="bracket">}</span>
  <span class="script">exampleScript</span> <span class="bracket">{</span>
    <span class="verb">show</span> <span class="identifier">dialog</span> <span class="string">bobTalk</span><span class="terminator">;</span>
  <span class="bracket">}</span>

</pre>

This usage is comparable to what is done with raw JSON.

## Combination Block

However, to [combine](../mgs/combination_block) these two usages into one, you'll want to use a [show dialog block](../mgs/show_dialog_block):

<pre class="HyperMD-codeblock mgs">

  <span class="script">exampleScript</span> <span class="bracket">{</span>
    <span class="verb">show</span> <span class="identifier">dialog</span> <span class="bracket">{</span>
      <span class="dialog-identifier">Bob</span> <span class="string">"Hi there! I'm speaking to you!"</span>
    <span class="bracket">}</span>
  <span class="bracket">}</span>

</pre>
