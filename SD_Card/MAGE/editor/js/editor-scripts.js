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
