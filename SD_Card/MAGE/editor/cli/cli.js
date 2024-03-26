const fs = require('fs');
const path = require('path');
const window = {
	fastPng: require(`${__dirname}/../dependencies/fast-png`),
	omggif: require(`${__dirname}/../dependencies/omggif`),
	natlang: require(`${__dirname}/../dependencies/natlang-parser/natlang-parse`),
	mgs: require(`${__dirname}/../dependencies/natlang-parser/mgs_natlang_config`),
	imageCache: {},
};

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

var fileNameMap = makeMap(inputPath);
var scenarioFile = fileNameMap['scenario.json'];
if (!scenarioFile) {
	throw new Error("No `scenario.json` file detected in folder, nowhere to start!")
} else {
	getFileJson(scenarioFile)
		.then(handleScenarioData(fileNameMap))
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
