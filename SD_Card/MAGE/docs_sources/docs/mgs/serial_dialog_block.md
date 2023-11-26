# Serial Dialog Block

To define an [MGS Natlang](mgs/mgs_natlang) [serial dialog](dialogs/serial_dialogs), start a new [block](mgs/block) at the root level:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">show</span> <span class="identifier">serial dialog</span> <span class="variable-constant">$string</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

Similar to [dialog blocks](mgs/dialog_block), serial dialog blocks allow you to name and populate a serial dialog. Serial dialogs are shown in the serial console instead of the badge's physical screen.

These blocks aren't being defined inside a  [script body](mgs/script_block), so a serial dialog name is required. (The name is whatever is given for [string](mgs/variables/string).)

Inside the curly braces may be any number of [serial dialogs](mgs/serial_dialogs_mgs).

The pair to the above usage is the action [SHOW_SERIAL_DIALOG](actions/SHOW_SERIAL_DIALOG):

<pre class="HyperMD-codeblock mgs">

  <span class="identifier">serial dialog</span> <span class="string">bootTalk</span> <span class="bracket">{</span>
    <span class="string">"Bootup sequence completed!"</span>
  <span class="bracket">}</span>
    <span class="script">exampleScript</span> <span class="bracket">{</span>
    <span class="verb">show</span> <span class="identifier">serial dialog</span> <span class="string">bootTalk</span><span class="terminator">;</span>
  <span class="bracket">}</span>

</pre>

This usage is comparable to what is done with raw JSON.

## Combination Block

However, to [combine](mgs/combination_block) these two usages into one, you'll want to use a [show serial dialog block](mgs/show_serial_dialog_block):

<pre class="HyperMD-codeblock mgs">

  <span class="script">exampleScript</span> <span class="bracket">{</span>
    <span class="verb">show</span> <span class="identifier">serial dialog</span> <span class="bracket">{</span>
      <span class="string">"Bootup sequence completed!"</span>
    <span class="bracket">}</span>
  <span class="bracket">}</span>

</pre>
