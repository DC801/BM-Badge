var outputBuffer = document.getElementById('output');
var inputForm = document.getElementById('input_form');
var commandInput = document.getElementById('command_input');
outputBuffer.innerHTML = '';
var appendMessage = function (input, classname) {
	var newMessage = document.createElement('div');
	newMessage.className = classname;
	newMessage.innerText = input;
	outputBuffer.appendChild(newMessage);
	outputBuffer.scrollTo(0, outputBuffer.scrollHeight);
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
