// These no longer work

const tryBranchTests = [
	{
		input: `include!("header.mgs")\nadd`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: false,  nextPos: 5,
	},
	{
		input: `include("header.mgs")\nadd`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: true,  nextPos: 4,
	},
	{
		input: `include!()\nadd`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: true,  nextPos: 4,
	},
	{
		input: `include()\nadd`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: true,  nextPos: 3,
	},
	{
		input: `include(\nadd`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: true,  nextPos: 3,
	},
	{
		input: `include( add`, branchName: 'include_macro', branchID: 0,
		matched: true, malformed: true,  nextPos: 2,
	},
	{
		input: `$trombones = 76;`, branchName: 'constant_assignment', branchID: 0,
		matched: true, malformed: false, nextPos: 4,
	},
	{
		input: `$trombones = ;`, branchName: 'constant_assignment', branchID: 0,
		matched: true, malformed: true, nextPos: 3,
	},
];
tryBranchTests.forEach((test, i)=>{
	test.tokens = lex(test.input).tokens;
	test.tree = tree;
	test.stack = [{
		branchName: test.branchName,
		startPos: 0,
	}];
});
const testCrawl = {
	tokenPos: 0,
	captures: [],
	unusedLabels: [],
	nodes: [],
	stack: [],
};
let passedTests = 0;
const failedTests = [];
tryBranchTests.forEach((test, i)=>{
	const branch = tree[test.branchName][test.branchID];
	const crawlState = JSON.parse(JSON.stringify(testCrawl));
	crawlState.stack = test.stack;
	const tried = tryBranch(test, crawlState, branch);
	const nextPosTest = tried.crawlState.tokenPos === test.nextPos;
	const matchedTest = (tried.report.matched || false) === test.matched;
	const malformedTest = (tried.report.malformed || false) === test.malformed;
	if (nextPosTest && matchedTest && malformedTest) {
		passedTests += 1;
	} else {
		const testReport = {
			testID: i,
			test: test.input,
		};
		if (!nextPosTest) {
			testReport.nextPos = {expected: test.nextPos, found: tried.crawlState.tokenPos};
		}
		if (!matchedTest) {
			testReport.matched = {expected: test.matched, found: tried.report.matched};
		}
		if (!malformedTest) {
			testReport.malformed = {expected: test.malformed, found: tried.report.malformed};
		}
		failedTests.push(testReport);
	}
});
if (failedTests.length > 0) {
	console.log(failedTests);
}
