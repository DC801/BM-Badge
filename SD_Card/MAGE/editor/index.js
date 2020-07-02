window.Vue.component(
	'inputty',
	{
		template: '#inputty'
	}
);
var c565 = function (r, g, b, a) {
	return a < 100
		? 32
		: (((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3));
};
var supportedImageTypes = ['png', 'gif'];
window.vueApp = new window.Vue({
	el: '#app',
	data: {
		jsonValue: '',
		downloadData: null,
	},
	created: function () {
		console.log('Created');
	},
	methods: {
		prepareDownload: function (data, name) {
			var blob = new Blob(data, {type: 'octet/stream'});
			var url = window.URL.createObjectURL(blob);
			if(this.downloadData) {
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
			Promise.all(filesArray.map(function (file) {
				var result;
				var mimeTypeSuffix = file.type.split('/').pop();
				fileNameMap[file.name] = file;
				console.log('file.name', file.name);
				if (supportedImageTypes.indexOf(mimeTypeSuffix) > -1) {
					console.log('	IT THINKS IT IS IMAGE!!!');
					var blobUrl = URL.createObjectURL(file);
					result = new Promise(function (resolve) {
						window.getPixels(
							blobUrl,
							file.type,
							function (error, result) {
								if(error){
									reject(error);
								} else {
									resolve(result);
								}
							}
						);
					})
						.catch(console.error)
						.then(function (result) {
							URL.revokeObjectURL(blobUrl);
							console.log(
								file.name,
								result
							);
							var width = result.shape[0];
							var height = result.shape[1];
							var hasAlpha = result.shape[2] === 4;
							var dataLength = width * height;
							var dataSize = 2;
							var data = new Uint8Array(dataLength * dataSize);
							var offset = 0;
							while (offset < dataLength) {
								var readOffset = offset * result.shape[2];
								var view = [
									result.data[readOffset],
									result.data[readOffset + 1],
									result.data[readOffset + 2],
									hasAlpha
										? result.data[readOffset + 3]
										: 255
								];
								var color = c565.apply(
									null,
									view
								);
								// console.log('view, color', view, color);

								// fix endianness of output, little -> big
								data.set([color >> 8], offset * dataSize);
								data.set([color & 255], (offset * dataSize) + 1);
								offset += 1;
							}
							return {
								file: file,
								data: data
							};
						});
				} else {
					console.log('	IS NOT IMAGE');
					result = file.arrayBuffer().then(function (data) {
						console.log('event.target.files[0].arrayBuffer resolved', data);
						var uint8 = new Uint8Array(data);
						console.log('uint8', uint8);
						return {
							file: file,
							data: uint8
						};
					});
				}
				return result;
			}))
				.then(function (fileAndDataArray) {
					var compositeSize = fileAndDataArray.reduce(
						function (accumulator, item) {
							return accumulator + item.data.byteLength;
						},
						0
					);
					var compositeArray = new Uint8Array(compositeSize);
					var currentOffset = 0;
					fileAndDataArray.forEach(function (item) {
						compositeArray.set(item.data, currentOffset);
						currentOffset += item.data.byteLength;
					});
					console.log(
						'compositeArray',
						compositeArray
					);
					vm.prepareDownload([compositeArray], 'game.dat');
				});
		}
	}
});
