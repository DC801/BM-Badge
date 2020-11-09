var dataTypes = [
	'maps',
	'tilesets',
	'animations',
	'entityTypes',
	'entities',
	'geometry',
	'scripts',
	'images',
];

var handleScenarioData = function(fileNameMap) {
	return function (scenarioData) {
		console.log(
			'scenario.json',
			scenarioData
		);
		Object.keys(scenarioData.entityTypes).forEach(function (key) {
			scenarioData.entityTypes[key].type = key;
		})
		scenarioData.mapsByName = {};
		scenarioData.parsed = {};
		dataTypes.forEach(function (typeName) {
			scenarioData.parsed[typeName] = [];
		});
		var entitiesFile = fileNameMap['entities.json'];
		var entitiesPromise = !entitiesFile
			? Promise.resolve()
			: getFileJson(entitiesFile)
				.then(handleEntitiesData(scenarioData, entitiesFile));
		return entitiesPromise.then(function () {
			return mergeScriptDataIntoScenario(scenarioData, fileNameMap)
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
		false
	);
	indicesDataView.headerOffset += 4;
	parsedItems.forEach(function(item, index, list) {
		var headerOffsetOffset = indicesDataView.headerOffset + (index * 4);
		var headerLengthOffset = (
			headerOffsetOffset
			+ (list.length * 4)
		);
		var totalSize = 0;
		indicesDataView.setUint32(
			headerOffsetOffset,
			indicesDataView.fileOffset,
			false
		)
		chunks.push(item.serialized);
		totalSize += item.serialized.byteLength;
		indicesDataView.setUint32(
			headerLengthOffset,
			totalSize,
			false
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
	var signature = new ArrayBuffer(8);
	var signatureDataView = new DataView(signature);
	setCharsIntoDataView(
		signatureDataView,
		'MAGEGAME',
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
window.Vue.component(
	'inputty',
	{
		template: '#inputty'
	}
);

window.vueApp = new window.Vue({
	el: '#app',
	data: {
		error: null,
		jsonValue: '',
		downloadData: null
	},
	created: function () {
		console.log('Created');
	},
	methods: {
		prepareDownload: function (data, name) {
			var blob = new Blob(data, {type: 'octet/stream'});
			var url = window.URL.createObjectURL(blob);
			if(this.downloadData) {
				window.URL.revokeObjectURL(this.downloadData.url);
			}
			window.Vue.set(
				this,
				'downloadData',
				{
					href: url,
					target: '_blank',
					download: name
				}
			);
		},
		handleChange: function (event) {
			var fileNameMap = {};
			var vm = this;
			var filesArray = Array.prototype.slice.call(event.target.files);
			filesArray.forEach(function (file) {
				fileNameMap[file.name] = file;
			});
			var scenarioFile = fileNameMap['scenario.json'];
			try {
				if (!scenarioFile) {
					vm.error = 'No `scenario.json` file detected in folder, no where to start!';
				} else {
					getFileJson(scenarioFile)
						.then(handleScenarioData(fileNameMap))
						.then(generateIndexAndComposite)
						.then(function (compositeArray) {
							vm.prepareDownload([compositeArray], 'game.dat');
						});
				}
			} catch (error) {
				vm.error = error.message;
			}
		}
	}
});
