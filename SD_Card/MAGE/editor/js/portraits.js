var handlePortraitsData = function (
	fileNameMap,
	scenarioData,
) {
	return function (portraitsData) {
		scenarioData.portraits = portraitsData;
		var portraitTilesetsPromiseArray = Object.keys(scenarioData.portraits).map(function (key) {
			var portrait = scenarioData.portraits[key];
			portrait.scenarioIndex = scenarioData.parsed.portraits.length;
			scenarioData.parsed.portraits.push(portrait);
			return loadTilesetByName(
				portrait.tileset,
				fileNameMap,
				scenarioData,
			)
				.then(function handlePortraitLoad () {
					portrait.serialized = serializePortrait(
						key,
						portrait,
						fileNameMap
					);
				});
		});
		return Promise.all(portraitTilesetsPromiseArray);
	}
};

var serializePortrait = function(
	portraitName,
	portrait,
	fileNameMap
) {
	var emotes = Object.values(portrait.emotes);
	var tileset = fileNameMap[portrait.tileset];
	var headerLength = (
		32 // char[32] name
		+ 1 // uint8_t ??? padding
		+ 1 // uint8_t ??? padding
		+ 1 // uint8_t ??? padding
		+ 1 // uint8_t emote_count
		+ (
			animationDirectionSize
			* emotes.length
		)
	);
	var result = new ArrayBuffer(
		getPaddedHeaderLength(headerLength)
	);
	var dataView = new DataView(result);
	dataView.currentOffset = 0;
	setCharsIntoDataView(
		dataView,
		portraitName,
		0,
		dataView.currentOffset += 32
	);
	dataView.currentOffset += 3; // padding
	dataView.setUint8(
		dataView.currentOffset, // uint8_t emote_count
		emotes.length
	);
	dataView.currentOffset += 1;
	var serializeAnimation = createAnimationDirectionSerializer(
		tileset,
		dataView,
	);
	emotes.forEach(serializeAnimation);
	return result;
};
