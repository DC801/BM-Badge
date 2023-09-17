var lispish =
[
	["-------------------------------"],
	[//row 1
		"|  ",
		["=99", "/----\\"],
		"      ",
		["=14", "-"],
		"       M A P  |"
	],
	[//row 2
		"|  ",
		["=99", "|.@..|"],
		"     ",
		["=14", "/.\\"],
		"             |"
	],
	[//row 3
		"|  ",
		["=99", "------"],
		"   ",
		["=14", "/..@..\\"],
		"           |"
	],
	[//row 4
		"|           ",
		["=14", "-"],
		["=14||13", "-----"],
		["=14", "-"],
		"           |"
	],
	[//row 5
		"|            ",
		["=13", "|...|"],
		"   ",
		["=33", "----"],
		["=33||34", "-"],
		["=34", "--"],
		"  |"
	],
	[//row 6
		"|   ",
		["=23", "-----"],
		"    ",
		["=13", "|.@.|"],
		"   ",
		["=33", "|.@."],
		["=33||34", "|"],
		["=34", "@|"],
		"  |"
	],
	[//row 7
		"|  ",
		["=23", "/..@..\\"],
		"   ",
		["=13", "|...|"],
		"   ",
		["=33", "-"],
		["=33||32", "---"],
		["=33||32||34", "-"],
		["=32||34", "-"],
		["=34", "-"],
		"  |"
	],
	[//row 8
		"|  ",
		["=23", "\\...../"],
		"   ",
		["=13", "|...|"],
		"    ",
		["=32", "|.@.|"],
		"   |"
	],
	[//row 9
		"|   ",
		["=22||23", "-----"],
		"    ",
		["=12||13", "----"],
		["=12||13||31", "-"],
		["=31", "----"],
		["=31||32", "-----"],
		"   |"
	],
	[//row 10
		"|   ",
		["=22", "|.@.|"],
		"    ",
		["=12", "|.@."],
		["=12||31", "|"],
		["=31", "...@....|"],
		"   |"
	],
	[//row 11
		"|   ",
		["=22||21", "-----"],
		["=21", "----"],
		["=11||12||21", "-"],
		["=11||12", "---"],
		["=11||12||31", "-"],
		["=31", "---------"],
		"   |"
	],
	[//row 12
		"|   ",
		["=21", "|...@...."],
		["=21||11", "|"],
		["=11", ".@.|"],
		"            |"
	],
	[//row 13
		"|   ",
		["=21", "-------"],
		"---------          |"
	],
	[//row 14
		"|          |...",
		["=1", "@"],
		"...|          |"
	],
	[//row 15
		"|          ---------          |"
	],
	[//row 16
		"-------------------------------"
	],
];

/* TESTING THINGS OUT (in JS) */

var paths = {
	"1": {
		label: "Castle entrance",
		north: "11",
	},
	"11": {
		label: "Castle foyer (south)",
		north: "12",
		west: "21",
		south: "1",
	},
	"12": {
		label: "Castle foyer (north)",
		north: "13",
		east: "31",
		south: "11",
	},
	"13": {
		label: "Throne room",
		north: "14",
		south: "12",
	},
	"14": {
		label: "King Gibson's bedroom",
		south: "13",
	},
	"21": {
		label: "Workshop",
		north: "22",
		east: "11",
	},
	"22": {
		label: "Server room",
		north: "23",
		south: "21",
	},
	"23": {
		label: "Geothermal plant",
		south: "22",
	},
	"31": {
		label: "Great hall",
		west: "12",
		north: "32",
	},
	"32": {
		label: "Kitchen",
		north: "33",
		south: "31",
	},
	"33": {
		label: "Hydroponics",
		east: "34",
		south: "32",
	},
	"34": {
		label: "Pantry",
		west: "33",
	},
}

/*

- [x] 11 => ch2-map-monitor is true
- [x] 12 => ch2-map-needle is true
- [x] 13 => ch2-map-goldfish is true
- [x] 14 => ch2-map-clock is true
- [x] 21 => ch2-map-abacus is true
- [x] 21 => ch2-map-ramchips is true
- [x] 22 => ch2-map-powersupply is true
- [x] 23 => ch2-map-heatsink is true
- [x] 31 => ch2-map-keyboard is true
- [x] 33 => ch2-map-mouse is true
- [x] 34 => ch2-map-plate is true
- [x] 99 => ch2-map-mainframeos is true
- [x] M => ch2-map-cactuscooler-castle is true
	Message: Look for Cactus Cooler somewhere they keep refreshments or drinks.
- [x] M => ch2-map-cactuscooler-bobaustin is true
	Map Message: Ask Stone Cold Bob Austin about Cactus Cooler; he brings loads to all his parties.
- [x] M => ch2-map-seamoss is true
	Message: Look for Sea Moss somewhere in the east wing of the castle.


*/

var messages = {

}

var printMap = function () {
	var string = '';
	lispish.forEach(function (row, index) {
		// console.log("PRINTING ROW " + index);
		var insert = '';
		row.forEach(function (chonk) {
			if (Array.isArray(chonk)) {
				if (chonk[0].includes('=')) {
					var drawMe = false;
					var targets = chonk[0].replace('=','').split('||');
					targets = targets.map(function (string) {
						return parseInt(string, 10);
					})
					targets.forEach(function (room) {
							if (seenRooms[room]) {
								drawMe = true;
							}
						});
					if (drawMe) {
						if (
							targets[0] === location
							&& chonk[1].includes('@')
						) {
							insert += chonk[1];
						} else {
							insert += chonk[1].replace('@', '.');
						}
					} else {
						insert += ' '.repeat(chonk[1].length);
					}
				}
			} else {
				insert += chonk;
			}
		})
		// console.log(insert);
		string += insert + '\n';
	})
	if (paths[location]) {
		string += `LOCATION: ${paths[location].label}\n`
		var exits = getExitsForRoom(location);
		string += `Exits: ${exits.join(', ')}`
	}
	console.log(string);
	return string;
};

var getExitsForRoom = function (room) {
	if (paths[room]) {
		var exits = Object.keys(paths[room])
			.filter(function (item) {
				return item !== 'label'
			})
		return exits;
	} else {
		console.error('No paths found for room #' + room);
		return false;
	}
};

var location = 1;
var seenRooms = {
	"1": true,
};

var teleport = function (_room) {
	var room = parseInt(_room, 10);
	seenRooms[room] = true;
	location = room;
	printMap();
};
var visit = function (room) {
	seenRooms[room] = true;
	printMap();
};
var unvisit = function (room) {
	seenRooms[room] = false;
	printMap();
};
var go = function (_direction) {
	var direction = _direction.toLocaleLowerCase();
	var exits = getExitsForRoom(location);
	if (exits.includes(direction)) {
		teleport(paths[location][direction]);
	} else if (direction === "dennis") {
		console.log("Cheeky....");
	} else {
		console.log("You cannot go " + direction);
	}
};

printMap();

/* TRANSLATING MAP TO NATLANG */

var makeNatlangMapRow = function (rowArray) {
	var result = '';
	rowArray.forEach(function (chonk, index) {
		if (Array.isArray(chonk)) {
			var targets = chonk[0].replace('=','').split('||');
			var printme = chonk[1];
			var blankprintme = ' '.repeat(printme.length);
			var verboseTargets = targets
				.map(function (item) {
					return 'flag ch2-seen-room-' + item + ' is true';
				})
				.join(' || ')
			result += `\tif (${verboseTargets}) {\n`;
			if (printme.includes('@')) {
				var splits = printme.split('@');
				if (splits[0].length) {
					result += `\t\tconcat serial dialog {"${splits[0]}"}\n`;
				}
				result += `\t\tif (variable ch2-in-room is ${targets[0]}) {\n`;
				result += `\t\t\tconcat serial dialog {"<c>@</>"}\n`; // NOTE: format the `@` here!
				result += `\t\t} else {\n`;
				result += `\t\t\tconcat serial dialog {"."}\n`;
				result += `\t\t}\n`;
				if (splits[1].length) {
					result += `\t\tconcat serial dialog {"${splits[1]}"}\n`;
				}
			} else {
				result += `\t\tconcat serial dialog {"${printme}"}\n`;
			}
			result += `\t} else {\n`;
			result += `\t\tconcat serial dialog {"${blankprintme}"}\n`;
			result += `\t}\n`;
		} else {
			if (index === rowArray.length - 1) { // making some assumptions :P
				result += `\tconcat serial dialog {"${chonk}\\n"}\n`;
			} else {
				result += `\tconcat serial dialog {"${chonk}"}\n`;
			}
		}
	})
	return result;
}

var makeNatlangMap = function () {
	var result = 'draw-ch2-serial-map {\n';
	result += '\tset serial control off\n';
	lispish.forEach(function (row, index) {
		if (index !== 0) {
			result += '\n'
		}
		result += `\t// ROW ${index}\n`
		result += makeNatlangMapRow(row);
	})
	result += '\tgoto draw-ch2-serial-map-footer\n'
	result += '}\n'
	result = result.replace(/\\(?!n)/g, "\\\\");
	return result;
};

console.log("breakpoint me lol")
