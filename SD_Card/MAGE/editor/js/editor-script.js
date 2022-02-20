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
				@input="updateAction(index,$event)"
				@moveAction="moveAction(index,$event)"
				@deleteAction="deleteAction(index)"
			></editor-action>
		</div>
	</div>
</div>
`}
);
