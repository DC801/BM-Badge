Vue.component(
	'editor-script',
	{
		name: 'editor-script',
		props: {
			scriptName: {
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
		},
		data: function () {
			return {
				collapsed: true,
				editingName: this.scriptName,
				newActionName: null,
				editing: false,
			}
		},
		computed: {
			script: function () {
				return this.currentData.scripts[this.scriptName];
			},
			existingScriptNames: function () {
				return Object.keys(this.currentData.scripts);
			},
			isNewScriptNameUnique: function () {
				var existingNames = this.existingScriptNames;
				return !existingNames.includes(this.editingName);
			},
		},
		methods: {
			moveScript: function (direction) {
				var fileName = this.fileName;
				var scripts = this.currentData.scriptsFileItemMap[fileName].slice();
				var index = this.index;
				var targetIndex = index + direction;
				var splice = scripts.splice(index, 1);
				scripts.splice(targetIndex, 0, splice[0]);
				this.$emit('updateScriptsFileItemMap', scripts);
			},
			submitNewScriptName: function () {
				var newName = this.editingName;
				this.editing = false;
				this.$emit('updateScriptName', newName);
			},
			moveAction: function (index, direction) {
				var newScript = this.script.slice();
				var targetIndex = index + direction;
				var splice = newScript.splice(index, 1);
				newScript.splice(targetIndex, 0, splice[0]);
				this.$emit('input', newScript);
			},
			deleteAction: function (index) {
				var newScript = this.script.slice();
				newScript.splice(index, 1);
				this.$emit('input', newScript);
			},
			collapse: function () {
				this.collapsed = !this.collapsed;
			},
			updateAction: function (index, action) {
				var newScript = this.script.slice();
				newScript[index] = action;
				this.$emit('input', newScript);
			},
			addAction: function () {
				var actionName = this.newActionName;
				var fieldsForAction = actionFieldsMap[actionName];
				// don't try to add an action if it's not valid
				if (fieldsForAction) {
					var newScript = this.script.slice();
					var action = {
						action: actionName
					};
					fieldsForAction.forEach(function (field) {
						action[field.propertyName] = null;
					});
					newScript.push(action);
					this.$emit('input', newScript);
				}
				this.newActionName = null;
			}
		},
		template: /*html*/`
<div
	class="editor-script card border-primary mb-4"
>
	<div class="card-header bg-primary">
		<div
			v-if="!editing"
		>
			<button
				type="button"
				class="btn mr-1 btn-outline-danger"
				@click="$emit('deleteScript')"
			>X</button>
			<strong class="me-auto">{{scriptName}}</strong>
			<button
				type="button"
				class="btn btn-sm p-0"
				@click="editing = true"
			>
				<component-icon
					color="white"
					:size="12"
					subject="edit"
				></component-icon>
			</button>
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
					:disabled="index === (currentData.scriptsFileItemMap[fileName].length - 1)"
					@click="moveScript(1)"
				>↓</button>
			</span>
		</div>
		<div
			v-if="editing"
		>
			<div class="input-group">
				<input
					type="text"
					class="form-control"
					:class="{
						'is-invalid': !isNewScriptNameUnique && scriptName !== editingName
					}"
					v-model="editingName"
					aria-label="editingName"
				>
				<button
					type="button"
					class="btn btn-sm"
					@click="editing = false; editingName = scriptName"
				>Cancel</button>
				<button
					type="button"
					class="btn btn-sm"
					@click="submitNewScriptName"
					:disabled="
						!isNewScriptNameUnique
						&& scriptName !== editingName
					"
				>OK</button>
			</div>
			<div
				class="form-text text-warning"
				v-if="
					isNewScriptNameUnique
					|| scriptName === editingName
				"
			>NOTE: Script name references will not be updated elsewhere!</div>
			<div
				class="form-text text-danger"
				v-if="
					!isNewScriptNameUnique
					&& scriptName !== editingName
				"
			>Another script already has that name!</div>
		</div>
	</div>
	<div
		class="card-body p-3"
		v-show="!collapsed"
	>
		<div
			v-for="(action, index) in script"
		>
			<editor-action
				:script="script"
				:action="action"
				:index="index"
				:current-data="currentData"
				@input="updateAction(index,$event)"
				@moveAction="moveAction(index,$event)"
				@deleteAction="deleteAction(index)"
			></editor-action>
		</div>
		<form
			@submit.prevent="addAction"
		>
			<div
				class="form-group"
			>
				<label
					class="form-label"
					for="newScriptFileName"
				>New Action</label>
				<div class="input-group">
					<action-input-action-type
						id="newActionName"
						placeholder="New Action"
						aria-label="New Action"
						v-model="newActionName"
					></action-input-action-type>
					<button
						class="btn btn-primary"
						type="submit"
					>Add Action</button>
				</div>
			</div>
		</form>
	</div>
</div>
`}
);
