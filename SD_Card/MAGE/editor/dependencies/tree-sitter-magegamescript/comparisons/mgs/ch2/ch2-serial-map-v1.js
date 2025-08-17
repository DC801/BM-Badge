var lispish = [
	['-------------------------------'],
	[
		//row 1
		'|  ',
		['=99', '/----\\'],
		'      ',
		['=14', '-'],
		'      CASTLE  |',
	],
	[
		//row 2
		'|  ',
		['=99', '|.@?.|'],
		'     ',
		['=14', '/.\\'],
		'        MAP  |',
	],
	[
		//row 3
		'|  ',
		['=99', '------'],
		'   ',
		['=14', '/..@?.\\'],
		'           |',
	],
	[
		//row 4
		'|           ',
		['=14', '-'],
		['=14||13', '--+--'],
		['=14', '-'],
		'           |',
	],
	[
		//row 5
		'|            ',
		['=13', '|...|'],
		'   ',
		['=33', '---'],
		['=33||34', '-'],
		['=34', '---'],
		'  |',
	],
	[
		//row 6
		'|   ',
		['=23', '-----'],
		'    ',
		['=13', '|.@.|'],
		'   ',
		['=33', '|?@'],
		['=33||34', '|'],
		['=34', '@?|'],
		'  |',
	],
	[
		//row 7
		'|  ',
		['=23', '/..@..\\'],
		'   ',
		['=13', '|.?.|'],
		'   ',
		['=33', '-'],
		['=33||32', '-+'],
		['=33||32||34', '-'],
		['=32||34', '+-'],
		['=34', '-'],
		'  |',
	],
	[
		//row 8
		'|  ',
		['=23', '\\..?../'],
		'   ',
		['=13', '|...|'],
		'    ',
		['=32', '|.@.|'],
		'   |',
	],
	[
		//row 9
		'|   ',
		['=22||23', '--+--'],
		'    ',
		['=12||13', '--+-'],
		['=12||13||31', '-'],
		['=31', '----'],
		['=31||32', '--+--'],
		'   |',
	],
	[
		//row 10
		'|   ',
		['=22', '|.@?|'],
		'    ',
		['=12', '|.@?'],
		['=12||31', '+'],
		['=31', '...@.?..|'],
		'   |',
	],
	[
		//row 11
		'|   ',
		['=22||21', '--+--'],
		['=21', '----'],
		['=11||12||21', '-'],
		['=11||12', '-+-'],
		['=11||12||31', '-'],
		['=31', '---------'],
		'   |',
	],
	[
		//row 12
		'|   ',
		['=21', '|...@.?..'],
		['=21||11', '+'],
		['=11', '.@?|'],
		'            |',
	],
	[
		//row 13
		'|   ',
		['=21', '-------'],
		'----+----          |',
	],
	[
		//row 14
		'|          |...',
		['=1', '@'],
		'...|          |',
	],
	[
		//row 15
		'|          ----+----          |',
	],
	[
		//row 16
		'-------------------------------',
	],
];

/* TESTING THINGS OUT (in JS) */

var paths = {
	1: {
		label: 'Castle entrance',
		north: '11',
	},
	11: {
		label: 'Castle foyer (south)',
		north: '12',
		west: '21',
		south: '1',
	},
	12: {
		label: 'Castle foyer (north)',
		north: '13',
		east: '31',
		south: '11',
	},
	13: {
		label: 'Throne room',
		north: '14',
		south: '12',
	},
	14: {
		label: "King Gibson's bedroom",
		south: '13',
	},
	21: {
		label: 'Workshop',
		north: '22',
		east: '11',
	},
	22: {
		label: 'Server room',
		north: '23',
		south: '21',
	},
	23: {
		label: 'Geothermal plant',
		south: '22',
	},
	31: {
		label: 'Great hall',
		west: '12',
		north: '32',
	},
	32: {
		label: 'Kitchen',
		north: '33',
		south: '31',
	},
	33: {
		label: 'Hydroponics',
		east: '34',
		south: '32',
	},
	34: {
		label: 'Pantry',
		west: '33',
	},
};

var flagConditions = {
	11: ['ch2_map_monitor'],
	12: ['ch2_map_needle'],
	13: ['ch2_map_goldfish'],
	14: ['ch2_map_clock'],
	21: ['ch2_map_abacus', 'ch2_map_ramchips', 'ch2_map_solder'],
	22: ['ch2_map_powersupply'],
	23: ['ch2_map_heatsink'],
	31: ['ch2_map_keyboard'],
	33: ['ch2_map_mouse'],
	34: ['ch2_map_plate'],
	99: ['ch2_map_mainframeos'],
};

var startMessageAtRow = 13;
var messagePadding = '   ';
var messages = {
	ch2_map_cactuscooler_castle: [
		'Look for <m>Cactus Cooler</>',
		'somewhere they keep',
		'refreshments or drinks.',
	],
	ch2_map_cactuscooler_bobaustin: [
		'Ask <m>Stone Cold Bob Austin</>',
		'about Cactus Cooler; he brings',
		'loads to all his parties.',
	],
	ch2_map_seamoss: ['Look for <m>Sea Moss</>', 'somewhere in the east wing', 'of the castle.'],
	ch2_map_manual: [
		"Look for <m>Frankie's</>",
		'<m>calculator manual</>',
		'in the library in town.',
	],
};
var specialCharStyles = {
	'@': 'c',
	'?': 'g',
};

var printMap = function () {
	var string = '';
	lispish.forEach(function (row, index) {
		// console.log("PRINTING ROW " + index);
		var insert = '';
		row.forEach(function (chonk) {
			if (Array.isArray(chonk)) {
				if (chonk[0].includes('=')) {
					var drawMe = false;
					var targets = chonk[0].replace('=', '').split('||');
					targets = targets.map(function (string) {
						return parseInt(string, 10);
					});
					targets.forEach(function (room) {
						if (seenRooms[room]) {
							drawMe = true;
						}
					});
					if (drawMe) {
						if (targets[0] === location && chonk[1].includes('@')) {
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
		});
		// console.log(insert);
		string += insert + '\n';
	});
	if (paths[location]) {
		string += `LOCATION: ${paths[location].label}\n`;
		var exits = getExitsForRoom(location);
		string += `Exits: ${exits.join(', ')}`;
	}
	// console.log(string);
	return string;
};

var getExitsForRoom = function (room) {
	if (paths[room]) {
		var exits = Object.keys(paths[room]).filter(function (item) {
			return item !== 'label';
		});
		return exits;
	} else {
		console.error('No paths found for room #' + room);
		return false;
	}
};

var location = 1;
var seenRooms = {
	1: true,
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
	} else if (direction === 'dennis') {
		console.log('Cheeky....');
	} else {
		console.log('You cannot go ' + direction);
	}
};

printMap();

/* TRANSLATING MAP TO NATLANG */

var makeNatlangMapLogicSegment = function (template) {
	if (!Array.isArray(template)) {
		// just a plain thing; draw verbatim
		return `	concat serial dialog {"${template}"}`;
	}
	var roomCondition = template[0]
		.replace('=', '')
		.split('||')
		.map(function (room) {
			return `flag ch2-seen-room-${room} is true`;
		})
		.join(' || ');

	var ret = [];
	var insert = '';
	var insertInsert = function () {
		ret.push(
			`	if (${roomCondition}) {` +
				`\n		concat serial dialog {"${insert}"}` +
				`\n	} else {` +
				`\n		concat serial dialog {"${' '.repeat(insert.length)}"}` +
				`\n	}`,
		);
		insert = '';
	};

	template[1].split('').forEach(function (char) {
		if (char !== '@' && char !== '?') {
			// normal segment
			insert += char;
		} else {
			// special char
			if (insert.length) {
				// if there's anything to insert, clean it up
				insertInsert();
			}
			var messageName = '';
			var currentRoom = template[0].replace('=', '');
			var specialCondition = '';
			if (char === '@') {
				// The player will not be in multiple rooms simultaneously... (right?)
				specialCondition = `variable ch2_in_room is ${currentRoom}`;
				messageName = 'player';
			} else if (char === '?') {
				specialCondition = flagConditions[currentRoom]
					.map(function (flagName) {
						return `flag ${flagName} is true`;
					})
					.join(' || ');
				messageName = 'item';
			}
			ret.push(
				`	if (${specialCondition}) {` +
					`\n		concat serial dialog ${messageName};` +
					`\n	} else {` +
					`\n		if (${roomCondition}) {` +
					`\n			concat serial dialog dot;` +
					`\n		} else {` +
					`\n			concat serial dialog space;` +
					`\n		}` +
					`\n	}`,
			);
		}
	});
	if (insert.length) {
		// if there's anything left to insert
		insertInsert();
	}
	return ret.join('\n');
};

// optional message

var messagePrefix = `<${specialCharStyles['?']}>?</> `;
var getMessageText = function (flagName, messageIndex) {
	var message = messagePadding;
	message += messageIndex === 0 ? messagePrefix : '';
	message += messages[flagName][messageIndex];
	return message;
};

var makeNatlangMapRow = function (rowData, rowIndex) {
	var ret = rowData.map(makeNatlangMapLogicSegment);
	// label at the top
	ret.unshift(`\n	// ROW ${rowIndex}`);

	// optional extra messages
	var messageDiff = rowIndex - startMessageAtRow;
	if (messageDiff >= 0) {
		var messageFlagNames = Object.keys(messages).filter(function (flagName) {
			return messages[flagName].length > messageDiff;
		});
		if (messageFlagNames.length) {
			var zigs = messageFlagNames.map(function (flagName) {
				return (
					`if (flag ${flagName} is true) {` +
					`\n		concat serial dialog {"${getMessageText(flagName, messageDiff)}"}` +
					`\n	}`
				);
			});
			var joinedZigs = `	` + zigs.join(' else ');
			ret.push(joinedZigs);
		}
	}
	ret.push(`	concat serial dialog newline;`);
	return ret.join('\n');
};

var makeNatlangMap = function (lispish) {
	var ret = []
		.concat(
			[
				`serial dialog newline {"\\n"}`,
				`serial dialog space {" "}`,
				`serial dialog dot {"."}`,
				`serial dialog player {"<${specialCharStyles['@']}>@</>"}`,
				`serial dialog item {"<${specialCharStyles['?']}>?</>"}`,
				`draw_ch2_serial_map {`,
				`	turn serial control off;`,
			],
			lispish.map(makeNatlangMapRow),
			[`	goto draw_ch2_serial_map_footer;`, `}`],
		)
		.join('\n');
	return ret.replace(/\\(?!n)/g, '\\\\');
};

var natlangOutput = makeNatlangMap(lispish);

// I'm so sorry future me!! Bodge for the double messages:
var bodgeRows = [10, 11, 12]; // the row *after* the insertion (for find/replace)
bodgeRows.forEach(function (item, i) {
	var find = `concat serial dialog newline;\n\n\t// ROW ${item}`;
	var insert = messages['ch2_map_manual'][i];
	if (i === 0) {
		insert = '<g>?</> ' + insert;
	}
	var replace =
		`if (flag ch2_map_manual is true) {
		if (flag ch2_map_seamoss is true) {
			concat serial dialog {"   ${insert}"}
		}
	}\n\t` + find;
	natlangOutput = natlangOutput.replace(find, replace);
});

console.log(natlangOutput);
