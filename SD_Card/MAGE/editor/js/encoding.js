var dataTypes = [
    'maps',
    'tilesets',
    'animations',
    'entityTypes',
    'entities',
    'geometry',
    'scripts',
    'portraits',
    'dialogs',
    'imageColorPalettes',
    'strings',
    'save_flags',
    'variables',
    'images',
];

var handleScenarioData = function (fileNameMap) {
    return function (scenarioData) {
        console.log(
            'scenario.json',
            scenarioData
        );
        scenarioData.mapsByName = {};
        scenarioData.parsed = {};
        scenarioData.uniqueStringLikeMaps = {
            strings: {},
            save_flags: {},
            variables: {},
        };
        scenarioData.uniqueDialogMap = {};
        scenarioData.entityTypesPlusProperties = {};
        dataTypes.forEach(function (typeName) {
            scenarioData.parsed[typeName] = [];
        });
        var portraitsFile = fileNameMap['portraits.json'];
        var portraitsPromise = getFileJson(portraitsFile)
            .then(handlePortraitsData(fileNameMap, scenarioData));
        var entityTypesFile = fileNameMap['entity_types.json'];
        var entityTypesPromise = portraitsPromise.then(function () {
            return getFileJson(entityTypesFile)
                .then(handleEntityTypesData(fileNameMap, scenarioData))
        });
        return Promise.all([
            entityTypesPromise,
            preloadAllDialogSkins(fileNameMap, scenarioData),
            mergeScriptDataIntoScenario(fileNameMap, scenarioData),
            mergeDialogDataIntoScenario(fileNameMap, scenarioData),
        ])
            .then(function () {
                serializeNullScript(
                    fileNameMap,
                    scenarioData,
                );
                return handleScenarioMaps(scenarioData, fileNameMap)
                    .then(function () {
                        return scenarioData;
                    });
            });
    }
};

var addParsedTypeToHeadersAndChunks = function (
    parsedItems,
    indicesDataView,
    chunks
) {
    indicesDataView.setUint32(
        indicesDataView.headerOffset,
        parsedItems.length,
        IS_LITTLE_ENDIAN
    );
    indicesDataView.headerOffset += 4;
    parsedItems.forEach(function (item, index, list) {
        var headerOffsetOffset = indicesDataView.headerOffset + (index * 4);
        var headerLengthOffset = (
            headerOffsetOffset
            + (list.length * 4)
        );
        var totalSize = 0;
        indicesDataView.setUint32(
            headerOffsetOffset,
            indicesDataView.fileOffset,
            IS_LITTLE_ENDIAN
        );
        chunks.push(item.serialized);
        totalSize += item.serialized.byteLength;
        indicesDataView.setUint32(
            headerLengthOffset,
            totalSize,
            IS_LITTLE_ENDIAN
        );
        indicesDataView.fileOffset += totalSize;
    });
    indicesDataView.headerOffset += parsedItems.length * 8;
};

var generateIndexAndComposite = function (scenarioData) {
    console.log(
        'generateIndexAndComposite:scenarioData',
        scenarioData
    );
    var signature = new ArrayBuffer(32);
    var signatureDataView = new DataView(signature);
    setCharsIntoDataView(
        signatureDataView,
        'MAGEGAME' + new Date().toJSON(),
        0
    );
    var headerSize = 0;
    dataTypes.forEach(function (typeName) {
        headerSize += (
            4 // uint32_t count
            + (4 * scenarioData.parsed[typeName].length) // uint32_t offsets
            + (4 * scenarioData.parsed[typeName].length) // uint32_t lengths
        )
    });
    var indices = new ArrayBuffer(headerSize);
    var indicesDataView = new DataView(indices);
    var chunks = [
        signature,
        indices
    ];
    indicesDataView.fileOffset = signature.byteLength + indices.byteLength;
    indicesDataView.headerOffset = 0;

    dataTypes.forEach(function (type) {
        addParsedTypeToHeadersAndChunks(
            scenarioData.parsed[type],
            indicesDataView,
            chunks
        );
    })

    var compositeSize = chunks.reduce(
        function (accumulator, item) {
            return accumulator + item.byteLength;
        },
        0
    );
    var compositeArray = new Uint8Array(compositeSize);
    var currentOffset = 0;
    chunks.forEach(function (item) {
        compositeArray.set(
            new Uint8Array(item),
            currentOffset
        );
        currentOffset += item.byteLength;
    });
    console.log(
        'compositeArray',
        compositeArray
    );
    return compositeArray;
};