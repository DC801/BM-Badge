var ENGINE_VERSION = 11; // MUST BE BUMPED BY WHOLE NUMBERS WHEN ENGINE CHANGES DATA SHAPES!!!
var IS_LITTLE_ENDIAN = true;
var IS_SCREEN_LITTLE_ENDIAN = false;
var IS_GLITCHED_FLAG = 0b10000000;
var IS_DEBUG_FLAG = 0b01000000;
var IS_FLIPPED_DIAGONAL_FLAG = 0b00000001;
var MAX_ENTITIES_PER_MAP = 64;
var DIALOG_SCREEN_NO_PORTRAIT = 255;
var DIALOG_SCREEN_NO_ENTITY = 255;

var getFileJson = function (file) {
	return file.text()
		.then(JSON.parse);
};

var combineArrayBuffers = function (bufferA, bufferB) {
	var temp = new Uint8Array(bufferA.byteLength + bufferB.byteLength);
	temp.set(new Uint8Array(bufferA), 0);
	temp.set(new Uint8Array(bufferB), bufferA.byteLength);
	return temp.buffer;
};

var setCharsIntoDataView = function (
	dataView,
	string,
	offset,
	maxLength
) {
	var source = string.slice(0, maxLength);
	for (var i = 0; i < source.length; i++) {
		dataView.setUint8(
			i + offset,
			source.charCodeAt(i)
		);
	}
};

var getPaddedHeaderLength = function (length) {
	// pad to to uint32_t alignment
	var mod = length % 4;
	return length + (
		mod
			? 4 - mod
			: 0
	);
};

var convertTextOptionsToResponses = function (textOptions) {
	var result = [];
	var textOptionKeys = Object.keys(textOptions || {});
	if (textOptionKeys.length) {
		result = textOptionKeys.map(function (key) {
			return {
				label: key.toLocaleLowerCase(),
				script: textOptions[key],
			};
		});
	}
	return result;
};

var propertyTypeHandlerMap = {
	'object': function (value, targetSourceList) {
		// tiled object ids always start at 1
		return value === 0
			? null
			: targetSourceList.find(function (item) {
				return item.id === value;
			});
	},
	'string': function (value, targetSourceList) {
		return value;
	},
	'bool': function (value, targetSourceList) {
		return value === true;
	},
	'color': function (value, targetSourceList) {
		var chunks = value
			.replace('#', '')
			.match(/.{1,2}/g)
			.map(function (chunk) {
				return parseInt(chunk, 10);
			});
		return rgbaToC565(
			chunks[1],
			chunks[2],
			chunks[3],
			chunks[0]
		);
	},
	'file': function (value, targetSourceList) {
		return value;
	},
	'float': function (value, targetSourceList) {
		return parseFloat(value);
	},
	'int': function (value, targetSourceList) {
		return parseInt(value, 10);
	}
};

var mergeInProperties = function (target, properties, targetSourceList) {
	var list = targetSourceList || [];
	if (properties) {
		properties.forEach(function (property) {
			target[property.name] = propertyTypeHandlerMap[property.type](
				property.value,
				list
			);
		});
	}
	return target;
};

var assignToLessFalsy = function () {
	var inputArray = Array.prototype.slice.call(arguments);
	var target = inputArray.shift();
	inputArray.forEach(function (source) {
		Object.keys(source).forEach(function (key) {
			var value = source[key];
			if (
				value === ""
				|| value === undefined
				|| value === null
			) {
				value = target[key];
			}
			if (
				value === ""
				|| value === undefined
				|| value === null
			) {
				value = null;
			}
			target[key] = value;
		});
	});
	return target;
};

var jsonClone = function (input) {
	return JSON.parse(JSON.stringify(input));
};

var makeComputedStoreGetterSetter = function (propertyName) {
	return {
		get: function () {
			return this.$store.state[propertyName]
		},
		set: function (value) {
			return this.$store.commit('GENERIC_MUTATOR', {
				propertyName: propertyName,
				value: value,
			});
		}
	}
};

var makeComputedStoreGetterSettersMixin = function (config) {
	var vuexPropertyNames = config;
	var computedNames = config;
	var computed = {};
	if (!(config instanceof Array)) {
		vuexPropertyNames = Object.values(config);
		computedNames = Object.keys(config);
	}
	vuexPropertyNames.forEach(function (vuexPropertyName, index) {
		computed[computedNames[index]] = makeComputedStoreGetterSetter(
			vuexPropertyName
		);
	});
	return {
		computed: computed
	};
}

var makeFileChangeTrackerMixinByResourceType = function (resourceName) {
	var fileMapPropertyName = resourceName + 'FileItemMap';
	var resourceJsonStatePropertyName = resourceName + 'JsonOutput'
	var changedFileMapPropertyName = resourceName + 'ChangedFileMap'
	return {
		computed: {
			startFileMap: function () {
				return this.getAllRecombinedFilesForResource(this.initState, resourceName);
			},
			[changedFileMapPropertyName]: function () {
				var result = {}
				var currentFileMap = this.getAllRecombinedFilesForResource(this.currentData, resourceName)
				var startFileMap = this.startFileMap
				Object.keys(currentFileMap).forEach(function (fileName) {
					if (currentFileMap[fileName] !== startFileMap[fileName]) {
						result[fileName] = currentFileMap[fileName]
					}
				})
				return result;
			},
			[resourceJsonStatePropertyName]: function () {
				return JSON.stringify(this.currentData[fileMapPropertyName]);
			},
			[resourceName + 'NeedSave']: function () {
				return Object.keys(this[changedFileMapPropertyName]).length > 0;
			},
		},
		methods: {
			getAllRecombinedFilesForResource (source, resourceName) {
				var fileMapPropertyName = resourceName + 'FileItemMap';
				var self = this;
				var result = {};
				Object.keys(
					source[fileMapPropertyName]
				).forEach(function (fileName) {
					result[fileName] = self.recombineFileForResource(
						fileName,
						source
					);
				});
				return result
			},
			recombineFileForResource (fileName, source) {
				var resourceNamesInFile = source[fileMapPropertyName][fileName];
				var result = {};
				resourceNamesInFile.forEach(function (scriptName) {
					result[scriptName] = source[resourceName][scriptName];
				});
				return JSON.stringify(result, null, '\t') + '\n';
			},
		}
	}
}
