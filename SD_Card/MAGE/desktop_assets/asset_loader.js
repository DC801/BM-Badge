var textDecoder = new TextDecoder();
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
var setDataToPathInVirtualFS = function (path, uintArray) {
	var pathSplit = path.split('/');
	var fileName = pathSplit.pop();
	var parent = '/' + pathSplit.join('/');
	mkdirp(pathSplit);
	FS.createDataFile(
		parent,
		fileName,
		uintArray,
		true,
		false
	);
};
var addLoadedFilePathToVirtualFS = function (path) {
	setDataToPathInVirtualFS(
		path,
		loadedDataMap[path],
	)
};
var enableSaveFilePersistence = function () {
	var saveFilePath = 'MAGE/save_games';
	var split = saveFilePath.split('/');
	mkdirp(split);
	FS.mount(
		window.IDBFS,
		{},
		saveFilePath
	);
	return new Promise(function (resolve, reject) {
		FS.syncfs(true, function (err) {
			if (err) {
				reject(err);
			} else {
				console.log('IDBFS state applied to Virtual Filesystem');
				resolve();
			}
		});
	});
};
var emscriptenReadyResolve;
var emscriptenReadyPromise = new Promise(function (resolve, reject) {
	emscriptenReadyResolve = function (err) {
		if (err) {
			reject(err);
		} else {
			console.log('Emscripten reports `RuntimeInitialized`, game ready to launch');
			resolve();
		}
	};
});
var Module = {
	canvas: canvas, // compensates for emscripten startup weirdness - IMPORTANT
	noInitialRun: true, // because preInit isn't promise based, need to start manually
	onRuntimeInitialized: emscriptenReadyResolve,
	preInit: function() {
		Object.keys(loadedDataMap).forEach(addLoadedFilePathToVirtualFS);
		Promise.all([
			enableSaveFilePersistence(),
			emscriptenReadyPromise,
		])
			.then(function () {
				// Starts the WebAssembly main loop in the most normal way possible,
				// considering that we're disabling it via `noInitialRun` above.
				Module.callMain();
			});
	},
	// May look unused, but is actually called by C code
	persistSaveFiles: function () {
		FS.syncfs(false, function (err) {
			if (err) {
				throw err;
			} else {
				console.log('Save files persisted to IndexedDB, probably.');
			}
		});
	},
};

var fetchBinaryDataFromPath = function (path) {
	return localforage.getItem(path).then(function (content) {
		var result = content;
		if (result === null) {
			result = fetch(path).then(function (file) {
				return file.arrayBuffer().then(function (arrayBuffer) {
					return localforage.setItem(path, arrayBuffer);
				});
			})
		}
		return result;
	})
		.then(function (arrayBuffer) {
			return loadedDataMap[path] = new Uint8Array(arrayBuffer);
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

var handleFileDropIntoPage = function(event) {
	event.preventDefault();
	if (event.type === 'drop') {
		var itemList = Array.prototype.slice.call(event.dataTransfer.items);
		var item = itemList[0];
		var file = item.getAsFile();
		console.log('handleFileDropIntoPage', event, file);
		file.arrayBuffer().then(function (arrayBuffer) {
			var uint8Array = new Uint8Array(arrayBuffer);
			var headerStringUint8Array = uint8Array.slice(0, 8);
			var headerText = textDecoder.decode(headerStringUint8Array);
			if (headerText !== 'MAGEGAME') {
				alert('The file you dragged is not a valid `MAGEGAME` data file!');
			} else {
				var headerCrc32Uint8Array = uint8Array.slice(8, 12);
				var headerCrc32String = (
					'0x'
					+ Array.from(headerCrc32Uint8Array)
						.map((value)=>value.toString(16))
						.join('')
				);
				var headerLengthUint32Array = new Uint32Array(uint8Array.slice(12, 16));
				var path = 'Dragged';
				var gameHeaderLabel = [
					'Source: ' + path,
					'CRC32: ' + headerCrc32String,
					'Length: ' + headerLengthUint32Array[0],
				].join(' | ');
				console.log('handleFileDropIntoPage:gameHeaderLabel');
				console.log(gameHeaderLabel);
				// don't persist this until we add GUI to allow users to delete bad ROMs
				FS.unlink('MAGE/game.dat');
				setDataToPathInVirtualFS(
					'MAGE/game.dat',
					uint8Array,
				);
				Module.ccall('EngineTriggerRomReload');
			}
		});
	}
};

// weirdly, if you don't preventDefault on dragover & dragenter,
// your drop handler will never fire???
document.body.addEventListener('dragover', handleFileDropIntoPage);
document.body.addEventListener('dragenter', handleFileDropIntoPage);
document.body.addEventListener('drop', handleFileDropIntoPage);
