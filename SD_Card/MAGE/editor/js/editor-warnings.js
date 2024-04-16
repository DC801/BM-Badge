/*
TODO

source of truth IS scripts.js: var possibleEntityScripts = [ 'on_interact', 'on_tick', 'on_look', ];

how will look work for multiple entities of the same or similar names (eg bread, torch)
- NEED TO BIND ALL map entities
- detect many2one?

two more warning types
---
orphaned scripts
missing room look scripts
	- room looks can be in map or in maps.json (lately maps.json preferred)
	- warn for on_look etc in map definition?

remove encoder capabilities?
---
looking for scripts in top-level `properties` of a map file?
reading string-value maps in maps.json (value implicitly `path`)?

generated fixes
---
check if name we generate was already used (like above, probably good enough to output to a separate section needing manual fixing)
use randomness to get past taken names?

blacklisting
---
use maps.json strategy: map-level only control
how to associate a checker function to the appropriate disable flag
- possibleEntityScripts variable?

misc
---
don't let card headers run into buttons
- change other components with card headers as well?
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
			fixesParameters: this.entity.fixes ? this.entity.fixes.parameters : {},
		};
	},
	computed: {
		fixesText: function () {
			return this.entity.fixes ? this.entity.fixes.getFixes(this.fixesParameters) : [];
		},
	},
	template: /*html*/`
<div class="editor-warning">
	<div class="alert alert-primary" role="alert">{{ entity.warningMessage }}</div>
	<div v-if="entity.fixes">
		<div class="mb-3" v-if="Object.keys(fixesParameters).length">
			<span>Override certain aspects of the fixes if you need to:</span>
			<div
				class="input-group my-1"
				v-for="(parameterValue, parameterName) in fixesParameters"
			>
				<div class="input-group-prepend">
					<span class="input-group-text">{{parameterName}}</span>
				</div>
				<input
					class="form-control"
					type="text"
					v-model="fixesParameters[parameterName]"
				/>
			</div>
		</div>
		<div>
			<span>Click the button by any of these fixes to copy it:</span>
			<div
				class="my-1"
				v-for="(fixText, fixIndex) in fixesText"
				:key="fixIndex"
			>
				<div class="row align-items-center flex-nowrap mx-0">
					<pre class="border border-primary rounded p-2 m-0 w-100">{{fixText}}</pre>
					<copy-button
						:text="fixText"
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
	data: function() {
		return {
			scriptNamesFromFixes: new Set(),
		};
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
		scriptNamesFromScenarioData: function() {
			return new Set(Object.keys(this.scenarioData.scripts));
		},
	},
	methods: {
		scriptNameIsTaken(scriptName) {
			return this.scriptNamesFromScenarioData.has(scriptName) || this.scriptNamesFromFixes.has(scriptName);
		}
	},
	template: /*html*/`
<div class="editor-warnings card text-white mb-3">
	<div class="card-header bg-primary">Additional reports about the build ({{warningsSorted.length}} checks)</div>
	<div class="card-body py-1">
		<!-- "invisible wrapper" use of <template> because of v-for inside (good practice) -->
		<template v-if="warningsSorted.length">
			<editor-accordion
				v-for="[checkName, maps] in warningsSorted"
				:key="checkName"
				:title="'Problems with &grave;' + checkName + '&grave; (' + maps.length  + ' maps)'"
				:useVShow="true"
			>
				<editor-accordion
					v-for="[mapName, entities] in maps"
					:key="mapName"
					:title="'Problems in map &grave;' + mapName + '&grave; (' + entities.length  + ' entities)'"
					:useVShow="true"
				>
					<editor-accordion
						:title="'Entity &grave;' + (entity.name || 'NO NAME') + '&grave; (id ' + entity.id + ')'"
						:useVShow="true"
						:collapsedInitial="false"
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
