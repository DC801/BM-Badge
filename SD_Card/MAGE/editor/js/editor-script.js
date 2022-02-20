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
			fileNameMap: {
				type: Object,
				required: true
			},
			scenarioData: {
				type: Object,
				required: true
			},
			currentData: {
				type: Object,
				required: true
			},
		},
		data: function () {
			return {
				collapsed: false,
			}
		},
		computed: {
			script: function () {
				return this.currentData.scripts[this.scriptName];
			}
		},
		methods: {
			moveScript: function (value) {
				// TODO: emit moveScript(fileName, index, value)

				// var scriptList = this.current.scriptFiles[fileName];
				// var splice = scriptList.splice(index, 1);
				// var targetIndex = index + value;
				// scriptList.splice(targetIndex, 0, splice[0]);
			},
			collapseScript: function () {
				this.collapsed = !this.collapsed;
			},
			deleteScript: function () {
				// TODO
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
				@click="collapseScript()"
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
				:disabled="index === (scenarioData.scriptsFileItemMap[fileName].length - 1)"
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
				:file-name-map="fileNameMap"
				:script-name="scriptName"
				:action="action"
				:index="index"
				:scenario-data="scenarioData"
				:current-data="currentData"
				@input="updateAction(index,$event)"
			></editor-action>
		</div>
	</div>
</div>
`}
);
