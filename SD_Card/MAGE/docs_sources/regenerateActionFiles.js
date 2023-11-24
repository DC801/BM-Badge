var fs = require('fs');
var pages = require('./buildActionFiles.js');

var filePrefix = 'MGE_obsidian_vault/Actions/'

Object.entries(pages).forEach(function (pair) {
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
