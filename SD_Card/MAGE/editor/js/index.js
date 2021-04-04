
window.Vue.component(
	'inputty',
	{
		template: '#inputty'
	}
);

window.vueApp = new window.Vue({
	el: '#app',
	data: {
		uniqueEncodeAttempt: Math.random(),
		isLoading: false,
		error: null,
		downloadData: null,
		scenarioData: null,
		fileNameMap: null,
	},
	created: function () {
		console.log('Created');
	},
	methods: {
		closeError: function () {
			this.uniqueEncodeAttempt = Math.random();
			this.error = false;
		},
		closeSuccess: function () {
			this.uniqueEncodeAttempt = Math.random();
			this.downloadData = null;
		},
		prepareDownload: function (data, name) {
			var blob = new Blob(data, { type: 'octet/stream' });
			var url = window.URL.createObjectURL(blob);
			if (this.downloadData) {
				window.URL.revokeObjectURL(this.downloadData.url);
			}
			window.Vue.set(
				this,
				'downloadData',
				{
					href: url,
					target: '_blank',
					download: name
				}
			);
		},
		handleChange: function (event) {
			var fileNameMap = {};
			var vm = this;
			var filesArray = Array.prototype.slice.call(event.target.files);
			vm.isLoading = true;
			filesArray.forEach(function (file) {
				fileNameMap[file.name] = file;
			});
			var scenarioFile = fileNameMap['scenario.json'];
			try {
				if (!scenarioFile) {
					vm.error = 'No `scenario.json` file detected in folder, nowhere to start!';
				} else {
					getFileJson(scenarioFile)
						.then(handleScenarioData(fileNameMap))
						.then(function (scenarioData) {
							vm.fileNameMap = fileNameMap;
							vm.scenarioData = scenarioData;
							return scenarioData;
						})
						.then(generateIndexAndComposite)
						.then(function (compositeArray) {
							vm.prepareDownload([compositeArray], 'game.dat');
							vm.isLoading = false;
						})
						.catch(function (error) {
							console.error(error);
							vm.error = error.message;
							vm.isLoading = false;
						});
				}
			} catch (error) {
				vm.error = error.message;
				vm.isLoading = false;
			}
		}
	}
});
