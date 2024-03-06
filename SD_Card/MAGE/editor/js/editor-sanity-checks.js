/*
TODO

misc
---
problem counts for GUI and CLI
- final print-out info in GUI?
CLI print-out
txt download next to copy button
separate js files for components instead of one?
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
use fallback entity names that are generated somewhere late in the build process for fixes? (saw them as something like entity-5)

definitions checking
---
check for script definitions in JSON files as well as MGS files (there are a couple)
*/








Vue.component('editor-sanity-check-problem', {
	name: 'editor-sanity-check-problem',
	props: {
		problem: {
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
			console.log('XXX', 'collapse one problem');
		},
		copyFixes: function () {
			this.$refs.copyFixesText.select();
			document.execCommand('copy');
		},
		downloadFixes: function() {
			// TODO
		}
	},
/*
TODO copy button

<div class="
	alert
	alert-dismissible
	show
"
role="alert"
>
	<span>You can click the "Copy" button to the right to copy these suggested fixes.</span>
	<button
		type="button"
		class="close"
		title="Copy"
		@click="copyFixes"
	>
		<span aria-hidden="true">📋</span>
	</button>
</div>
<textarea
	ref="copyFixesText"
></textarea>
*/
	template: /*html*/`
<div
	class="card"
>
	<div class="card-header bg-primary">
		hi TODO
		<span
			class="position-absolute"
			style="top:6px; right:6px;"
		>
			<button
				type="button"
				class="btn btn-outline-info"
				@click="collapse"
			>_</button>
		</span>
	</div>
	<div class="card-body p-3">
		{{problem.name || "NO NAME"}} (id {{problem.id}}) needs {{problem.problemMessage}}
	</div>
</div>
`});






Vue.component('editor-sanity-check', {
	name: 'editor-sanity-check',
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
			console.log('XXX', 'collapse one check');
		}
	},
	template: /*html*/`
<div
	class="card"
>
	<div class="card-header bg-primary">
		Problems with {{checkName}}
		<span
			class="position-absolute"
			style="top:6px; right:6px;"
		>
			<button
				type="button"
				class="btn btn-outline-info"
				@click="collapse"
			>_</button>
		</span>
	</div>
	<div class="card-body p-3">
		<div
			class="card"
			v-for="(mapProblems, mapName) in maps"
			:key="mapName"		
		>
			<div class="card-header bg-primary">
				Problems in map {{mapName}}
			</div>
			<div class="card-body">
				<ul>
					<editor-sanity-check-problem
						v-for="problem in mapProblems"
						:key="problem.id"
						:problem="problem"
					></editor-sanity-check-problem>
				</ul>
			</div>
		</div>
	</div>
</div>
`});







Vue.component('editor-sanity-checks', {
	name: 'editor-sanity-checks',
	props: {
		problems: {
			type: Object,
			required: true
		}
	},
	data: function () {
		return {
			collapsed: false, // TODO change
		}
	},
	methods: {
		collapse: function () {
			this.collapsed = !this.collapsed;
			console.log('XXX', 'collapse the checks overall');
		}
	},
	template: /*html*/`
<div
	class="card text-white mb-3"
>
	<div class="card-header">
		Additional reports about the build
		<span
			class="position-absolute"
			style="top:6px; right:6px;"
		>
			<button
				type="button"
				class="btn btn-outline-info"
				@click="collapse"
			>_</button>
		</span>
	</div>
	<div
		class="card-body"
		v-if="!collapsed"
	>
		<editor-sanity-check
			v-for="(checkProblems, checkName) in problems"
			:key="checkName"
			:check-name="checkName"
			:maps="checkProblems"></editor-sanity-check>
	</div>
</div>`});