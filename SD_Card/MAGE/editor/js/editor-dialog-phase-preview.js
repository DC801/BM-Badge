var dialogAlignmentCoords = {
	BOTTOM_LEFT: {
		text: { x: 0, y: 8, w: 19, h: 6 },
		label: { x: 0, y: 6, w: 7, h: 3 },
		portrait: { x: 0, y: 1, w: 6, h: 6 }
	},
	BOTTOM_RIGHT: {
		text: { x: 0, y: 8, w: 19, h: 6 },
		label: { x: 12, y: 6, w: 7, h: 3 },
		portrait: { x: 13, y: 1, w: 6, h: 6 }
	},
	TOP_LEFT: {
		text: { x: 0, y: 0, w: 19, h: 6 },
		label: { x: 0, y: 5, w: 7, h: 3 },
		portrait: { x: 0, y: 7, w: 6, h: 6 }
	},
	TOP_RIGHT: {
		text: { x: 0, y: 0, w: 19, h: 6 },
		label: { x: 12, y: 5, w: 7, h: 3 },
		portrait: { x: 13, y: 7, w: 6, h: 6 }
	}
};

Vue.component('editor-dialog-phase-preview', {
	name: 'editor-dialog-phase-preview',
	props: {
		phase: {
			type: Object,
			required: true
		},
		messageIndex: {
			type: Number,
			required: true
		},
	},
	computed: {
		tileset: function () {
			return this.scenarioData.dialogSkinsTilesetMap[
				this.phase.border_tileset || 'default'
			];
		},
		alignmentData: function () {
			var alignment = this.phase.alignment || 'BOTTOM_LEFT';
			return dialogAlignmentCoords[alignment];
		},
		label: function () {
			var phase = this.phase;
			var name = phase.name;
			var entity = phase.entity;
			return name || entity;
		},
		text: function () {
			var phase = this.phase;
			var messages = phase.messages;
			var result = messages[this.messageIndex];
			if (
				phase.response_type
				&& (this.messageIndex === (messages.length - 1))
			) {
				phase.options.forEach(function (option) {
					result += '\n   ' + option.label;
				});
			}
			return result;
		},
		fileNameMap: function () {
			return this.$store.state.fileNameMap
		},
		scenarioData: function () {
			return this.$store.state.scenarioData
		},
		portrait: function () {
			return this.phase.portrait || this.phase.entity
		},
		textValuesMap: function () {
			return {
				text: this.text,
				label: this.label,
				portrait: this.portrait,
			}
		}
	},
	template: /*html*/`
<div
	class="editor-dialog-phase-preview"
>
	<div
		v-for="(rect, key) in alignmentData"
		:class="key"
		:key="key"
	>
		<editor-dialog-box
			v-if="textValuesMap[key]"
			:rect="rect"
			:dialog-skin="phase.border_tileset"
			:file-name-map="fileNameMap"
			:scenario-data="scenarioData"
		></editor-dialog-box>
		<font-image
			v-if="textValuesMap[key]"
			:x="((rect.x + 1) * tileset.tilewidth) + (tileset.tilewidth / 2) + 4"
			:y="((rect.y + 1) * tileset.tileheight) + (tileset.tileheight / 2) + 4"
			:string="textValuesMap[key]"
		></font-image>
	</div>
</div>
`});
