var terminalFrame = document.getElementById('terminal_iframe');

var stdinMessage = '';
var commandComplete = false;
// Why one charCode at a time?
// That's the only way Emscripten allows a stdin replacement.
var stdin = function () {
	var result = null;
	if (stdinMessage.length) {
		var split = stdinMessage.split('');
		var char = split.shift();
		stdinMessage = split.join('');
		result = char.charCodeAt(0);
		if (!split.length && !commandComplete) {
			stdinMessage = '\n';
			commandComplete = true;
		} else {
			commandComplete = false;
		}
	}
	return result;
};
var installStdInReplacement = function (FS) {
	// use our stdin replacement because the default is idiotically window.alert
	FS.init(stdin);
};
var enterCommand = function (command) {
	stdinMessage = command;
};

// pass messages to stdin, but triggered from a child frame:
// Why in a frame? Because SDL event handlers capture ALL INPUT
// on the page and prevent text entry into simple form inputs.
// So break out of that garbage and restore normal form behavior
// into a context it can't possibly break: a child frame.
window.addEventListener('message', function (messageEvent) {
	enterCommand(messageEvent.data);
});

// Emscripten generates a bunch of non-actionable noise which
// should be passed through to browser console log/warn,
// and NOT POLLUTING stdout/stderr!!! Filter that garbage!
var emscriptenLogNoiseIndicators = [
	'Incorrect response MIME type',
	'ArrayBuffer instantiation',
	'Calling stub',
	'emscripten_',
]
var detectEmscriptenNoise = function (message) {
	return emscriptenLogNoiseIndicators.every(function (noiseIndicator) {
		return !message.includes(noiseIndicator);
	});
};

// emulate stdout/stderr, passing messages to a child frame:
// to allow the ability to use normal keyboard/focus interaction
// inside of the terminal frame, because that would normally be
// ruined by the overly aggressive SDL input event handling.
var consoleSourceKey = {
	stdin: 'log',
	stderr: 'warn',
};
var createOutputFunction = function (source) {
	return function (message) {
		// console.log(output);
		if (detectEmscriptenNoise(message)) {
			terminalFrame.contentWindow.postMessage(
				{
					source: source,
					value: message
				},
				window.origin,
			)
		} else {
			console[consoleSourceKey[source]](message);
		}
	}
};

// because clicking on the canvas itself gets preventDefault'd
// by the SDL click handlers, and that stops that the parent
// window from getting a focus event follow-through, so call it
// manually here, so player can resume playing game by clicking
// on the canvas after typing in the terminal. :facepalm:
var focusParentWindowOnCanvasInteraction = function () {
	window.focus();
};
window.addEventListener('mousedown', focusParentWindowOnCanvasInteraction);
window.addEventListener('touchstart', focusParentWindowOnCanvasInteraction);
