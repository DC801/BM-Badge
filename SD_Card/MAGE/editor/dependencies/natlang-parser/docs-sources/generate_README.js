var fs = require('fs');

var mid = require('./mid.js');

var outputFileName = '../README.md';

var top = fs.readFileSync('top.md',"utf-8");
var bot = fs.readFileSync('bot.md',"utf-8");

var pieces = [
	`# MageGameScript Natlang <!-- This README is automatically generated, NO TOUCHY -->`,
	top,
	mid,
	bot
]

var output = pieces.join('\n\n');

fs.writeFileSync(outputFileName, output);
