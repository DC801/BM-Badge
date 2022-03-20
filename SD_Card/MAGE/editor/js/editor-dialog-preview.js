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

Vue.component('editor-dialog-preview', {
	name: 'editor-dialog-preview',
	props: {
		index: {
			type: Number,
			required: true
		},
		dialog: {
			type: Object,
			required: true
		},
		fileNameMap: {
			type: Object,
			required: true
		},
		scenarioData: {
			type: Object,
			required: true
		},
	},
	computed: {
		tileset: function () {
			return this.scenarioData.dialogSkinsTilesetMap[
				this.dialog.border_tileset || 'default'
			];
		},
		alignmentData: function () {
			var alignment = this.dialog.alignment || 'BOTTOM_LEFT';
			return dialogAlignmentCoords[alignment];
		},
		label: function () {
			var dialog = this.dialog;
			var name = dialog.name;
			var entity = dialog.entity;
			return name || entity;
		},
		text: function () {
			var dialog = this.dialog;
			var messages = dialog.messages;
			// TODO: Animate these swapping out
			return messages[0];
		}
	},
	template: /*html*/`
<div
	class="editor-dialog-preview"
>
	<div
		v-for="(rect, key) in alignmentData"
		:class="key"
	>
		<editor-dialog-box
			:key="key"
			:rect="rect"
			:dialogSkin="dialog.border_tileset"
			:file-name-map="fileNameMap"
			:scenario-data="scenarioData"
		></editor-dialog-box>
		<font-image
			v-if="(
				key === 'text'
				|| key === 'label'
			)"
			:x="((rect.x + 1) * tileset.tilewidth) + (tileset.tilewidth / 2) + 4"
			:y="((rect.y + 1) * tileset.tileheight) + (tileset.tileheight / 2) + 4"
			:string="key === 'label' ? label : text"
		></font-image>
	</div>
</div>
`});
