var fs = require('fs');
var testJSON = require('./mgs.testdata.json');
var stableStringify = require('fast-json-stable-stringify');

const natlang = require('../natlang-parse.js');
const zigzag = require('../mgs-macro-zigzag.js');
const constants = require('../mgs-macro-constants.js');

// describe('Zigzag macro test suite', function () {
// 	describe('Pass tests', function () {
// 		testJSON.zigzagTestsGood.forEach(function (item, index) {
// 			it(`Should flatten zigzag #${index}`, function () {
// 				var expected = item.expectedOutput;
// 				var result = zigzag.process(item.lex.tokens);
// 				expect(stableStringify(result)).toBe(stableStringify(expected));
// 			})
// 		})
// 	})
// 	describe('Fail tests', function () {
// 		testJSON.zigzagTestsFail.forEach(function (item) {
// 			var tokens = natlang.lex(item.inputString);
// 			var substring = item.errorSubstring;
// 			test(substring, () => {
// 				expect(() => {
// 					zigzag.process(tokens.tokens);
// 				}).toThrow(substring);
// 			})
// 		})
// 	})
// })
describe('Constants macro test suite', function () {
	describe('Pass tests', function () {
		testJSON.constantsTestsGood.forEach(function (item, index) {
			it(`Should hardcode constants in set #${index}`, function () {
				var expected = item.outputTokens;
				var tokens = natlang.lex(item.inputString);
				var result = constants.process(tokens);
				expect(stableStringify(result)).toBe(stableStringify(expected));
			})
		})
	})
	describe('Fail tests', function () {
		testJSON.zigzagTestsFail.forEach(function (item) {
			var tokens = natlang.lex(item.inputString);
			var substring = item.errorSubstring;
			test(substring, () => {
				expect(() => {
					zigzag.process(tokens.tokens);
				}).toThrow(substring);
			})
		})
	})
})

// npm run test
