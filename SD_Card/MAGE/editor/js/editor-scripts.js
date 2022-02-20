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
			var currentData = {
				scripts: jsonClone(this.scenarioData.scripts),
				scriptsFileItemMap: jsonClone(this.scenarioData.scriptsFileItemMap),
			}
			return {
				currentData: currentData,
				initJsonState: JSON.stringify(currentData),
				currentScriptFileName: '',
			}
		},
		computed: {
			jsonOutput: function () {
				return JSON.stringify(this.currentData);
			},
			needsSave: function () {
				return this.initJsonState !== this.jsonOutput;
			}
		},
		methods: {
			copyState: function () {
				this.$refs.copyStateTextArea.select();
				document.execCommand("copy");
			},
			updateScript: function (scriptName,changes) {
				this.currentData.scripts[scriptName] = changes;
			},
			updateScriptsFileItemMap: function (scripts) {
				var fileName = this.currentScriptFileName;
				var newScriptsFileItemMap = {}
				Object.assign(
					newScriptsFileItemMap,
					this.currentData.scriptsFileItemMap
				);
				newScriptsFileItemMap[fileName] = scripts;
				this.currentData.scriptsFileItemMap = newScriptsFileItemMap
			}
		},
	}
);
