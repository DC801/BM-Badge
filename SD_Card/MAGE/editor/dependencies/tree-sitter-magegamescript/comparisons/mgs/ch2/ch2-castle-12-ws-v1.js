// source data
var lispish = [
	[['T', 'tape'], ['M', 'microphone'], 'T', ['VINYL'], 'UJZDUHEAAUZ', ['M', 'media'], 'QZGSM'],

	[
		['A', 'tape'],
		['I', 'microphone'],
		'P',
		['M', 'music'],
		'LK',
		['CHIPTUNE'],
		'FBPS',
		['E', 'media'],
		'PQRSAP',
	],

	[
		['P', 'tape'],
		['C', 'microphone'],
		'VF',
		['U', 'music'],
		'F',
		['A', 'aux'],
		'XSYNVRZKKY',
		['D', 'media'],
		'F',
		['R', 'radio'],
		'OSUL',
		['M', 'mixing'],
	],

	[
		['E', 'tape'],
		['R', 'microphone'],
		'STS',
		['S', 'music'],
		'I',
		['U', 'aux'],
		'KASYPNKD',
		['I', 'media'],
		'HI',
		['A', 'radio'],
		'NPF',
		['I', 'mixing'],
		'O',
	],

	[
		'T',
		['O', 'microphone'],
		'HG',
		['L', 'laser'],
		'Q',
		['I', 'music'],
		'B',
		['X', 'aux'],
		'VLHNPI',
		['A', 'media'],
		'ZVW',
		['D', 'radio'],
		'VN',
		['X', 'mixing'],
		'BY',
	],

	[
		'Y',
		['P', 'microphone'],
		'UM',
		['A', 'laser'],
		'YW',
		['C', 'music'],
		'EMAO',
		['COMPACT'],
		['I', 'radio'],
		'P',
		['I', 'mixing'],
		'V',
		['C', 'codec'],
		'Z',
	],

	[
		['V', 'vocoder'],
		['H', 'microphone'],
		'YK',
		['S', 'laser|sequencer'],
		['EQUENCER', 'sequencer'],
		'ZPWVQR',
		['O', 'radio'],
		['N', 'mixing'],
		'M',
		['O', 'codec'],
		'VU',
	],

	[
		'F',
		['O', 'microphone|vocoder'],
		'NF',
		['E', 'laser'],
		'NMWWT',
		['C', 'cassette'],
		'GXEQHZOJ',
		['G', 'mixing'],
		'J',
		['D', 'codec'],
		'JJR',
	],

	[
		'D',
		['N', 'microphone'],
		['C', 'vocoder'],
		'T',
		['R', 'laser'],
		'VNQD',
		['S', 'song'],
		['A', 'cassette'],
		'V',
		['STREAM'],
		'GA',
		['E', 'codec'],
		'HOEZ',
	],

	[
		'I',
		['E', 'microphone'],
		'O',
		['O', 'vocoder'],
		'ROBB',
		['O', 'song'],
		'D',
		['S', 'cassette'],
		'QLYUEMLT',
		['C', 'codec'],
		['AUDIO'],
	],

	[
		'WVQF',
		['D', 'vocoder'],
		'VJ',
		['N', 'song'],
		'OO',
		['S', 'cassette'],
		'RQN',
		['MIDI'],
		'DW',
		['S', 'stereo'],
		['A', 'album'],
		'YYO',
	],

	[
		['R', 'recording'],
		'SONU',
		['E', 'vocoder'],
		['G', 'song'],
		'MJ',
		['H', 'headphones'],
		['E', 'headphones|cassette'],
		['ADPHONES', 'headphones'],
		['T', 'stereo'],
		['L', 'lofi'],
		['L', 'album'],
		'UO',
		['B', 'bpm|beat'],
	],

	[
		'M',
		['E', 'recording'],
		'XRFU',
		['R', 'vocoder'],
		['RHY', 'rhythm'],
		['T', 'cassette|rhythm'],
		['HM', 'rhythm'],
		'WHGCR',
		['E', 'stereo'],
		'O',
		['O', 'lofi'],
		['B', 'album'],
		'H',
		['P', 'bpm'],
		['E', 'beat'],
	],

	[
		'WR',
		['C', 'recording'],
		'PGCT',
		['SYN', 'synthesizer'],
		['T', 'cassette|synthesizer'],
		['HESIZE', 'synthesizer'],
		['R', 'stereo|synthesizer'],
		'TA',
		['F', 'lofi'],
		['U', 'album'],
		['M', 'bpm'],
		'T',
		['A', 'beat'],
	],

	[
		'UDW',
		['O', 'recording'],
		'HKXQHY',
		['E', 'cassette'],
		['FREQU', 'frequency'],
		['E', 'frequency|stereo'],
		['NCY', 'frequency'],
		['I', 'lofi'],
		['M', 'album'],
		'TI',
		['T', 'beat'],
	],

	[
		'S',
		['SUR', 'surround'],
		['R', 'surround|recording'],
		['OUND', 'surround'],
		'VEBG',
		['BR', 'broadcast'],
		['O', 'broadcast|stereo'],
		['ADCAST', 'broadcast'],
		['H', 'hifi'],
		'KA',
	],

	[
		'L',
		['SOUN', 'soundtrack'],
		['D', 'soundtrack|recording'],
		['TRACK', 'soundtrack'],
		'C',
		['TRE', 'treble'],
		['B', 'treble|bass'],
		['LE', 'treble'],
		'PRC',
		['I', 'hifi'],
		'DYM',
	],

	[
		['VOLUME'],
		['I', 'recording'],
		'O',
		['ANALOG'],
		'F',
		['A', 'bass'],
		'DVMA',
		['F', 'hifi'],
		'CKZD',
	],

	[
		'UIXXHXE',
		['N', 'recording'],
		['SPEAKER', 'speakers'],
		['S', 'bass|speakers'],
		'KSV',
		['I', 'hifi'],
		'KZXYN',
	],

	[
		'QXC',
		['PHONO', 'phonograph'],
		['G', 'recording|phonograph'],
		['RAPH', 'phonograph'],
		'OY',
		['S', 'subwoofer|bass'],
		['UBWOOFER', 'subwoofer'],
		'C',
	],
];
var hitWordsDescriptions = {
	album: 'Oh, of course! This is my bread and butter!',
	analog: 'Yeah! Who could forget that warm, velvety sound?',
	audio: "That's right! My raison d'etre! My joie de vivre!",
	aux: 'How could I forget? Who would ever want to lose this?',
	bass: "Oh, yeah! I'm all about that low frequency! It's the butter zone!",
	beat: "It's all coming back! Makes my LEDs all tingly.",
	bpm: 'Oh, yeah! Reminds me of my buddy, Metronome!',
	broadcast: 'Oh, yeah! Reminds me of those aluminum flags I used to wear.',
	cassette: "Oh, I remember those! They're so cute and spindly!",
	chiptune: 'Oh, right! So sine wavey and squarey....',
	codec: "Oh, that's right, I think I know a few of these.",
	compact: 'Ha! Compact discs? More like--yeah, no, I got nothing.',
	frequency: "That's the best! Dial it in, find the sweet spot....",
	headphones: "Yeah, I remember these! Let's get tinitus together!",
	hifi: 'Who could forget? My audio standards are through the ROOF!',
	laser: "Ahaha, that's right! It's all about the 1s and 0s, isn't it?",
	lofi: "Oh, so nostalgic! Oh... I'm tearing up.",
	media: "Oh, that's right! Anything you can throw at me, I can take!",
	microphone: 'Oh yeah! I used to host karaoke parties all the time!',
	midi: "WOW, that's right! Who has a classy sound font? This guy!",
	mixing: "Aha, so that's what my second tape deck was for!",
	music: 'Oh, yes! I remember! This is the best part about all of this!',
	phonograph: "Oh, that's right, my great-grandpa! That takes me back.",
	radio: "Yeah, let's take a caller! Let's go to a commercial!",
	recording: "Yes! This is the best part! It's like having a time machine!",
	rhythm: "Yeah! You've hit the nail on the head! That's why we're here!",
	sequencer: 'Oh yeah! I always wanted to be one of these when I grew up.',
	song: 'Oh, yes! These are like stories, or like memories! I remember....',
	soundtrack: "Aha! Wonderful. I'm remembering....",
	speakers: 'Oh, yeah! Without these, music would be DEAD.',
	stereo: 'Ooh ooh! Yeah, I control the horizontal... of a sort.',
	stream: "Oh, yeah! Buffer 'til the cows come home!",
	subwoofer: "Oh, that's right! Let's rattle some windows!",
	surround: 'I remember filling the world with sound from all around!',
	synthesizer: 'Oh! I had a job in college where I worked as one of these.',
	tape: 'Aha, I remember... those things give me indigestion! Yuck!',
	treble: 'Of course! Sends shivers down my copper wiring!',
	vinyl: 'Oh! What a nostalgic thought! Reminds me of old grandpappy....',
	vocoder: 'Oh, yeah! I remembered how to do a Dalek voice!',
	volume: 'Aha, I remember this! And why stop at 11?',
};
var closeWordsDescriptions = {
	albums: "Love your enthusiasm, but I'm a single-slot kind of guy.",
	base: 'Hmmm. Is that how you spell that?',
	beats: "Almost, but not quite what I'm looking for.",
	broadcasts: "Optimistic, but I don't know about that.",
	cassettes: 'As in multiple? What decade is this?',
	chiptunes: "I think you're a smidge off, but keep trying.",
	codecs: "I think you're nearly there, but not quite.",
	frequencies: "Almost, but not what I'm thinking of.",
	gramophone: 'Are you just making things up now?',
	headphone: "Is that like a 'scissor'? Or a 'pant'?",
	lasers: 'Almost, but not quite. Sounds fun though!',
	microphones: 'Do I look like I need more than one?',
	phones: 'Close, but way off.',
	phone: 'Getting close to something, I can feel it.',
	mic: "No, but I think that's almost something.",
	musician: "A bit overboard, but you're on to something.",
	radios: "Sorry, there's only one of me here.",
	recordings: "Close, but I think you're going a bit overboard.",
	record: 'Aha, yes! Oh, no, wait. Not this time. Close though.',
	sequence: "You're getting somewhere, but no dice this time.",
	sequencers: 'Were that I was that cool! Maybe scale that back.',
	sing: "I feel like that's close, but I don't know.",
	singing: "I mean sure, but... no, that's not what I'm missing.",
	songs: 'Almost! Not exactly though.',
	sound: "I mean sure, but... no, not what I'm looking for.",
	soundtracks: "Enthusiastic, aren't you! Not quite, though.",
	synth: 'Getting there, but I think you can go bigger!',
	synthesizers: 'Almost there, but maybe a little different.',
	track: "Was it more than that? It's on the tip of my silicon.",
	tracks: "No, but I think that's close.",
	speaker: "Hey, I'm more sophisticated than that! Go bigger!",
	stereos: 'Can you use the word like that? Was it something similar?',
	streams: "I'm loving the river vibe, but not exactly right.",
	subwoofers: 'I hardly know her!',
	tapes: 'So close, but a little too much.',
	tune: "Hmmm... almost, but not quite. Maybe it's something more.",
	tunes: 'Hmmm, maybe something else, something similar.',
	vinyls: "No, I don't know if that's quite how that goes.",
	vocoders: "Technically, yes, but not what I'm looking for this time.",
};
var closeWords = Object.keys(closeWordsDescriptions);

// word list middle stage stuff
var wordMap = {};
lispish.forEach(function (row) {
	row.forEach(function (item) {
		if (Array.isArray(item)) {
			if (item.length === 1) {
				wordMap[item[0].toLowerCase()] = false;
			} else {
				item[1].split('|').forEach(function (thing) {
					wordMap[thing] = false;
				});
			}
		}
	});
});
var wordList = Object.keys(wordMap).sort();
var sorted = wordList.slice().sort(function (a, b) {
	return a.length - b.length;
});
var coupled = [];
while (sorted.length) {
	coupled.push(sorted.shift() + ' ' + sorted.pop());
}
var padded = coupled.map((s) => {
	while (s.length < 16) {
		s = s.replace(' ', '  ');
	}
	return s;
});

// JS game state
var pickedWordMap = JSON.parse(JSON.stringify(wordMap));
var lastWord = '';
var lastWordStatus = '';

// JS draw things
var countPicks = function () {
	return Object.values(pickedWordMap).filter(function (item) {
		return item;
	}).length;
};
var printHeader = function () {
	return [
		``,
		// `----------------------------------|----------------------------------`,
		`                            WORD SEARCH!                             `,
		`Find words meaningful to the stereo system to break through its amnesia!`,
		``,
		`         Type a word! (or type Q to quit)             Pts to win: ${countPicks()}/15`,
		// `T M T V I N Y L U J Z D U H E A A U Z M Q Z G S M    ---  -----------`
	].join('\n');
};
var printFooter = function () {
	var prefix = '\n       ';
	if (lastWordStatus === 'close') {
		return prefix + `Hmm, almost! I think ${lastWord.toUpperCase()} is close!`;
	} else if (lastWordStatus === 'repeat') {
		return prefix + `No, you found ${highlighted}${lastWord.toUpperCase()}${reset} already!`;
	} else if (lastWordStatus === 'hit') {
		return (
			prefix + `Oh, yes! Of course! I know ${highlighted}${lastWord.toUpperCase()}${reset}!`
		);
	} else if (lastWordStatus === 'miss') {
		return prefix + `Nah, ${lastWord.toUpperCase()} doesn't ring a bell.`;
	} else {
		return `\n`;
	}
};

var printBox = function (word) {
	var ret = [];
	var words = [];
	if (typeof word === 'string') {
		words = [word];
	} else if (Array.isArray(word)) {
		words = word;
	}
	words = words.map(function (item) {
		return item.toLowerCase();
	});
	lispish.forEach(function (row) {
		var insert = '>';
		row.forEach(function (entry) {
			if (typeof entry === 'string') {
				insert += entry.toLowerCase();
			} else {
				if (entry.length === 2) {
					var matches = entry[1].split('|');
					if (
						words.some(function (str) {
							return matches.includes(str);
						})
					) {
						insert += entry[0];
					} else {
						insert += entry[0].toLowerCase();
					}
				} else {
					if (words.includes(entry[0].toLowerCase())) {
						insert += entry[0];
					} else {
						insert += entry[0].toLowerCase();
					}
				}
			}
		});
		ret.push(insert);
	});
	ret = ret.map(function (row) {
		var temp = row
			.split('')
			.join(' ')
			.replace(/([A-Z])/g, '<$1>')
			.toUpperCase();
		return temp.replace(/</g, highlighted).replace(/>/g, notHighlighted);
	});
	padded.forEach(function (line, i) {
		var words = line.replace(/\s+/g, ' ').split(' ');
		words.forEach(function (word) {
			if (!pickedWordMap[word]) {
				line = line.replace(word, word.replace(/[a-z]/g, '-'));
			}
		});
		ret[i] += reset + '    ' + line;
	});
	return ret.join('\n');
};

var printGame = function () {
	var printWords = wordList.filter(function (item) {
		return pickedWordMap[item] === true;
	});
	console.log(printHeader());
	console.log(printBox(printWords));
	console.log(printFooter());
	console.log('\n');
};

// JS gameplay loop
var pick = function (word) {
	lastWord = word;
	if (closeWords.includes(lastWord.toLowerCase())) {
		lastWordStatus = 'close';
	} else if (pickedWordMap[lastWord.toLowerCase()] === true) {
		lastWordStatus = 'repeat';
	} else if (pickedWordMap[lastWord.toLowerCase()] === false) {
		lastWordStatus = 'hit';
		pickedWordMap[lastWord.toLowerCase()] = true;
	} else {
		lastWordStatus = 'miss';
	}
	printGame();
};

// colors stuff
var bold = '\u001B[1m';
var reset = '\u001B[0m';
var highlightColor = '33';
var highlighted = `\u001B[${highlightColor}m` + bold;
var notHighlightColor = '31';
var notHighlighted = reset + `\u001B[${notHighlightColor}m`;

// printGame(); // first turn (UNCOMMENT THIS TO PLAY)

// ---------------------------------------------- \\
//                MGS NATLANG TIMES!                \\
//----------------------------------------------------\\

var prefix = `ch2-ws-`;
var varName = `${prefix}flags-tally`;
var pts = '20'; // points to win

var makeCountFlagScript = function () {
	var ret = [prefix + `count-flags {`, `\tmutate ${varName} = 0;`];
	wordList.forEach(function (word) {
		ret.push(`\tif (flag ${prefix}${word} is true) {`);
		ret.push(`\t\tmutate ${varName} + 1;`);
		ret.push(`\t}`);
	});
	ret.push(`}`);
	return ret.join('\n');
};

var makeGridLineScriptChunk = function (line, doop) {
	var ret = [`concat serial dialog ${prefix}rowstart;`];
	// line
	line.forEach(function (entry) {
		if (typeof entry === 'string') {
			var spacey = entry.split('').join(' ') + ' ';
			ret.push(`concat serial dialog { "${spacey}" }`);
		} else {
			var spacey = entry[0].split('').join(' ') + ' ';
			var flags = entry.length === 1 ? [entry[0].toLowerCase()] : entry[1].split('|');
			var cond = flags
				.map(function (flag) {
					return `flag ${prefix}${flag} is true`;
				})
				.join(' || ');
			ret.push(
				`if (${cond}) {` +
					`\n\t\tconcat serial dialog { "<y><bold>${spacey}</><r>" }` +
					`\n\t} else {` +
					`\n\t\tconcat serial dialog { "${spacey}" }` +
					`\n\t}`,
			);
		}
	});
	// doop
	var matches = doop.match(/([a-z]+)(\s+)([a-z]+)/);
	var words = [matches[1], matches[3]];
	var whiteSpace = matches[2];
	ret.push(`concat serial dialog ${prefix}col;`);
	ret.push(
		words
			.map(function (word) {
				return (
					`if (flag ch2-ws-${word} is true) {` +
					`\n\t\tconcat serial dialog { "${word}" }` +
					`\n\t} else {` +
					`\n\t\tconcat serial dialog { "${'-'.repeat(word.length)}" }` +
					`\n\t}`
				);
			})
			.join(`\n\tconcat serial dialog { "${whiteSpace}" }\n\t`),
	);
	ret.push(`concat serial dialog newline;`);
	return ret
		.map(function (row) {
			return '\t' + row;
		})
		.join('\n');
};

var makeBoxPrintScript = function () {
	var ret = [`${prefix}draw-map {`];
	lispish.forEach(function (row, i) {
		ret.push('', `\t// ROW ${i}`);
		ret.push(makeGridLineScriptChunk(row, padded[i]));
	});
	return ret.join('\n') + '\n}';
};

var makeInputDialog = function () {
	var ret = [
		`serial dialog ${prefix}input {`,
		`\t" "`,
		`\t_ "Q" : ${prefix}guess-quit`,
		`\t_ "QUIT" : ${prefix}guess-quit`,
		`\t_ "EXIT" : ${prefix}guess-quit`,
	];
	ret.push('\t// target words');
	wordList.forEach(function (word) {
		var scriptName = `${prefix}guess-${word}`;
		ret.push(`\t_ "${word.toUpperCase()}" : ${scriptName}`);
	});
	ret.push('\t// "close" words');
	closeWords.forEach(function (word) {
		var scriptName = `${prefix}guess-${word}`;
		ret.push(`\t_ "${word.toUpperCase()}" : ${scriptName}`);
	});
	ret.push('	// cheats');
	ret.push(`	_ "GLITTERING PRIZES" : ${prefix}guess-cheat`);
	ret.push('}');
	return ret.join('\n');
};

var cheatGuessBulk = wordList
	.map(function (word) {
		return `\tset flag ${prefix}${word} to true;`;
	})
	.join('\n');
var cheatGuessScript = [
	'// Guesses: cheat',
	'ch2_ws_guess_cheat {',
	'	mutate ch2_ws_turn_value = 0;',
	'	mutate ch2_ws_turn_status = $cheat;',
	cheatGuessBulk,
	'	goto ch2_ws_doturn;',
	'}',
].join('\n');

var makeCloseGuessScript = function (word) {
	return `ch2_ws_guess_${word.toLowerCase()} {
	mutate ch2_ws_turn_value = $${word.toLowerCase()};
	mutate ch2_ws_turn_status = $close;
	goto ch2_ws_doturn;
}`;
};
var closeGuessScripts =
	`// Guesses: "close" words:\n` + closeWords.map(makeCloseGuessScript).join('\n');

var makeHitGuessScript = function (word) {
	return `ch2_ws_guess_${word} {
	mutate ch2_ws_turn_value = $${word};
	if (flag ch2-ws-${word} is true) {
		mutate ch2_ws_turn_status = $repeat;
	} else {
		set flag ch2-ws-${word} to true;
		mutate ch2_ws_turn_status = $hit;
	}
	goto ch2_ws_doturn;
}`;
};
var hitGuessScripts = `// Guesses: hits\n` + wordList.map(makeHitGuessScript).join('\n');

var makeCloseGuessMessage = function (word) {
	var message = closeWordsDescriptions[word.toLowerCase()];
	message = message !== undefined ? message : "No, but I think that's close.";
	return `if (variable ${prefix}turn-value is $${word.toLowerCase()}) {
		concat serial dialog {
			"${word.toUpperCase()}? ${message}"
		}
	}`;
};
var closeGuessMessages = '\t' + closeWords.map(makeCloseGuessMessage).join(' else ');

var makeHitMessage = function (word) {
	var message = hitWordsDescriptions[word.toLowerCase()];
	message = message !== undefined ? message : "Yes, genuis! That's it! I remember now.";
	return `if (variable ${prefix}turn-value is $${word.toLowerCase()}) {
		if (variable ${prefix}turn-status is $repeat) {
			concat serial dialog {
				"${word.toUpperCase()}? Oh, but you've found that one already."
			}
		} else {
			concat serial dialog {
				"<y>${word.toUpperCase()}</>! ${message}"
			}
		}
	}`;
};
var hitMessages = '\t' + wordList.map(makeHitMessage).join(' else ');

var makeTurnMessageScript = function () {
	return (
		`${prefix}turn-message {
	if (variable ${prefix}turn-status is $cheat) {
		concat serial dialog {
			"Whoa! Look who's a medieval man!"
		}
	} else if (variable ${prefix}turn-status is $miss) {
		concat serial dialog {
			"Huh? I don't think I know that word."
		}
	} else ` +
		closeGuessMessages +
		` else ` +
		hitMessages +
		` else {
		if (variable ${prefix}flags-tally is ${wordList.length}) {
			concat serial dialog {
				"You know? I think you've done it! Everything is clear to me now!"
			}
		} else if (flag ${prefix}won is true) {
			concat serial dialog {
				"Oh boy! What else is there inside my head?"
			}
		} else {
			concat serial dialog {
				"My head is all jumbled up. I can almost remember...."
			}
		}
	}
}`.replace(`else 	if`, `else if`)
	);
};

var makeConst = function () {
	return [
		`const!(`,
		`\t$close = 1 $repeat = 2 $hit = 3 $miss = 4 $cheat = 5`,
		`\t// target words`,
		'\t' +
			wordList
				.map(function (s, i) {
					return `$${s.toLowerCase()} = ${i + 1}`;
				})
				.join(' '),
		'\t// "close" words',
		'\t' +
			closeWords
				.map(function (s, i) {
					return `$${s.toLowerCase()} = ${i + 1 + wordList.length}`;
				})
				.join(' '),
		')',
	].join('\n');
};

var natlangFile = [
	makeConst(),
	makeCountFlagScript(),
	makeBoxPrintScript(),
	makeInputDialog(),
	cheatGuessScript,
	closeGuessScripts,
	hitGuessScripts,
	`// MESSAGES`,
	makeTurnMessageScript(),
].join('\n\n');

// `cd` in here, then run `node.exe ch2-castle-12-ws.js > ch2-castle-12-ws.mgs`
// (No `.exe` needed except on Windows)
console.log(natlangFile);
// console.log("GAME OVER");
