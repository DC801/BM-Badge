var fs = require('fs');
var testJSON = require('./natlang.testdata.json');
var stableStringify = require('fast-json-stable-stringify');

const natlang = require('../natlang-parse.js');
const mgs = require('../mgs_json_to_natlang.js');

var mgsTestConfig = natlang.prepareConfig(mgs);

describe('Natlang test suite', function () {
	describe('Lex: single word', function () {
		Object.entries(testJSON.decay).forEach(function (item) {
			var origNatlang = item[1].natlang;
			it(`Should correctly make tokens from: ${origNatlang}`, function () {
				var expected = [ item[1].token ];
				var result = natlang.lex(origNatlang).tokens;
				expect(stableStringify(result)).toBe(stableStringify(expected));
			})
		})
	})
	describe('Lex: dialog settings', function () {
		var origNatlang = testJSON.lex.dialogSettings.inputString;
		var tokens = testJSON.lex.dialogSettings.tokens;
		it(`Should correctly make tokens from the "dialog settings" snippet`, function () {
			var expected = tokens;
			var result = natlang.lex(origNatlang).tokens;
			expect(stableStringify(result)).toBe(stableStringify(expected));
		})
	})
	describe('Parse: value decay', function () {
		Object.entries(natlang.decayTo).forEach(function (decaySplits) {
			Object.values(testJSON.decay).forEach(function (testItem) {
				var decayType = decaySplits[0];
				var decayFunction = decaySplits[1];
				it(`Should determine ${decayType} decay for: ${testItem.natlang}`, function () {
					var expected = testItem.decayValues[decayType];
					var result = decayFunction(testItem.token);
					expect(result).toStrictEqual(expected);
				})
			})
		})
	})
	describe('Parse: tryBranch (match fail)', function () {
		var branchTestData = testJSON.tryBranchFails;
		Object.keys(branchTestData).forEach(function (branchName) {
			describe(branchName + ' test input', function () {
				Object.keys(branchTestData[branchName]).forEach(function (inputString) {
					var lex = natlang.lex(inputString);
					var testData = branchTestData[branchName][inputString]
					var tokens = lex.tokens;
					describe(inputString, function () {
						var attempt = natlang.tryBranch(tokens, 0, mgsTestConfig.parseTrees[branchName])
						it(`Should match the above pattern`, function () {
							var result = attempt.success;
							var expected = testData.success;
							expect(result).toStrictEqual(expected);
						})
						it(`Should get as far as ${testData.tokenCount} token(s)`, function () {
							var result = attempt.tokenCount;
							var expected = testData.tokenCount;
							expect(result).toStrictEqual(expected);
						})
						it(`Should have found: ${testData.found}`, function () {
							var result = attempt.found;
							var expected = testData.found;
							expect(result).toStrictEqual(expected);
						})
						it(`Should have expected: ${testData.expected}`, function () {
							var result = attempt.expected;
							var expected = testData.expected;
							expect(result).toStrictEqual(expected);
						})
					})
				})
			})
		})
	})
	describe('Parse: tryBranch (match success)', function () {
		var branchTestData = testJSON.tryBranch;
		Object.keys(branchTestData).forEach(function (branchName) {
			describe(branchName + ' test input', function () {
				Object.keys(branchTestData[branchName]).forEach(function (inputString) {
					var lex = natlang.lex(inputString);
					var testData = branchTestData[branchName][inputString]
					var tokens = lex.tokens;
					describe(inputString, function () {
						var attempt = natlang.tryBranch(tokens, 0, mgsTestConfig.parseTrees[branchName])
						it(`Should match the above pattern`, function () {
							var result = attempt.success;
							var expected = testData.success;
							expect(result).toStrictEqual(expected);
						})
						it(`Should count ${testData.tokenCount} token(s)`, function () {
							var result = attempt.tokenCount;
							var expected = testData.tokenCount;
							expect(result).toStrictEqual(expected);
						})
						it(`Should capture some data (maybe)`, function () {
							var result = attempt.captures;
							var expected = testData.captures;
							expect(stableStringify(result)).toBe(stableStringify(expected));
						})
					})
				})
			})
		})
	})
	describe('Parse: buildDialogFromState', function () {
		it(`Should make a dialog from "state" object`, function () {
			var expected = testJSON.buildDialogFromState[0].result;
			var result = mgs.buildDialogFromState(testJSON.buildDialogFromState[0].state);
			expect(stableStringify(result)).toBe(stableStringify(expected));
		})
	})
	describe('Parse: action gamut (tryBranch)', function () {
		testJSON.actionGamut.forEach(function (entry) {
			for (var index = 0; index < entry.natlang.length; index++) {
				var pattern = entry.natlang[index];
				describe(`Pattern: ${pattern}`, function () {
					var lex = natlang.lex(pattern);
					it(`Should generate tokens`, function () {
						expect(lex.success).toStrictEqual(true);
					})
					var tokens = lex.tokens;
					var tryBranch = natlang.tryBranch(tokens,0,mgsTestConfig.parseTrees.action);
					it(`Should parse successfully`, function () {
						expect(tryBranch.success).toStrictEqual(true);
					})
					var parse = natlang.parse(mgs,'testScript {' + pattern + "}");
					var result = parse.scripts.testScript[0];
					var expected = entry.json;
					it(`Should generate JSON`, function () {
						expect(stableStringify(result)).toBe(stableStringify(expected));
					})
				})
			}
		})
	})
	describe('To natlang: action gamut', function () {
		testJSON.actionGamut.forEach(function (entry) {
			var targetJSON = entry.json;
			var expected = entry.natlang[0];
			var result = mgs.actionToNatlang(targetJSON, '').trim();
			it(`Should generate: ${entry.natlang[0]}`, function () {
				expect(result).toStrictEqual(expected);
			})
		})
	})
	describe('Full circle', function () {
		var expected = testJSON.dialogCircle;
		var inputString = mgs.intelligentDialogHandler(expected).naiveString;
		var result = natlang.parse(mgs, inputString).dialogs;
		it(`Should translate dialog JSON to natlang and back`, function () {
			expect(stableStringify(result)).toBe(stableStringify(expected));
		})
	})
})

// npm run test