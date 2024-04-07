Vue.component('editor-accordion', {
	props: {
		title: {
			type: String,
			required: false,
			default: ''
		}
	},
	name: 'editor-accordion',
	data: function () {
		return {
			collapsed: true
		}
	},
	methods: {
		collapse: function () {
			this.collapsed = !this.collapsed;
		}
	},
	template: /*html*/`
<div class="editor-accordion card text-white mb-3">
	<div class="card-header bg-primary">
		<span>{{title}}</span>
		<span
			class="position-absolute"
			style="top: 6px; right: 6px;"
		>
			<button
				type="button"
				class="btn btn-outline-info"
				@click="collapse"
			>_</button>
		</span>
	</div>
	<div
		class="card-body p-3"
		v-if="!collapsed"
	>
		<slot></slot>
	</div>
</div>
`});
 