const fs = require('fs');
const path = require('path');
const natlang = require('./natlang-parse.js');
const mgs = require('./mgs_natlang_config.js');

const DEFAULT_OUTPUT_PATH = `${__dirname}/workflow_tests/output`;
const DEFAULT_SOURCE_PATH = `${__dirname}/workflow_tests/input`;

let args = process.argv.slice();
const verbose = args.includes('-v') || args.includes('--verbose')
args = args.filter(function (item) {
	return [ '-v', '--verbose' ].includes(item);
})

const inputPathFromArgs = args[2];
const outputPathFromArgs = args[3];
const inputPath = path.resolve(inputPathFromArgs || DEFAULT_SOURCE_PATH);
const outputPath = path.resolve(outputPathFromArgs || DEFAULT_OUTPUT_PATH);

fs.mkdirSync(outputPath, { recursive: true });
const mgsFileNames = fs.readdirSync(inputPath, { encoding: 'utf-8'});

console.log('input files:', mgsFileNames);
fs.mkdirSync(`${outputPath}/scripts`, { recursive: true });
fs.mkdirSync(`${outputPath}/dialogs`, { recursive: true });
if (verbose) {
	fs.mkdirSync(`${outputPath}/passes`, { recursive: true });
}

const convertFileByName = (fileName) => {
	const filenameTrimmed = fileName.replace('.mgs', '');
	const fileContents = fs.readFileSync(`${inputPath}/${fileName}`, { encoding: 'utf-8'});
	let fileOutput;
	try {
		fileOutput = natlang.parse(mgs, fileContents, filenameTrimmed);
	} catch (error) {
		let message = 'Error in file: ' + filenameTrimmed + '\n';
		message += `${error.fancyMessage}\n\n`
		message += `Attempted branch name: ${error.branch}\n`
		message += `Input string char index: ${error.pos}`
		fs.writeFileSync(
			`${outputPath}/${`pass-${filenameTrimmed}-error.txt`}`,
			message
		);
		console.error('Error in file: ' + filenameTrimmed);
		throw error;
	}
	if (verbose) {
		const fileOutputPasses = fileOutput.passes; // from any macros
		Object.keys(fileOutputPasses).forEach(function (passName) {
			const passReport = fileOutputPasses[passName];
			const logType = passReport.logType || 'txt';
			const logBody = passReport.logBody || passReport;
			fs.writeFileSync(
				`${outputPath}/passes/${`pass-${filenameTrimmed}-${passName}-log.${logType}`}`,
				logBody
			);
			if (passReport.raw) {
				fs.writeFileSync(
					`${outputPath}/passes/${`pass-${filenameTrimmed}-${passName}-tokens.json`}`,
					JSON.stringify(passReport.raw, null, '\t')
				);
			}
			console.log(`  Logged '${passName}' pass for file '${filenameTrimmed}'`);
		})
	}
	if (!fileOutput.errors) {
		const outputScriptJson = fileOutput.scripts;
		const outputScriptName = `script-${filenameTrimmed}.json`;
		const outputDialogJson = fileOutput.dialogs;
		const outputDialogName = `dialog-${filenameTrimmed}.json`;
		let outputFiles = [];

		if (outputScriptJson) {
			fs.writeFileSync(
				`${outputPath}/scripts/${outputScriptName}`,
				JSON.stringify(outputScriptJson, null, '\t')
			);
			outputFiles.push('script')
		}
		if (outputDialogJson) {
			fs.writeFileSync(
				`${outputPath}/dialogs/${outputDialogName}`,
				JSON.stringify(outputDialogJson, null, '\t')
			);
			outputFiles.push('dialog')
		}
		console.log(`    Generated '${filenameTrimmed}' ${outputFiles.join(', ')}`);
	} else {
		throw new Error(`Natlang parsing failed for file: "${fileName}"! Aborting...`);
	}
}

mgsFileNames.forEach(convertFileByName);

console.log("FINISHED");
