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
				newActionName: null
			}
		},
		computed: {
			script: function () {
				return this.currentData.scripts[this.scriptName];
			}
		},
		methods: {
			moveScript: function (direction) {
				var fileName = this.fileName;
				var scripts = this.currentData.scriptsFileItemMap[fileName].slice();
				var index = this.index;
				var targetIndex = index + direction;
				var splice = scripts.splice(index, 1);
				scripts.splice(targetIndex, 0, splice[0]);
				this.$emit('updateScriptsFileItemMap', scripts)
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
			collapseScript: function () {
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
		<strong class="me-auto">{{scriptName}}</strong>
		<span
			class="position-absolute"
			style="top:6px; right:6px;"
		>
			<button
				type="button"
				class="btn btn-outline-info"
				@click="collapseScript"
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
