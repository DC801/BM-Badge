Vue.component('editor-accordion', {
	props: {
		title: {
			type: String,
			required: false,
			default: '',
		},
		collapsedInitial: {
			type: Boolean,
			required: false,
			default: true,
		},
		useVShow: {
			// if you want to always render the slots contents invisibly instead of using v-if
			type: Boolean,
			required: false,
			default: false,
		},
	},
	name: 'editor-accordion',
	data: function () {
		return {
			collapsed: this.collapsedInitial,
		};
	},
	methods: {
		collapse: function () {
			this.collapsed = !this.collapsed;
		},
	},
	template: /*html*/`
<div class="editor-accordion card border-secondary text-white mb-2">
	<div class="card-header bg-secondary pr-5">
		<span v-html="title"></span>
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
	<template v-if="useVShow">
		<div
			class="card-body px-3 pt-3 pb-2"
			v-show="!collapsed"
		>
			<slot></slot>
		</div>
	</template>
	<template v-else>
		<div
			class="card-body px-3 pt-3 pb-2"
			v-if="!collapsed"
		>
			<slot></slot>
		</div>
	</template>
</div>
`});
 