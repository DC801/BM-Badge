var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
context.fillStyle = '#000';
context.fillRect(0, 0, canvas.width, canvas.height);
context.fillStyle = '#dc8';
context.textAlign = 'center';
context.font = '32px monospace';
context.fillText(
	':: LOAFING ::',
	(canvas.width / 2),
	(canvas.height / 2) + 8,
);

var loadedDataMap = {};
var createdPaths = {};
var mkdirp = function (_pathSplit) {
	var pathSplit = _pathSplit.slice();
	var joined = pathSplit.join('/');
	var parent = '';
	while (pathSplit.length) {
		var item = pathSplit.shift();
		if (!createdPaths[joined]) {
			FS.createPath(
				parent || '/',
				item,
				true,
				true
			);
			parent += '/' + item;
			createdPaths[parent] = true;
		}
	}
};
var addLoadedFilePathToVirtualFS = function (path) {
	var pathSplit = path.split('/');
	var fileName = pathSplit.pop();
	var parent = '/' + pathSplit.join('/');
	mkdirp(pathSplit);
	FS.createDataFile(
		parent,
		fileName,
		loadedDataMap[path],
		true,
		false
	);
};
var Module = {
	canvas: canvas, // compensates for emscripten startup weirdness - IMPORTANT
	preInit: function() {
		Object.keys(loadedDataMap).forEach(addLoadedFilePathToVirtualFS);
	}
};

// TODO: Use FS.writeFile(path, data, opts) to write new `game.dat` when drug into window
// REF: https://emscripten.org/docs/api_reference/Filesystem-API.html#FS.writeFile

var fetchBinaryDataFromPath = function (path) {
	return fetch(path).then(function (file) {
		return file.arrayBuffer().then(function (arrayBuffer) {
			return loadedDataMap[path] = new Uint8Array(arrayBuffer);
		});
	});
};


var filesToPreload = [
	'MAGE/desktop_assets/window_frame.png',
	'MAGE/desktop_assets/window_frame-button.png',
	'MAGE/desktop_assets/window_frame-led.png',
	'MAGE/game.dat',
];

var fileLoadPromises = filesToPreload.map(fetchBinaryDataFromPath);

Promise.all(fileLoadPromises)
	.then(function(resolvedFiles) {
		console.log('resolvedFiles', resolvedFiles);
		var scriptElement = document.createElement('script');
		scriptElement.src = './bm_badge.js';
		document.body.appendChild(scriptElement);
	});
