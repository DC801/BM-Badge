/*
TODO

generated fixes
---
generating script names
- nice indenting to be able to paste into maps
- what to do with a no-name entity?
- check if name we generate was already used (like above, probably good enough to output to a separate section needing manual fixing)
use fallback entity names that are generated somewhere late in the build process for fixes? (e.g. 'Mage 32')
- are these only showing up sometimes?

blacklisting
---
maps.json strategy? would be map-level only
how to associate a checker function to the appropriate disable flag

misc
---
warn for handle scripts defined but never bound in a map?
ask about scripts.js: var possibleEntityScripts = [ 'on_interact', 'on_tick', 'on_look', ];
ask about drag and drop game.dat not working on my linux setup
ask about hiding crc32 messages behind verbose
ask re adding final warning counts from CLI to GUI
documentation for API (e.g., return null or a string error message)
how will look work for multiple entities of the same or similar names (eg bread, torch)
ask Mary for a pattern for "TODO" script definitions
- <m> true names
- newline then space at end?
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
	template: /*html*/`
<div class="editor-warnings card text-white mb-3">
	<div class="card-header bg-primary">Additional reports about the build ({{Object.keys(warnings).length}} checks)</div>
	<div class="card-body py-1">
		<template v-if="Object.keys(warnings).length">
			<!-- "invisible wrapper" use of <template> because of v-for inside (good practice) -->
				<editor-accordion
					v-for="(maps, checkName) in warnings"
					:key="checkName"
					:title="'Problems with \`' + checkName + '\` (' + Object.keys(maps).length  + ' maps)'"
				>
					<editor-accordion
						v-for="(warnings, mapName) in maps"
						:key="mapName"
						:title="'Problems in map \`' + mapName + '\` (' + warnings.length  + ' entities)'"
					>
						<div
							class="warnings-warning card text-white border-secondary my-3"
							v-for="warning in warnings"
							:key="warning.id"
						>
							<div class="card-header bg-secondary">\`{{warning.name || 'NO NAME'}}\` (id {{warning.id}})</div>
							<div class="card-body px-3 pt-3 pb-2">
								<p>{{ warning.warningMessage }}</p>
								<label v-if="warning.fixes.length">Click the button by any of these fixes to copy it.</label>
								<div
									v-for="(fix, fixIndex) in warning.fixes"
									:key="fixIndex"
								>
									<div class="row align-items-center flex-nowrap px-2">
										<pre class="border border-primary rounded p-2 w-100">{{fix}}</pre>
										<copy-button
											:text="fix"
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
