/*
TODO

generated fixes
---
should auto fixes include 'ch2' ever?
reactive overrideable infix (e.g. ch2)?
reactive overrideable script names?
what to do with a no-name entity?
check if name we generate was already used (like above, probably good enough to output to a separate section needing manual fixing)
use fallback entity names that are generated somewhere late in the build process for fixes? (e.g. 'Mage 32')
	- are these only showing up sometimes?
use randomness to get past taken names?
do we care about other types of missing scripts, e.g. look for a room (ch2-PLANNING.md)?

blacklisting
---
maps.json strategy? would be map-level only
how to associate a checker function to the appropriate disable flag

misc
---
ask about ch2-bobsclub.mgs:15 bold not being closed
warn for scripts defined but never bound in a map?
ask about scripts.js: var possibleEntityScripts = [ 'on_interact', 'on_tick', 'on_look', ];
ask about drag and drop game.dat not working on my linux setup
ask re adding final warning counts from CLI to GUI
documentation for API (e.g., return null or a string error message)
how will look work for multiple entities of the same or similar names (eg bread, torch)
move look scripts not in the look scripts file? e.g. see ch2-castle-34.mgs
- (also naming of script look-ch2-castle-34 but it's really for the pantry?)
*/

Vue.component('editor-warnings', {
	name: 'editor-warnings',
	props: {
		warnings: {
			type: Object,
			required: true
		}
	},
	computed: {
		warningsSorted: function() {
			// convert warnings data structure to its 2D array equivalent
			// (sorted lexically by check or map name, or by `id` for entities)
			// precomputing this is useful for ordered access and quicker length checks
			var sortByNameInIndexZero = function(a, b) {
				return a[0].localeCompare(b);
			};
			var checksSorted = [];
			Object.entries(this.warnings).forEach(function ([checkName, maps]) {
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
<div class="editor-warnings card text-white mb-3">
	<div class="card-header bg-primary">Additional reports about the build ({{warningsSorted.length}} checks)</div>
	<div class="card-body py-1">
		<!-- "invisible wrapper" use of <template> because of v-for inside (good practice) -->
		<template v-if="warningsSorted.length">
			<editor-accordion
				v-for="[checkName, maps] in warningsSorted"
				:key="checkName"
				:title="'Problems with &grave;' + checkName + '&grave; (' + maps.length  + ' maps)'"
			>
				<editor-accordion
					v-for="[mapName, entities] in maps"
					:key="mapName"
					:title="'Problems in map &grave;' + mapName + '&grave; (' + entities.length  + ' entities)'"
				>
					<div
						class="warnings-warning card text-white border-secondary my-3"
						v-for="entity in entities"
						:key="entity.id"
					>
						<div class="card-header bg-secondary">Entity &grave;{{entity.name || 'NO NAME'}}&grave; (id {{entity.id}})</div>
						<div class="card-body px-3 pt-3 pb-2">
							<p>{{ entity.warningMessage }}</p>
							<label v-if="entity.fixes.length">Click the button by any of these fixes to copy it.</label>
							<div
								v-for="(fix, fixIndex) in entity.fixes"
								:key="fixIndex"
							>
								<div class="row align-items-center flex-nowrap px-2">
									<pre class="border border-primary rounded p-2 w-100">{{fix.fixText}}</pre>
									<copy-button
										:text="fix.fixText"
										class="ml-1"
										style="width: 2rem;"
									></copy-button>
								</div>
							</div>
						</div>
					</div>
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
