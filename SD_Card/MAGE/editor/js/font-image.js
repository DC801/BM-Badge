var imageCharWidth = 6;
var imageCharHeight = 12;
var imageCharsPerRow = 32;
var getCharBGCoords = function (charCode) {
	var index = charCode - 32;
	var x = (index % imageCharsPerRow) * imageCharWidth;
	var y = Math.floor(index / imageCharsPerRow) * imageCharHeight;
	return -x + 'px ' + -y + 'px';
};
Vue.component('font-image', {
	props: {
		x: {
			type: Number,
			required: true,
		},
		y: {
			type: Number,
			required: true,
		},
		string: {
			type: String,
			required: true,
		},
	},
	computed: {
		chars: function () {
			var string = this.string;
			var x = 0;
			var y = 0;
			var result = [];
			string.split('').forEach(function(char) {
				if (char !== '\n') {
					var charCode = char.charCodeAt(0);
					if (
						charCode > 31
						&& charCode < 128
					) {
						result.push({
							style: {
								left: x + 'px',
								top: y + 'px',
								backgroundPosition: getCharBGCoords(charCode),
							}
						});
					}
					x += imageCharWidth;
				} else {
					y += imageCharHeight;
					x = 0;
				}
			});
			return result;
		}
	},
	template: /*html*/`
<div
	class="font-image"
	:style="{
		left: x + 'px',
		top: y + 'px',
	}"
>
	<div class="font-image-relative">
		<div
			v-for="(char, index) in chars"
			class="image_font-monaco_9-6x12"
			:key="index"
			:style="char.style"
		></div>
	</div>
</div>
	`
})