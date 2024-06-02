/*
TODO

ask
---
when a script is missing in mgs, a browser console error shows but no GUI error text
- possibly for lots of other possible errors too
commit e68dfc941a6f276959a064f752262d11c50000ed not needed?
	- https://github.com/DC801/BM-Badge/blame/chapter_2/SD_Card/MAGE/editor/js/editor-scripts.js

warning: orphaned scripts
- restart-wopr example of no binding but other access (goto)

warning: missing room look scripts
	- room looks can be in map or in maps.json (lately maps.json preferred)
	- warn for on_look etc in map definition?

generated fixes
---
use randomness to get past taken names?
flesh out scriptName fix parameter for scriptName store and document its special status
anything needed for script editor once fix script names are generated uniquely? maybe not
consider using store.scriptsOptions for scenarioData script names
consider using existing store mutations for scripts if nothing bad would happen
consider using computed instead of watch for uniqueness
debounce?

blacklisting
---
use maps.json strategy: map-level only control
how to associate a checker function to the appropriate disable flag
- possibleEntityScripts variable?

misc
---
.trim for text inputs?
source of truth IS scripts.js: var possibleEntityScripts = [ 'on_interact', 'on_tick', 'on_look', ];
meta / file info for fix
- paste into `x` file
	- look wherever editor-scripts looks just as a suggestion?
- other?
how will look work for multiple entities of the same or similar names (eg bread, torch)
- NEED TO BIND ALL map entities
- detect many2one?
*/

Vue.component('editor-warning', {
	name: 'editor-warning',
	props: {
		entity: {
			required: true,
			type: Object,
		},
	},
	data: function() {
		return {
			fixParameters: this.entity.fixes ? jsonClone(this.entity.fixes.parameters) : {},
			fixText: [],
			scriptNameTaken: false,
		};
	},
	mounted: function() {
		var vm = this;
		Object.keys(this.fixParameters).forEach(function(parameterName) {
			vm.$watch(
				function() {
					// use a function in case parameterName isn't ok to access with a dot
					return vm.fixParameters[parameterName];
				},
				function(newParameter, oldParameter) {
					vm.reactToFixParameterChanged(
						parameterName,
						newParameter,
						oldParameter
					);
				},
				{
					immediate: true
				});
		});
	},
	methods: {
		reactToFixParameterChanged: function (parameterName, newParameter, oldParameter) {
			// console.group(`XXX param ${parameterName} changed from entity ${this.entity.name} from map ${this.entity.sourceFile}`);

			if (parameterName === 'scriptName') {
				// of all possible keys for this.fixParameters, `scriptName` gets
				// special treatment (involving $store.state.warningsGeneratedScriptNames)

				// console.log(`XXX trying script ${newParameter}`);

				var takenByWarnings = this.$store.state.warningsGeneratedScriptNames;
				var takenByScenarioData = this.$store.getters.scriptsOptions;
				var scriptNameTaken =
					(!newParameter)
					|| takenByScenarioData.includes(newParameter)
					|| takenByWarnings.includes(newParameter);

				if (scriptNameTaken) {
					// console.log(`XXX clashing script ${newParameter}`);

					this.scriptNameTaken = true;
				} else {
					// console.log(`XXX reserving script ${newParameter}`);

					this.scriptNameTaken = false;
					this.$store.commit('RESERVE_WARNING_SCRIPT_NAME', {
						scriptName: newParameter,
					});
				}

				if (oldParameter) {
					// console.log(`XXX freeing script ${oldParameter}`);

					this.$store.commit('FREE_WARNING_SCRIPT_NAME', {
						scriptName: oldParameter,
					});
				} else {
					// console.log('XXX old scriptName was null');
				}
			}

			if (! this.scriptNameTaken) { // save a bit of work if the fix text is going to be hidden
				// console.log('XXX update fixText');

				this.fixText = this.entity.fixes.getFixes(this.fixParameters);
			}

			// console.groupEnd();
		},
	},	
	template: /*html*/`
<div class="editor-warning">
	<div class="alert alert-primary" :class="{'mb-0': ! entity.fixes}" role="alert">{{ entity.warningMessage }}</div>
	<div v-if="entity.fixes">
		<div class="mb-3" v-if="Object.keys(fixParameters).length">
			<span>Override certain aspects of the fixes if you need to:</span>
			<div
				class="input-group my-1"
				v-for="(parameterValue, parameterName) in fixParameters"
			>
				<div class="input-group-prepend">
					<span class="input-group-text">{{parameterName}}</span>
				</div>
				<input
					class="form-control"
					:class="{ 'is-invalid': scriptNameTaken && (parameterName === 'scriptName') }"
					type="text"
					:name="parameterName"
					v-model.trim="fixParameters[parameterName]"
				/>
				<div
					v-if="scriptNameTaken"
					class="invalid-feedback"
				>Script name already taken or empty.</div>
			</div>
		</div>
		<div v-if="! scriptNameTaken">
			<span>Click the button by any of these fixes to copy it:</span>
			<div
				class="my-1"
				v-for="(thisFixText, thisFixIndex) in fixText"
				:key="thisFixIndex"
			>
				<div class="row align-items-center flex-nowrap mx-0">
					<pre class="border border-primary rounded p-2 m-0 w-100">{{thisFixText}}</pre>
					<copy-button
						:text="thisFixText"
						class="ml-1"
						style="width: 2rem;"
					></copy-button>
				</div>
			</div>
		</div>

	</div>
</div>
`});


Vue.component('editor-warnings', {
	name: 'editor-warnings',
	props: {
		scenarioData: {
			type: Object,
			required: true
		}
	},
	computed: {
		warningsSorted: function() {
			// convert warnings data structure to its 2D array equivalent
			// (sorted at each layer, lexically for check names and map names, and by `id` for entities)
			// precomputing this is useful for ordered access and quicker length checks
			var sortByNameInIndexZero = function(a, b) {
				return a[0].localeCompare(b);
			};
			var checksSorted = [];
			Object.entries(this.scenarioData.warnings).forEach(function ([checkName, maps]) {
				var mapsSorted = [];
				Object.entries(maps).forEach(function ([mapName, entities]) {
					entities.sort(function(a, b) {
						return a.id - b.id;
					});
					mapsSorted.push([mapName, entities]);
				});
				mapsSorted.sort(sortByNameInIndexZero);
				checksSorted.push([checkName, mapsSorted]);
			});
			checksSorted.sort(sortByNameInIndexZero);
			return checksSorted;
		},
	},
	template: /*html*/`
<div class="editor-warnings card text-white my-3">
	<div class="card-header bg-primary">Additional reports about the build ({{warningsSorted.length}} checks)</div>
	<div class="card-body p-3">
		<!-- "invisible wrapper" use of <template> because of v-for inside (good practice) -->
		<template v-if="warningsSorted.length">
			<editor-accordion
				v-for="[checkName, maps] in warningsSorted"
				:key="checkName"
				:title="'Problems with &grave;' + checkName + '&grave; (' + maps.length  + ' maps)'"
				:use-v-show="true"
			>
				<editor-accordion
					v-for="[mapName, entities] in maps"
					:key="mapName"
					:title="'Problems in map &grave;' + mapName + '&grave; (' + entities.length  + ' entities)'"
					:use-v-show="true"
				>
					<editor-accordion
						:title="'Entity &grave;' + (entity.name || 'NO NAME') + '&grave; (id ' + entity.id + ')'"
						:use-v-show="true"
						:collapsed-initial="false"
						v-for="entity in entities"
						:key="entity.id"
					>
						<editor-warning
							:entity="entity"
						></editor-warning>
					</editor-accordion>
				</editor-accordion>
			</editor-accordion>
		</template >
		<div v-else>
			<img src="./dependencies/MageDance.gif" />
			<span class="mx-1 align-bottom">No problems found. Damg.</span>
		</div>
	</div>
</div>
`});
