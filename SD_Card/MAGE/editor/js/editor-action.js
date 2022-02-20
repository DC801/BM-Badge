var comparisons = Object.keys(operationMap).slice(4);

var operations = Object.keys(operationMap);

Vue.component(
	'editor-action',
	{
		name: 'editor-action',
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
			requiredPropertyNames: function () {
				return actionFieldsMap[this.actionName]
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
				var newAction = Object.assign(
					{},
					this.action,
					{
						[property]: value
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
			<input
				type="text"
				class="form-control"
				:placeholder="property"
				:value="action[property]"
				:aria-label="property"
				@input="handleInput(property, $event.target.value)"
			>
		</div>
	</div>
</div>
`}
);
