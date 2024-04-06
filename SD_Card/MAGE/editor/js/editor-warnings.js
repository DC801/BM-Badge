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
	data: function () {
		return {
			collapsed: true
		}
	},
	methods: {
		collapse: function () {
			this.collapsed = !this.collapsed;
		},
		copyFixes: function () {
			this.$refs.copyFixesTextArea.select();
			document.execCommand('copy');
		}
	},
	template: /*html*/`
<editor-accordion
	:title="'Additional reports about the build (' + Object.keys(warnings).length + ' checks)'"
>
	<template v-if="Object.keys(warnings).length">
	<!-- "invisible wrapper" use of <template> because of v-for inside (good practice) -->
		<editor-accordion
			v-for="(maps, checkName) in warnings"
			:key="checkName"
			:title="'Problems with ' + checkName + ' (' + Object.keys(maps).length  + ' maps)'"
		>
			<editor-accordion
				v-for="(warnings, mapName) in maps"
				:key="mapName"
				:title="'Problems in map ' + mapName + ' (' + warnings.length  + ' entities)'"
			>
				<editor-accordion
					v-for="warning in warnings"
					:key="warning.id"
					:title="(warning.name || 'NO NAME') + ' (id ' + warning.id + ')'"
				>
					<p>{{ warning.warningMessage }}</p>
					<p v-if="warning.fixes.length">You can click the button to the right of any of these fixes to copy it.</p>
					<template v-for="(fix, fixIndex) in warning.fixes">
						<div
							class="row align-items-start flex-nowrap px-2"
							:key="fixIndex"
						>
							<pre class="border border-primary rounded p-2 w-100">{{fix}}</pre>
							<button type="button" class="ml-1" style="width: 2rem;" title="Copy" @click="copyFixes">
								<span aria-hidden="true">📋</span>
							</button>
						</div>
						<textarea
							cols="80"
							rows="16"
							class="position-absolute"
							style="font-size: 0; opacity: 0;"
							ref="copyFixesTextArea"
						>{{fix}}</textarea>
					</template>
				</editor-accordion>
			</editor-accordion>
		</editor-accordion>
	</template >
	<div v-else>
		<img src="./dependencies/MageDance.gif" />
		<span class="mx-1 align-bottom">No problems found. Damg.</span>
	</div>
</editor-accordion>
`});
