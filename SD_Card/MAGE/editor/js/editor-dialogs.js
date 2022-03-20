Vue.component('editor-dialogs', {
	name: 'editor-dialogs',
	props: {
		fileNameMap: {
			type: Object,
			required: true
		},
		scenarioData: {
			type: Object,
			required: true
		},
	},
	data: function () {
		const data = {
			dialogs: jsonClone(this.scenarioData.dialogs),
			dialogsFileItemMap: jsonClone(this.scenarioData.dialogsFileItemMap)
		}
		return {
			currentDialogFileName: null,
			currentDialog: null,
			currentData: data,
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
