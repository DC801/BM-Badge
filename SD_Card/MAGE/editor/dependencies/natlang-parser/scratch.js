var typeInfo = {
	u2: {
		natlangType: "number",
		jsonPropertyName: {
			check: "expected_u2",
			set: "u2_value",
		},
	},
	byte: {
		natlangType: "number",
		jsonPropertyName: {
			check: "expected_byte",
			set: "byte_value",
		},
	},
	script: {
		natlangType: "string",
		jsonPropertyName: {
			check: "expected_script",
			set: "script",
		},
	},
	entity_type: {
		natlangType: "string",
		jsonPropertyName: "entity_type",
	},
	string: {
		natlangType: "string",
		jsonPropertyName: "string",
	},
	geometry: {
		natlangType: "string",
		jsonPropertyName: "geometry",
	},
};
var actionMap = {
// natlang property: { type info, action name (sans prefix) }
	on_interact: {
		baseAction: "ENTITY_INTERACT_SCRIPT",
		compositeType: "script",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	on_tick: {
		baseAction: "ENTITY_TICK_SCRIPT",
		compositeType: "script",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	on_look: {
		baseAction: "ENTITY_LOOK_SCRIPT",
		compositeType: "script",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	name: {
		baseAction: "ENTITY_NAME",
		compositeType: "string",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	type: {
		baseAction: "ENTITY_TYPE",
		compositeType: "entity_type",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	x: {
		baseAction: "ENTITY_X",
		compositeType: "u2",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	y: {
		baseAction: "ENTITY_Y",
		compositeType: "u2",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	primary_id: {
		baseAction: "ENTITY_PRIMARY_ID",
		compositeType: "u2",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	secondary_id: {
		baseAction: "ENTITY_SECONDARY_ID",
		compositeType: "u2",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	primary_id_type: {
		baseAction: "ENTITY_PRIMARY_ID_TYPE",
		compositeType: "byte",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	current_animation: {
		baseAction: "ENTITY_CURRENT_ANIMATION",
		compositeType: "byte",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	animation_frame: {
		baseAction: "ENTITY_CURRENT_FRAME",
		compositeType: "byte",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
	path: {
		baseAction: "ENTITY_PATH",
		compositeType: "geometry",
		pattern: "entity_explicit",
		categories: [ "check", "set" ],
	},
};

var patterns = {
	entity_explicit: [
		{
			pattern: '$e_ $PROP is $VALUE',
			values: { "expected_bool" : true },
		},
		{
			pattern: '$e_ $PROP is not $VALUE',
			values: { "expected_bool" : false },
		},
	],
	jump: [
		{
			pattern: 'then goto (script)? $success_script:string',
		},
		{
			pattern: 'then goto index $jump_index:number',
		},
		{
			pattern: 'then goto label $jump_index:bareword',
		},
	]
};

var actionPrefixMap = {
	check: "CHECK_",
	set: "SET_",
}

var flat = Object.keys(actionMap).map(natlangPropertyName => {
	var cats = actionMap[natlangPropertyName].categories;
	var info = cats.map(prefix => {
		var obj = actionMap[natlangPropertyName];
		// { compositeType: "script", baseAction: "ENTITY_INTERACT_SCRIPT" }

		var propInfo = typeInfo[obj.compositeType];
		// natlangType: "number",
		// jsonPropertyName: { "CHECK_": "expected_u2", "SET_": "u2_value", }

		var jsonPropertyName = typeof propInfo.jsonPropertyName === "string"
			? propInfo.jsonPropertyName
			: propInfo.jsonPropertyName[prefix];
		var actionName = actionPrefixMap[prefix] + obj.baseAction;
		var newDict = {
			category: prefix,
			action: actionName,
			jsonPropName: jsonPropertyName,
			natlangType: propInfo.natlangType,
			natlangPropName: natlangPropertyName,
		}
		// var verifyMe = { // check these against the orig
		// 	action: prefix + obj.baseAction,
		// 	actionProperty: jsonPropertyName,
		// 	natLangProperties: natlangPropertyName,
		// 	dictionaryRef: ":" + propInfo.natlangType,
		// };
		// Object.assign(obj, {
		// 	jsonPropertyName,
		// });
		return newDict;
	});
	return info;
}).flat();

// {
// category: "check",
// action: "CHECK_ENTITY_INTERACT_SCRIPT",
// jsonPropName: "expected_script",
// natlangType: "string",
// natlangPropName: "on_interact",
// }

// // var final = {};
// var flatter = [];

// combo.forEach(item=>{
// 	item.categories.forEach(a=>{
// 		flatter.push(Object.assign(a, {
// 			natlangPropName: item.natlangPropName,
// 		}));
// 		// final[item.natlangPropName] = final[item.natlangPropName] || {};
// 		// final[item.natlangPropName][a.category] = a;
// 	});
// });

console.log("BREAK ME");

// // nah, hard to navigate actually. Keep things flat?
// var newDict = {
// 	on_interact: {
// 	  check: {
// 		action: "CHECK_ENTITY_INTERACT_SCRIPT",
// 		jsonPropName: "expected_script",
// 		natlangType: "string",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_INTERACT_SCRIPT",
// 		jsonPropName: "script",
// 		natlangType: "string",
// 	  },
// 	},
// 	on_tick: {
// 	  check: {
// 		action: "CHECK_ENTITY_TICK_SCRIPT",
// 		jsonPropName: "expected_script",
// 		natlangType: "string",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_TICK_SCRIPT",
// 		jsonPropName: "script",
// 		natlangType: "string",
// 	  },
// 	},
// 	on_look: {
// 	  check: {
// 		action: "CHECK_ENTITY_LOOK_SCRIPT",
// 		jsonPropName: "expected_script",
// 		natlangType: "string",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_LOOK_SCRIPT",
// 		jsonPropName: "script",
// 		natlangType: "string",
// 	  },
// 	},
// 	name: {
// 	  check: {
// 		action: "CHECK_ENTITY_NAME",
// 		jsonPropName: "string",
// 		natlangType: "string",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_NAME",
// 		jsonPropName: "string",
// 		natlangType: "string",
// 	  },
// 	},
// 	type: {
// 	  check: {
// 		action: "CHECK_ENTITY_TYPE",
// 		jsonPropName: "entity_type",
// 		natlangType: "string",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_TYPE",
// 		jsonPropName: "entity_type",
// 		natlangType: "string",
// 	  },
// 	},
// 	x: {
// 	  check: {
// 		action: "CHECK_ENTITY_X",
// 		jsonPropName: "expected_u2",
// 		natlangType: "number",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_X",
// 		jsonPropName: "u2_value",
// 		natlangType: "number",
// 	  },
// 	},
// 	y: {
// 	  check: {
// 		action: "CHECK_ENTITY_Y",
// 		jsonPropName: "expected_u2",
// 		natlangType: "number",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_Y",
// 		jsonPropName: "u2_value",
// 		natlangType: "number",
// 	  },
// 	},
// 	primary_id: {
// 	  check: {
// 		action: "CHECK_ENTITY_PRIMARY_ID",
// 		jsonPropName: "expected_u2",
// 		natlangType: "number",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_PRIMARY_ID",
// 		jsonPropName: "u2_value",
// 		natlangType: "number",
// 	  },
// 	},
// 	secondary_id: {
// 	  check: {
// 		action: "CHECK_ENTITY_SECONDARY_ID",
// 		jsonPropName: "expected_u2",
// 		natlangType: "number",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_SECONDARY_ID",
// 		jsonPropName: "u2_value",
// 		natlangType: "number",
// 	  },
// 	},
// 	primary_id_type: {
// 	  check: {
// 		action: "CHECK_ENTITY_PRIMARY_ID_TYPE",
// 		jsonPropName: "expected_byte",
// 		natlangType: "number",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_PRIMARY_ID_TYPE",
// 		jsonPropName: "byte_value",
// 		natlangType: "number",
// 	  },
// 	},
// 	current_animation: {
// 	  check: {
// 		action: "CHECK_ENTITY_CURRENT_ANIMATION",
// 		jsonPropName: "expected_byte",
// 		natlangType: "number",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_CURRENT_ANIMATION",
// 		jsonPropName: "byte_value",
// 		natlangType: "number",
// 	  },
// 	},
// 	animation_frame: {
// 	  check: {
// 		action: "CHECK_ENTITY_CURRENT_FRAME",
// 		jsonPropName: "expected_byte",
// 		natlangType: "number",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_CURRENT_FRAME",
// 		jsonPropName: "byte_value",
// 		natlangType: "number",
// 	  },
// 	},
// 	path: {
// 	  check: {
// 		action: "CHECK_ENTITY_PATH",
// 		jsonPropName: "geometry",
// 		natlangType: "string",
// 	  },
// 	  set: {
// 		action: "SET_ENTITY_PATH",
// 		jsonPropName: "geometry",
// 		natlangType: "string",
// 	  },
// 	},
//   };