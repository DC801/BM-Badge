Vue.component('editor-sanity-checks', {
	name: 'editor-sanity-checks',
	props: {
		checkName: {
			type: String,
			required: true
		},
		checkContents: {
			type: String,
			required: false,
			default: ''
		}
	},
	data: function () {
		return {
			collapsed: false, // TODO change
			problems: window.sanityChecks.problems
		}
	},
	methods: {
		collapse: function () {
			this.collapsed = !this.collapsed;
		},
		copyFixes: function () {
			this.$refs.copyFixesText.select();
			document.execCommand('copy');
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
		<span>{{checkName}}</span>
		
		<!--
		TODO
		
		<div class="
			alert
			alert-dismissible
			show
		"
		role="alert"
		>
			<span>You can click the "Copy" button to the right to copy these suggested fixes.</span>
			<button
				type="button"
				class="close"
				title="Copy"
				@click="copyFixes"
			>
				<span aria-hidden="true">📋</span>
			</button>
		</div>
		<textarea
			ref="copyFixesText"
		></textarea>

		-->

	</div>
</div>
`});
