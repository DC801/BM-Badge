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
				newScriptFileName: null,
				newScriptName: null
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
			},
			addNewScriptFile () {
				var fileName = this.newScriptFileName;
				var allFiles = this.currentData.scriptsFileItemMap;
				this.currentData.scriptsFileItemMap = Object.assign(
					{},
					allFiles,
					{
						[fileName]: []
					}
				);
				this.currentScriptFileName = fileName;
				this.newScriptFileName = null;
			},
			addNewScript () {
				var scriptName = this.newScriptName;
				var fileName = this.currentScriptFileName;
				var allScripts = this.currentData.scripts;
				this.currentData.scripts = Object.assign(
					{},
					allScripts,
					{
						[scriptName]: []
					}
				);
				this.currentData.scriptsFileItemMap[fileName].push(
					scriptName
				);
				this.newScriptName = null;
			},
		},
		template: /*html*/`
<div
	class="
		editor-scripts
		card
		text-white
		mb-3
	"
>
	<div class="card-header">Script Editor</div>
	<div class="card-body">
		<template
			v-if="needsSave"
		>
		<textarea
			cols="80"
			rows="16"
			class="position-absolute"
			style="
				font-size: 0;
				opacity: 0;
			"
			ref="copyStateTextArea"
		>{{ fileOutputToCopy }}</textarea>
		<div
			v-for="(changes, fileName) in changedFileMap"
			class="
				alert
				alert-danger
				alert-dismissible
				fade
				show
			"
			role="alert"
		>
			<strong>Unsaved changes in <em>{{fileName}}</em>!</strong>
			<span>You can click the "Copy" button to the right to put the current scripts your clipboard, then paste it into your "<strong>{{fileName}}</strong>" file to save.</span>
			<button
				type="button"
				class="close"
				title="Copy"
				@click="copyState(changes)"
			>
				<span aria-hidden="true">📋</span>
			</button>
		</div>
		</template>
		<div class="form-group">
			<label for="currentScriptFileName">Script Files:</label>
			<select
				class="form-control"
				id="currentScriptFileName"
				v-model="currentScriptFileName"
			>
				<option
					value=""
				>Select a script</option>
				<option
					v-for="(script, scriptFileName) in currentData.scriptsFileItemMap"
					:key="scriptFileName"
					:value="scriptFileName"
				>{{ scriptFileName }}</option>
			</select>
		</div>
		<div
			v-if="newScriptFileName === null"
			class="form-group"
		>
			<button
				class="btn btn-block btn-primary"
				type="button"
				@click="newScriptFileName = 'script-YOUR_SCRIPT_NAME_HERE.json'"
			>Create New Script File</button>
		</div>
		<form
			v-if="newScriptFileName !== null"
			@submit.prevent="addNewScriptFile"
		>
			<div
				class="form-group"
			>
				<label
					class="form-label"
					for="newScriptFileName"
				>New Script FileName</label>
				<div class="input-group">
					<button
						class="btn btn-primary"
						type="button"
						@click="newScriptFileName = null"
					>X</button>
					<input
						type="text"
						class="form-control"
						id="newScriptFileName"
						placeholder="New Script FileName"
						aria-label="New Script FileName"
						v-model="newScriptFileName"
					/>
					<button
						class="btn btn-primary"
						type="submit"
					>Create New File</button>
				</div>
			</div>
		</form>

		<div
			v-if="currentScriptFileName"
		>
			<div
				v-for="(scriptName, index) in currentData.scriptsFileItemMap[currentScriptFileName]"
			>
				<editor-script
					:script-name="scriptName"
					:file-name="currentScriptFileName"
					:index="index"
					:file-name-map="fileNameMap"
					:scenario-data="scenarioData"
					:current-data="currentData"
					@input="updateScript(scriptName,$event)"
					@updateScriptsFileItemMap="updateScriptsFileItemMap($event)"
				></editor-script>
			</div>
			<div
				v-if="newScriptName === null"
				class="form-group"
			>
				<button
					class="btn btn-block btn-primary"
					type="button"
					@click="newScriptName = 'script-YOUR_SCRIPT_NAME_HERE'"
				>Create New Script</button>
			</div>
			<form
				v-if="newScriptName !== null"
				@submit.prevent="addNewScript"
			>
				<div
					class="form-group"
				>
					<label
						class="form-label"
						for="newScriptName"
					>New Script</label>
					<div class="input-group">
						<button
							class="btn btn-primary"
							type="button"
							@click="newScriptName = null"
						>X</button>
						<input
							type="text"
							class="form-control"
							id="newScriptName"
							placeholder="New Script Name"
							aria-label="New Script Name"
							v-model="newScriptName"
						/>
						<button
							class="btn btn-primary"
							type="submit"
						>Create New Script</button>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>
		`
	}
);
