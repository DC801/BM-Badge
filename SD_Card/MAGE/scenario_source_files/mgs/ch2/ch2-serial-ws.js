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

var wordMap = {};
lispish.forEach(function(row) {
	row.forEach(function(item){
		if (Array.isArray(item)) {
			if (item.length === 1) {
				wordMap[item[0].toLowerCase()] = true;
			} else {
				item[1].split('|').forEach(function(thing) {
					wordMap[thing] = true;
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
	while (s.length < 15) {
		s = s.replace(' ', '  ')
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
	'radios',
	'recordings',
	'records',
	'record',
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
	'vinyls',
	'vocoders',
];

var pickedWords = [];
var pick = function (word) {
	if (closeWords.includes(word.toLowerCase())) {
		console.log(`   ${word.toUpperCase()} is close!`);
	} else if (pickedWords.includes(word.toLowerCase())) {
		console.log(`   You found ${word.toUpperCase()} already!`);
	} else if (wordList.includes(word)) {
		pickedWords.push(word);
		console.log(`\n`)
		printBox(pickedWords);
		console.log(`   Found ${word.toUpperCase()}!`);
	} else {
		console.log(`   ${word.toUpperCase()} is not valid`);
	}
}
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
		var insert = '';
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
		// var temp = row
		// 	.replace(/([a-z])([A-Z])/g,'$1<$2')
		// 	.replace(/^([A-Z])/g,'<$1')
		// 	.replace(/([A-Z])$/g,'$1>')
		// 	.replace(/([A-Z])([a-z])/g,'$1>$2')
		// temp = temp.split('').join(' ').toUpperCase() + ' ';
		return temp
			.replace(/</g,green)
			.replace(/>/g,reset)
	});
	padded.forEach(function (line, i) {
		var words = line.replace(/\s+/g,' ').split(' ');
		words.forEach(function (word) {
			if (!pickedWords.includes(word)) {
				line = line.replace(word, word.replace(/[a-z]/g, '-'));
			}
		})
		ret[i] += '  ' + line;
	});
	console.log(ret.join('\n'));
}
var green = '\u001B[33m';
var reset = '\u001B[0m';

printBox();

// wordList.forEach(function(word){
// 	printBox(word);
// });

console.log("GAME OVER")