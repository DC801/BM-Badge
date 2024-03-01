Vue.component('editor-sanity-checks', {
	name: 'editor-sanity-checks',
	props: {
		checkName: {
			type: String,
			required: true
		}
	},
	data: function () {
		return {
			collapsed: true
		}
	},
	methods: {
		collapse: function () {
			this.collapsed = !this.collapsed;
		},
	},
	template: /*html*/`
<div
	class="editor-dialog card bg-secondary border-primary mb-4"
>
	<div class="card-header bg-primary">
		<strong class="me-auto">{{checkName}}</strong>
		<span
			class="position-absolute"
			style="top:6px; right:6px;"
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
	hello TODO
	</div>
</div>
`});
