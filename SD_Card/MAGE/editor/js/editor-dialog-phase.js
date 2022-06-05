Vue.component('editor-dialog-phase', {
	name: 'editor-dialog-phase',
	alignmentOptions: Object.keys(dialogAlignmentEnum),
	props: {
		phaseIndex: {
			type: Number,
			required: true
		},
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
			if (value === null) {
				delete result[propertyName]
			}
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
	class="editor-dialog-phase card body-dark mb-3"
>
	<div
		class="card-header"
	>
		<span>Phase: {{ phaseIndex }}</span>
		<span
			class="position-absolute"
			style="top:6px; right:6px;"
		>
			<button
				type="button"
				class="btn btn-outline-danger"
				@click="$emit('delete')"
			>x</button>
		</span>
	</div>
	<div
		class="card-body"
	>
		<div
			class="input-group"
		>
			<div class="input-group-prepend">
				<span class="input-group-text">Border Tileset</span>
			</div>
			<field-select
				property="border_tileset"
				:options="$store.getters.borderTilesetOptions"
				:value="phase.border_tileset"
				@input="updateProperty('border_tileset', $event || null)"
			></field-select>
		</div>
		<div
			class="input-group"
		>
			<div class="input-group-prepend">
				<span class="input-group-text">Alignment</span>
			</div>
			<field-select
				property="alignment"
				:options="$options.alignmentOptions"
				:value="phase.alignment"
				@input="updateProperty('alignment', $event || null)"
			></field-select>
		</div>
		<div
			class="input-group"
		>
			<div class="input-group-prepend">
				<span class="input-group-text">Entity</span>
			</div>
			<field-text
				property="entity"
				:value="phase.entity"
				@input="updateProperty('entity', $event || null)"
			></field-text>
		</div>
		<div
			class="input-group"
		>
			<div class="input-group-prepend">
				<span class="input-group-text">Portrait</span>
			</div>
			<field-text
				property="portrait"
				:value="phase.portrait"
				@input="updateProperty('portrait', $event || null)"
			></field-text>
		</div>
		<div
			class="input-group"
		>
			<div class="input-group-prepend">
				<span class="input-group-text">Name</span>
			</div>
			<field-text
				property="name"
				:value="phase.name"
				@input="updateProperty('name', $event || null)"
			></field-text>
		</div>
		<div
			v-for="(message, index) in phase.messages"
			:key="index"
			class="position-relative"
		>
			<editor-dialog-phase-preview
				:phase="phase"
				:message-index="index"
			></editor-dialog-phase-preview>
			<div
				class="position-absolute"
				style="
					top: 0;
					left: 320px;
					right: 0;
				"
			>
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
						rows="5"
						:value="message"
						@input="updateMessage(index, $event.target.value)"
					></textarea>
				</div>
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
</div>
`});
