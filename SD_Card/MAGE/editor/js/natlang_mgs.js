var natlangOutputProperties = {
	'scripts': {
		arrayPath: 'scriptPaths',
		folderPath: 'scripts',
		fileName: function (name) {return 'script-' + name + '.json'}
	},
	'dialogs': {
		arrayPath: 'dialogPaths',
		folderPath: 'dialog',
		fileName: function (name) {return 'dialog-' + name + '.json'}
	},
	'serialDialogs': {
		arrayPath: 'serialDialogPaths',
		folderPath: 'serial_dialog',
		fileName: function (name) {return 'serial_dialog-' + name + '.json'}
	}
};
var mgsFileNameRegex = /\.mgs$/;
var convertMgsFilesIntoScenarioDataConfig = function (
	fileNameMap,
	scenarioData,
) {
	var mgsFileMap = {};
	var mgsFilePromises = Object.keys(fileNameMap)
		.filter(function (value) {
			return value.match(mgsFileNameRegex);
		})
		.map(function (mgsFileName) {
			var filePointer = fileNameMap[mgsFileName];
			var baseFileName = mgsFileName.replace(mgsFileNameRegex, '');
			return filePointer.text()
				.then(function (text) {
					mgsFileMap[filePointer.name] = text;
					var result = window.natlang.parse(
						window.mgs,
						text,
						mgsFileName,
					);
					Object.keys(natlangOutputProperties).forEach(function (propertyName) {
						var value = result[propertyName]
						if (value) {
							var outputProperties = natlangOutputProperties[propertyName];
							var destinationArray = scenarioData[outputProperties.arrayPath];
							var fileName = outputProperties.fileName(baseFileName);
							var completeFilePath = outputProperties.folderPath + '/' + fileName;
							destinationArray.push(completeFilePath);
							fileNameMap[fileName] = {
								name: fileName,
								webkitRelativePath: completeFilePath,
								text: function () {
									return new Promise(function (resolve) {
										resolve(JSON.stringify(value, null, '\t'));
									});
								},
							};
						}
					})
				});
		});
	return Promise.all(mgsFilePromises)
};
