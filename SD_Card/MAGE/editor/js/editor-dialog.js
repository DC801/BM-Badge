Vue.component('editor-dialog', {
	name: 'editor-dialog',
	props: {
		dialogName: {
			type: String,
			required: true
		},
		fileName: {
			type: String,
			required: true
		},
		index: {
			type: Number,
			required: true
		},
		currentData: {
			type: Object,
			required: true
		},
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
		return {
			collapsed: true,
			newActionName: null,
			newMessage: null
		}
	},
	computed: {
		dialogs: function () {
			return this.currentData.dialogs[this.dialogName]
		},
	},
	methods: {
		moveDialog: function (direction) {
			// TODO: Use this and verify this works
			var fileName = this.fileName;
			var scripts = this.currentData.dialogsFileItemMap[fileName].slice();
			var index = this.index;
			var targetIndex = index + direction;
			var splice = scripts.splice(index, 1);
			scripts.splice(targetIndex, 0, splice[0]);
			this.$emit('updateDialogsFileItemMap', scripts)
		},
		collapse: function () {
			this.collapsed = !this.collapsed;
		},
		updateMessage: function (index, message) {
			// TODO: Use this and verify this works
			var messages = (this.dialog.messages || []).slice();
			messages[index] = message;
			this.updateProperty(
				'messages',
				messages
			);
		},
		updateProperty: function (propertyName, value) {
			// TODO: Use this and verify this works
			var result = Object.assign(
				{},
				this.dialog,
				{
					[propertyName]: value
				}
			)
			this.$emit('input', result);
		},
		addMessage: function () {
			// TODO: Use this and verify this works
			var messages = (this.dialog.messages || []).slice();
			messages.push(message);
			this.updateProperty(
				'messages',
				messages
			);
		}
	},
	template: /*html*/`
<div
	class="editor-dialog card border-primary mb-4"
>
	<div class="card-header bg-primary">
		<strong class="me-auto">{{dialogName}}</strong>
		<span
			class="position-absolute"
			style="top:6px; right:6px;"
		>
			<button
				type="button"
				class="btn btn-outline-info"
				@click="collapse"
			>_</button>
			<button
				type="button"
				class="btn btn-outline-info"
				:disabled="index === 0"
				@click="moveScript(-1)"
			>↑</button>
			<button
				type="button"
				class="btn btn-outline-info"
				:disabled="index === (currentData.dialogsFileItemMap[fileName].length - 1)"
				@click="moveScript(1)"
			>↓</button>
		</span>
	</div>
	<div
		class="card-body p-3"
		v-if="!collapsed"
	>
		<div
			v-for="(dialog, index) in dialogs"
			:key="index"
		>
			<editor-dialog-preview
				:index="index"
				:dialog="dialog"
				:file-name-map="fileNameMap"
				:scenario-data="scenarioData"
			></editor-dialog-preview>
			<pre>{{dialog}}</pre>
		</div>
		<form
			@submit.prevent="addMessage"
		>
			<div
				class="form-group"
			>
				<label
					class="form-label"
				>New Phase</label>
				<div class="input-group">
					<input
						class="form-control"
						placeholder="New Message"
						aria-label="New Message"
						v-model="newMessage"
					/>
					<button
						class="btn btn-primary"
						type="submit"
					>Add Message</button>
				</div>
			</div>
		</form>
	</div>
</div>
`});
