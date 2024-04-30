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
		mixins: [
			makeComputedStoreGetterSettersMixin([
				'scenarioData',
				'fileNameMap',
				'currentData',
				'initState',
			]),
			{
				computed: window.Vuex.mapGetters([
					'scriptsOptions',
				]),
			},
			makeFileChangeTrackerMixinByResourceType('scripts'),
		],
		data: function () {
			return {
				currentScriptFileName: '',
				newScriptFileName: null,
				newScriptName: null
			}
		},
		computed: {
			isNewScriptNameUnique: function () {
				var existingNames = this.scriptsOptions;
				return !existingNames.includes(this.newScriptName);
			},
			/*
			natLangScript: function () {
				var currFile = this.currentScriptFileName;
				var scriptNames = this.currentData.scriptsFileItemMap[currFile];
				var scripts = this.currentData.scripts;
				var result = {};
				if (currFile) {
					scriptNames.forEach(function (scriptName) {
						result[scriptName] = scripts[scriptName];
					})
					var restored = makeNatLangScripts(result);
					return restored;
				} else {
					return '';
				}
			},
			*/
		},
		methods: {
			updateScript: function (scriptName,changes) {
				this.$store.commit('UPDATE_SCRIPT_BY_NAME', {
					scriptName: scriptName,
					script: changes
				})
			},
			updateScriptName: function (oldName, newName, index) {
				// updates global script map
				var scriptValue = this.currentData.scripts[oldName];
				var newScriptsMap = Object.assign(
					{
						[newName]: scriptValue,
					},
					this.currentData.scripts,
				);
				delete newScriptsMap[oldName];

				// updates script name in file script list
				var fileName = this.currentScriptFileName;
				var newScriptList = this.currentData.scriptsFileItemMap[fileName].slice();
				newScriptList[index] = newName;

				this.currentData.scripts = newScriptsMap;
				this.updateScriptsFileItemMap(newScriptList);
			},
			deleteScript: function (scriptName) {
				var fileName = this.currentScriptFileName;
				var newScriptList = this.currentData.scriptsFileItemMap[fileName]
					.filter(function (name) {
						return name !== scriptName
					});

				var newScriptsMap = Object.assign(
					{},
					this.currentData.scripts,
				);
				delete newScriptsMap[scriptName];

				this.currentData.scripts = newScriptsMap;
				this.updateScriptsFileItemMap(newScriptList);
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
			v-if="scriptsNeedSave"
		>
			<copy-changes
				v-for="(changes, fileName) in scriptsChangedFileMap"
				:key="fileName"
				:file-name="fileName"
				:changes="changes"
				resource-name="script"
			></copy-changes>
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
					@updateScriptName="updateScriptName(scriptName,$event,index)"
					@deleteScript="deleteScript(scriptName)"
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
							:class="{
								'is-invalid': !isNewScriptNameUnique
							}"
							id="newScriptName"
							placeholder="New Script Name"
							aria-label="New Script Name"
							v-model="newScriptName"
						/>
						<button	
							class="btn btn-primary"
							type="submit"
							:disabled="!isNewScriptNameUnique"
						>Create New Script</button>
						<div
							class="invalid-feedback"
							v-if="!isNewScriptNameUnique"
						>Another script already has that name!</div>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>
`});
