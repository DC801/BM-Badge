var convert = new window.ansiToHtml();
var outputBuffer = document.getElementById('output');
var inputForm = document.getElementById('input_form');
var commandInput = document.getElementById('command_input');
outputBuffer.innerHTML = '';
var appendMessage = function (input, classname) {
	var newMessage = document.createElement('div');
	newMessage.className = classname;
	newMessage.innerHTML = convert.toHtml(input);
	outputBuffer.appendChild(newMessage);
	outputBuffer.scrollTo(0, outputBuffer.scrollHeight);
	// system bell
	if (input.includes("\u0007")) {
		outputBuffer.className = "flash";
		requestAnimationFrame(function () {
			outputBuffer.className = "";
		});
	}
};

window.addEventListener('message', function (messageEvent) {
	appendMessage(messageEvent.data.value, messageEvent.data.source);
});

inputForm.addEventListener('submit', function (event) {
	event.preventDefault();
	window.parent.postMessage(
		commandInput.value,
		window.parent.origin
	);
	commandInput.value = '';
});

// When bringing focus into this window at all from the parent,
// there's a 99% chance you actually want to type terminal input,
// so focus the input directly.
var makeFocusInputOnTerminalFrameInteract = function (logName) {
	return function (event) {
		// console.log('focusInputOnTerminalFrameFocus:', {
		// 	event: logName,
		// 	activeElement: document.activeElement,
		// });
		if (document.activeElement === document.body) {
			event.preventDefault();
			commandInput.focus();
		}
	};
};
document.addEventListener('mousedown', makeFocusInputOnTerminalFrameInteract('mousedown'));
document.addEventListener('touchstart', makeFocusInputOnTerminalFrameInteract('touchstart'));
window.addEventListener('focusin', makeFocusInputOnTerminalFrameInteract('focusin'));
