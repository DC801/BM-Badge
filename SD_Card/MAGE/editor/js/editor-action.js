var comparisons = Object.keys(comparisonMap).slice(5);

var operations = Object.keys(operationMap);

var sanitizeAsString = function (string) {
	return string;
}
var sanitizeAsNumber = function (string) {
	return parseInt(string, 10);
}
var sanitizeAsBool = function (string) {
	return string === 'true'
}
var propertySanitizerMap = {
	duration: sanitizeAsNumber,
	expected_u4: sanitizeAsNumber,
	map: sanitizeAsString,
	entity: sanitizeAsString,
	target_entity: sanitizeAsString,
	entity_type: sanitizeAsString,
	geometry: sanitizeAsString,
	target_geometry: sanitizeAsString,
	script: sanitizeAsString,
	success_script: sanitizeAsString,
	expected_script: sanitizeAsString,
	string: sanitizeAsString,
	save_flag: sanitizeAsString,
	dialog: sanitizeAsString,
	address: sanitizeAsNumber,
	color: sanitizeAsString,
	expected_u2: sanitizeAsNumber,
	u2_value: sanitizeAsNumber,
	amplitude: sanitizeAsNumber,
	bitmask: sanitizeAsNumber,
	button_id: sanitizeAsString,
	byte_offset: sanitizeAsNumber,
	byte_value: sanitizeAsNumber,
	expected_byte: sanitizeAsNumber,
	animation: sanitizeAsNumber,
	play_count: sanitizeAsNumber,
	frequency: sanitizeAsNumber,
	font_id: sanitizeAsNumber,
	slot: sanitizeAsNumber,
	direction: sanitizeAsString,
	relative_direction: sanitizeAsNumber,
	bool_value: sanitizeAsBool,
	expected_bool: sanitizeAsBool,
	value: sanitizeAsNumber,
	variable: sanitizeAsString,
	source: sanitizeAsString,
	field: sanitizeAsString,
	inbound: sanitizeAsBool,
	operation: sanitizeAsString,
	comparison: sanitizeAsString,
	serial_dialog: sanitizeAsString,
	item_name: sanitizeAsString,
	ble_flag: sanitizeAsString,
};



var actionInputMixin = {
	props: {
		property: {
			type: String,
		},
		value: {
			required: true,
		},
		currentData: {
			type: Object,
		},
	},
}
Vue.component('field-text', {
	mixins: [actionInputMixin],
	props: {
		type: {
			type: String,
			default: function () {
				return 'text'
			}
		},
	},
	template: `
<input
	type="text"
	class="form-control"
	:placeholder="property"
	:value="value"
	:aria-label="property"
	@input="$emit('input', $event.target.value)"
/>
	`
});
Vue.component('field-number', {
	mixins: [actionInputMixin],
	template: `
<field-text
	type="number"
	:value="value"
	@input="$emit('input', $event)"
></field-text>
	`
});
Vue.component('field-select', {
	props: {
		options: {
			type: Array,
			required: true,
		},
		value: {
			required: true,
		},
	},
	template: `
<select
	class="form-select"
	id="exampleSelect1"
	:value="value"
	@input="$emit('input', $event.target.value)"
>
	<option
		v-for="option in options"
	>{{option}}</option>
</select>
	`
});
Vue.component('field-bool', {
	mixins: [actionInputMixin],
	operations: operations,
	template: `
<field-select
	:options="['true', 'false']"
	:value="value"
	@input="$emit('input', $event)"
></field-select>
	`
});
Vue.component('action-input-operations', {
	mixins: [actionInputMixin],
	operations: operations,
	template: `
<field-select
	:options="$options.operations"
	:value="value"
	@input="$emit('input', $event)"
></field-select>
	`
});
Vue.component('action-input-comparisons', {
	mixins: [actionInputMixin],
	comparisons: comparisons,
	template: `
<field-select
	:options="$options.comparisons"
	:value="value"
	@input="$emit('input', $event)"
></field-select>
	`
});
Vue.component('action-input-scripts', {
	mixins: [actionInputMixin],
	computed: {
		scripts: function () {
			return Object.keys(
				this.currentData.scripts
			)
		}
	},
	template: `
<field-select
	:options="scripts"
	:value="value"
	@input="$emit('input', $event)"
></field-select>
	`
});

var propertyEditorComponentMap = {
	duration: 'field-number',
	expected_u4: 'field-number',
	address: 'field-number',
	expected_u2: 'field-number',
	u2_value: 'field-number',
	amplitude: 'field-number',
	bitmask: 'field-number',
	byte_offset: 'field-number',
	byte_value: 'field-number',
	expected_byte: 'field-number',
	animation: 'field-number',
	play_count: 'field-number',
	frequency: 'field-number',
	font_id: 'field-number',
	slot: 'field-number',
	relative_direction: 'field-number',
	value: 'field-number',
	script: 'action-input-scripts',
	success_script: 'action-input-scripts',
	expected_script: 'action-input-scripts',
	comparison: 'action-input-comparisons',
	operation: 'action-input-operations',
	bool_value: 'field-bool',
	expected_bool: 'field-bool',
	inbound: 'field-bool',
};

Vue.component(
	'editor-action',
	{
		name: 'editor-action',
		propertyEditorComponentMap,
		props: {
			script: {
				type: Array,
				required: true
			},
			action: {
				type: Object,
				required: true
			},
			index: {
				type: Number,
				required: true
			},
			currentData: {
				type: Object,
				required: true,
			},
		},
		data: function () {
			return {
				collapsed: false,
			}
		},
		computed: {
			actionName: function () {
				return this.action.action
			},
			requiredProperties: function () {
				return actionFieldsMap[this.actionName];
			},
			requiredPropertyNames: function () {
				return this.requiredProperties
					.map(function (property) {
						return property.propertyName;
					});
			},
			foundPropertyNames: function () {
				var foundProperties = Object.keys(this.action)
					.filter(function (key) {
						return key !== 'action';
					});
				return foundProperties;
			},
		},
		methods: {
			collapseAction: function () {
				this.collapsed = !this.collapsed;
			},
			deleteAction: function () {
				// TODO
			},
			handleInput: function (property, value) {
				var sanitizer = (
					propertySanitizerMap[property]
					|| sanitizeAsString // so you can edit extra field like 'doc'
				);
				var sanitisedValue = sanitizer(value);
				var newAction = Object.assign(
					{},
					this.action,
					{
						[property]: sanitisedValue
					}
				)
				this.$emit('input', newAction);
			},
		},
		template: /*html*/`
<div
	class="action-editor mb-3 mt-1 card border-secondary"
>
	<div class="card-header bg-secondary p-2">
		<button
			type="button"
			class="btn btn-sm mr-1 btn-outline-danger"
			@click="$emit('deleteAction')"
		>X</button>
		<component-icon
			color="white"
			:size="16"
			:subject="actionName"
		></component-icon>
		<span>{{actionName}}</span>
		<span
			class="position-absolute"
			style="top:3px; right:3px;"
		>
			<button
				type="button"
				class="btn btn-sm btn-outline-light"
				@click="collapseAction"
			>_</button>
			<button
				type="button"
				class="btn btn-sm btn-outline-light"
				:disabled="index === 0"
				@click="$emit('moveAction', -1)"
			>↑</button>
			<button
				type="button"
				class="btn btn-sm btn-outline-light"
				:disabled="index === script.length - 1"
				@click="$emit('moveAction', 1)"
			>↓</button>
		</span>
	</div>
	<div
		class="card-body p-0"
		v-show="!collapsed"
	>
		<ul class="list-group list-group-flush">
			<li
				class="list-group-item p-2"
				v-for="property in foundPropertyNames"
			>{{property}}: {{action[property]}}</li>
		</ul>
		<div
			class="input-group mb-3"
			v-for="property in foundPropertyNames"
		>
			<div class="input-group-prepend">
				<span class="input-group-text">{{property}}</span>
			</div>
			<component
				:is="$options.propertyEditorComponentMap[property] || 'field-text'"
				:property="property"
				:value="action[property]"
				:current-data="currentData"
				@input="handleInput(property, $event)"
			></component>
		</div>
	</div>
</div>
`}
);
