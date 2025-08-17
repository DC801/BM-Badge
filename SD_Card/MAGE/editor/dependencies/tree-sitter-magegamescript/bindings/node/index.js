const root = require('path').join(__dirname, '..', '..');

export default typeof process.versions.bun === 'string'
	? // Support `bun build --compile` by being statically analyzable enough to find the .node file at build-time
		require(
			`../../prebuilds/${process.platform}-${process.arch}/tree-sitter-magegamescript.node`,
		)
	: require('node-gyp-build')(root);

try {
	module.exports.nodeTypeInfo = require('../../src/node-types.json');
} catch (_) {}
