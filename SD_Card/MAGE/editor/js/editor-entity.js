Vue.component(
	'entity-type-editor',
	{
		name: 'entity-type-editor',
		template: '#template-entity-type-editor',
		directions: [
			'↑',
			'→',
			'↓',
			'←',
		],
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
				currentEntityTypeId: '',
			}
		},
		computed: {
			entityTypes: function () {
				return this.scenarioData.entityTypes;
			},
			entityTypeList: function () {
				return Object.values(this.entityTypes);
			},
			currentEntityType: function () {
				return this.entityTypes[this.currentEntityTypeId];
			},
			tileset: function () {
				return this.fileNameMap[this.currentEntityType.tileset].parsed;
			},
			tilesetImage: function () {
				return this.tileset.imageFile.blobUrl;
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
