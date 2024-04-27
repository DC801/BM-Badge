/*
TODO

source of truth IS scripts.js: var possibleEntityScripts = [ 'on_interact', 'on_tick', 'on_look', ];

ask: commit e68dfc941a6f276959a064f752262d11c50000ed not needed?
- https://github.com/DC801/BM-Badge/blame/chapter_2/SD_Card/MAGE/editor/js/editor-scripts.js

meta / file info for fix
- paste into `x` file
- other?

how will look work for multiple entities of the same or similar names (eg bread, torch)
- NEED TO BIND ALL map entities
- detect many2one?

two more warning types
---
orphaned scripts
missing room look scripts
	- room looks can be in map or in maps.json (lately maps.json preferred)
	- warn for on_look etc in map definition?

ask: warning type for duplicate files anywhere across scenario_source_files?

has-danger removed from bootstrap: in other files

remove encoder capabilities?
---
looking for scripts in top-level `properties` of a map file?
reading string-value maps in maps.json (value implicitly `path`)?

generated fixes
---
check if name we generate was already used (like above, probably good enough to output to a separate section needing manual fixing)
use randomness to get past taken names?
flesh out scriptName fix parameter for scriptName store and document its special status
anything needed for script editor once fix script names are generated uniquely? maybe not
consider using store.scriptsOptions for scenarioData script names
consider using existing store operations for scripts if nothing bad would happen
consider using watch instead of reactivity for uniqueness
debounce?

blacklisting
---
use maps.json strategy: map-level only control
how to associate a checker function to the appropriate disable flag
- possibleEntityScripts variable?
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
			fixParameters: this.entity.fixes ? this.entity.fixes.parameters : {},
			fixText: [],
			oldScriptName: null,
			isScriptNameUnique: true,
		};
	},
	watch: {
		fixParameters: {
			handler: function (newFixParameters) {
				// TODO need to not run the scriptName stuff when a standard param changes

				var newScriptName = newFixParameters.scriptName;
				if (newScriptName !== undefined) {
					// of all possible keys for this.fixParameters, `scriptName` gets
					// special treatment (involving $store.state.warningsGeneratedScriptNames)

					console.group(`XXX trying script ${newScriptName} from entity ${this.entity.name} from map ${this.entity.sourceFile}`);

					var takenByWarnings = this.$store.state.warningsGeneratedScriptNames;
					var takenByScenarioData = this.$store.getters.scriptsOptions;
					var scriptNameTaken =
						(! newScriptName)
						|| takenByScenarioData.includes(newScriptName)
						|| takenByWarnings.includes(newScriptName);

					if (scriptNameTaken) {
						console.log(`XXX clashing script ${newScriptName}`);

						this.isScriptNameUnique = false;
					} else {
						console.log(`XXX reserving script ${newScriptName}`);

						this.isScriptNameUnique = true;
						this.$store.commit('RESERVE_WARNING_SCRIPT_NAME', {
							scriptName: newScriptName,
						});
					}

					var oldScriptName = this.oldScriptName;
					if (oldScriptName) {
						console.log(`XXX freeing script ${oldScriptName}`);
						
						this.$store.commit('FREE_WARNING_SCRIPT_NAME', {
							scriptName: oldScriptName,
						});
					} else {
						console.log('XXX oldScriptName was null');
					}

					console.log(`XXX stash old ${newScriptName}`);
					this.oldScriptName = newScriptName;

					console.groupEnd();
				}

				this.fixText = this.entity.fixes.getFixes(newFixParameters);
			},
			deep: true,
			immediate: true,
		}
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
					:class="{ 'is-invalid': (! isScriptNameUnique) && (parameterName === 'scriptName') }"
					type="text"
					:name="parameterName"
					v-model.trim="fixParameters[parameterName]"
				/>
			</div>
		</div>
		<div v-if="isScriptNameUnique">
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
		<div 
			v-else	
			class="alert alert-danger"
			role="alert">
		Script name already taken or empty.</div>
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
