window.store = new window.Vuex.Store({
	state: function () {
		return {
			fileNameMap: null,
			scenarioData: null,
			currentData: null,
			initState: null,
		};
	},
	mutations: {
		GENERIC_MUTATOR: function (state, args) {
			state[args.propertyName] = args.value;
		},
		INIT_CURRENT_DATA: function (state) {
			var scenarioData = state.scenarioData;
			state.currentData = {
				dialogs: jsonClone(state.scenarioData.dialogs),
				dialogsFileItemMap: jsonClone(state.scenarioData.dialogsFileItemMap),
				scripts: jsonClone(scenarioData.scripts),
				scriptsFileItemMap: jsonClone(scenarioData.scriptsFileItemMap),
			};
			state.initState = jsonClone(state.currentData);
		},
		UPDATE_SCRIPT_BY_NAME: function (state, args) {
			state.currentData.scripts[args.scriptName] = args.script;
		},
		MOVE_DIALOG: function (state, args) {
			var direction = args.direction;
			var fileName = args.fileName;
			var index = args.index;
			var dialogs = state.currentData.dialogsFileItemMap[fileName].slice();
			var targetIndex = index + direction;
			var splice = dialogs.splice(index, 1);
			dialogs.splice(targetIndex, 0, splice[0]);
			state.currentData.dialogsFileItemMap[fileName] = dialogs;
		},
		ADD_DIALOG_PHASE: function (state, dialogName) {
			var dialog = state.currentData.dialogs[dialogName].slice();
			dialog.push({
				alignment: 'BOTTOM_LEFT',
				messages: [],
			})
			state.currentData.dialogs[dialogName] = dialog;
		},
		UPDATE_DIALOG_PHASE: function (state, args) {
			var dialogName = args.dialogName;
			var phaseIndex = args.phaseIndex;
			var phase = args.phase;
			var dialog = state.currentData.dialogs[dialogName].slice();
			dialog[phaseIndex] = phase
			state.currentData.dialogs[dialogName] = dialog;
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
