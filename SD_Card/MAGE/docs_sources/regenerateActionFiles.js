var fs = require('fs');
var pages = require('./buildActionFiles.js');

var filePrefix = 'docs/actions/'

var actionFileName = 'actions';
var actionFileContents = pages.actions;
fs.writeFileSync(
	filePrefix + actionFileName + '.md',
	actionFileContents
);

Object.entries(pages)
	.filter(function (pair) {
		return pair[0] !== 'actions';
	})
	.forEach(function (pair) {
		var fileName = pair[0];
		var fileContents = pair[1];
		fs.writeFileSync(
			filePrefix + fileName + '.md',
			fileContents
		);
	});

// NOTE: run this with node, not VSCode!
// File paths will be weird otherwise!
// `node ./regenerateActionFiles.js`
