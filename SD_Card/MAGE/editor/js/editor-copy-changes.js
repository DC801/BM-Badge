window.Vue.component('copy-changes', {
	props: {
		changes: {
			required: true,
		},
		fileName: {
			type: String,
			required: true,
		},
		resourceName: {
			type: String,
			required: true,
		},
	},
	methods: {
		copyState: function () {
			this.$refs.copyStateTextArea.select();
			document.execCommand("copy");
		},
	},
	template: `
<div
	class="
		copy-changes
		alert
		alert-danger
		alert-dismissible
		fade
		show
	"
	role="alert"
>
	<textarea
		cols="80"
		rows="16"
		class="position-absolute"
		style="
			font-size: 0;
			opacity: 0;
		"
		ref="copyStateTextArea"
	>{{ changes }}</textarea>
	<strong>Unsaved changes in <em>{{ fileName }}</em>!</strong>
	<span>You can click the "Copy" button to the right to put the current {{ resourceName }} your clipboard, then paste it into your "<strong>{{ fileName }}</strong>" file to save.</span>
	<button
		type="button"
		class="close"
		title="Copy"
		@click="copyState"
	>
		<span aria-hidden="true">📋</span>
	</button>
</div>
	`
})
