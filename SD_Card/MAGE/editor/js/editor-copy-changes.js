window.Vue.component('copy-button', {
	name: 'copy-button',
	props: {
		text: {
			required: true,
			type: String,
		},
	},
	methods: {
		copyState: function () {
			this.$refs.copyStateTextArea.select();
			document.execCommand("copy");
		},
	},
	template: /*html*/`
<span class="copy-button">
	<button
		type="button"
		class="close"
		title="Copy"
		@click="copyState"
	>
		<span aria-hidden="true">📋</span>
	</button >
	<textarea
		cols="80"
		rows="16"
		class="position-absolute"
		style="
			font-size: 0;
			opacity: 0;
		"
		:value="text"
		ref="copyStateTextArea"
		name="iminvisible"
	></textarea>
</span>
`});

window.Vue.component('copy-changes', {
	name: 'copy-changes',
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
	template: /*html*/`
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
	<strong>Unsaved changes in <em>{{ fileName }}</em>!</strong>
	<span>You can click the "Copy" button to the right to put the current {{ resourceName }} your clipboard, then paste it into your "<strong>{{ fileName }}</strong>" file to save.</span>
	<copy-button :text="changes"></copy-button>
</div>
`});
