Vue.component('editor-sanity-checks', {
	name: 'editor-sanity-checks',
	props: {
		sanityChecks: {
			type: Object,
			// required: true
			// TODO change
			required: false,
			default: null
		}
	},
	data: function () {
		return {
			collapsed: false, // TODO change
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
	class="card border-primary mb-4"
>
	<div class="card-header">
		<strong class="me-auto">Additional reports about the build</strong>
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
		<div class="editor-script card border-primary mb-4">
			<div class="card-header bg-primary">
				TODO a name
			</div>
			<div class="card-body p-3">
			</div>
		</div>
	</div>
</div>



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
`});
