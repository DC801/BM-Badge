Vue.component('editor-dialogs', {
	name: 'editor-dialogs',
	mixins: [
		makeComputedStoreGetterSettersMixin([
			'scenarioData',
			'fileNameMap',
			'currentData',
			'initState',
		]),
		makeFileChangeTrackerMixinByResourceType('dialogs'),
	],
	data: function () {
		return {
			currentDialogFileName: '',
			currentDialog: '',
		}
	},
	computed: {
		currentFileDialogs: function () {
			return this.currentData.dialogsFileItemMap[this.currentDialogFileName]
		},
	},
	methods: {
		handleInput: function (dialogName, value) {
			// TODO: implement
		},
		updateDialogsFileItemMap: function (map) {
			this.currentData.dialogsFileItemMap = map;
		},
	},
	template: /*html*/`
<div
	class="editor-dialogs card mb-4"
>
	<div
		class="card-header bg-secondary p-2"
	>Dialog Editor</div>
	<div
		class="card-body"
	>
		<template
			v-if="dialogsNeedSave"
		>
			<copy-changes
				v-for="(changes, fileName) in dialogsChangedFileMap"
				:key="fileName"
				:file-name="fileName"
				:changes="changes"
				resource-name="dialog"
			></copy-changes>
		</template>
		<div class="form-group">
			<label for="currentDialogFileName">Dialog Files:</label>
			<select
				class="form-control"
				id="currentDialogFileName"
				v-model="currentDialogFileName"
			>
				<option
					value=""
				>Select a file</option>
				<option
					v-for="(dialog, dialogFileName) in currentData.dialogsFileItemMap"
					:key="dialogFileName"
					:value="dialogFileName"
				>{{ dialogFileName }}</option>
			</select>
		</div>
		<editor-dialog
			v-for="(dialogName, index) in currentFileDialogs"
			:key="dialogName"
			:dialog-name="dialogName"
			:index="index"
			:file-name="currentDialogFileName"
			:file-name-map="fileNameMap"
			:scenario-data="scenarioData"
			:current-data="currentData"
			@input="handleInput(dialogName, $event)"
			@updateDialogsFileItemMap="updateDialogsFileItemMap"
		></editor-dialog>
	</div>
</div>
`});
