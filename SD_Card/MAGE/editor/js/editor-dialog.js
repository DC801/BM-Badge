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
		}
	},
	computed: {
		dialogPhases: function () {
			return this.currentData.dialogs[this.dialogName]
		},
	},
	methods: {
		moveDialog: function (direction) {
			this.$store.commit('MOVE_DIALOG', {
				fileName: this.fileName,
				index: this.index,
				direction: direction
			});
		},
		collapse: function () {
			this.collapsed = !this.collapsed;
		},
		updateDialogPhase: function (phaseIndex, phase) {
			this.$store.commit('UPDATE_DIALOG_PHASE', {
				dialogName: this.dialogName,
				phaseIndex: phaseIndex,
				phase: phase,
			})
		},
		deleteDialogPhase: function (phaseIndex) {
			this.$store.commit('DELETE_DIALOG_PHASE', {
				dialogName: this.dialogName,
				phaseIndex: phaseIndex,
			});
		},
	},
	template: /*html*/`
<div
	class="editor-dialog card bg-secondary border-primary mb-4"
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
				@click="moveDialog(-1)"
			>↑</button>
			<button
				type="button"
				class="btn btn-outline-info"
				:disabled="index === (currentData.dialogsFileItemMap[fileName].length - 1)"
				@click="moveDialog(1)"
			>↓</button>
		</span>
	</div>
	<div
		class="card-body p-3"
		v-if="!collapsed"
	>
		<editor-dialog-phase
			v-for="(phase, index) in dialogPhases"
			:key="index"
			:phase="phase"
			:phase-index="index"
			@input="updateDialogPhase(index, $event)"
			@delete="deleteDialogPhase(index)"
		></editor-dialog-phase>
		<div>
			<button
				class="btn btn-primary"
				type="submit"
				@click="$store.commit('ADD_DIALOG_PHASE', dialogName)"
			>Add Phase</button>
		</div>
	</div>
</div>
`});
