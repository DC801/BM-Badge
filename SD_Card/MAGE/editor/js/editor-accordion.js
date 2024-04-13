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
<div class="editor-accordion card border-secondary text-white my-3">
	<div class="card-header bg-secondary">
		<span v-html="title"></span>
		<span
			class="position-absolute"
			style="top: 6px; right: 6px;"
		>
			<button
				type="button"
				class="btn btn-outline-light"
				@click="collapse"
			>_</button>
		</span>
	</div>
	<div
		class="card-body px-3 py-1"
		v-show="!collapsed"
	>
		<slot></slot>
	</div>
</div>
`});
 