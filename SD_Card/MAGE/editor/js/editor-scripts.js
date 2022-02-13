Vue.component(
	'editor-scripts',
	{
		name: 'editor-scripts',
		template: '#template-editor-scripts',
		props: {
			fileNameMap: {
				type: Object,
				required: true
			},
			scenarioData: {
				type: Object,
				required: true
			}
		},
		data: function () {
			return {
				init: {
					scripts: jsonClone(this.scenarioData.scripts),
					scriptFiles: jsonClone(this.scenarioData.scriptsFileItemMap),
				},
				current: {
					scripts: jsonClone(this.scenarioData.scripts),
					scriptFiles: jsonClone(this.scenarioData.scriptsFileItemMap),
				},
				initJsonState: '',
				currentScriptFileName: '',
			}
		},
		computed: {
			jsonOutput: function () {
				return JSON.stringify(
					this.current,
					null,
					'\t'
				) + '\n';
			},
			needsSave: function () {
				return this.initJsonState !== this.jsonOutput;
			}
		},
		created: function () {
			this.initJsonState = this.jsonOutput;
		},
		methods: {
			copyState: function () {
				this.$refs.copyStateTextArea.select();
				document.execCommand("copy");
			},
			moveScript: function (fileName, index, value) {
				var scriptList = this.current.scriptFiles[fileName];
				var splice = scriptList.splice(index, 1);
				var targetIndex = index + value;
				scriptList.splice(targetIndex, 0, splice[0]);
			},
		}
	}
);

Vue.component(
	'tiled-tile',
	{
		name: 'tiled-tile',
		template: '#template-tiled-tile',
		props: {
			tileset: {
				type: Object,
				required: true,
			},
			tileid: {
				type: Number,
				required: true,
			}
		},
		data: function () {
			return {
				currentFrame: 0,
			};
		},
		created: function() {
			var imageFile = this.tileset.imageFile;
			if (imageFile && !imageFile.blobUrl) {
				imageFile.blobUrl = URL.createObjectURL(imageFile);
			}
			if(this.animation) {
				this.animate();
			}
		},
		beforeDestroy: function () {
			clearTimeout(this.animationTimeout);
		},
		computed: {
			image: function () {
				return this.tileset.imageFile.blobUrl;
			},
			animation: function () {
				var tileid = this.tileid;
				var currentTile = this.tileset.tiles.find(function (tile) {
					return tile.id === tileid;
				});
				return currentTile && currentTile.animation;
			},
			currentTileId: function () {
				var animation = this.animation;
				var currentFrame = this.currentFrame;
				var tileid = this.tileid;
				return animation
					? animation[currentFrame].tileid
					: tileid;
			},
			outerStyle: function () {
				var tileset = this.tileset;
				var animation = this.animation;
				return {
					display: 'inline-block',
					width: tileset.tilewidth + 2 + 'px',
					height: tileset.tileheight + 2 + 'px',
					border: `1px solid ${animation ? '#f44' : '#333'}`,
				};
			},
			innerStyle: function () {
				var tileset = this.tileset;
				var tileid = this.currentTileId;
				var x = tileid % tileset.columns;
				var y = Math.floor(tileid / tileset.columns);
				return {
					display: 'inline-block',
					width: tileset.tilewidth + 'px',
					height: tileset.tileheight + 'px',
					backgroundImage: `url("${this.image}")`,
					backgroundPosition: `${
						-x * tileset.tilewidth
					}px ${
						-y * tileset.tileheight
					}px`,
				};
			}
		},
		methods: {
			animate: function () {
				var vm = this;
				var frame = this.animation[vm.currentFrame];
				this.animationTimeout = setTimeout(
					function () {
						vm.currentFrame += 1;
						vm.currentFrame %= vm.animation.length;
						vm.animate();
					},
					frame.duration
				);
			},
		},
	}
);
