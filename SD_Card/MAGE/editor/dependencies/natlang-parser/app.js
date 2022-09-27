var app = new Vue({
	el:' #app',
	data: {
		which: 'combo',
		origInput: testText,
		lexOutput: {},
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
			}
		},
		split: {
			natlang: oldCoupleHouseNatlang,
			fileName: "untitledFile",
			script: "",
			dialog: "",
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
		>Natlang to JSON pair</button>
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
		<p>(If problems arise, check the console.)</p>
	</div>
	<div
		v-if="which === 'lex'"
	>
		<textarea
			rows="20" cols="80"
			v-model="origInput"
		></textarea>
		<p>
			<button
				@click="lexInput"
			>LEX!</button>
		</p>
		<pre>{{lexOutput}}</pre>
	</div>
</div>
`});
