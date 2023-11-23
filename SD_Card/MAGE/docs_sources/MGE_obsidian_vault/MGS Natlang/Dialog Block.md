# Dialog Block

To define an [[MGS Natlang]] [[dialogs|dialog]], start a new [[Block|block]] at the root level:

<pre class="HyperMD-codeblock mgs">

  <span class="verb">show</span> <span class="identifier">dialog</span> <span class="variable-constant">$string</span> <span class="bracket">{</span><span class="bracket">}</span>

</pre>

As these dialog blocks aren't being defined inside a [[Script Block|script body]], a dialog name is required. (The name is whatever is given for [[string]].)

Inside the curly braces may be any number of [[Dialogs (MGS)|dialogs]].

The pair to the above usage is the action [[SHOW_DIALOG]]:

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

However, to [[Combination Block|combine]] these two usages into one, you'll want to use a [[show dialog block]]:

<pre class="HyperMD-codeblock mgs">

  <span class="script">exampleScript</span> <span class="bracket">{</span>
    <span class="verb">show</span> <span class="identifier">dialog</span> <span class="bracket">{</span>
      <span class="dialog-identifier">Bob</span> <span class="string">"Hi there! I'm speaking to you!"</span>
    <span class="bracket">}</span>
  <span class="bracket">}</span>

</pre>
