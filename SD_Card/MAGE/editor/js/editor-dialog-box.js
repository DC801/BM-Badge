var DIALOG_TILES_TOP_LEFT = 0;
var DIALOG_TILES_TOP_REPEAT = 1;
var DIALOG_TILES_TOP_RIGHT = 2;
var DIALOG_TILES_LEFT_REPEAT = 4;
var DIALOG_TILES_CENTER_REPEAT = 5;
var DIALOG_TILES_RIGHT_REPEAT = 6;
var DIALOG_TILES_BOTTOM_LEFT = 8;
var DIALOG_TILES_BOTTOM_REPEAT = 9;
var DIALOG_TILES_BOTTOM_RIGHT = 10;

var DIALOG_TILES_SCROLL_END = 3;
var DIALOG_TILES_SCROLL_REPEAT = 7;
var DIALOG_TILES_SCROLL_POSITION = 11;

var DIALOG_TILES_CHECKBOX = 12;
var DIALOG_TILES_CHECK = 13;
var DIALOG_TILES_HIGHLIGHT = 14;
var DIALOG_TILES_ARROW = 15;

var getTileIdFromXY = function (
	x,
	y,
	box
) {
	var tileId = DIALOG_TILES_CENTER_REPEAT;
	var leftEdge = x === 0;
	var rightEdge = x === (box.w - 1);
	var topEdge = y === 0;
	var bottomEdge = y === (box.h - 1);
	if (leftEdge && topEdge) {
		tileId = DIALOG_TILES_TOP_LEFT;
	} else if (rightEdge && topEdge) {
		tileId = DIALOG_TILES_TOP_RIGHT;
	} else if (topEdge) {
		tileId = DIALOG_TILES_TOP_REPEAT;
	} else 	if (leftEdge && bottomEdge) {
		tileId = DIALOG_TILES_BOTTOM_LEFT;
	} else if (rightEdge && bottomEdge) {
		tileId = DIALOG_TILES_BOTTOM_RIGHT;
	} else if (bottomEdge) {
		tileId = DIALOG_TILES_BOTTOM_REPEAT;
	} else if (rightEdge) {
		tileId = DIALOG_TILES_RIGHT_REPEAT;
	} else if (leftEdge) {
		tileId = DIALOG_TILES_LEFT_REPEAT;
	}
	return tileId;
};

Vue.component('editor-dialog-box', {
	name: 'editor-dialog-box',
	props: {
		rect: {
			type: Object,
			required: true
		},
		dialogSkin: {
			type: String,
			default: 'default'
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
			return this.scenarioData.dialogSkinsTilesetMap[this.dialogSkin];
		},
		subrects: function () {
			var n = 16; // actually look this up later
			var offset = n / 2;
			var x = this.rect.x;
			var y = this.rect.y;
			var w = this.rect.w;
			var h = this.rect.h;
			var ty = offset + y * n;
			var by = offset + (y + h - 1) * n;
			var lx = offset + x * n;
			var rx = offset + (x + w - 1) * n;
			var cx = offset + (x + 1) * n;
			var cw = (w - 2) * n;
			var cy = offset + (y + 1) * n;
			var ch = (h - 2) * n;
			return [
				// top left
				{ x: lx, y: ty, w: n, h: n },
				// top
				{ x: cx, y: ty, w: cw, h: n },
				// top right
				{ x: rx, y: ty, w: n, h: n },
				// left
				{ x: lx, y: cy, w: n, h: ch },
				// center
				{ x: cx, y: cy, w: cw, h: ch },
				// right
				{ x: rx, y: cy, w: n, h: ch },
				// bottom left
				{ x: lx, y: by, w: n, h: n },
				// bottom
				{ x: cx, y: by, w: cw, h: n },
				// bottom right
				{ x: rx, y: by, w: n, h: n },
			];
		},
		tiles: function () {
			var result = []
			var box = this.rect;
			var tileset = this.tileset;
			var tileSize = tileset.tilewidth;
			var offset = tileSize / 2;
			var offsetX = (box.x * tileSize) + offset;
			var offsetY = (box.y * tileSize) + offset;
			for (var i = 0; i < box.w; ++i) {
				for (var j = 0; j < box.h; ++j) {
					var x = offsetX + (i * tileSize);
					var y = offsetY + (j * tileSize);
					result.push({
						tileId: getTileIdFromXY(i, j, box),
						styles: {
							position: 'absolute',
							left: x + 'px',
							top: y + 'px',
						},
					});
				}
			}
			return result
		},
	},
	template: /*html*/`
<div
	class="editor-dialog-box"
>
	<tiled-tile
		v-for="(tile, index) in tiles"
		:key="index"
		:tileset="tileset"
		:tileid="tile.tileId"
		:style="tile.styles"
		:hide-border="true"
	></tiled-tile>
</div>
`});
