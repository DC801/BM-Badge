var possibleNameList = [
	'idle',
	'walk',
	'action',
	'special',
	'extra_special',
	'really_extra_special',
	'why_do_you_have_this_many_animations',
];

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
				newEntityTypeId: '',
				currentAnimationName: '',
				currentAnimationDirection: -1,
				initJsonState: '',
			}
		},
		created: function () {
			this.initJsonState = this.jsonOutput;
		},
		computed: {
			entityTypes: function () {
				return this.scenarioData.entityTypes;
			},
			jsonOutput: function () {
				return JSON.stringify(
					this.scenarioData.entityTypes,
					null,
					'\t'
				) + '\n';
			},
			needsSave: function () {
				return this.initJsonState !== this.jsonOutput;
			},
			entityTypeList: function () {
				return Object.values(this.entityTypes);
			},
			currentEntityType: function () {
				return this.entityTypes[this.currentEntityTypeId];
			},
			tileset: function () {
				var tilesetFile = this.fileNameMap[this.currentEntityType.tileset];
				return tilesetFile
					? tilesetFile.parsed
					: undefined;
			},
			allTilesets: function () {
				return this.scenarioData.parsed.tilesets.slice().sort()
			},
			tilesetImage: function () {
				return this.tileset.imageFile.blobUrl;
			},
			currentDirection: function () {
				var currentAnimation = this.currentEntityType.animations[this.currentAnimationName];
				return (
					currentAnimation
					&& (this.currentAnimationDirection !== -1)
				)
					? currentAnimation[this.currentAnimationDirection]
					: undefined;
			},
			currentTileId: function () {
				return this.currentDirection
					? this.currentDirection.tileid
					: undefined;
			},
		},
		methods: {
			addEntityType: function () {
				var name = this.newEntityTypeId
					.trim()
					.toLocaleLowerCase()
					.replace(/[^a-z0-9]/gm, '_');
				Vue.set(
					this.scenarioData.entityTypes,
					name,
					{
						type: name,
						tileset: '',
						animations: {
							idle: [
								{
									tileid: 0,
									flip_x: false,
									flip_y: false,
								},
								{
									tileid: 0,
									flip_x: false,
									flip_y: false,
								},
								{
									tileid: 0,
									flip_x: false,
									flip_y: false,
								},
								{
									tileid: 0,
									flip_x: false,
									flip_y: false,
								}
							]
						}
					},
				);
				this.currentEntityTypeId = name;
			},
			clickDirection: function (animationName, directionIndex) {
				this.currentAnimationName = animationName;
				this.currentAnimationDirection = directionIndex;
			},
			clickTile: function (tileid) {
				if(this.currentDirection) {
					this.currentDirection.tileid = tileid;
				}
			},
			flip: function (animationName, directionIndex, propertyName) {
				this.currentAnimationName = animationName;
				this.currentAnimationDirection = directionIndex;
				if(this.currentDirection) {
					Vue.set(
						this.currentDirection,
						propertyName,
						!this.currentDirection[propertyName]
					);
				}
			},
			addAnimation() {
				var propertyName = possibleNameList[
					Object.keys(this.currentEntityType.animations).length
				];
				Vue.set(
					this.currentEntityType.animations,
					propertyName,
					[
						{
							"tileid": 0,
							"flip_x": false
						},
						{
							"tileid": 0,
							"flip_x": false
						},
						{
							"tileid": 0,
							"flip_x": false
						},
						{
							"tileid": 0,
							"flip_x": false
						}
					]
				)
			},
			deleteAnimation: function (animationName) {
				var animations = this.currentEntityType.animations;
				var newValues = {};
				var currentCount = 0;
				Object.entries(animations).forEach(function (pair) {
					var name = pair[0];
					var animation = pair[1];
					if (name !== animationName) {
						newValues[possibleNameList[currentCount]] = animation;
						currentCount += 1;
					}
				});
				this.currentEntityType.animations = newValues;
			}
		}
	}
);

Vue.component(
	'unsaved-changes-warning',
	{
		name: 'unsaved-changes-warning',
		template: '#template-unsaved-changes-warning',
		props: {
			data: String,
		},
		methods: {
			copyState: function () {
				this.$refs.copyStateTextArea.select();
				document.execCommand("copy");
			},
		},
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
