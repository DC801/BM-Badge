/*
TODO

Vue cleanup
---
one accordion component
slots / pass children for innermost's content
- change other uses of accordion to my accordion?

blacklisting
---
maps.json strategy? would be map-level only

CLI print-out
---
--verbose arg?

definitions checking
---
implement for JS
check for script definitions in JSON files as well as MGS files (there are a couple)

misc
---
documentation for API (e.g., return null or a string error message)
ask about scripts.js: var possibleEntityScripts = [ 'on_interact', 'on_tick', 'on_look', ];
ask about populating warningChecks onto scenarioData even possibly causing any issues
- game not running (says engine v11, dat v10, could just be not syncing my fork)
- drag and drop not working on my linux setup (minor)
presentation design
- original design: a report like the python output that would be useful to download
	- fixes separate from warnings
- new design: Vue component for each warnings
	- fixes presented next to warnings
warning counts for GUI and CLI
- final print-out info in GUI?
txt download next to copy button? (ask)
how will look work for multiple entities of the same or similar names (eg bread, torch)
gameengine prettier mage_command_control.cpp:185
- commandResponseBuffer += "\"" + subject + "\" is not a valid entity name.\n";
ask Mary for a pattern for "TODO" script definitions
- <m> true names
- newline then space at end?
move look scripts not in the look scripts file? e.g. see ch2-castle-34.mgs
- (also naming of script look-ch2-castle-34 but it's really for the pantry?)
use a predicate function for blacklisted_files? e.g. positive string match 'ch2'

generated fixes
---
generating script names
- nice indenting to be able to paste into maps
- what to do with a no-name entity?
- check if name we generate was already used (like above, probably good enough to output to a separate section needing manual fixing)
use fallback entity names that are generated somewhere late in the build process for fixes? (e.g. 'Mage 32')
- are these only showing up sometimes? 
*/







Vue.component('editor-warning-check-warning', {
	name: 'editor-warning-check-warning',
	props: {
		warning: {
			type: Object,
			required: true
		},
		fix: {
			type: String,
			required: false,
			default: '{\n    json: {\n        morejson: {\n            \'TODO generated fixes\'\n        }\n    }\n}'
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
<div class="card mb-1 text-white">
	<div class="card-header bg-primary">
		{{ warning.name || "NO NAME" }} (id {{ warning.id }})
		<span
			class="position-absolute"
			style="top: 6px; right: 6px;"
		>
			<button
				type="button"
				class="btn btn-outline-info"
				@click="collapse"
			>_</button>
		</span>
	</div>
	<div
		class="card-body p-3"
		v-if="!collapsed"
	>
		<p>{{ warning.warningMessage }}</p>
		
	
	


		<div
			class="alert alert-info"
			role="alert"
		>
			<span>You can click the "Copy" button to the right to put the current TODO dynamic your clipboard, then paste it into your "<strong>TODO dynamic</strong>" file to save.</span>
		</div>

		<p>You can click the button to the right to copy these suggested fixes.</p>
		<div class="row align-items-start flex-nowrap">
			<pre class="border border-primary rounded p-2 w-100">{{ fix }}</pre>
			<button
				type="button"
				class="ml-1"
				style="width: 2rem;"
				title="Copy"
				@click="copyFixes"
			>
				<span aria-hidden="true">📋</span>
			</button>
		</div>

		<textarea
			cols="80"
			rows="16"
			class="position-absolute"
			style="
				font-size: 0;
				opacity: 0;
			"
			ref="copyFixesTextArea"
		>{{ fix }}</textarea>
	</div>
</div>
`});












Vue.component('editor-warning-check-map', {
	name: 'editor-warning-check-map',
	props: {
		mapName: {
			type: String,
			required: true
		},
		warnings: {
			type: Array,
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
		}
	},
	template: /*html*/`
<div class="card mb-1 text-white">
	<div class="card-header bg-primary">
		Problems in map '{{ mapName }}' ({{ warnings.length }} entities)
		<span
			class="position-absolute"
			style="top: 6px; right: 6px;"
		>
			<button
				type="button"
				class="btn btn-outline-info"
				@click="collapse"
			>_</button>
		</span>
	</div>
	<div
		class="card-body p-3"
		v-if="!collapsed"
	>
		<editor-warning-check-warning
			v-for="warning in warnings"
			:key="warning.id"
			:warning="warning"
		></editor-warning-check-warning>
	</div>
</div>
`});








Vue.component('editor-warning-check', {
	name: 'editor-warning-check',
	props: {
		checkName: {
			type: String,
			required: true
		},
		maps: {
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
		}
	},
	template: /*html*/`
<div class="card mb-1 text-white">
	<div class="card-header bg-primary">
		Problems with '{{ checkName }}' ({{ Object.keys(maps).length }} maps)
		<span
			class="position-absolute"
			style="top: 6px; right: 6px;"
		>
			<button
				type="button"
				class="btn btn-outline-info"
				@click="collapse"
			>_</button>
		</span>
	</div>
	<div
		class="card-body p-3"
		v-if="!collapsed"
	>
		<editor-warning-check-map
			v-for="(warnings, mapName) in maps"
			:key="mapName"
			:map-name="mapName"
			:warnings="warnings"
		></editor-warning-check-map>
	</div>
</div>
`});








Vue.component('editor-warning-checks', {
	name: 'editor-warning-checks',
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
		}
	},
	template: /*html*/`
<div class="card mb-3 text-white">
	<div class="card-header">
		Additional reports about the build
		<span
			class="position-absolute"
			style="top: 6px; right: 6px;"
		>
			<button
				type="button"
				class="btn btn-outline-light"
				@click="collapse"
			>_</button>
		</span>
	</div>
	<div
		class="card-body p-3"
		v-if="!collapsed"
	>
		<template v-if="Object.keys(warnings).length">
			<editor-warning-check
				v-for="(maps, checkName) in warnings"
				:key="checkName"
				:check-name="checkName"
				:maps="maps"
			></editor-warning-check>
		</template>
		<div v-else>
			<img src="./dependencies/MageDance.gif"/>
			<span class="mx-1 align-bottom">No problems found. Damg.</span>
		</div>
	</div>
</div>`});
