var dataTypes = [
	'maps',
	'tilesets',
	'animations',
	'entityTypes',
	'entities',
	'geometry',
	'scripts',
	'dialogs',
	'imageColorPalettes',
	'strings',
	'save_flags',
	'images',
];

var handleScenarioData = function(fileNameMap) {
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
		};
		scenarioData.uniqueDialogMap = {};
		dataTypes.forEach(function (typeName) {
			scenarioData.parsed[typeName] = [];
		});
		var entityTypesFile = fileNameMap['entity_types.json'];
		var entityTypesPromise = getFileJson(entityTypesFile)
			.then(handleEntitityTypesData(scenarioData, fileNameMap));
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
window.Vue.component(
	'inputty',
	{
		template: '#inputty'
	}
);

window.Vue.component(
	'download-link',
	{
		name: 'download-link',
		template: '#template-download-link',
		props: {
			link: {
				type: Object,
				required: true,
			}
		},
	}
);

window.vueApp = new window.Vue({
	el: '#app',
	data: {
		uniqueEncodeAttempt: Math.random(),
		isLoading: false,
		error: null,
		downloadData: null,
		downloadZip: null,
		scenarioData: null,
		fileNameMap: null,
	},
	created: function () {
		console.log('Created');
	},
	methods: {
		closeError: function () {
			this.uniqueEncodeAttempt = Math.random();
			this.error = false;
		},
		closeSuccess: function (propertyName) {
			this.uniqueEncodeAttempt = Math.random();
			this[propertyName] = null;
		},
		prepareDownload: function (data, name, targetPropertyName) {
			var blob = new Blob(data, {type: 'octet/stream'});
			var url = window.URL.createObjectURL(blob);
			if(this[targetPropertyName]) {
				window.URL.revokeObjectURL(this[targetPropertyName].url);
			}
			window.Vue.set(
				this,
				targetPropertyName,
				{
					href: url,
					target: '_blank',
					download: name
				}
			);
		},
		getPathByDataTypeName: function (item, dataTypeName) {
			var nameTypeMap = {
				sdfsd: function () {return `${aaaaaaaaa}`},
			};
		},
		prepZipDataByDataTypeName: function (item, dataTypeName) {
			var filterMap = {
				
			};
			return {
				fileName: 'scenario_source_files/' + this.getPathByDataTypeName(
					item,
					dataTypeName
				),
				data: JSON.stringify(
					item,
					filterMap[dataTypeName],
					'\t',
				)
			}
		},
		makeZip: function (scenarioData) {
			var vm = this;
			var zip = jszip();

			/*
			Enforcing strict hierarchy and naming conventions
			/scenario.json           <- managed in this editor
			/entity_types.json       <- ^
			/scripts/script-*.json   <- ^
			/dialog/dialog-*.json    <- ^
			/entities/entity-*.json  <- managed by Tiled
			/tilesets/tileset-*.json <- ^
			/maps/map-*.json         <- ^
			 */
			scenarioData.parsed.scripts

			Object.keys(scenarioData.parsed).forEach(function (dataTypeName) {
				var dataType = scenarioData.parsed[dataTypeName];
				dataType.forEach(function (item) {
					var zipData = this.prepZipDataByDataTypeName(
						item,
						dataTypeName
					);
					zip.file(
						zipData.filename,
						zipData.data,
					);
				})
			});
			zip.generateAsync({type: "uint8array"})
				.then(function (data) {
					vm.prepareDownload(
						[data],
						'scenario_source_files.zip',
						'downloadZip'
					);
				});
		},
		handleChange: function (event) {
			var fileNameMap = {};
			var vm = this;
			var filesArray = Array.prototype.slice.call(event.target.files);
			vm.isLoading = true;
			filesArray.forEach(function (file) {
				fileNameMap[file.name] = file;
			});
			var scenarioFile = fileNameMap['scenario.json'];
			try {
				if (!scenarioFile) {
					vm.error = 'No `scenario.json` file detected in folder, nowhere to start!';
				} else {
					getFileJson(scenarioFile)
						.then(handleScenarioData(fileNameMap, vm))
						.then(function (scenarioData) {
							vm.fileNameMap = fileNameMap;
							vm.scenarioData = scenarioData;
							return scenarioData;
						})
						.then(generateIndexAndComposite)
						.then(function (compositeArray) {
							vm.prepareDownload(
								[compositeArray],
								'game.dat',
								'downloadData'
							);
							vm.isLoading = false;
						})
						.catch(function (error) {
							console.error(error);
							vm.error = error.message;
							vm.isLoading = false;
						});
				}
			} catch (error) {
				vm.error = error.message;
				vm.isLoading = false;
			}
		}
	}
});
