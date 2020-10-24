var serializeTileset = function (tilesetData, image) {
    var tilesetHeaderLength = getPaddedHeaderLength(
        16 // char[16] name
        + 2 // uint16_t imageIndex
        + 2 // uint16_t imageWidth
        + 2 // uint16_t imageHeight
        + 2 // uint16_t tileWidth
        + 2 // uint16_t tileHeight
        + 2 // uint16_t cols
        + 2 // uint16_t rows
    );
    var header = new ArrayBuffer(
        tilesetHeaderLength
    );
    var dataView = new DataView(header);
    var offset = 0;
    setCharsIntoDataView(
        dataView,
        tilesetData.name,
        0,
        offset += 16
    );
    dataView.setUint16(
        offset, // uint16_t imageIndex
        image.scenarioIndex,
        false
    );
    offset += 2
    dataView.setUint16(
        offset, // uint16_t imageWidth
        tilesetData.imagewidth,
        false
    );
    offset += 2
    dataView.setUint16(
        offset, // uint16_t imageHeight
        tilesetData.imageheight,
        false
    );
    offset += 2
    dataView.setUint16(
        offset, // uint16_t tileWidth
        tilesetData.tilewidth,
        false
    );
    offset += 2
    dataView.setUint16(
        offset, // uint16_t tileHeight
        tilesetData.tileheight,
        false
    );
    offset += 2
    dataView.setUint16(
        offset, // uint16_t cols
        tilesetData.columns,
        false
    );
    offset += 2
    dataView.setUint16(
        offset, // uint16_t rows
        Math.floor(tilesetData.imageheight / tilesetData.tileheight),
        false
    );
    var result = combineArrayBuffers(
        header,
        tilesetData.serializedTiles
    );
    return result;
};

var handleTilesetData = function (tilesetFile, scenarioData, fileNameMap) {
    return function (tilesetData) {
        tilesetData.scenarioIndex = tilesetFile.scenarioIndex;
        scenarioData.parsed.tilesets[tilesetData.scenarioIndex] = tilesetData;
        console.log(
            'Tileset:',
            tilesetFile.name,
            tilesetData
        );
        tilesetData.serializedTiles = new ArrayBuffer(
            getPaddedHeaderLength(tilesetData.tilecount)
        );
        var tileDataView = new DataView(tilesetData.serializedTiles);
        // forget about the built-in name, using file name instead.
        tilesetData.name = tilesetFile.name.split('.')[0];
        // already has columns, add the missing pair
        (tilesetData.tiles || []).forEach(function (tile) {
            mergeInProperties(
                tile,
                tile.properties
            );
            var entityPrototype = (
                (
                    fileNameMap['entities.json']
                    && fileNameMap['entities.json'].parsed[tile.type]
                )
                || {}
            );
            Object.assign(
                tile,
                assignToLessFalsy(
                    {},
                    entityPrototype,
                    tile
                )
            );
            if (tile.type) {
                tileDataView.setUint8(
                    tile.id,
                    tile.type.charCodeAt(0)
                );
            }
            if (tile.animation) {
                serializeAnimationData(tile, tilesetData, scenarioData);
            }
        });
        var filePromise = handleImage(tilesetData.image, scenarioData, fileNameMap)
            .then(function () {
                return tilesetData;
            });
        var imageFileName = tilesetData.image.split('/').pop();
        var imageFile = fileNameMap[imageFileName];
        tilesetData.imageFile = imageFile;
        tilesetData.serialized = serializeTileset(tilesetData, imageFile);
        tilesetFile.parsed = tilesetData;
        return filePromise
    };
};
