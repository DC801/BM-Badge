Vue.component('editor-dialog-phase', {
	name: 'editor-dialog-phase',
	props: {
		phase: {
			type: Object,
			required: true
		},
	},
	computed: {
		messageIndexOptions: function () {
			return Object.keys(this.phase.messages)
		}
	},
	methods: {
		updateProperty: function (propertyName, value) {
			var result = Object.assign(
				{},
				this.phase,
				{
					[propertyName]: value
				}
			)
			this.$emit('input', result);
		},
		updateMessage: function (index, message) {
			var messages = (this.phase.messages || []).slice();
			messages[index] = message;
			this.updateProperty(
				'messages',
				messages
			);
		},
		addMessage: function () {
			var messages = (this.phase.messages || []).slice();
			messages.push(this.newMessage);
			this.updateProperty(
				'messages',
				messages
			);
		},
		deleteMessage: function (index) {
			var messages = (this.phase.messages || []).slice();
			messages.splice(index, 1);
			this.updateProperty(
				'messages',
				messages
			);
		},
	},
	template: /*html*/`
<div
	class="editor-dialog-phase"
>
	<div
		v-for="(message, index) in phase.messages"
		:key="index"
	>
		<editor-dialog-phase-preview
			:phase="phase"
			:message-index="index"
		></editor-dialog-phase-preview>
		<div class="form-group position-relative">
			<label>Message</label>
			<span
				class="position-absolute"
				style="top: 0; right: 6px;"
			>
				<button
					type="button"
					class="btn btn-outline-info btn-sm"
					@click="deleteMessage(index)"
					title="Delete message"
				>x</button>
			</span>
			<textarea
				class="form-control"
				rows="3"
				:value="message"
				@input="updateMessage(index, $event.target.value)"
			></textarea>
		</div>
	</div>
	<div>
		<button
			class="btn btn-primary"
			@click="addMessage"
		>Add Message</button>
	</div>
	<pre>{{phase}}</pre>
</div>
`});
