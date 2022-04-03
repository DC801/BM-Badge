window.store = new window.Vuex.Store({
	state: function () {
		return {
			fileNameMap: null,
			scenarioData: null,
			currentData: null,
		};
	},
	mutations: {
		GENERIC_MUTATOR: function (state, args) {
			state[args.propertyName] = args.value;
		},
		INIT_CURRENT_DATA: function (state) {
			var scenarioData = state.scenarioData;
			state.currentData = {
				scripts: jsonClone(scenarioData.scripts),
				scriptsFileItemMap: jsonClone(scenarioData.scriptsFileItemMap),
			}
			state.initState = JSON.parse(JSON.stringify(state.currentData));
			state.initStateJson = JSON.stringify(state.currentData);
		},
	},
	getters: {
		dialogOptions: function (state) {
			return Object.keys(
				(state.scenarioData || {}).dialogs || {}
			);
		},
		scriptsOptions: function (state) {
			return Object.keys(
				(state.currentData || {}).scripts || {}
			);
		},
		mapsOptions: function (state) {
			return Object.keys(
				(state.scenarioData || {}).maps || {}
			);
		},
		entityTypesOptions: function (state) {
			return Object.keys(
				(state.scenarioData || {}).entityTypes || {}
			)
				.sort(sortCaseInsensitive);
		},
		entityNamesOptions: function (state) {
			return [
				'%SELF%',
				'%PLAYER%',
			]
				.concat(extractNames(state.scenarioData.parsed.entities));
		},
		geometryOptions: function (state) {
			return [
				'%ENTITY_PATH%'
			]
				.concat(extractNames(state.scenarioData.parsed.geometry));
		},
	}
});
