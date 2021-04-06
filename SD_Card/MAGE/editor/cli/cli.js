const fs = require("fs");
const window = {
	fastPng: require(`${__dirname}/../dependencies/fast-png`),
	omggif: require(`${__dirname}/../dependencies/omggif`),
};

var DEFAULT_OUTPUT_PATH = `${__dirname}/../../game.dat`;
var DEFAULT_SOURCE_PATH = `${__dirname}/../../scenario_source_files`;

const modules = [
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
	"images",
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

var fileNameMap = makeMap(DEFAULT_SOURCE_PATH);
var scenarioFile = fileNameMap['scenario.json'];
if (!scenarioFile) {
	throw new Error("No `scenario.json` file detected in folder, nowhere to start!")
} else {
	getFileJson(scenarioFile)
		.then(handleScenarioData(fileNameMap))
		.then(generateIndexAndComposite)
		.then(function (compositeArray) {
			fs.writeFileSync(DEFAULT_OUTPUT_PATH, compositeArray)
		})
}