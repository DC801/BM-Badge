Vue.component(
	'editor-action',
	{
		name: 'editor-action',
		props: {
			fileNameMap: {
				type: Object,
				required: true
			},
			scriptName: {
				type: String,
				required: true
			},
			action: {
				type: Object,
				required: true
			}
		},
		data: function () {
			return {}
		},
		computed: {
			actionName: function () {
				return this.action.action
			},
			requiredPropertyNames: function () {
				var requiredProperties = [];
				var actionDefinition = actionFieldsMap[this.actionName];
				actionDefinition.forEach(function (property) {
					requiredProperties.push(property.propertyName)
				});
				return requiredProperties;
			},
			foundPropertyNames: function () {
				var foundProperties = [];
				console.log(this.action);
				Object.keys(this.action)
					.filter(function (key) {
						return key !== 'action';
					})
					.forEach(function (propertyName) {
					foundProperties.push(propertyName);
				});
				return foundProperties;
			},
		},
		methods: {},
		template: /*html*/`
<div
	class="action-editor mb-2 mt-1 card border-secondary"
>
	<div class="card-header bg-secondary p-2">{{actionName}}</div>
		<ul class="list-group list-group-flush">
			<li
				class="list-group-item p-2"
				v-for="property in foundPropertyNames"
			>{{property}}</li>
		</ul>
	</div>
</div>
`}
);
