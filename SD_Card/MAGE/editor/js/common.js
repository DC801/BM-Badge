var getFileJson = function (file) {
    return file.text()
        .then(function (text) {
            return JSON.parse(text);
        });
};

var combineArrayBuffers = function(bufferA, bufferB) {
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

var getPaddedHeaderLength = function(length) {
    // pad to to uint32_t alignment
    var mod = length % 4;
    return length + (
        mod
            ? 4 - mod
            : 0
    );
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
