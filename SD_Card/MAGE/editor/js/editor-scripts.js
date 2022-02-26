var getUnique = function (value, index, self) {
	return self.indexOf(value) === index;
};

var sortCaseInsensitive = function (a, b) {
	return a.toLowerCase().localeCompare(b.toLowerCase());
}

var extractNames = function (arrayOfObjects) {
	console.log(arrayOfObjects);
	var result = arrayOfObjects
		.map(function (item) {
			return item.name;
		})
		.filter(function (itemName) {
			return itemName && itemName.length;
		})
		.sort(sortCaseInsensitive)
		.filter(getUnique);
	return result;
};

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
				dialogs: jsonClone(this.scenarioData.dialogs),
				maps: jsonClone(this.scenarioData.maps),
				entityTypes: jsonClone(this.scenarioData.entityTypes),
				entityNames: extractNames(this.scenarioData.parsed.entities),
				geometryNames: extractNames(this.scenarioData.parsed.geometry),
			}
			return {
				currentData: currentData,
				initState: JSON.parse(JSON.stringify(currentData)),
				initStateJson: JSON.stringify(currentData),
				currentScriptFileName: '',
				fileOutputToCopy: '',
			}
		},
		computed: {
			startFileMap: function () {
				return this.getAllScriptFileJsonForSource(this.initState);
			},
			currentFileMap: function () {
				return this.getAllScriptFileJsonForSource(this.currentData);
			},
			changedFileMap () {
				var result = {}
				var currentFileMap = this.currentFileMap
				var startFileMap = this.startFileMap
				Object.keys(currentFileMap).forEach(function (fileName) {
					if (currentFileMap[fileName] !== startFileMap[fileName]) {
						result[fileName] = currentFileMap[fileName]
					}
				})
				return result;
			},
			jsonOutput: function () {
				return JSON.stringify(this.currentData);
			},
			needsSave: function () {
				return this.initStateJson !== this.jsonOutput;
			}
		},
		methods: {
			getAllScriptFileJsonForSource (source) {
				var self = this;
				var result = {};
				Object.keys(
					source.scriptsFileItemMap
				).forEach(function (fileName) {
					result[fileName] = self.collectFileScripts(
						fileName,
						source
					);
				});
				return result
			},
			collectFileScripts (fileName, source) {
				var scriptNamesInFile = source.scriptsFileItemMap[fileName];
				var result = {};
				scriptNamesInFile.forEach(function (scriptName) {
					result[scriptName] = source.scripts[scriptName];
				})
				return JSON.stringify(result, null, '\t') + '\n';
			},
			copyState: function (changes) {
				this.fileOutputToCopy = changes;
				this.$refs.copyStateTextArea.innerHTML = changes;
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
