var fs = require('fs');
var testJSON = require('./mgnl.testdata.json');
var stableStringify = require('fast-json-stable-stringify');

var modules = [
	'../common.js',
	'../scripts.js',
	'../editor-natlang-dictionary.js',
	'../editor-natlang-from-json.js',
	'../editor-natlang-to-json.js',
];

var moduleString = '';

modules.forEach(function (filePath) {
	moduleString += '\n' + fs.readFileSync(`${__dirname}/${filePath}`);
})

eval(moduleString);

describe('MGNL test suite', function () {
	describe('ao dictionary lookup', function () {
		Object.keys(testJSON.suite.actions).forEach(function (actionName) {
			testJSON.suite.actions[actionName].forEach(function (ao, index) {
				it(`Should find the corrent dictionary item for ${JSON.stringify(ao)}`, function () {
					var result = getDictionaryItemFromAO(ao);
					var expected = testJSON.suite.dictionaryItems[actionName][index];
					expect(result).toStrictEqual(expected);
				})
			})
		})
	})
	describe('convert ao to token', function () {
		Object.keys(testJSON.suite.actions).forEach(function (actionName) {
			testJSON.suite.actions[actionName].forEach(function (ao, index) {
				it(`Should convert ${JSON.stringify(ao)} to tokens`, function () {
					var result = makeActionTokensFromAO(ao);
					var expected = testJSON.suite.tokens[actionName][index];
					expect(result).toStrictEqual(expected);
				})
			})
		})
	})
	describe('convert MGNL block to script JSON', function () {
		it(`Should convert test block to test JSON`, function () {
			var block = testJSON["suite-mini"].block;
			var stream = parseNatlangBlock(block);
			var result = parseNatlangStream(stream);
			var expected = testJSON["suite-mini"].actions;
			expect(result).toStrictEqual(expected);
		})
	})
	describe('Full circle', function () {
		Object.keys(testJSON.suite.actions).forEach(function (scriptName) {
			it(`Should translate ${scriptName} to natlang and back`, function () {
				var orig = {
					[scriptName]: testJSON.suite.actions[scriptName]
				};
				var natlang = translateScripts(orig);
				var stream = parseNatlangBlock(natlang);
				var result = parseNatlangStream(stream);
				expect(stableStringify(result)).toBe(stableStringify(orig));
			})
		})
	})
})
