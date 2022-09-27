const fs = require('fs');
const path = require('path');
const natlang = require('./natlang-parse.js');
const mgs = require('./mgs_natlang_config.js');

const DEFAULT_OUTPUT_PATH = `${__dirname}/workflow_tests/output`;
const DEFAULT_SOURCE_PATH = `${__dirname}/workflow_tests/input`;

const inputPathFromArgs = process.argv[2];
const outputPathFromArgs = process.argv[3];
const inputPath = path.resolve(inputPathFromArgs || DEFAULT_SOURCE_PATH);
const outputPath = path.resolve(outputPathFromArgs || DEFAULT_OUTPUT_PATH);

fs.mkdirSync(outputPath, { recursive: true });
const mgsFileNames = fs.readdirSync(inputPath, { encoding: 'utf-8'});

console.log('mgsFiles:', mgsFileNames);
fs.mkdirSync(`${outputPath}/scripts`, { recursive: true });
fs.mkdirSync(`${outputPath}/dialogs`, { recursive: true });

const convertFileByName = (fileName) => {
	const filenameTrimmed = fileName.replace('.mgs', '');
	const fileContents = fs.readFileSync(`${inputPath}/${fileName}`, { encoding: 'utf-8'});
	const fileOutput = natlang.parse(mgs, fileContents, filenameTrimmed);
	
	if (!fileOutput.errors) {
		const outputScriptJson = fileOutput.scripts;
		const outputScriptName = `script-${filenameTrimmed}.json`
		const outputDialogJson = fileOutput.dialogs;
		const outputDialogName = `dialog-${filenameTrimmed}.json`
		
		fs.writeFileSync(
			`${outputPath}/scripts/${outputScriptName}`,
			JSON.stringify(outputScriptJson, null, '\t')
		);
		fs.writeFileSync(
			`${outputPath}/dialogs/${outputDialogName}`,
			JSON.stringify(outputDialogJson, null, '\t')
		);
	} else {
		throw new Error(`Natlang parsing failed for file: "${fileName}"! Aborting...`);
	}
}

mgsFileNames.forEach(convertFileByName);

console.log("FINISHED");
