const fs = require('fs');
const path = require('path');
const window = {
	fastPng: require(`${__dirname}/../dependencies/fast-png`),
	omggif: require(`${__dirname}/../dependencies/omggif`),
	natlang: require(`${__dirname}/../dependencies/natlang-parser/natlang-parse`),
	mgs: require(`${__dirname}/../dependencies/natlang-parser/mgs_natlang_config`),
	imageCache: {},
};

var verbose = false;
['-v', '--verbose'].forEach(function(verboseArgForm) {
	// recognize multiple forms of specifying that the user wants verbose behavior,
	// then take all instances of those forms out of the process.argv so that the fixed position
	// logic below for input and output args still works (reconsider this if more args are added)
	const index = process.argv.indexOf(verboseArgForm);
	if (index > -1) {
		verbose = true;
		delete process.argv[index];
	}
});

var DEFAULT_OUTPUT_PATH = `${__dirname}/../../game.dat`;
var DEFAULT_SOURCE_PATH = `${__dirname}/../../scenario_source_files`;

var inputPathFromArgs = process.argv[2];
var outputPathFromArgs = process.argv[3];
var inputPath = path.resolve(inputPathFromArgs || DEFAULT_SOURCE_PATH);
var outputPath = path.resolve(outputPathFromArgs || DEFAULT_OUTPUT_PATH);

const parsedOutputPath = path.parse(outputPath || '');
const imageCachePath = path.resolve(path.join(parsedOutputPath.dir, 'image_cache.json'));

try {
	console.log('attempting to use imageCache at:', imageCachePath);
	window.imageCache = require(imageCachePath);
} catch (error) {
	console.error('imageCache load failed. Anyway...');
}

const modules = [
	"natlang_mgs",
	"common",
	"maps",
	"tilesets",
	"animations",
	"entity_types",
	"portraits",
	"entities",
	"geometry",
	"strings",
	"scripts",
	"dialogs",
	"serial_dialogs",
	"images",
	"warnings",
	"encoding"
];

var moduleString = "";

for (m of modules) {
	moduleString += fs.readFileSync(`${__dirname}/../js/${m}.js`);
}

//for ()
//JSON.parse(fs.readFileSync(scenarioFile))

eval(moduleString);

function makeMap(path) {
	let map = {}
	for (file of fs.readdirSync(
		path,
		{ withFileTypes: true }
	)) {
		let filePath = `${path}/${file.name}`

		if (file.isDirectory()) {
			map = {
				...map,
				...makeMap(filePath)
			};
		} else {
			let fileBlob = fs.readFileSync(filePath)
			let type = filePath.split('.').pop()
			map[file.name] = {
				name: file.name,
				type,
				arrayBuffer: function () {
					return new Promise((resolve) => {
						resolve(fileBlob);
					});
				},
				text: function text() {
					return new Promise(resolve => {
						resolve(fileBlob.toString('utf8'));
					});
				},
			}
		}
	}
	return map
}

function printWarningsIfVerbose(scenarioData) {
	if (
		verbose
		&& 'warnings' in scenarioData
	) {
		let totalWarningCount = 0;
		const mapsWithWarnings = [];
		const checkWarningCounts = Object.fromEntries(
			Object.keys(scenarioData.warnings).map(function (checkName) {
				return [checkName, 0];
			})
		);

		console.log();
		Object.entries(scenarioData.warnings).forEach(function ([checkName, checkWarnings]) {
			console.log(`Warnings for '${checkName}' (${Object.keys(checkWarnings).length} maps):`);

			Object.entries(checkWarnings).forEach(function ([mapName, mapWarnings]) {
				if (!mapsWithWarnings.includes(mapName)) {
					mapsWithWarnings.push(mapName);
				}
				console.log(`    Warnings in map '${mapName}' (${Object.keys(mapWarnings).length} entities):`);

				mapWarnings.forEach(function (warning) {
					totalWarningCount += 1;
					checkWarningCounts[checkName] += 1;
					console.log(`        WARNING: ${warning.warningMessage}`);
				});
				console.log();
			});
		});

		Object.entries(checkWarningCounts).forEach(function ([checkName, checkFailureCount]) {
			if (checkFailureCount > 0) {
				console.log(`Found ${checkFailureCount} total entities with a warning for check '${checkName}'`);
			}
		});

		console.log(`Found ${totalWarningCount} total warnings across ${mapsWithWarnings.length} total maps`);
		console.log();
	}

	return scenarioData;
}

var fileNameMap = makeMap(inputPath);
var scenarioFile = fileNameMap['scenario.json'];
if (!scenarioFile) {
	throw new Error("No `scenario.json` file detected in folder, nowhere to start!")
} else {
	getFileJson(scenarioFile)
		.then(handleScenarioData(fileNameMap))
		.then(printWarningsIfVerbose)
		.then(generateIndexAndComposite)
		.then(function (compositeArray) {
			console.log('Starting game.dat write to:', outputPath);
			fs.writeFileSync(outputPath, compositeArray);
			console.log('done');
			console.log('Starting imageCache write to:', imageCachePath);
			fs.writeFileSync(imageCachePath, JSON.stringify(window.imageCache));
			console.log('done');
		})
}
