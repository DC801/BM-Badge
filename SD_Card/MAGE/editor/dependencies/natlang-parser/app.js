var app = new Vue({
	el:' #app',
	data: {
		which: 'zigzag',
		origInput: testText,
		lexOutput: {},
		whyleTestStrings: whyleTestStrings, // for the v-for
		whyleOrigInput: whyleTestStrings[0],
		whyleOutput: '',
		zigzagTestStrings: zigzagTestStrings, // for the v-for
		zigzagOrigInput: zigzagTestStrings[0],
		zigzagOutput: '',
		constantsTestStrings: constantsTestStrings, // for the v-for
		constantsOrigInput: constantsTestStrings[0],
		constantsOutput: '',
		combo: {
			origScript: '{}',
			origDialog: '{}',
			indent: '\t',
			natlang: '',
			format: {
				simpleGoto: false,
				simpleCopy: false,
				splitThen: false,
				altIndent: false,
				altIndentChar: '',
				nestledAlign: false,
				shortAlign: false,
				snugSemicolons: false,
			}
		},
		split: {
			natlang: oldCoupleHouseNatlang,
			fileName: "untitledFile",
			script: "",
			dialog: "",
			serialDialog: "",
		}
	},
	computed: {
		formattedNatlang: function () {
			return mgs.natlangFormatter(
				this.combo.natlang,
				this.combo.format
			);
		},
		lexSuccess: function () {
			return this.lexOutput && this.lexOutput.numErrors && this.lexOutput.numErrors === 0;
		},
		lexResult: function () {
			return this.lexSuccess ? this.lexOutput.tokens : null;
		},
		lexErrors: function () {
			return this.lexSuccess ? this.lexOutput.messages : null;
		},
	},
	methods: {
		loadScriptDemo: function () {
			this.combo.origScript = JSON.stringify(oldCoupleHouseScript, null, '  ');
		},
		loadDialogDemo: function () {
			this.combo.origDialog = JSON.stringify(oldCoupleHouseDialog, null, '  ');
		},
		lexInput: function () {
			this.lexOutput = natlang.lex(this.origInput);
		},
		populateWhyleTest: function (index) {
			this.whyleOrigInput = whyleTestStrings[index];
		},
		populateZigzagTest: function (index) {
			this.zigzagOrigInput = zigzagTestStrings[index];
		},
		populateConstantsTest: function (index) {
			this.constantsOrigInput = constantsTestStrings[index];
		},
		whyleInput: function () {
			var result;
			var tokenReport = natlang.lex(this.whyleOrigInput);
			var tokens = tokenReport.tokens;
			if (!tokens) {
				var pos = tokenReport.errors[0].pos
				var text = tokenReport.errors[0].text
				var fancyMessage = natlang.getPosContext(this.whyleOrigInput, pos, text);
				this.whyleOutput = "LEX ERROR\n" + fancyMessage;
				throw new Error(fancyMessage);
			}
			var expandedTokens;
			try {
				expandedTokens = whyle.process(tokens);
			} catch (error) {
				var errorMessage;
				if (error.pos) {
					errorMessage = error.name + '\n' + natlang.getPosContext(this.whyleOrigInput, error.pos, error.message);
				} else {
					errorMessage = error.name + '\n' + error.message + '\n' + error.stack;
				}
				this.whyleOutput = errorMessage;
				throw new Error(errorMessage);
			}
			if (expandedTokens.length) {
				result = whyle.log(expandedTokens);
			}
			this.whyleOutput = result.logBody;
		},
		zigzagInput: function () {
			var result;
			var tokenReport = natlang.lex(this.zigzagOrigInput);
			var tokens = tokenReport.tokens;
			if (!tokens) {
				var pos = tokenReport.errors[0].pos
				var text = tokenReport.errors[0].text
				var fancyMessage = natlang.getPosContext(this.zigzagOrigInput, pos, text);
				this.zigzagOutput = "LEX ERROR\n" + fancyMessage;
				throw new Error(fancyMessage);
			}
			var expandedTokens;
			try {
				expandedTokens = zigzag.process(tokens);
			} catch (error) {
				var errorMessage;
				if (error.pos) {
					errorMessage = error.name + '\n' + natlang.getPosContext(this.zigzagOrigInput, error.pos, error.message);
				} else {
					errorMessage = error.name + '\n' + error.message + '\n' + error.stack;
				}
				this.zigzagOutput = errorMessage;
				throw new Error(errorMessage);
			}
			if (expandedTokens.length) {
				result = zigzag.log(expandedTokens);
			}
			this.zigzagOutput = result.logBody;
		},
		constantsInput: function () {
			var result;
			var tokenReport = natlang.lex(this.constantsOrigInput);
			var tokens = tokenReport.tokens;
			if (!tokens) {
				var pos = tokenReport.errors[0].pos
				var text = tokenReport.errors[0].text
				var fancyMessage = natlang.getPosContext(this.constantsOrigInput, pos, text);
				this.constantsOutput = "LEX ERROR\n" + fancyMessage;
				throw new Error(fancyMessage);
			}
			var expandedTokens;
			try {
				expandedTokens = constants.process(tokens);
			} catch (error) {
				var errorMessage;
				if (error.pos) {
					errorMessage = error.name + '\n' + natlang.getPosContext(this.constantsOrigInput, error.pos, error.message);
				} else {
					errorMessage = error.name + '\n' + error.message + '\n' + error.stack;
				}
				this.constantsOutput = errorMessage;
				throw new Error(errorMessage);
			}
			if (expandedTokens.length) {
				result = constants.log(expandedTokens);
			}
			this.constantsOutput = result.logBody + '\n\nRAW:\n\n' + JSON.stringify(result.raw, null, '\t');
		},
		makeComboNatlang: function () {
			this.combo.natlang = mgs.intelligentDualHandler(
				JSON.parse(this.combo.origScript),
				JSON.parse(this.combo.origDialog),
				this.combo.indent
			);
		},
		makeSplitJSONs: function () {
			var safeInput = this.split.natlang;
			var result = natlang.parse(
				mgs,
				safeInput,
				this.split.fileName
			);
			this.split.dialog = JSON.stringify(result.dialogs, null, '  ');
			this.split.serialDialog = JSON.stringify(result.serialDialogs, null, '  ');
			this.split.script = JSON.stringify(result.scripts, null, '  ');
		},
		changeWhich: function (word) {
			this.which = word;
		}
	},
	template: /*html*/`
<div id="app">
	<p>
		<button
			@click="changeWhich('lex')"
		>Lex tester</button>
		<button
			@click="changeWhich('combo')"
		>JSON pair to natlang</button>
		<button
			@click="changeWhich('split')"
		>Natlang to JSON trio</button>
		<button
			@click="changeWhich('whyle')"
		>Whyle tester</button>
		<button
			@click="changeWhich('zigzag')"
		>Zigzag tester</button>
		<button
			@click="changeWhich('constants')"
		>Constants tester</button>

	</p>
	<hr />
	<div
		v-if="which === 'combo'"
	>
		<h3>
			<span>Original script JSON:</span>
			<button
				@click="loadScriptDemo"
			>Demo</button>
		</h3>
		<p><textarea
			rows="5" cols="80"
			v-model="combo.origScript"
		></textarea></p>
		<h3>
			<span>Original dialog JSON:</span>
			<button
				@click="loadDialogDemo"
			>Demo</button>
		</h3>
		<p><textarea
			rows="5" cols="80"
			v-model="combo.origDialog"
		></textarea></p>
		<hr />
		<h1>
			<span>Make natlang!</span>
			<button
				@click="makeComboNatlang"
			>GO!</button>
		</h1>
		<p>
			<div>
				<label>
					<input
						type="checkbox"
						v-model="combo.format.altIndent"
					>
					<span>replace indent:</span>
				</label>
				<label>
					<input
						:disabled="!combo.format.altIndent"
						type="text"
						v-model="combo.format.altIndentChar"
					>
				</label>
			</div>
			<div>
				<label><input
					type="checkbox"
					v-model="combo.format.simpleGoto"
				><span>simple goto</span></label>
			</div>
			<div>
				<label><input
					type="checkbox"
					v-model="combo.format.simpleCopy"
				><span>simple copy</span></label>
			</div>
			<div>
				<label><input
					type="checkbox"
					v-model="combo.format.splitThen"
				><span>split then</span></label>
			</div>
			<div>
				<label><input
					type="checkbox"
					v-model="combo.format.nestledAlign"
				><span>nestled alignment</span></label>
			</div>
			<div>
				<label><input
					type="checkbox"
					v-model="combo.format.shortAlign"
				><span>short alignment</span></label>
			</div>
			<div>
				<label><input
					type="checkbox"
					v-model="combo.format.snugSemicolons"
				><span>snug semicolons</span></label>
			</div>
		</p>
		<textarea
			rows="20" cols="80"
			v-model="formattedNatlang"
		></textarea>
		<p>(If problems arise, check the console.)</p>
	</div>
	<div
		v-if="which === 'split'"
	>
		<h3>File name:</h3>
		<p><input
			type="text"
			v-model="split.fileName"
		></p>
		<h3>Original natlang:</h3>
		<p><textarea
			rows="10" cols="80"
			v-model="split.natlang"
		></textarea></p>
		<hr />
		<h1>
			<span>Make splits!!</span>
			<button
				@click="makeSplitJSONs"
			>GO!</button>
		</h1>
		<h3>Script JSON:</h3>
		<textarea
			rows="20" cols="80"
			v-model="split.script"
		></textarea>
		<h3>Dialog JSON:</h3>
		<textarea
			rows="20" cols="80"
			v-model="split.dialog"
		></textarea>
		<h3>Serial dialog JSON:</h3>
		<textarea
			rows="20" cols="80"
			v-model="split.serialDialog"
		></textarea>
		<p>(If problems arise, please check the console.)</p>
	</div>
	<div
		v-if="which === 'lex'"
	>
		<textarea
			rows="20" cols="80"
			v-model="origInput"
		></textarea>
		<h1>
			<span>Lex!</span>
			<button
				@click="lexInput"
			>GO!</button>
		</h1>
		<pre>{{lexOutput}}</pre>
	</div>
	<div
		v-if="which === 'whyle'"
	>
		<textarea
			rows="20" cols="80"
			v-model="whyleOrigInput"
		></textarea>
		<p>
			<button
				v-for="testString, index in whyleTestStrings"
				@click="populateWhyleTest(index)"
			>TestData {{index}}</button>
		</p>
		<h1>
			<span>Whyle!</span>
			<button
				@click="whyleInput"
			>GO!</button>
		</h1>
		<pre>{{whyleOutput}}</pre>
	</div>
	<div
		v-if="which === 'zigzag'"
	>
		<textarea
			rows="20" cols="80"
			v-model="zigzagOrigInput"
		></textarea>
		<p>
			<button
				v-for="testString, index in zigzagTestStrings"
				@click="populateZigzagTest(index)"
			>TestData {{index}}</button>
		</p>
		<h1>
			<span>Zigzag!</span>
			<button
				@click="zigzagInput"
			>GO!</button>
		</h1>
		<pre>{{zigzagOutput}}</pre>
	</div>
	<div
		v-if="which === 'constants'"
	>
		<textarea
			rows="20" cols="80"
			v-model="constantsOrigInput"
		></textarea>
		<p>
			<button
				v-for="testString, index in constantsTestStrings"
				@click="populateConstantsTest(index)"
			>TestData {{index}}</button>
		</p>
		<h1>
			<span>Constants!</span>
			<button
				@click="constantsInput"
			>GO!</button>
		</h1>
		<pre>{{constantsOutput}}</pre>
	</div>
</div>
`});
