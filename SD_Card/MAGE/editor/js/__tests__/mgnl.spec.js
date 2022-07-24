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
				var natlang = translateJSONToNatlang(orig);
				var json = translateNatlangToJSON(natlang);
				expect(stableStringify(json)).toBe(stableStringify(orig));
			})
		})
	})
	describe('Labeled comment detection', function () {
		it(`Should parse "/* asdf: asdfff */"`, function () {
			var testComment = "/* asdf: asdfff */";
			var result = patternParse.comment(testComment);
			expect(result.type).toBe("comment");
			expect(result.value.commentLabel).toBe("asdf");
			expect(result.value.commentBody).toBe("asdfff");
		})
		it(`Should parse "/* asdf: as as as */"`, function () {
			var testComment = `/* asdf: as as as */`;
			var result = patternParse.comment(testComment);
			expect(result.type).toBe("comment");
			expect(result.value.commentLabel).toBe("asdf");
			expect(result.value.commentBody).toBe("as as as");
		})

	})
	describe('Unlabeled comment detection', function () {
		it(`Should parse "/* asdf */"`, function () {
			var testComment = "/* asdf */";
			var result = patternParse.comment(testComment);
			expect(result.type).toBe("comment-unlabeled");
			expect(result.value).toBe("asdf");
		})
		it(`Should parse "/* Test! Woo */"`, function () {
			var testComment = `/* Test! Woo */`;
			var result = patternParse.comment(testComment);
			expect(result.type).toBe("comment-unlabeled");
			expect(result.value).toBe(`Test! Woo`);
		})
		it(`Should parse "/* "Test! Woo" */"`, function () {
			var testComment = `/* "Test! Woo" */`;
			var result = patternParse.comment(testComment);
			expect(result.type).toBe("comment-unlabeled");
			expect(result.value).toBe(`"Test! Woo"`);
		})
		it(`Should parse "/* "Test: Woo" */"`, function () {
			var testComment = `/* "Test: Woo" */`;
			var result = patternParse.comment(testComment);
			expect(result.type).toBe("comment-unlabeled");
			expect(result.value).toBe(`"Test: Woo"`);
		})
		it(`Should parse "/* ?!(<^>>) */"`, function () {
			var testComment = "/* ?!(<^>>) */";
			var result = patternParse.comment(testComment);
			expect(result.type).toBe("comment-unlabeled");
			expect(result.value).toBe("?!(<^>>)");
		})
	})
})
