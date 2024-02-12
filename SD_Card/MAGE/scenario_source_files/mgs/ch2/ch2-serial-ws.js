var lispish = [
	[['T', 'tape'],['M','microphone'],'T',['VINYL'],'UJZDUHEAAUZ',['M', 'media'],'QZGSM'],

	[['A', 'tape'],['I','microphone'],'P',['M','music'],'LK',['CHIPTUNE'],'FBPS',['E','media'],'PQRSAP'],

	[['P', 'tape'],['C','microphone'],'VF',['U','music'],'F',['A','aux'],'XSYNVRZKKY',['D','media'],'F',['R','radio'],'OSUL',['M','mixing']],

	[['E','tape'],['R','microphone'],'STS',['S','music'],'I',['U','aux'],'KASYPNKD',['I','media'],'HI',['A','radio'],'NPF',['I','mixing'],'O'],

	['T',['O','microphone'],'HG',['L','laser'],'Q',['I','music'],'B',['X','aux'],'VLHNPI',['A','media'],'ZVW',['D','radio'],'VN',['X','mixing'],'BY'],

	['Y',['P','microphone'],'UM',['A','laser'],'YW',['C','music'],'EMAO',['COMPACT'],['I','radio'],'P',['I','mixing'],'V',['C','codec'],'Z'],

	[['V','vocoder'],['H','microphone'],'YK',['S','laser|sequencer'],['EQUENCER','sequencer'],'ZPWVQR',['O','radio'],['N','mixing'],'M',['O','codec'],'VU'],

	['F',['O','microphone|vocoder'],'NF',['E','laser'],'NMWWT',['C','cassette'],'GXEQHZOJ',['G','mixing'],'J',['D','codec'],'JJR'],

	['D',['N','microphone'],['C','vocoder'],'T',['R','laser'],'VNQD',['S','song'],['A','cassette'],'V',['STREAM'],'GA',['E','codec'],'HOEZ'],

	['I',['E','microphone'],'O',['O','vocoder'],'OOBB',['O','song'],'D',['S','cassette'],'QLYUEMLT',['C','codec'],['AUDIO']],

	['WVQF',['D','vocoder'],'VJ',['N','song'],'OO',['S','cassette'],'RQN',['MIDI'],'DW',['S','stereo'],['A','album'],'YYO'],

	[['R','recording'],'SONU',['E','vocoder'],['G','song'],'MJ',['H','headphones'],['E','headphones|cassette'],['ADPHONES','headphones'],['T','stereo'],['L','lofi'],['L','album'],'UO',['B','bpm|beat']],

	['M',['E','recording'],'XRFU',['R','vocoder'],['RHY','rhythm'],['T','cassette|rhythm'],['HM','rhythm'],'WHGCR',['E','stereo'],'O',['O','lofi'],['B','album'],'H',['P','bpm'],['E','beat']],

	['WR',['C','recording'],'PGCT',['SYN','synthesizer'],['T','cassette|synthesizer'],['HESIZE','synthesizer'],['R','stereo|synthesizer'],'TA',['F','lofi'],['U','album'],['M','bpm'],'T',['A','beat']],

	['UDW',['O','recording'],'HKXQHY',['E','cassette'],['FREQU','frequency'],['E','frequency|stereo'],['NCY','frequency'],['I','lofi'],['M','album'],'TI',['T','beat']],

	['S',['SUR','surround'],['R','surround|recording'],['OUND','surround'],'VEBG',['BR','broadcast'],['O','broadcast|stereo'],['ADCAST','broadcast'],['H','hifi'],'KA'],

	['L',['SOUN','soundtrack'],['D','soundtrack|recording'],['TRACK','soundtrack'],'C',['TRE','treble'],['B','treble|bass'],['LE','treble'],'PRC',['I','hifi'],'DYM'],

	[['VOLUME'],['I','recording'],'O',['ANALOG'],'F',['A','bass'],'DVMA',['F','hifi'],'CKZD'],

	['UIXXHXE',['N','recording'],['SPEAKER','speakers'],['S','bass|speakers'],'KSV',['I','hifi'],'KZXYN'],

	['QXC',['PHONO','phonograph'],['G','recording|phonograph'],['RAPH','phonograph'],'OY',['S','subwoofer|bass'],['UBWOOFER','subwoofer'],'C'],
];

// word list stuff
var wordMap = {};
lispish.forEach(function(row) {
	row.forEach(function(item){
		if (Array.isArray(item)) {
			if (item.length === 1) {
				wordMap[item[0].toLowerCase()] = false;
			} else {
				item[1].split('|').forEach(function(thing) {
					wordMap[thing] = false;
				})
			}
		}
	});
});
var wordList = Object.keys(wordMap).sort();
var sorted = wordList.slice().sort(function(a,b) {
	return a.length - b.length;
});
var coupled = [];
while (sorted.length) {
	coupled.push(sorted.shift() + ' ' + sorted.pop());
}
var padded = coupled.map(s=>{
	while (s.length < 16) {
		s = s.replace(' ', '  ');
	}
	return s;
});
var closeWords = [
	'albums',
	'base',
	'beats',
	'broadcasts',
	'cassettes',
	'chiptunes',
	'codecs',
	'frequencies',
	'gramophone',
	'headphone',
	'lasers',
	'microphones',
	'phones',
	'phone',
	'mic',
	'musician',
	'radios',
	'recordings',
	'record',
	'sequence',
	'sequencers',
	'sing',
	'singing',
	'songs',
	'sound',
	'soundtracks',
	'synth',
	'synthesizers',
	'track',
	'tracks',
	'speaker',
	'stereos',
	'streams',
	'subwoofers',
	'tapes',
	'tune',
	'tunes',
	'vinyls',
	'vocoders',
];

// state
var pickedWordMap = JSON.parse(JSON.stringify(wordMap));
var lastWord = '';
var lastWordStatus = '';

// draw things
var countPicks = function () {
	return Object.values(pickedWordMap)
		.filter(function(item) { return item; })
		.length;
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
		return prefix + `Oh, yes! Of course! I know ${highlighted}${lastWord.toUpperCase()}${reset}!`;
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
	words = words.map(function(item){ return item.toLowerCase(); });
	lispish.forEach(function(row){
		var insert = '>';
		row.forEach(function(entry){
			if (typeof entry === 'string') {
				insert += entry.toLowerCase();
			} else {
				if (entry.length === 2) {
					var matches = entry[1].split('|');
					if (words.some(function(str){ return matches.includes(str); })) {
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
		})
		ret.push(insert);
	});
	ret = ret.map(function(row) {
		var temp = row.split('').join(' ')
			.replace(/([A-Z])/g, '<$1>')
			.toUpperCase();
		return temp
			.replace(/</g,highlighted)
			.replace(/>/g,notHighlighted);
	});
	padded.forEach(function (line, i) {
		var words = line.replace(/\s+/g,' ').split(' ');
		words.forEach(function (word) {
			if (!pickedWordMap[word]) {
				line = line.replace(word, word.replace(/[a-z]/g, '-'));
			}
		})
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

// gameplay loop
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
}

// colors stuff
var bold = '\u001B[1m';
var reset = '\u001B[0m';
var highlightColor = '33';
var highlighted = `\u001B[${highlightColor}m` + bold;
var notHighlightColor = '31';
var notHighlighted = reset + `\u001B[${notHighlightColor}m`;

printGame(); // first turn


  // ---------------------------------------------- \\
 //                MGS NATLANG TIMES!                \\
//----------------------------------------------------\\

var prefix = `ch2-ws-`;
var varName = `${prefix}flags-tally`;
var pts = "15"; // points to win

var makeCountFlagScript = function () {
	var ret = [
		prefix + `count-flags {`,
		`\tmutate ${varName} = 0;`
	];
	wordList.forEach(function(word) {
		ret.push(`\tif (flag ${prefix}${word} is true) {`);
		ret.push(`\t\tmutate ${varName} + 1;`);
		ret.push(`\t}`);
	});
	ret.push(`}`)
	return ret.join('\n');
};

var makeHeadingSerialDialog = function () {
	var ret = `
serial dialog ${prefix}header {
	"                            WORD SEARCH!"
	"Find words meaningful to the stereo system to break through its amnesia!"
	" "
	"         Type a word! (or type Q to quit)             Pts to win: $${varName}$/${pts}"
}
`;
	return ret.trim();
};

var makeGridLineScriptChunk = function (line, doop) {
	var ret = [
	 	`concat serial dialog ${prefix}rowstart;`,
	];
	// line
	line.forEach(function (entry) {
		if (typeof entry === 'string') {
			var spacey = entry.split('').join(' ') + ' ';
			ret.push(`concat serial dialog { "${spacey}" }`);
		} else {
			var spacey = entry[0].split('').join(' ') + ' ';
			var flags = entry.length === 1
				? [ entry[0].toLowerCase() ]
				: entry[1].split('|');
			var cond = flags.map(function (flag) {
				return `flag ${prefix}${flag} is true`;
			}).join(' || ');
			ret.push(`if (${cond}) {`
				+ `\n\t\tconcat serial dialog { "<y><bold>${spacey}</><r>" }`
				+ `\n\t} else {`
				+ `\n\t\tconcat serial dialog { "${spacey}" }`
				+ `\n\t}`);
		}
	});
	// doop
	var matches = doop.match(/([a-z]+)(\s+)([a-z]+)/);
	var words = [ matches[1], matches[3] ];
	var whiteSpace = matches[2];
	ret.push(`concat serial dialog ${prefix}col;`);
	ret.push(
		words.map(function (word) {
			return `if (flag ch2-ws-${word} is true) {`
				+ `\n\t\tconcat serial dialog { "${word}" }`
				+ `\n\t} else {`
				+ `\n\t\tconcat serial dialog { "${'-'.repeat(word.length)}" }`
				+ `\n\t}`;
		}).join(`\n\tconcat serial dialog { "${whiteSpace}" }\n\t`)
	);
	ret.push(`concat serial dialog newline;`);
	return ret.map(function (row) {
		return '\t' + row;
	}).join('\n');
};

var makeBoxPrintScript = function () {
	var ret = [
		`${prefix}draw-map {`,
	];
	lispish.forEach(function (row, i) {
		ret.push('', `\t// ROW ${i}`);
		ret.push(makeGridLineScriptChunk(row, padded[i]))
	});
	return ret.join('\n') + '\n}';
};

var makeInputDialog = function () {
	var ret = [
		`${prefix}serial dialog {`,
		`\t" "`,
		`\t_ "Q" : ${prefix}quit`,
		`\t_ "QUIT" : ${prefix}quit`
	];
	ret.push('	// target words');
	wordList.forEach(function (word) {
		var scriptName = `${prefix}guess-${word}`;
		ret.push(`\t\t_ "${word.toUpperCase()}" : ${scriptName}`);
	});
	ret.push('	// "close" words');
	closeWords.forEach(function (word) {
		var scriptName = `${prefix}guess-${word}`;
		ret.push(`\t\t_ "${word.toUpperCase()}" : ${scriptName}`);
	});
	ret.push('}')
	return ret.join('\n');
};

var makeCloseGuessScript = function (word) {
return `ch2-ws-guess-${word.toLowerCase()} {
	mutate ch2-ws-turn-value = $${word.toLowerCase()};
	mutate ch2-ws-turn-status = $close;
	goto ch2-ws-doturn;
}`
};
var closeGuessScripts = closeWords.map(makeCloseGuessScript)
	.join('\n');

var makeHitGuessScript = function (word) {
return `ch2-ws-guess-${word} {
	mutate ch2-ws-turn-value = $${word};
	if (flag ch2-ws-${word} is true) {
		mutate ch2-ws-turn-status = $repeat;
	} else {
		set flag ch2-ws-${word} to true;
		mutate ch2-ws-turn-status = $hit;
	}
	goto ch2-ws-doturn;
}`
};
var hitGuessScripts = wordList.map(makeHitGuessScript)
	.join('\n');

var makeCloseGuessMessage = function (word) {
return `if (variable ch2-ws-turn-value is $${word.toLowerCase()}) {
		concat serial dialog {
			"${word.toUpperCase()}? No, but I think that's close."
		}
}`
};
var closeGuessMessages = '\t' + closeWords.map(makeCloseGuessMessage)
	.join(' else ');

var makeHitMessage = function (word) {
return `if (variable ch2-ws-turn-value is $${word.toLowerCase()}) {
		if (variable ch2-ws-turn-status is $repeat) {
			concat serial dialog {
				"${word.toUpperCase()}? Oh, but you've found that one already."
			}
		} else {
			concat serial dialog {
				"<y>${word.toUpperCase()}</>! Yes, genuis! That's it! I remember now."
			}
		}
	}`
}
var hitMessages = '\t' + wordList.map(makeHitMessage)
	.join(' else ');

console.log("GAME OVER");
