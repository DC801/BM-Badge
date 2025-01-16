// `captures` and `unusedLabels` use shift/unshift! Everything else uses pop/push!

const exampleLex = {
	errors: [
	],
	plaintext: `include!("header.mgs")

$trombones = 76;
/* comment */
$player = "%PLAYER%";

add serial_dialog settings {
	wrap 88
}
add dialog settings {
	default {
		alignment BL
		wrap 10
	}
	label PLAYER {
		entity "%PLAYER%"
		alignment BR
	}
	entity Bob {
		name "True Bob"
	}
}
`,
	tokens: [
	  {
		type: "bareword",
		rawValue: "include",
		value: "include",
		pos: 0,
	  },
	  {
		type: "operator",
		rawValue: "!",
		value: "!",
		pos: 7,
	  },
	  {
		type: "operator",
		rawValue: "(",
		value: "(",
		pos: 8,
	  },
	  {
		type: "quoted_string",
		rawValue: "\"header.mgs\"",
		value: "header.mgs",
		pos: 9,
	  },
	  {
		type: "operator",
		rawValue: ")",
		value: ")",
		pos: 21,
	  },
	  {
		type: "newline",
		rawValue: "\n\n",
		value: "\n\n",
		pos: 22,
		ignorable: true,
	  },
	  {
		type: "constant",
		rawValue: "$trombones",
		value: "$trombones",
		pos: 24,
	  },
	  {
		type: "operator",
		rawValue: "=",
		value: "=",
		pos: 35,
	  },
	  {
		type: "number",
		rawValue: "76",
		value: 76,
		pos: 37,
	  },
	  {
		type: "operator",
		rawValue: ";",
		value: ";",
		pos: 39,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 40,
		ignorable: true,
	  },
	  {
		type: "block_comment",
		rawValue: "/* comment */",
		value: " comment ",
		pos: 41,
		ignorable: true,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 54,
		ignorable: true,
	  },
	  {
		type: "constant",
		rawValue: "$player",
		value: "$player",
		pos: 55,
	  },
	  {
		type: "operator",
		rawValue: "=",
		value: "=",
		pos: 63,
	  },
	  {
		type: "quoted_string",
		rawValue: "\"%PLAYER%\"",
		value: "%PLAYER%",
		pos: 65,
	  },
	  {
		type: "operator",
		rawValue: ";",
		value: ";",
		pos: 75,
	  },
	  {
		type: "newline",
		rawValue: "\n\n",
		value: "\n\n",
		pos: 76,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "add",
		value: "add",
		pos: 78,
	  },
	  {
		type: "bareword",
		rawValue: "serial_dialog",
		value: "serial_dialog",
		pos: 82,
	  },
	  {
		type: "bareword",
		rawValue: "settings",
		value: "settings",
		pos: 96,
	  },
	  {
		type: "operator",
		rawValue: "{",
		value: "{",
		pos: 105,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 106,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "wrap",
		value: "wrap",
		pos: 108,
	  },
	  {
		type: "number",
		rawValue: "88",
		value: 88,
		pos: 113,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 115,
		ignorable: true,
	  },
	  {
		type: "operator",
		rawValue: "}",
		value: "}",
		pos: 116,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 117,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "add",
		value: "add",
		pos: 118,
	  },
	  {
		type: "bareword",
		rawValue: "dialog",
		value: "dialog",
		pos: 122,
	  },
	  {
		type: "bareword",
		rawValue: "settings",
		value: "settings",
		pos: 129,
	  },
	  {
		type: "operator",
		rawValue: "{",
		value: "{",
		pos: 138,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 139,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "default",
		value: "default",
		pos: 141,
	  },
	  {
		type: "operator",
		rawValue: "{",
		value: "{",
		pos: 149,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 150,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "alignment",
		value: "alignment",
		pos: 153,
	  },
	  {
		type: "bareword",
		rawValue: "BL",
		value: "BL",
		pos: 163,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 165,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "wrap",
		value: "wrap",
		pos: 168,
	  },
	  {
		type: "number",
		rawValue: "10",
		value: 10,
		pos: 173,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 175,
		ignorable: true,
	  },
	  {
		type: "operator",
		rawValue: "}",
		value: "}",
		pos: 177,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 178,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "label",
		value: "label",
		pos: 180,
	  },
	  {
		type: "bareword",
		rawValue: "PLAYER",
		value: "PLAYER",
		pos: 186,
	  },
	  {
		type: "operator",
		rawValue: "{",
		value: "{",
		pos: 193,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 194,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "entity",
		value: "entity",
		pos: 197,
	  },
	  {
		type: "quoted_string",
		rawValue: "\"%PLAYER%\"",
		value: "%PLAYER%",
		pos: 204,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 214,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "alignment",
		value: "alignment",
		pos: 217,
	  },
	  {
		type: "bareword",
		rawValue: "BR",
		value: "BR",
		pos: 227,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 229,
		ignorable: true,
	  },
	  {
		type: "operator",
		rawValue: "}",
		value: "}",
		pos: 231,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 232,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "entity",
		value: "entity",
		pos: 234,
	  },
	  {
		type: "bareword",
		rawValue: "Bob",
		value: "Bob",
		pos: 241,
	  },
	  {
		type: "operator",
		rawValue: "{",
		value: "{",
		pos: 245,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 246,
		ignorable: true,
	  },
	  {
		type: "bareword",
		rawValue: "name",
		value: "name",
		pos: 249,
	  },
	  {
		type: "quoted_string",
		rawValue: "\"True Bob\"",
		value: "True Bob",
		pos: 254,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 264,
		ignorable: true,
	  },
	  {
		type: "operator",
		rawValue: "}",
		value: "}",
		pos: 266,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 267,
		ignorable: true,
	  },
	  {
		type: "operator",
		rawValue: "}",
		value: "}",
		pos: 268,
	  },
	  {
		type: "newline",
		rawValue: "\n",
		value: "\n",
		pos: 269,
		ignorable: true,
	  },
	  {
		type: "EOF",
		rawValue: "EOF",
		value: "EOF",
		pos: 270,
	  },
	],
	warnings: [
	],
	completed: true,
  };

const exampleTree = {
	document: [
	  [
		{
		  original: "@root*",
		  rep: "*",
		  type: "lookup",
		  value: "root",
		},
		{
		  original: "$EOF",
		  rep: "",
		  type: "capture",
		  value: "EOF",
		},
	  ],
	],
	root: [
	  [
		{
		  original: "@include_macro",
		  rep: "",
		  type: "lookup",
		  value: "include_macro",
		},
	  ],
	  [
		{
		  original: "@constant_assignment",
		  rep: "",
		  type: "lookup",
		  value: "constant_assignment",
		},
	  ],
	  [
		{
		  original: "@add_serial_dialog_settings",
		  rep: "",
		  type: "lookup",
		  value: "add_serial_dialog_settings",
		},
	  ],
	  [
		{
		  original: "@add_dialog_settings",
		  rep: "",
		  type: "lookup",
		  value: "add_dialog_settings",
		},
	  ],
	],
	include_macro: [
	  [
		{
		  original: "'include'",
		  rep: "",
		  type: "literal",
		  value: "include",
		},
		{
		  original: "'!'",
		  rep: "",
		  type: "literal",
		  value: "!",
		},
		{
		  original: "'('",
		  rep: "",
		  type: "literal",
		  value: "(",
		},
		{
		  original: "$quoted_string:fileName?",
		  rep: "?",
		  type: "capture",
		  value: "quoted_string",
		  label: "fileName",
		},
		{
		  original: "')'",
		  rep: "",
		  type: "literal",
		  value: ")",
		},
	  ],
	],
	constant_assignment: [
	  [
		{
		  original: "$constant:constantName>constantNames",
		  rep: "",
		  type: "capture",
		  value: "constant",
		  label: "constantName",
		  toCollection: "constantNames",
		},
		{
		  original: "'='",
		  rep: "",
		  type: "literal",
		  value: "=",
		},
		{
		  original: "@constant_value:constantValue",
		  rep: "",
		  type: "lookup",
		  value: "constant_value",
		  label: "constantValue",
		},
		{
		  original: "';'",
		  rep: "",
		  type: "literal",
		  value: ";",
		},
	  ],
	],
	constant_value: [
	  [
		{
		  original: "$constant<constantNames",
		  rep: "",
		  type: "capture",
		  value: "constant",
		  autoComplete: "constantNames",
		},
	  ],
	  [
		{
		  original: "$boolean",
		  rep: "",
		  type: "capture",
		  value: "boolean",
		},
	  ],
	  [
		{
		  original: "$quoted_string",
		  rep: "",
		  type: "capture",
		  value: "quoted_string",
		},
	  ],
	  [
		{
		  original: "$bareword",
		  rep: "",
		  type: "capture",
		  value: "bareword",
		},
	  ],
	  [
		{
		  original: "$number",
		  rep: "",
		  type: "capture",
		  value: "number",
		},
	  ],
	  [
		{
		  original: "$duration",
		  rep: "",
		  type: "capture",
		  value: "duration",
		},
	  ],
	  [
		{
		  original: "$distance",
		  rep: "",
		  type: "capture",
		  value: "distance",
		},
	  ],
	  [
		{
		  original: "$color",
		  rep: "",
		  type: "capture",
		  value: "color",
		},
	  ],
	  [
		{
		  original: "$quantity",
		  rep: "",
		  type: "capture",
		  value: "quantity",
		},
	  ],
	],
	enum_alignment: [
	  [
		{
		  original: "'TR'",
		  rep: "",
		  type: "literal",
		  value: "TR",
		},
	  ],
	  [
		{
		  original: "'BR'",
		  rep: "",
		  type: "literal",
		  value: "BR",
		},
	  ],
	  [
		{
		  original: "'TL'",
		  rep: "",
		  type: "literal",
		  value: "TL",
		},
	  ],
	  [
		{
		  original: "'BL'",
		  rep: "",
		  type: "literal",
		  value: "BL",
		},
	  ],
	  [
		{
		  original: "'TOP_RIGHT'",
		  rep: "",
		  type: "literal",
		  value: "TOP_RIGHT",
		},
	  ],
	  [
		{
		  original: "'BOTTOM_RIGHT'",
		  rep: "",
		  type: "literal",
		  value: "BOTTOM_RIGHT",
		},
	  ],
	  [
		{
		  original: "'TOP_LEFT'",
		  rep: "",
		  type: "literal",
		  value: "TOP_LEFT",
		},
	  ],
	  [
		{
		  original: "'BOTTOM_LEFT'",
		  rep: "",
		  type: "literal",
		  value: "BOTTOM_LEFT",
		},
	  ],
	],
	add_serial_dialog_settings: [
	  [
		{
		  original: "'add'",
		  rep: "",
		  type: "literal",
		  value: "add",
		},
		{
		  original: "'serial_dialog'",
		  rep: "",
		  type: "literal",
		  value: "serial_dialog",
		},
		{
		  original: "'settings'",
		  rep: "",
		  type: "literal",
		  value: "settings",
		},
		{
		  original: "'{'",
		  rep: "",
		  type: "literal",
		  value: "{",
		},
		{
		  original: "@serial_dialog_parameter*",
		  rep: "*",
		  type: "lookup",
		  value: "serial_dialog_parameter",
		},
		{
		  original: "'}'",
		  rep: "",
		  type: "literal",
		  value: "}",
		},
	  ],
	],
	serial_dialog_parameter: [
	  [
		{
		  original: "'wrap':property",
		  rep: "",
		  type: "literal",
		  value: "wrap",
		  label: "property",
		},
		{
		  original: "$number:value",
		  rep: "",
		  type: "capture",
		  value: "number",
		  label: "value",
		},
	  ],
	],
	add_dialog_settings: [
	  [
		{
		  original: "'add'",
		  rep: "",
		  type: "literal",
		  value: "add",
		},
		{
		  original: "'dialog'",
		  rep: "",
		  type: "literal",
		  value: "dialog",
		},
		{
		  original: "'settings'",
		  rep: "",
		  type: "literal",
		  value: "settings",
		},
		{
		  original: "'{'",
		  rep: "",
		  type: "literal",
		  value: "{",
		},
		{
		  original: "@dialog_settings_target*",
		  rep: "*",
		  type: "lookup",
		  value: "dialog_settings_target",
		},
		{
		  original: "'}'",
		  rep: "",
		  type: "literal",
		  value: "}",
		},
	  ],
	],
	dialog_settings_target: [
	  [
		{
		  original: "'default':target",
		  rep: "",
		  type: "literal",
		  value: "default",
		  label: "dialogSettingsTarget",
		},
		{
		  original: "'{'",
		  rep: "",
		  type: "literal",
		  value: "{",
		},
		{
		  original: "@dialog_parameter*",
		  rep: "*",
		  type: "lookup",
		  value: "dialog_parameter",
		},
		{
		  original: "'}'",
		  rep: "",
		  type: "literal",
		  value: "}",
		},
	  ],
	  [
		{
		  original: "'label':target",
		  rep: "",
		  type: "literal",
		  value: "label",
		  label: "dialogSettingsTarget",
		},
		{
		  original: "$bareword:targetValue",
		  rep: "",
		  type: "capture",
		  value: "bareword",
		  label: "dialogSettingsTargetValue",
		},
		{
		  original: "'{'",
		  rep: "",
		  type: "literal",
		  value: "{",
		},
		{
		  original: "@dialog_parameter*",
		  rep: "*",
		  type: "lookup",
		  value: "dialog_parameter",
		},
		{
		  original: "'}'",
		  rep: "",
		  type: "literal",
		  value: "}",
		},
	  ],
	  [
		{
		  original: "'entity':target",
		  rep: "",
		  type: "literal",
		  value: "entity",
		  label: "dialogSettingsTarget",
		},
		{
		  original: "$string:targetValue",
		  rep: "",
		  type: "capture",
		  value: "string",
		  label: "dialogSettingsTargetValue",
		},
		{
		  original: "'{'",
		  rep: "",
		  type: "literal",
		  value: "{",
		},
		{
		  original: "@dialog_parameter*",
		  rep: "*",
		  type: "lookup",
		  value: "dialog_parameter",
		},
		{
		  original: "'}'",
		  rep: "",
		  type: "literal",
		  value: "}",
		},
	  ],
	],
	dialog_parameter: [
	  [
		{
		  original: "'entity':dialogSettingsProperty",
		  rep: "",
		  type: "literal",
		  value: "entity",
		  label: "property",
		},
		{
		  original: "$string:value<>dialogSettingsValue",
		  rep: "",
		  type: "capture",
		  value: "string",
		  label: "value",
		  autoComplete: "entityNames",
		  toCollection: "entityNames",
		},
	  ],
	  [
		{
		  original: "'name':dialogSettingsProperty",
		  rep: "",
		  type: "literal",
		  value: "name",
		  label: "property",
		},
		{
		  original: "$string:dialogSettingsValue",
		  rep: "",
		  type: "capture",
		  value: "string",
		  label: "value",
		},
	  ],
	  [
		{
		  original: "'portrait':dialogSettingsProperty",
		  rep: "",
		  type: "literal",
		  value: "portrait",
		  label: "property",
		},
		{
		  original: "$string:value<dialogSettingsValue",
		  rep: "",
		  type: "capture",
		  value: "string",
		  label: "value",
		  autoComplete: "portraitNames",
		},
	  ],
	  [
		{
		  original: "'alignment':dialogSettingsProperty",
		  rep: "",
		  type: "literal",
		  value: "alignment",
		  label: "property",
		},
		{
		  original: "@enum_alignment:dialogSettingsValue",
		  rep: "",
		  type: "lookup",
		  value: "enum_alignment",
		  label: "value",
		},
	  ],
	  [
		{
		  original: "'border_tileset':dialogSettingsProperty",
		  rep: "",
		  type: "literal",
		  value: "border_tileset",
		  label: "property",
		},
		{
		  original: "$string:dialogSettingsValue",
		  rep: "",
		  type: "capture",
		  value: "string",
		  label: "value",
		},
	  ],
	  [
		{
		  original: "'emote':dialogSettingsProperty",
		  rep: "",
		  type: "literal",
		  value: "emote",
		  label: "property",
		},
		{
		  original: "$number:dialogSettingsValue",
		  rep: "",
		  type: "capture",
		  value: "number",
		  label: "value",
		},
	  ],
	  [
		{
		  original: "'wrap':dialogSettingsProperty",
		  rep: "",
		  type: "literal",
		  value: "wrap",
		  label: "property",
		},
		{
		  original: "$number:dialogSettingsValue",
		  rep: "",
		  type: "capture",
		  value: "number",
		  label: "value",
		},
	  ],
	],
	enum_lights: [
	  [
		{
		  original: "'LED_XOR'",
		  rep: "",
		  type: "literal",
		  value: "LED_XOR",
		},
	  ],
	  [
		{
		  original: "'LED_ADD'",
		  rep: "",
		  type: "literal",
		  value: "LED_ADD",
		},
	  ],
	  [
		{
		  original: "'LED_SUB'",
		  rep: "",
		  type: "literal",
		  value: "LED_SUB",
		},
	  ],
	  [
		{
		  original: "'LED_PAGE'",
		  rep: "",
		  type: "literal",
		  value: "LED_PAGE",
		},
	  ],
	  [
		{
		  original: "'LED_BIT128'",
		  rep: "",
		  type: "literal",
		  value: "LED_BIT128",
		},
	  ],
	  [
		{
		  original: "'LED_BIT64'",
		  rep: "",
		  type: "literal",
		  value: "LED_BIT64",
		},
	  ],
	  [
		{
		  original: "'LED_BIT32'",
		  rep: "",
		  type: "literal",
		  value: "LED_BIT32",
		},
	  ],
	  [
		{
		  original: "'LED_BIT16'",
		  rep: "",
		  type: "literal",
		  value: "LED_BIT16",
		},
	  ],
	  [
		{
		  original: "'LED_BIT8'",
		  rep: "",
		  type: "literal",
		  value: "LED_BIT8",
		},
	  ],
	  [
		{
		  original: "'LED_BIT4'",
		  rep: "",
		  type: "literal",
		  value: "LED_BIT4",
		},
	  ],
	  [
		{
		  original: "'LED_BIT2'",
		  rep: "",
		  type: "literal",
		  value: "LED_BIT2",
		},
	  ],
	  [
		{
		  original: "'LED_BIT1'",
		  rep: "",
		  type: "literal",
		  value: "LED_BIT1",
		},
	  ],
	  [
		{
		  original: "'LED_MEM0'",
		  rep: "",
		  type: "literal",
		  value: "LED_MEM0",
		},
	  ],
	  [
		{
		  original: "'LED_MEM1'",
		  rep: "",
		  type: "literal",
		  value: "LED_MEM1",
		},
	  ],
	  [
		{
		  original: "'LED_MEM2'",
		  rep: "",
		  type: "literal",
		  value: "LED_MEM2",
		},
	  ],
	  [
		{
		  original: "'LED_MEM3'",
		  rep: "",
		  type: "literal",
		  value: "LED_MEM3",
		},
	  ],
	  [
		{
		  original: "'LED_HAX'",
		  rep: "",
		  type: "literal",
		  value: "LED_HAX",
		},
	  ],
	  [
		{
		  original: "'LED_USB'",
		  rep: "",
		  type: "literal",
		  value: "LED_USB",
		},
	  ],
	  [
		{
		  original: "'LED_SD'",
		  rep: "",
		  type: "literal",
		  value: "LED_SD",
		},
	  ],
	  [
		{
		  original: "'LED_ALL'",
		  rep: "",
		  type: "literal",
		  value: "LED_ALL",
		},
	  ],
	],
	enum_buttons: [
	  [
		{
		  original: "'MEM0'",
		  rep: "",
		  type: "literal",
		  value: "MEM0",
		},
	  ],
	  [
		{
		  original: "'MEM1'",
		  rep: "",
		  type: "literal",
		  value: "MEM1",
		},
	  ],
	  [
		{
		  original: "'MEM2'",
		  rep: "",
		  type: "literal",
		  value: "MEM2",
		},
	  ],
	  [
		{
		  original: "'MEM3'",
		  rep: "",
		  type: "literal",
		  value: "MEM3",
		},
	  ],
	  [
		{
		  original: "'BIT128'",
		  rep: "",
		  type: "literal",
		  value: "BIT128",
		},
	  ],
	  [
		{
		  original: "'BIT64'",
		  rep: "",
		  type: "literal",
		  value: "BIT64",
		},
	  ],
	  [
		{
		  original: "'BIT32'",
		  rep: "",
		  type: "literal",
		  value: "BIT32",
		},
	  ],
	  [
		{
		  original: "'BIT16'",
		  rep: "",
		  type: "literal",
		  value: "BIT16",
		},
	  ],
	  [
		{
		  original: "'BIT8'",
		  rep: "",
		  type: "literal",
		  value: "BIT8",
		},
	  ],
	  [
		{
		  original: "'BIT4'",
		  rep: "",
		  type: "literal",
		  value: "BIT4",
		},
	  ],
	  [
		{
		  original: "'BIT2'",
		  rep: "",
		  type: "literal",
		  value: "BIT2",
		},
	  ],
	  [
		{
		  original: "'BIT1'",
		  rep: "",
		  type: "literal",
		  value: "BIT1",
		},
	  ],
	  [
		{
		  original: "'XOR'",
		  rep: "",
		  type: "literal",
		  value: "XOR",
		},
	  ],
	  [
		{
		  original: "'ADD'",
		  rep: "",
		  type: "literal",
		  value: "ADD",
		},
	  ],
	  [
		{
		  original: "'SUB'",
		  rep: "",
		  type: "literal",
		  value: "SUB",
		},
	  ],
	  [
		{
		  original: "'PAGE'",
		  rep: "",
		  type: "literal",
		  value: "PAGE",
		},
	  ],
	  [
		{
		  original: "'LJOY_CENTER'",
		  rep: "",
		  type: "literal",
		  value: "LJOY_CENTER",
		},
	  ],
	  [
		{
		  original: "'LJOY_UP'",
		  rep: "",
		  type: "literal",
		  value: "LJOY_UP",
		},
	  ],
	  [
		{
		  original: "'LJOY_DOWN'",
		  rep: "",
		  type: "literal",
		  value: "LJOY_DOWN",
		},
	  ],
	  [
		{
		  original: "'LJOY_LEFT'",
		  rep: "",
		  type: "literal",
		  value: "LJOY_LEFT",
		},
	  ],
	  [
		{
		  original: "'LJOY_RIGHT'",
		  rep: "",
		  type: "literal",
		  value: "LJOY_RIGHT",
		},
	  ],
	  [
		{
		  original: "'RJOY_CENTER'",
		  rep: "",
		  type: "literal",
		  value: "RJOY_CENTER",
		},
	  ],
	  [
		{
		  original: "'RJOY_UP'",
		  rep: "",
		  type: "literal",
		  value: "RJOY_UP",
		},
	  ],
	  [
		{
		  original: "'RJOY_DOWN'",
		  rep: "",
		  type: "literal",
		  value: "RJOY_DOWN",
		},
	  ],
	  [
		{
		  original: "'RJOY_LEFT'",
		  rep: "",
		  type: "literal",
		  value: "RJOY_LEFT",
		},
	  ],
	  [
		{
		  original: "'RJOY_RIGHT'",
		  rep: "",
		  type: "literal",
		  value: "RJOY_RIGHT",
		},
	  ],
	  [
		{
		  original: "'TRIANGLE'",
		  rep: "",
		  type: "literal",
		  value: "TRIANGLE",
		},
	  ],
	  [
		{
		  original: "'X'",
		  rep: "",
		  type: "literal",
		  value: "X",
		},
	  ],
	  [
		{
		  original: "'CROSS'",
		  rep: "",
		  type: "literal",
		  value: "CROSS",
		},
	  ],
	  [
		{
		  original: "'O'",
		  rep: "",
		  type: "literal",
		  value: "O",
		},
	  ],
	  [
		{
		  original: "'CIRCLE'",
		  rep: "",
		  type: "literal",
		  value: "CIRCLE",
		},
	  ],
	  [
		{
		  original: "'SQUARE'",
		  rep: "",
		  type: "literal",
		  value: "SQUARE",
		},
	  ],
	  [
		{
		  original: "'HAX'",
		  rep: "",
		  type: "literal",
		  value: "HAX",
		},
	  ],
	  [
		{
		  original: "'ANY'",
		  rep: "",
		  type: "literal",
		  value: "ANY",
		},
	  ],
	],
	enum_map_slots: [
	  [
		{
		  original: "'on_load'",
		  rep: "",
		  type: "literal",
		  value: "on_load",
		},
	  ],
	  [
		{
		  original: "'on_tick'",
		  rep: "",
		  type: "literal",
		  value: "on_tick",
		},
	  ],
	  [
		{
		  original: "'on_look'",
		  rep: "",
		  type: "literal",
		  value: "on_look",
		},
	  ],
	],
	enum_entity_slots: [
	  [
		{
		  original: "'on_interact'",
		  rep: "",
		  type: "literal",
		  value: "on_interact",
		},
	  ],
	  [
		{
		  original: "'on_tick'",
		  rep: "",
		  type: "literal",
		  value: "on_tick",
		},
	  ],
	  [
		{
		  original: "'on_look'",
		  rep: "",
		  type: "literal",
		  value: "on_look",
		},
	  ],
	],
	enum_save_slots: [
	  [
		{
		  original: "'1'",
		  rep: "",
		  type: "literal",
		  value: "1",
		},
	  ],
	  [
		{
		  original: "'2'",
		  rep: "",
		  type: "literal",
		  value: "2",
		},
	  ],
	  [
		{
		  original: "'3'",
		  rep: "",
		  type: "literal",
		  value: "3",
		},
	  ],
	],
	enum_nsew: [
	  [
		{
		  original: "'north'",
		  rep: "",
		  type: "literal",
		  value: "north",
		},
	  ],
	  [
		{
		  original: "'south'",
		  rep: "",
		  type: "literal",
		  value: "south",
		},
	  ],
	  [
		{
		  original: "'east'",
		  rep: "",
		  type: "literal",
		  value: "east",
		},
	  ],
	  [
		{
		  original: "'west'",
		  rep: "",
		  type: "literal",
		  value: "west",
		},
	  ],
	],
	enum_entity_field: [
	  [
		{
		  original: "'x'",
		  rep: "",
		  type: "literal",
		  value: "x",
		},
	  ],
	  [
		{
		  original: "'y'",
		  rep: "",
		  type: "literal",
		  value: "y",
		},
	  ],
	  [
		{
		  original: "'primary_id'",
		  rep: "",
		  type: "literal",
		  value: "primary_id",
		},
	  ],
	  [
		{
		  original: "'secondary_id'",
		  rep: "",
		  type: "literal",
		  value: "secondary_id",
		},
	  ],
	  [
		{
		  original: "'primary_id_type'",
		  rep: "",
		  type: "literal",
		  value: "primary_id_type",
		},
	  ],
	  [
		{
		  original: "'interact_script_id'",
		  rep: "",
		  type: "literal",
		  value: "interact_script_id",
		},
	  ],
	  [
		{
		  original: "'tick_script_id'",
		  rep: "",
		  type: "literal",
		  value: "tick_script_id",
		},
	  ],
	  [
		{
		  original: "'look_script_id'",
		  rep: "",
		  type: "literal",
		  value: "look_script_id",
		},
	  ],
	  [
		{
		  original: "'current_animation'",
		  rep: "",
		  type: "literal",
		  value: "current_animation",
		},
	  ],
	  [
		{
		  original: "'current_frame'",
		  rep: "",
		  type: "literal",
		  value: "current_frame",
		},
	  ],
	  [
		{
		  original: "'direction'",
		  rep: "",
		  type: "literal",
		  value: "direction",
		},
	  ],
	  [
		{
		  original: "'path_id'",
		  rep: "",
		  type: "literal",
		  value: "path_id",
		},
	  ],
	],
  };

const findLineAndCharNumbers = (input, pos) => {
	const splits = input.substring(0,pos).split('\n')
	const charCount = splits[splits.length - 1].length;
	const wholeString = input.split('\n')
	const lineNumber = splits.length;
	return {
		row: lineNumber,
		col: charCount+1,
		lineString: wholeString[lineNumber - 1],
		char: input[pos]
	};
};
const getPosContext = (inputString, pos, message) => {
	const errorCoords = findLineAndCharNumbers(inputString, pos);
	const arrow = '~'.repeat(errorCoords.col) + '^';
	const lineString = errorCoords.lineString.replace(/\t/g,' ');
	const newMessage
		= `\n╓ Line ${errorCoords.row}:${errorCoords.col}: ${message}`
		+ '\n║ ' + `${lineString}`
		+ '\n╙' + arrow
	return newMessage;
};
const printParseMessage = (inputString, pos, message, messageType) => {
	const fancyMessage = getPosContext(inputString, pos, message);
	if (messageType === "error") {
		console.error(fancyMessage);
	} else if (messageType === "warning") {
		console.warn(fancyMessage);
	} else {
		console.log(fancyMessage);
	}
};

const decayTo = {
	EOF: token => token.type === 'EOF',
	bareword: token => {
		if (token.type === "bareword") return token.value;
		if (token.barewordValue) return token.barewordValue;
		return false;
	},
	operator: token => {
		let result = token.type === "operator" ? token.value : false;
		if (!result) result = natlang.opLookup[token.value]; // ???
		return result;
	},
	color: token => token.type === "color" ? token.value : false,
	boolean: token => token.type === "boolean" ? token.value : false,
	quoted_string: token => token.type === "quoted_string" ? token.value : false,
	number: token => token.type === "number" ? token.value : false,
	duration: token => token.type === "duration" || token.type === "number" ? token.value : false,
	distance: token => token.type === "distance" || token.type === "number" ? token.value : false,
	quantity: token => token.type === "quantity" || token.type === "number" ? token.value : false,
	constant: token => token.type === "constant" ? token.value : false,
	string: token => {
		const bareWord = decayTo.bareword(token);
		if (bareWord) return bareWord;
		if (token.type === "quoted_string") return token.value;
		return false;
	},
};

const verbose = true;
const debugLog = (string) => { if (verbose) console.log(string); };

const getAllCapturesByLabel = (crawlState, label, providedMin, providedMax) => {
	const min = providedMin || 0;
	const max = providedMax || min;
	const filtered = crawlState.captures
		.filter(item=>item.label === label);
	if (filtered.length < min || filtered.length > max) {
		const message = `Found ${filtered.length} captures with label ${label}; `
			message += min === max ? `needed ${min}` : `needed ${min}-${max}`;
		return false;
	} else {
		crawlState.captures = crawlState.captures
			.filter(item=>item.label !== label);
		return filtered;
	}
};

const getAllCapturesByPattern = (crawlState, pattern, providedMin, providedMax) => {
	const min = providedMin || 0;
	const max = providedMax || min;
	const filtered = crawlState.captures
		.filter(item=>item.pattern === pattern);
	if (filtered.length < min || filtered.length > max) {
		const message = `Found ${filtered.length} captures with label ${pattern}; `
			message += min === max ? `needed ${min}` : `needed ${min}-${max}`;
		return false;
	} else {
		crawlState.captures = crawlState.captures
			.filter(item=>item.label !== pattern);
		return filtered;
	}
};

const onMatch = {
	constant_assignment: (state, crawlState) => {
		const nameCapture = getAllCapturesByLabel(crawlState, 'constantName', 1)[0];
		const valueCapture = getAllCapturesByLabel(crawlState, 'constantValue', 1)[0];
		if (!nameCapture || !valueCapture) throw new Error (`constant_assignment error`);
		state.nodes.push({
			node: 'constant_assignment',
			label: nameCapture.value,
			value: valueCapture.value,
			tokenPos: nameCapture.pos,
			ignorable: false,
		});
	},
	include_macro: (state, crawlState, startPos) => {
		const fileNameCapture = getAllCapturesByLabel(crawlState, 'fileName', 1)[0];
		if (fileNameCapture) {
			state.nodes.push({
				node: 'include_macro',
				value: fileNameCapture.value,
				tokenPos: fileNameCapture.pos,
				ignorable: false,
			});
		} else {
			// Looks like there wasn't a filename to include. Should be a warning, not an error.
			state.warnings.push({
				value: 'Include macro lacks a filename',
				message: 'Nothing will break, but this is useless in practice. Maybe put a file name in there!',
				pos: crawlState.tokenPos,
			});
			// including it as an ignorable node makes it easier (probably?) to involve in suggestions and red squiglies
			state.nodes.push({
				node: 'include_macro',
				value: '',
				tokenPos: startPos,
				ignorable: true,
			});
		}
	},
	add_dialog_settings: (state, crawlState) => {

	},
	dialog_settings_target: (state, crawlState, startPos) => {
		// get settings
		const settings = [];
		let lastNode = state.nodes[state.nodes.length-1];
		while (lastNode.node === 'dialog_parameter') {
			settings.unshift(state.nodes.pop());
			lastNode = state.nodes[state.nodes.length-1]
		}
		// get target
		const target = getAllCapturesByLabel(crawlState, 'dialogSettingsTarget', 1)[0];
		const targetValue = getAllCapturesByLabel(crawlState, 'dialogSettingsTargetValue', 0, 1)[0];
		const entry = {
			node: 'add_dialog_settings',
			settings,
			tokenPos: target.pos,
			target: target.value,
			targetValue: !targetValue && target.value === 'default' ? '' : targetValue.value,
			ignorable: false,
		};
		state.nodes.push(entry);
	},
	dialog_parameter: (state, crawlState) => {
		const propertyCapture = getAllCapturesByLabel(crawlState, 'property', 1)[0];
		const valueCapture = getAllCapturesByLabel(crawlState, 'value', 1)[0];
		state.nodes.push({
			node: 'dialog_parameter',
			label: propertyCapture.value,
			value: valueCapture.value,
			tokenPos: propertyCapture.pos,
			ignorable: false,
		});
	},
	serial_dialog_parameter: (state, crawlState) => {
		const propertyCapture = getAllCapturesByLabel(crawlState, 'property', 1)[0];
		const valueCapture = getAllCapturesByLabel(crawlState, 'value', 1)[0];
		state.nodes.push({
			node: 'serial_dialog_parameter',
			label: propertyCapture.value,
			value: valueCapture.value,
			tokenPos: propertyCapture.pos,
			ignorable: false,
		});
	},
	add_serial_dialog_settings: (state, _crawlState, startPos) => {
		const settings = [];
		let lastNode = state.nodes[state.nodes.length-1];
		while (lastNode.node === 'serial_dialog_parameter') {
			settings.unshift(state.nodes.pop());
			lastNode = state.nodes[state.nodes.length-1]
		}
		state.nodes.push({
			node: 'add_serial_dialog_settings',
			values: settings,
			tokenPos: startPos,
			ignorable: false,
		});
	},
}

const exampleTwig = { rep: "", type: "literal", value: "include", original: "'include'", };
const exampleToken = { type: "bareword", rawValue: "include", value: "include", pos: 0, };

const tryBranch = (state, origCrawlState, branchName, branchIndex) => {
	const tokens = state.tokens;
	let crawlState = JSON.parse(JSON.stringify(origCrawlState)); 
	const branch = state.tree[branchName]?.[branchIndex];
	let twigPos = 0;
	let tokenPos = crawlState.tokenPos;
	let repeated = false;
	const advanceTwig = () => {
		twigPos += 1;
		repeated = false;
	}
	const advanceToken = () => {
		tokenPos += 1;
		crawlState.tokenPos += 1;
	}
	while (twigPos < branch.length && tokenPos < tokens.length) {
		const token = tokens[tokenPos];
		const twig = branch[twigPos];
		if (token.ignorable) {
			// // keeping track of these may make error handling easier, as it'll be more clear when certain kinds of broken things have terminated to try starting a fresh pattern
			// crawlState.nodes.push({
			// 	node: token.type,
			// 	value: token.value,
			// 	tokenPos,
			// 	ignorable: true,
			// });
			// // never mind actually... if this ends up needing to happen, sorry about everything I did that will end up breaking it
			advanceToken();
			continue;
		}
		const rep = twig.rep;
		const zeroOkay = rep === '*' || rep === '?';
		const multipleOkay = rep === '*' || rep === '+';
		if (twig.toCollection) {
			const collex = crawlState.collections;
			collex[twig.toCollection] = collex[twig.toCollection] || {};
			collex[twig.toCollection][token.value] = true;
		}
		if (twig.type === 'literal') {
			if (twig.value === token.value) {
				const twigLabel = twig.label;
				const unusedLabelExists = crawlState.unusedLabels.length > 0;
				if (twigLabel || unusedLabelExists) {
					const label = twig.label
						? twig.label
						: crawlState.unusedLabels.pop();
					crawlState.captures.unshift({
						pattern: branchName,
						label: label,
						value: twig.value,
						pos: tokenPos,
					});
				}
				advanceToken();
				advanceTwig();
			} else {
				if (
					(multipleOkay && repeated)
					|| zeroOkay
				) {
					advanceTwig();
				} else {
					return {
						matched: false,
						expected: twig.value,
						crawlState,
					};
				}
			}
			continue;
		}
		if (twig.type === 'capture') {
			const decayedValue = decayTo[twig.value](token);
			if (decayedValue) {
				if (twig.label) {
					crawlState.captures.unshift({
						pattern: branchName,
						label: twig.label,
						value: token.value,
						pos: tokenPos,
					});
				} else if (crawlState.unusedLabels.length > 0) {
					crawlState.captures.unshift({
						pattern: branchName,
						label: crawlState.unusedLabels.shift(),
						value: token.value,
						pos: tokenPos,
					});
				} else if (token.type === 'EOF') {

				} else {
					throw new Error ('Capture found without label');
				}
				advanceToken();
				advanceTwig();
			} else {
				if (
					(multipleOkay && repeated)
					|| zeroOkay
				) {
					advanceTwig();
				} else {
					return {
						matched: false,
						expected: `'${twig.value}'`,
						crawlState,
					};
				}
			}
			continue;
		}
		if (twig.type === 'lookup') {
			if (twig.label) {
				crawlState.unusedLabels.push(twig.label);
			}
			let lookedUp = tryBranches(
				state,
				crawlState,
				twig.value,
			);
			if (lookedUp.matched) {
				crawlState = lookedUp.crawlState;
				tokenPos = crawlState.tokenPos;
				if (multipleOkay) {
					repeated = true;
					// no advanceTwig() here
				} else {
					advanceTwig();
				}
				continue;
			}
			if (
				(multipleOkay && repeated)
				|| zeroOkay
			) {
				advanceTwig();
			} else {
				return {
					matched: false,
					expected: lookedUp.expected.join(', '),
					crawlState,
				};
			}
		}
	}
	return {
		matched: true,
		expected: '',
		crawlState,
	};
};

let printToken = '';
let printStack = [];
const tryBranches = (state, origCrawlState, branchName) => {
	const tree = state.tree;
	const branches = tree[branchName];
	const startPos = origCrawlState.tokenPos;
	const crawlState = JSON.parse(JSON.stringify(origCrawlState)); 
	const successes = [];
	const fails = [];
	const newPrintToken = state.tokens[startPos].value;
	if (newPrintToken !== printToken) {
		printToken = newPrintToken;
		debugLog (`\ttokens[${startPos}]: ${state.tokens[startPos].value}`);
	}
	printStack.push(branchName);
	debugLog(`${printStack.join(' > ')}`);
	for (let i = 0; i < branches.length; i++) {
		const triedBranch = tryBranch(state, crawlState, branchName, i);
		if (triedBranch.matched) {
			successes.push(triedBranch);
			break; // don't waste time trying matches after you've got one from the set; mathlang patterns should be mutually exclusive, whereas in the original natlang they could be subsets of each other
			// keep it an array just in case though
		} else {
			fails.push(triedBranch);
		}
	}
	if (successes.length === 0) {
		// debugLog('...Failed!');
		printStack.pop();
		fails.sort((a,b)=>b.crawlState.tokenPos - a.crawlState.tokenPos);
		const maxPos = fails[0].crawlState.tokenPos;
		const expected = fails
			.filter(item=>item.crawlState.tokenPos === maxPos)
			.map(item=>item.expected);
		const crawlError = JSON.parse(JSON.stringify(state.crawlError));
		if (maxPos === crawlError.bestPos) {
			state.crawlError.expected = crawlError.expected.concat(expected);
		}
		if (maxPos > crawlError.bestPos) {
			crawlError.bestPos = maxPos;
			crawlError.expected = expected;
			crawlError.message = `Error at '${printStack.join(' > ')}'`
			state.crawlError = crawlError;
		}
		return { // keeping the succeed/fail return values uniform for sanity's sake
			matched: false,
			pattern: branchName,
			expected,
			crawlState: {
				tokenPos: maxPos,
				collections: {},
				captures: [],
				unusedLabels: [],
				nodes: [],
			},
		};
	}
	debugLog('...Succeeded at ' + printStack.pop());
	if (successes.length > 1) {
		throw new Error ("Handle multiple matching patterns please!");
	} else {
		const success = successes[0];
		const newCrawlState = success.crawlState;
		Object.entries(newCrawlState.collections).forEach(entry=>{
			const [name, dict] = entry;
			const collex = state.collections;
			collex[name] = collex[name] || {};
			Object.keys(dict).forEach(value => {
				collex[name][value] = true;
			});
		})
		newCrawlState.nodes.forEach(node=>{
			state.nodes.push(node); // or is concat more efficient?
		})
		newCrawlState.nodes = [];
		if (onMatch[branchName]) {
			onMatch[branchName](state, newCrawlState, startPos);
		}
		return {
			matched: true,
			pattern: branchName,
			expected: [],
			crawlState: newCrawlState,
		};
	}
};

const parseFile = (lexObject, tree, givenFileName) => {
	const tokens = lexObject.tokens;
	const fileName = givenFileName ? givenFileName : 'auto' + Math.floor(Math.random()*10000000000);
	let crawlState = {
		tokenPos: 0,
		// these should be empty when we're done:
		collections: {},
		captures: [],
		unusedLabels: [],
		nodes: [],
	};
	const state = { // state == file info
		fileName,
		plaintext: lexObject.plaintext,
		success: false, // whether the file parsing succeeded
		nodes: [], // the file nodes discovered
		// these will have no actual effect yet, and are still per-file, but now files can reference each other and build into more interdependent things
		collections: {}, // definitions are collected here to populate autocomplete (TODO)
		warnings: [], // good things to know but non-breaking
		errors: [], // parsing might have still finished if there are errors, but some nodes will be broken so the scenario might be wonky
		tokens: lexObject.tokens, // still useful for error handling; you can get a token by its index (from a node) and look at the token pos within the file (char) to get the line/col to make error messages
		tree, // doesn't hurt to keep
		crawlError: {
			bestPos: 0,
			message: '',
			expected: [],
		},
	};

	// do the thing
	const triedAll = tryBranches(state, crawlState, 'document');
	state.success = triedAll.matched;
	state.crawlState = triedAll.crawlState;
	const crawlError = state.crawlError;
	const expected = [...new Set(state.crawlError.expected)];
	state.crawlError.message = `Expected: ${expected.join(', ')}`;
	if (crawlError.bestPos > 0) {
		state.errors.push({
			value: 'Parse error',
			message: crawlError.message,
			pos: crawlError.bestPos,
		});
	}

	// smooth things out
	state.nodes.forEach(node=>{
		node.fileName = fileName;
	});

	// review errors and warnings
	triedAll.crawlState.captures.forEach(capture => { // won't run if empty
		state.errors.push({
			value: 'Orphaned capture',
			message: `Found orphaned capture at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
			pos: capture.pos,
		});
	});
	triedAll.crawlState.unusedLabels.forEach(capture => { // won't run if empty
		state.errors.push({
			value: 'Unused capture label',
			message: `Found unused capture label at token pos ${capture.pos}! ${capture.label}: ${capture.value}`,
			pos: capture.pos,
		});
	});

	// done!
	return state;
};

const testFile = parseFile(exampleLex, exampleTree);
console.log(testFile.nodes);

if (testFile.success) {
	console.log(JSON.stringify(testFile.nodes, null, '  '));
} else {
	testFile.errors.forEach(error=>{
		const charPos = testFile.tokens[error.pos].pos;
		printParseMessage(testFile.plaintext, charPos, error.message);
	});
}

console.log('break');
