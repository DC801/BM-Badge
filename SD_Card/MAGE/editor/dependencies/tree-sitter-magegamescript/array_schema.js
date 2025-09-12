var arrayActions = [
	{
		action: 'ARRAY_LOG',
		array_name: 'string',
	},
	{
		action: 'ARRAY_NEW',
		array_name: 'string',
	},
	{
		action: 'ARRAY_DELETE',
		array_name: 'string',
	},
	{
		action: 'ARRAY_LENGTH_INTO_VARIABLE',
		array_name: 'string',
		variable: 'string',
	},
	{
		action: 'ARRAY_WRITE_INTO_INDEX_FROM_VALUE',
		array_name: 'string',
		index: 999,
		value: 999,
	},
	{
		action: 'ARRAY_WRITE_INTO_INDEX_FROM_VARIABLE',
		array_name: 'string',
		index: 999,
		variable: 'string',
	},
	{
		action: 'ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VALUE',
		array_name: 'string',
		variable_index: 'string',
		value: 999,
	},
	{
		action: 'ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VARIABLE',
		array_name: 'string',
		variable_index: 'string',
		variable: 'string',
	},
	{
		action: 'ARRAY_READ_FROM_INDEX_INTO_VARIABLE',
		array_name: 'string',
		index: 999,
		variable: 'string',
	},
	{
		action: 'ARRAY_READ_FROM_VARIABLE_INDEX_INTO_VARIABLE',
		array_name: 'string',
		variable_index: 'string',
		variable: 'string',
	},
	{
		action: 'ARRAY_PUSH_FROM_VALUE',
		array_name: 'string',
		value: 999,
	},
	{
		action: 'ARRAY_PUSH_FROM_VARIABLE',
		array_name: 'string',
		variable: 'string',
	},
	{
		action: 'ARRAY_PUSH_LEFT_FROM_VALUE',
		array_name: 'string',
		value: 999,
	},
	{
		action: 'ARRAY_PUSH_LEFT_FROM_VARIABLE',
		array_name: 'string',
		variable: 'string',
	},
	{
		action: 'ARRAY_SLICE',
		array_source: 'string',
		array_destination: 'string',
		index_start: 999,
	},
	{
		action: 'ARRAY_SLICE_BY_VARIABLE',
		array_source: 'string',
		array_destination: 'string',
		variable_start: 'string',
	},
	{
		action: 'ARRAY_SLICE_TWICE',
		array_source: 'string',
		array_destination: 'string',
		index_start: 999,
		index_end: 999,
	},
	{
		action: 'ARRAY_SLICE_TWICE_BY_VARIABLE',
		array_source: 'string',
		array_destination: 'string',
		variable_start: 'string',
		variable_end: 'string',
	},
	{
		action: 'ARRAY_POP_INTO_VARIABLE',
		array_name: 'string',
		variable: 'string',
	},
	{
		action: 'ARRAY_POP_LEFT_INTO_VARIABLE',
		array_name: 'string',
		variable: 'string',
	},
	{
		action: 'ARRAY_REVERSE',
		array_name: 'string',
	},
	{
		action: 'ARRAY_SORT',
		array_name: 'string',
	},
];

var newActionsForArrays = {
	ARRAY_LOG: [{ propertyName: 'array_name', size: 1 }],
	ARRAY_NEW: [{ propertyName: 'array_name', size: 1 }],
	ARRAY_DELETE: [{ propertyName: 'array_name', size: 1 }],
	ARRAY_PUSH_FROM_VALUE: [
		{ propertyName: 'value', size: 2 },
		{ propertyName: 'array_name', size: 1 },
	],
	ARRAY_PUSH_FROM_VARIABLE: [
		{ propertyName: 'array_name', size: 1 },
		{ propertyName: 'variable', size: 1 },
	],
	ARRAY_SLICE: [
		{ propertyName: 'array_source', size: 1 },
		{ propertyName: 'array_destination', size: 1 },
		{ propertyName: 'index_start', size: 1, dataViewMethodName: 'setInt8' },
	],
	ARRAY_SLICE_BY_VARIABLE: [
		{ propertyName: 'variable_start', size: 2 },
		{ propertyName: 'array_source', size: 1 },
		{ propertyName: 'array_destination', size: 1 },
	],
	ARRAY_SLICE_TWICE: [
		{ propertyName: 'array_source', size: 1 },
		{ propertyName: 'array_destination', size: 1 },
		{ propertyName: 'index_start', size: 1, dataViewMethodName: 'setInt8' },
		{ propertyName: 'index_end', size: 1, dataViewMethodName: 'setInt8' },
	],
	ARRAY_SLICE_TWICE_BY_VARIABLE: [
		{ propertyName: 'variable_start', size: 2 },
		{ propertyName: 'variable_end', size: 2 },
		{ propertyName: 'array_source', size: 1 },
		{ propertyName: 'array_destination', size: 1 },
	],
};
var aaaaaaaaaaaaaaaarays = {
	ARRAY_LOG: [{ propertyName: 'array_name', size: 1 }],
	ARRAY_NEW: [{ propertyName: 'array_name', size: 1 }],
	ARRAY_DELETE: [{ propertyName: 'array_name', size: 1 }],
	ARRAY_LENGTH_INTO_VARIABLE: [
		{ propertyName: 'array_name', size: 1 },
		{ propertyName: 'variable', size: 1 },
	],
	ARRAY_WRITE_INTO_INDEX_FROM_VALUE: [
		{ propertyName: 'value', size: 2 },
		{ propertyName: 'array_name', size: 1 },
		{ propertyName: 'index', size: 1, dataViewMethodName: 'setInt8' },
	],
	ARRAY_WRITE_INTO_INDEX_FROM_VARIABLE: [
		{ propertyName: 'variable', size: 1 },
		{ propertyName: 'array_name', size: 1 },
		{ propertyName: 'index', size: 1, dataViewMethodName: 'setInt8' },
	],
	ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VALUE: [
		{ propertyName: 'value', size: 2 },
		{ propertyName: 'array_name', size: 1 },
		{ propertyName: 'variable_index', size: 1 },
	],
	ARRAY_WRITE_INTO_VARIABLE_INDEX_FROM_VARIABLE: [
		{ propertyName: 'variable', size: 1 },
		{ propertyName: 'array_name', size: 1 },
		{ propertyName: 'variable_index', size: 1 },
	],
	ARRAY_READ_FROM_INDEX_INTO_VARIABLE: [
		{ propertyName: 'variable', size: 1 },
		{ propertyName: 'array_name', size: 1 },
		{ propertyName: 'index', size: 1, dataViewMethodName: 'setInt8' },
	],
	ARRAY_READ_FROM_VARIABLE_INDEX_INTO_VARIABLE: [
		{ propertyName: 'variable', size: 1 },
		{ propertyName: 'array_name', size: 1 },
		{ propertyName: 'variable_index', size: 1 },
	],
	ARRAY_PUSH_FROM_VALUE: [
		{ propertyName: 'value', size: 2 },
		{ propertyName: 'array_name', size: 1 },
	],
	ARRAY_PUSH_FROM_VARIABLE: [
		{ propertyName: 'array_name', size: 1 },
		{ propertyName: 'variable', size: 1 },
	],
	ARRAY_PUSH_LEFT_FROM_VALUE: [
		{ propertyName: 'value', size: 2 },
		{ propertyName: 'array_name', size: 1 },
	],
	ARRAY_PUSH_LEFT_FROM_VARIABLE: [
		{ propertyName: 'array_name', size: 1 },
		{ propertyName: 'variable', size: 1 },
	],
	ARRAY_SLICE: [
		{ propertyName: 'array_source', size: 1 },
		{ propertyName: 'array_destination', size: 1 },
		{ propertyName: 'index_start', size: 1, dataViewMethodName: 'setInt8' },
	],
	ARRAY_SLICE_BY_VARIABLE: [
		{ propertyName: 'variable_start', size: 2 },
		{ propertyName: 'array_source', size: 1 },
		{ propertyName: 'array_destination', size: 1 },
	],
	ARRAY_SLICE_TWICE: [
		{ propertyName: 'array_source', size: 1 },
		{ propertyName: 'array_destination', size: 1 },
		{ propertyName: 'index_start', size: 1, dataViewMethodName: 'setInt8' },
		{ propertyName: 'index_end', size: 1, dataViewMethodName: 'setInt8' },
	],
	ARRAY_SLICE_TWICE_BY_VARIABLE: [
		{ propertyName: 'variable_start', size: 2 },
		{ propertyName: 'variable_end', size: 2 },
		{ propertyName: 'array_source', size: 1 },
		{ propertyName: 'array_destination', size: 1 },
	],
	ARRAY_POP_INTO_VARIABLE: [
		{ propertyName: 'variable', size: 1 },
		{ propertyName: 'array_name', size: 1 },
	],
	ARRAY_POP_LEFT_INTO_VARIABLE: [
		{ propertyName: 'variable', size: 1 },
		{ propertyName: 'array_name', size: 1 },
	],
};
