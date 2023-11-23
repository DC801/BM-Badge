# Show Serial Dialog Block

A [[Combination Block|combination]] of the action [[SHOW_SERIAL_DIALOG]] and a [[serial dialog block]]:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">show</span> <span class="identifier">serial dialog</span> <span class="variable-constant">$string</span> <span class="bracket">{</span><span class="bracket">}</span>
  <span class="comment">// or</span>
  <span class="verb">show</span> <span class="identifier">serial dialog</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

Inside the curly braces may be any number of [[Serial Dialogs (MGS)|serial dialog]].

This block can be defined with or without a serial dialog name (whatever is given for [[string]]). Providing a name means other scripts are able to refer to that serial dialog, too, but this is rarely necessary. (When converting JSON files into [[MGS Natlang]], the dialog names are preserved.) When a serial dialog name isn't given, one is generated based on the file name and line number.

Both patterns are valid anywhere [[actions]] are allowed (i.e. inside [[script block|script blocks]]).

<pre class="HyperMD-codeblock mgs">

  <span class="script">exampleScript</span> <span class="bracket">{</span>
    <span class="verb">show</span> <span class="identifier">serial dialog</span> <span class="bracket">{</span>
      <span class="string">"Bootup sequence completed!"</span>
    <span class="bracket">}</span>
  <span class="bracket">}</span>

</pre>
