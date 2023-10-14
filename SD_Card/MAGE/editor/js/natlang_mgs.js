var natlangOutputProps = {
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
	var mgsFileNames = Object.keys(fileNameMap)
		.filter(function (value) {
			return value.match(mgsFileNameRegex);
		});
	var mgsFilePromises = mgsFileNames.map(function (mgsFileName) {
		return fileNameMap[mgsFileName].text()
			.then(function (text) {
				mgsFileMap[mgsFileName] = text;
			});
	});
	var ret = Promise.all(mgsFilePromises)
		.then(function () {
			mgsFileNames.forEach(function (mgsFileName) {
				var text = mgsFileMap[mgsFileName];
				var reg = /\binclude\s*!\s*\(\s*\"([-_a-zA-Z0-9 \.]+\.mgs)\"\s*\)\s*;/;
				match = text.match(reg);
				while (match) {
					if (!mgsFileMap[match[1]]) {
						throw new Error (`Could not include '${match[1]}' in file '${mgsFileName}' -- no such file!`);
					}
					// console.log(`include!() --> Now copying plaintext contents of file '${match[1]}' into file '${mgsFileName}'`)
					var textBodySlim = mgsFileMap[match[1]].replace(/\n/g, " "); // so line numbers will be the same as the original file (for error messages); for better handling, intercept after lexer but before parser (lol)
					text = text.replace(match[0], textBodySlim);
					match = text.match(reg);
				}
				mgsFileMap[mgsFileName] = text;
			})
			mgsFileNames.forEach(function (mgsFileName) {
				var text = mgsFileMap[mgsFileName];
				var result = window.natlang.parse(
					window.mgs,
					text,
					mgsFileName,
				);
				deposit(result, mgsFileName, scenarioData, fileNameMap);
			});
		});
	return ret;
};

var deposit = function (result, mgsFileName, scenarioData, fileNameMap) {
	var baseFileName = mgsFileName.replace(mgsFileNameRegex, '');
	Object.keys(natlangOutputProps).forEach(function (propName) {
		var value = result[propName]
		if (value) {
			var outputProps = natlangOutputProps[propName];
			var destinationArray = scenarioData[outputProps.arrayPath];
			var fileName = outputProps.fileName(baseFileName);
			var completeFilePath = outputProps.folderPath + '/' + fileName;
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
};