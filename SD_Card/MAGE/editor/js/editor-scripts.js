Vue.component(
	'editor-scripts',
	{
		name: 'editor-scripts',
		template: '#template-editor-scripts',
		props: {
			fileNameMap: {
				type: Object,
				required: true
			},
			scenarioData: {
				type: Object,
				required: true
			}
		},
		data: function () {
			return {
				init: {
					scripts: jsonClone(this.scenarioData.scripts),
					scriptFiles: jsonClone(this.scenarioData.scriptsFileItemMap),
				},
				current: {
					scripts: jsonClone(this.scenarioData.scripts),
					scriptFiles: jsonClone(this.scenarioData.scriptsFileItemMap),
				},
				initJsonState: '',
				currentScriptFileName: '',
			}
		},
		computed: {
			jsonOutput: function () {
				return JSON.stringify(
					this.current,
					null,
					'\t'
				) + '\n';
			},
			needsSave: function () {
				return this.initJsonState !== this.jsonOutput;
			}
		},
		created: function () {
			this.initJsonState = this.jsonOutput;
		},
		methods: {
			copyState: function () {
				this.$refs.copyStateTextArea.select();
				document.execCommand("copy");
			},
			updateScript: function (scriptName,changes) {
				this.current.scripts[scriptName] = changes;
			}
		},
	}
);
