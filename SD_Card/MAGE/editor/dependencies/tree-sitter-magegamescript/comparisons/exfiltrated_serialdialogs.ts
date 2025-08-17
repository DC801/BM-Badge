import { colorDifferentStrings } from '../parser-tests.ts';
import { type SerialDialog } from '../parser-types.ts';

export type EncoderSerialDialog = {
	messages: string[];
	name: string;
	text_options?: Record<string, string>;
	options?: {
		label: string;
		script: string;
	}[];
};

export const firstMessage = (dialog: EncoderSerialDialog | SerialDialog): string => {
	return dialog.messages[0].split(' ')[0];
};
export const messagesSummary = (serialDialog: EncoderSerialDialog | SerialDialog): string => {
	return serialDialog.messages
		.map((v) => '"' + v.split(' ').slice(0, 5).join(' ') + '"')
		.join(',')
		.replace(/\n/g, '\\n');
};

const compareSerialOptions = (expected: EncoderSerialDialog, found: SerialDialog) => {
	const expectedTextOptions = Object.entries(expected.text_options || {});
	const expectedPlainOptions = (expected.options || []).map((option) => [
		option.label,
		option.script,
	]);

	const expectedOptions =
		expectedPlainOptions.length > 0 ? expectedPlainOptions : expectedTextOptions;
	const foundOptions = (found.options || found.text_options || []).map((option) => [
		option.label,
		option.script,
	]);

	// neither have options? You're done
	if (foundOptions.length === 0 && expectedOptions.length === 0) {
		return [];
	}

	// compare found options
	if (foundOptions.length) {
		if (expectedOptions.length === 0) {
			return [`found options in serial dialog, expected none`];
		}
	}
	if (expectedOptions.length) {
		if (foundOptions.length === 0) {
			return [`expected options in serial dialog, found none`];
		}
	}
	// todo: check options type

	if (foundOptions.length !== expectedOptions.length) {
		return [`found ${foundOptions.length} options, expected ${expectedOptions.length}`];
	}

	const errors: string[] = [];
	foundOptions.forEach((foundOption, i) => {
		const expectedOption = expectedOptions[i];
		if (foundOption[0] !== expectedOption[0]) {
			errors.push(
				`found label "${foundOption[0]}" in option [${i}], expected "${expectedOption[0]}"`,
			);
		}
		if (foundOption[1] !== expectedOption[1]) {
			errors.push(
				`found script "${foundOption[1]}" in option [${i}], expected "${expectedOption[1]}"`,
			);
		}
	});

	return errors;
};

export const compareSerialDialogs = (
	expected: EncoderSerialDialog,
	found: SerialDialog,
	nameType: 'serialDialogName' | 'fileName',
	name: string,
	id?: number | string,
): string[] => {
	if (!found) {
		const errorMessage =
			nameType === 'serialDialogName'
				? `Did not find expected serial dialog named "${name}"`
				: `Did not find "${name}" [${id}] serial dialog`;
		return [errorMessage];
	}
	if (!expected) {
		const errorMessage =
			nameType === 'serialDialogName'
				? `Found unexpected serial dialog named "${name}"`
				: `Unexpected serial dialog "${name}" [${id !== undefined ? id : '??'}]`;
		return [errorMessage];
	}
	// get quick summary for quick comparison
	// const foundSummary = messagesSummary(found);
	// const expectedSummary = messagesSummary(expected);
	const problems: string[] = [];
	const expectedLength = expected.messages.length;
	const foundLength = found.messages.length;
	if (expectedLength !== foundLength) {
		problems.push(
			`Found ${foundLength} messages (${firstMessage(found)}), ` +
				`expected ${expectedLength} (${firstMessage(expected)})`,
		);
	} else {
		const localProblems: string[] = [];
		expected.messages.forEach((expectedMessage, i) => {
			const foundMessage = found.messages[i];
			if (foundMessage !== expectedMessage) {
				// text wrap issue? (old version had bug)
				const foundMessageApprox = foundMessage.replace(/\n/g, ' ');
				const expectedMessageApprox = expectedMessage.replace(/\n/g, ' ');
				if (foundMessageApprox === expectedMessageApprox) {
					localProblems.push(`WARNING: Text wrap diff, otherwise fine`);
					return;
				}
				// nope, actually different
				const diffColorReport = colorDifferentStrings(
					expectedMessage.replace(/\n/g, '\\n').replace(/\u001B\[/g, '\\u001B['),
					foundMessage.replace(/\n/g, '\\n').replace(/\u001B\[/g, '\\u001B['),
				);
				let diffFound = diffColorReport.diff;
				let diffExpected = expectedMessage
					.replace(/\n/g, '\\n')
					.replace(/\u001B\[/g, '\\u001B[');
				let diffPre = diffColorReport.pre;
				if (diffPre.length > 60) {
					const cutTo = diffPre.length - 40;
					diffFound = '...' + diffFound.slice(cutTo);
					diffExpected = '...' + diffExpected.slice(cutTo);
					diffPre = '...' + diffPre.slice(cutTo);
				}

				const diffFoundHeader = `Message diff [${i}]: `;
				const diffExpectedHeaderPre = `Expected: `;
				const diffExpectedHeader =
					' '.repeat(diffFoundHeader.length - diffExpectedHeaderPre.length) +
					diffExpectedHeaderPre;
				const diffPreHeader = '~'.repeat(diffFoundHeader.length);

				const squiggle = '~'.repeat(diffPre.length - 1) + 'v';

				localProblems.push(diffPreHeader + squiggle);
				localProblems.push(diffFoundHeader + diffFound);
				localProblems.push(diffExpectedHeader + diffExpected);
			}
		});
		if (localProblems.length) {
			problems.push(...localProblems);
		}
	}

	// REDO ALL OF THIS
	const optionDiffs = compareSerialOptions(expected, found);
	if (optionDiffs.length) {
		problems.push(`Problems in serial dialog "${name}"`);
		problems.push(...optionDiffs);
	}
	return problems;
};
export const compareFileSerialDialogs = (
	expected: EncoderSerialDialog[],
	found: SerialDialog[],
	fileName: string,
): { errors: string[]; warnings: string[] } => {
	if (!found) {
		return {
			warnings: [],
			errors: [`Did not find file "${fileName}" for anonymous dialog comparison`],
		};
	}
	if (!expected) {
		return {
			warnings: [],
			errors: [`Found unexpected file "${fileName}" for anonymous dialog comparison`],
		};
	}
	const errors: string[] = [];
	const warnings: string[] = [];
	const homelessExpected: Record<string, EncoderSerialDialog[]> = {};
	const homelessFound: Record<string, SerialDialog[]> = {};
	expected.forEach((expectedSerialDialog, i) => {
		const foundSerialDialog = found[i];
		// get quick summary for quick comparison
		const foundSummary = messagesSummary(foundSerialDialog);
		const expectedSummary = messagesSummary(expectedSerialDialog);
		if (foundSummary !== expectedSummary) {
			// might be an overall ordering mismatch; set aside for now
			homelessFound[foundSummary] = homelessFound[foundSummary] || [];
			homelessExpected[expectedSummary] = homelessExpected[expectedSummary] || [];
			homelessFound[foundSummary].push(foundSerialDialog);
			homelessExpected[expectedSummary].push(expectedSerialDialog);
			return;
		}
		const diffs = compareSerialDialogs(
			expectedSerialDialog,
			foundSerialDialog,
			'fileName',
			fileName,
		);
		if (diffs.length) {
			// STILL might be an overall ordering mismatch; set aside
			homelessFound[foundSummary] = homelessFound[foundSummary] || [];
			homelessExpected[expectedSummary] = homelessExpected[expectedSummary] || [];
			homelessFound[foundSummary].push(foundSerialDialog);
			homelessExpected[expectedSummary].push(expectedSerialDialog);
			return;
		}
	});
	// THE REST OF THE OWL
	const summaryIDs = new Set([...Object.keys(homelessFound), ...Object.keys(homelessExpected)]);
	[...summaryIDs].forEach((summaryID) => {
		const founds: SerialDialog[] = homelessFound[summaryID];
		const expecteds: EncoderSerialDialog[] = homelessExpected[summaryID];
		if (founds.length !== expecteds.length) {
			errors.push(
				`"${fileName}" ${summaryID}: found ${founds.length} serial dialogs, expected ${expecteds.length}`,
			);
			return;
		}
		if (founds.length === 1) {
			const diffs = compareSerialDialogs(
				expecteds[0],
				founds[0],
				'fileName',
				fileName,
				summaryID,
			);
			const errorDiffs = diffs.filter((v) => !v.startsWith('WARN'));
			const warnDiffs = diffs.filter((v) => v.startsWith('WARN'));
			errors.push(...errorDiffs);
			warnings.push(...warnDiffs);
			return;
		}
		const workingFounds = [...founds];
		const workingExpecteds = [...expecteds];
		const nonMatchedFounds: SerialDialog[] = [];
		while (workingFounds.length) {
			const found = workingFounds.shift();
			if (found === undefined) throw new Error('TS seriously');
			let matched = false;
			for (let i = 0; i < workingExpecteds.length; i++) {
				const expected = workingExpecteds[i];
				const diffs = compareSerialDialogs(
					expected,
					found,
					'fileName',
					fileName,
					summaryID,
				);
				const errorDiffs = diffs.filter((v) => !v.startsWith('WARN'));
				if (!errorDiffs.length) {
					matched = true;
					workingExpecteds.splice(i, 1);
				}
			}
			if (!matched) {
				nonMatchedFounds.push(found);
			}
		}
		nonMatchedFounds.forEach((nonMatchedFound, i) => {
			const remainingExpected = workingExpecteds[i];
			const diffs = compareSerialDialogs(
				remainingExpected,
				nonMatchedFound,
				'fileName',
				fileName,
				summaryID,
			);
			const errorDiffs = diffs.filter((v) => !v.startsWith('WARN'));
			const warnDiffs = diffs.filter((v) => v.startsWith('WARN'));
			errors.push(...errorDiffs);
			warnings.push(...warnDiffs);
		});
	});
	return {
		errors,
		warnings,
	};
};

export const serialDialogs: Record<string, EncoderSerialDialog> = {
	'serial_dialog-map-action_testing-on_connect': {
		options: [],
		text_options: {},
		messages: [
			'WELCOME TO GOAT NET',
			' NOW       ##### ####     ',
			' I       ##   #  ##       ',
			' RULE   #   (=)    #      ',
			' WORLD  #+        ######  ',
			'      - #v              ##',
			'         ###           #  ',
			'           #  #      # #  ',
			'           ##  ##  ##  #  ',
			'-----------######--#####--',
		],
		name: 'serial_dialog-map-action_testing-on_connect',
	},
	'serial_dialog-map-action_testing-look': {
		messages: [
			"Hey boss, I'm lookin around for secrets,",
			"but it's nothing but numbers and mages in",
			'this room!',
		],
		name: 'serial_dialog-map-action_testing-look',
	},
	'serial_dialog-map-action_testing-go_north': {
		messages: ["Hey boss, I tried to go north, but it's", 'just empty space up there!'],
		name: 'serial_dialog-map-action_testing-go_north',
	},
	'serial_dialog-map-action_testing-go_cleveland': {
		messages: [
			'McScuse me?',
			'What did you just ask me to do?',
			"My name isn't Bob, I can't go to Cleveland!",
		],
		name: 'serial_dialog-map-action_testing-go_cleveland',
	},
	'serial_dialog-map-action_testing-go_cleveland-protected': {
		messages: ['My name is Bob?!??', 'Looks like I have to go to Cleveland...'],
		name: 'serial_dialog-map-action_testing-go_cleveland-protected',
	},
	'serial_dialog-map-action_testing-go_numbers': {
		messages: [
			'You are in a desert.',
			'You approached by a mysterious goat.',
			'How do you react to the mysterious goat?',
		],
		options: [
			{
				label: 'Do nothing',
				script: 'response-do_nothing',
			},
			{
				label: 'Pet The Goat',
				script: 'response-pet_the_goat',
			},
			{
				label: 'Feed The Goat',
				script: 'response-feed_the_goat',
			},
			{
				label: 'Give the Goat a Sugar Cube',
				script: 'response-give_goat_sugar_cube',
			},
			{
				label: "Let's branch into another serial dialog",
				script: 'map-action_testing-go_sphinx-success',
			},
			{
				label: "Let's test some RUN_SCRIPT",
				script: 'map-action_testing-cli-run_script',
			},
			{
				label: "Let's test some CHECK_SAVE_FLAG",
				script: 'map-action_testing-cli-check_save_flag',
			},
			{
				label: "Let's test some SET_SAVE_FLAG",
				script: 'map-action_testing-cli-set_save_flag',
			},
			{
				label: "Let's test some CHECK_VARIABLE",
				script: 'map-action_testing-cli-check_variable',
			},
			{
				label: "Let's test some MUTATE_VARIABLE",
				script: 'map-action_testing-cli-mutate_variable',
			},
		],
		name: 'serial_dialog-map-action_testing-go_numbers',
	},
	'serial_dialog-map-action_testing-cli-fail': {
		messages: ['Fail branch!\n', 'cli-variable: $cli-variable$'],
		name: 'serial_dialog-map-action_testing-cli-fail',
	},
	'serial_dialog-map-action_testing-cli-success': {
		messages: [
			'Success branch!',
			'PLAYER: %PLAYER%',
			'cli-variable: $cli-variable$',
			"'Mage 01': %Mage 01%",
			'ch1_storyflags_tally: $ch1_storyflags_tally$',
			'SELF: %SELF%',
			'MAP: %MAP%',
		],
		name: 'serial_dialog-map-action_testing-cli-success',
	},
	'serial_dialog-map-action_testing-go_sphinx': {
		messages: [
			'When you arrive at the Sphinx,',
			'it speaks in a slow, monotone voice:',
			'WHEN DO THE FLYING TOASTERS COME OUT?',
		],
		text_options: {
			'after dark': 'map-action_testing-go_sphinx-success',
			'before dark': 'map-action_testing-go_sphinx-wtf',
		},
		name: 'serial_dialog-map-action_testing-go_sphinx',
	},
	'serial_dialog-map-action_testing-go_sphinx-success': {
		messages: ['The Sphinx bellows:', 'YOU ARE ELITE!'],
		name: 'serial_dialog-map-action_testing-go_sphinx-success',
	},
	'serial_dialog-map-action_testing-go_sphinx-wtf': {
		messages: ['The Sphinx bellows:', "Okay bro, now you're just messing with me. WTF"],
		name: 'serial_dialog-map-action_testing-go_sphinx-wtf',
	},
	'serial_dialog-map-action_testing-go_sphinx-fail': {
		messages: ['The Sphinx bellows:', 'YOU HAVE FAILED MY CHALLENGE!'],
		name: 'serial_dialog-map-action_testing-go_sphinx-fail',
	},
	'serial_dialog-map-action_testing-go_hub': {
		messages: ["You're goating to the Hub map now!"],
		name: 'serial_dialog-map-action_testing-go_hub',
	},
	'serial_dialog-go_register': {
		messages: ["Registered Command: 'map'!"],
		name: 'serial_dialog-go_register',
	},
	'serial_dialog-go_register_fail': {
		messages: ["Registered Command: 'map' fail fallback!"],
		name: 'serial_dialog-go_register_fail',
	},
	'serial_dialog-go_unregister': {
		messages: ["Unregistered Command: 'map'!"],
		name: 'serial_dialog-go_unregister',
	},
	'serial_dialog-go_register_secret': {
		messages: ["Registered Command: 'secret'!"],
		name: 'serial_dialog-go_register_secret',
	},
	'serial_dialog-go_hide_secret': {
		messages: ["Command has been hidden from `help`: 'secret'!"],
		name: 'serial_dialog-go_hide_secret',
	},
	'serial_dialog-go_unhide_secret': {
		messages: ["Command has been UNhidden from `help`: 'secret'!"],
		name: 'serial_dialog-go_unhide_secret',
	},
	'serial_dialog-go_unregister_secret': {
		messages: ["Unregistered Command: 'secret'!"],
		name: 'serial_dialog-go_unregister_secret',
	},
	'serial_dialog-command-secret': {
		messages: ["Yes, there's a secret, but what animal is secret?"],
		name: 'serial_dialog-command-secret',
	},
	'serial_dialog-command_secret_fail': {
		messages: ['No! Wrong Secret!'],
		name: 'serial_dialog-command_secret_fail',
	},
	'serial_dialog-command_secret_goat': {
		messages: [
			'You found the secret goat!',
			'               _))',
			'              > *\\     _~',
			"         yey- `;'\\__-' \\_",
			'                 | )  _ \\ \\',
			'                / / ``   w w',
			'               w w',
		],
		name: 'serial_dialog-command_secret_goat',
	},
	'serial_dialog-go_register_arguments': {
		messages: ["Registered Arguments: 'map' > ['town', 'dungeon']!"],
		name: 'serial_dialog-go_register_arguments',
	},
	'serial_dialog-go_unregister_arguments': {
		messages: ["Unregistered Arguments: 'map' > ['town', 'dungeon']!"],
		name: 'serial_dialog-go_unregister_arguments',
	},
	'serial_dialog-command-map': {
		messages: ['OMG! I can look at maps!! But which one???'],
		name: 'serial_dialog-command-map',
	},
	'serial_dialog-command_map_fail': {
		messages: ["I don't have a map named that!!!"],
		name: 'serial_dialog-command_map_fail',
	},
	'serial_dialog-command_map_town': {
		messages: ['This map of the Town sure is... existing.'],
		name: 'serial_dialog-command_map_town',
	},
	'serial_dialog-command_map_dungeon': {
		messages: ['This map of the Dungeon is AWESOME!!!'],
		name: 'serial_dialog-command_map_dungeon',
	},
	'serial_dialog-map-action_testing-go_concat': {
		messages: ['This is a script about concatenation!', 'What would you like to concatenate?'],
		options: [
			{
				label: 'Goat',
				script: 'concat_response-goat',
			},
			{
				label: 'Bird',
				script: 'concat_response-bird',
			},
			{
				label: 'Cat',
				script: 'concat_response-cat',
			},
			{
				label: 'Platypus',
				script: 'concat_response-platypus',
			},
			{
				label: 'Peregrine Falcon',
				script: 'concat_response-peregrine_falcon',
			},
		],
		name: 'serial_dialog-map-action_testing-go_concat',
	},
	'concat-start': {
		messages: ['This is a story about a '],
		name: 'concat-start',
	},
	'concat-goat': {
		messages: ['Goat'],
		name: 'concat-goat',
	},
	'concat-bird': {
		messages: ['Bird'],
		name: 'concat-bird',
	},
	'concat-cat': {
		messages: ['Cat'],
		name: 'concat-cat',
	},
	'concat-platypus': {
		messages: ['Platypus'],
		name: 'concat-platypus',
	},
	'concat-peregrine_falcon': {
		messages: ['Peregrine Falcon'],
		name: 'concat-peregrine_falcon',
	},
	'concat-end': {
		messages: [" that set out to make the world's most awesome ice-cream!"],
		name: 'concat-end',
	},
	'serial_dialog-go_register_moon': {
		messages: ["You have registered the verb 'moon' and the verb + argument 'moon moon'"],
		name: 'serial_dialog-go_register_moon',
	},
	'serial_dialog-command_map_moon': {
		messages: ['What would you like to moon?'],
		name: 'serial_dialog-command_map_moon',
	},
	'serial_dialog-command_map_moon_fail': {
		messages: ['You cannot moon that.'],
		name: 'serial_dialog-command_map_moon_fail',
	},
	'serial_dialog-command_map_moon_moon': {
		messages: ['You mooned the moon. It blushes.'],
		name: 'serial_dialog-command_map_moon_moon',
	},
	'serial_dialog-mage01-look_script': {
		messages: [
			'Looks like you just ran the look script on the entity named `%SELF%`! Goat job!',
		],
		name: 'serial_dialog-mage01-look_script',
	},
	'serial_dialog-map-action_testing-gui_open': {
		messages: ['---', ' ', 'Looks like a GUI dialog was indeed open!'],
		name: 'serial_dialog-map-action_testing-gui_open',
	},
	'serial_dialog-map-action_testing-gui_closed': {
		messages: ['---', ' ', 'Looks like a GUI dialog was NOT open!'],
		name: 'serial_dialog-map-action_testing-gui_closed',
	},
	'serial_dialog-map-action_testing-debug_false': {
		messages: ['---', ' ', 'Oh hey! Normal mode! (not debug)'],
		name: 'serial_dialog-map-action_testing-debug_false',
	},
	'serial_dialog-map-action_testing-debug_true': {
		messages: ['---', ' ', 'Oh hey! Debug mode!'],
		name: 'serial_dialog-map-action_testing-debug_true',
	},
	honk_point: {
		messages: ['HONK!'],
		name: 'honk_point',
	},
	'serial_dialog-go_override': {
		messages: ["Verb Overrides registered: 'Look', 'look mage 01', 'go west'"],
		name: 'serial_dialog-go_override',
	},
	'serial_dialog-go_un-override': {
		messages: ["Verb Overrides UN-registered: 'Look', 'look mage 01', 'go west'"],
		name: 'serial_dialog-go_un-override',
	},
	'dialog-debug_go_space': {
		messages: ['HONK! The goose has stolen the door!'],
		name: 'dialog-debug_go_space',
	},
	'dialog-debug_look_override': {
		messages: [
			'HONK! The goose tells you an awesome story about the rise and fall of his enemies, and prevents you from looking about the room!',
		],
		name: 'dialog-debug_look_override',
	},
	'dialog-debug_look_mage01-override': {
		messages: ["HONK! The goose attacks when you try to look at the 'Mage 01'!"],
		name: 'dialog-debug_look_mage01-override',
	},
	'ch1-secretroom.mgs:134:2': {
		messages: [
			'\u001b[1mNEW!\u001b[0m Serial command \u001b[36mRTFM\u001b[0m unlocked!',
			' ',
			'Read the books in this room wherever you are! Just type\n\u001b[36mRTFM\u001b[0m!',
		],
		name: 'ch1-secretroom.mgs:134:2',
	},
	'buffer-test.mgs:2:2': {
		messages: ['Which test?'],
		options: [
			{
				label: 'Daisy chain',
				script: 'debug_buffertest_daisy',
			},
			{
				label: 'Single messages',
				script: 'debug_buffertest_singles',
			},
			{
				label: 'Big message',
				script: 'debug_buffertest_big',
			},
			{
				label: 'Single messages with #',
				script: 'debug_buffertest_singles_q',
			},
			{
				label: 'Big message with #',
				script: 'debug_buffertest_big_q',
			},
			{
				label: 'Quit',
				script: 'null_script',
			},
		],
		name: 'buffer-test.mgs:2:2',
	},
	'buffer-test.mgs:14:2': {
		messages: [
			'(1)-------10--------20--------30--------40--------60',
			'2: 456789--23456789--23456789--23456789--23456789--',
			'3: 456789--23456789--23456789--23456789--23456789--',
			'4: 456789--23456789--23456789--23456789--23456789--',
			'5: 456789--23456789--23456789--23456789--23456789--',
			'6: 456789--23456789--23456789--23456789--23456789--',
			'7: 456789--23456789--23456789--23456789--23456789--',
			'8: 456789--23456789--23456789--23456789--23456789--',
			'9: 456789--23456789--23456789--23456789--23456789--',
			'10: 56789--23456789--23456789--23456789--23456789--',
		],
		name: 'buffer-test.mgs:14:2',
	},
	'buffer-test.mgs:29:2': {
		messages: [
			'(2)------10--------20--------30--------40--------60',
			'12: 56789--23456789--23456789--23456789--23456789--',
			'13: 56789--23456789--23456789--23456789--23456789--',
			'14: 56789--23456789--23456789--23456789--23456789--',
			'15: 56789--23456789--23456789--23456789--23456789--',
			'16: 56789--23456789--23456789--23456789--23456789--',
			'17: 56789--23456789--23456789--23456789--23456789--',
			'18: 56789--23456789--23456789--23456789--23456789--',
			'19: 56789--23456789--23456789--23456789--23456789--',
			'20: 56789--23456789--23456789--23456789--23456789--',
		],
		name: 'buffer-test.mgs:29:2',
	},
	'buffer-test.mgs:44:2': {
		messages: [
			'(3)------10--------20--------30--------40--------60',
			'22: 56789--23456789--23456789--23456789--23456789--',
			'23: 56789--23456789--23456789--23456789--23456789--',
			'24: 56789--23456789--23456789--23456789--23456789--',
			'25: 56789--23456789--23456789--23456789--23456789--',
			'26: 56789--23456789--23456789--23456789--23456789--',
			'27: 56789--23456789--23456789--23456789--23456789--',
			'28: 56789--23456789--23456789--23456789--23456789--',
			'29: 56789--23456789--23456789--23456789--23456789--',
			'30: 56789--23456789--23456789--23456789--23456789--',
		],
		name: 'buffer-test.mgs:44:2',
	},
	'buffer-test.mgs:59:2': {
		messages: [
			'(4)------10--------20--------30--------40--------60',
			'32: 56789--23456789--23456789--23456789--23456789--',
			'33: 56789--23456789--23456789--23456789--23456789--',
			'34: 56789--23456789--23456789--23456789--23456789--',
			'35: 56789--23456789--23456789--23456789--23456789--',
			'36: 56789--23456789--23456789--23456789--23456789--',
			'37: 56789--23456789--23456789--23456789--23456789--',
			'38: 56789--23456789--23456789--23456789--23456789--',
			'39: 56789--23456789--23456789--23456789--23456789--',
			'40: 56789--23456789--23456789--23456789--23456789--',
		],
		name: 'buffer-test.mgs:59:2',
	},
	'buffer-test.mgs:74:2': {
		messages: [
			'(5)------10--------20--------30--------40--------60',
			'42: 56789--23456789--23456789--23456789--23456789--',
			'43: 56789--23456789--23456789--23456789--23456789--',
			'44: 56789--23456789--23456789--23456789--23456789--',
			'45: 56789--23456789--23456789--23456789--23456789--',
			'46: 56789--23456789--23456789--23456789--23456789--',
			'47: 56789--23456789--23456789--23456789--23456789--',
			'48: 56789--23456789--23456789--23456789--23456789--',
			'49: 56789--23456789--23456789--23456789--23456789--',
			'50: 56789--23456789--23456789--23456789--23456789--',
		],
		name: 'buffer-test.mgs:74:2',
	},
	'buffer-test.mgs:89:2': {
		messages: [
			'(6)------10--------20--------30--------40--------60',
			'52: 56789--23456789--23456789--23456789--23456789--',
			'53: 56789--23456789--23456789--23456789--23456789--',
			'54: 56789--23456789--23456789--23456789--23456789--',
			'55: 56789--23456789--23456789--23456789--23456789--',
			'56: 56789--23456789--23456789--23456789--23456789--',
			'57: 56789--23456789--23456789--23456789--23456789--',
			'58: 56789--23456789--23456789--23456789--23456789--',
			'59: 56789--23456789--23456789--23456789--23456789--',
			'60: 56789--23456789--23456789--23456789--23456789--',
			' ',
			'TEST PASSED!',
			' ',
		],
		name: 'buffer-test.mgs:89:2',
	},
	'buffer-test.mgs:108:2': {
		messages: [
			'1--------10--------20--------30--------40--------60',
			'2: 456789--23456789--23456789--23456789--23456789--',
			'3: 456789--23456789--23456789--23456789--23456789--',
			'4: 456789--23456789--23456789--23456789--23456789--',
			'5: 456789--23456789--23456789--23456789--23456789--',
			'6: 456789--23456789--23456789--23456789--23456789--',
			'7: 456789--23456789--23456789--23456789--23456789--',
			'8: 456789--23456789--23456789--23456789--23456789--',
			'9: 456789--23456789--23456789--23456789--23456789--',
			'10: 56789--23456789--23456789--23456789--23456789--',
			'11: 56789--23456789--23456789--23456789--23456789--',
			'12: 56789--23456789--23456789--23456789--23456789--',
			'13: 56789--23456789--23456789--23456789--23456789--',
			'14: 56789--23456789--23456789--23456789--23456789--',
			'15: 56789--23456789--23456789--23456789--23456789--',
			'16: 56789--23456789--23456789--23456789--23456789--',
			'17: 56789--23456789--23456789--23456789--23456789--',
			'18: 56789--23456789--23456789--23456789--23456789--',
			'19: 56789--23456789--23456789--23456789--23456789--',
			'20: 56789--23456789--23456789--23456789--23456789--',
			'21: 56789--23456789--23456789--23456789--23456789--',
			'22: 56789--23456789--23456789--23456789--23456789--',
			'23: 56789--23456789--23456789--23456789--23456789--',
			'24: 56789--23456789--23456789--23456789--23456789--',
			'25: 56789--23456789--23456789--23456789--23456789--',
			'26: 56789--23456789--23456789--23456789--23456789--',
			'27: 56789--23456789--23456789--23456789--23456789--',
			'28: 56789--23456789--23456789--23456789--23456789--',
			'29: 56789--23456789--23456789--23456789--23456789--',
			'30: 56789--23456789--23456789--23456789--23456789--',
			' ',
			'TEST PASSED!',
			' ',
		],
		name: 'buffer-test.mgs:108:2',
	},
	'buffer-test.mgs:146:2': {
		messages: [
			'1--------10--------20--------30--------40--------60\n2: 456789--23456789--23456789--23456789--23456789--\n3: 456789--23456789--23456789--23456789--23456789--\n4: 456789--23456789--23456789--23456789--23456789--\n5: 456789--23456789--23456789--23456789--23456789--\n6: 456789--23456789--23456789--23456789--23456789--\n7: 456789--23456789--23456789--23456789--23456789--\n8: 456789--23456789--23456789--23456789--23456789--\n9: 456789--23456789--23456789--23456789--23456789--\n10: 56789--23456789--23456789--23456789--23456789--\n11: 56789--23456789--23456789--23456789--23456789--\n12: 56789--23456789--23456789--23456789--23456789--\n13: 56789--23456789--23456789--23456789--23456789--\n14: 56789--23456789--23456789--23456789--23456789--\n15: 56789--23456789--23456789--23456789--23456789--\n16: 56789--23456789--23456789--23456789--23456789--\n17: 56789--23456789--23456789--23456789--23456789--\n18: 56789--23456789--23456789--23456789--23456789--\n19: 56789--23456789--23456789--23456789--23456789--\n20: 56789--23456789--23456789--23456789--23456789--\n21: 56789--23456789--23456789--23456789--23456789--\n22: 56789--23456789--23456789--23456789--23456789--\n23: 56789--23456789--23456789--23456789--23456789--\n24: 56789--23456789--23456789--23456789--23456789--\n25: 56789--23456789--23456789--23456789--23456789--\n26: 56789--23456789--23456789--23456789--23456789--\n27: 56789--23456789--23456789--23456789--23456789--\n28: 56789--23456789--23456789--23456789--23456789--\n29: 56789--23456789--23456789--23456789--23456789--\n30: 56789--23456789--23456789--23456789--23456789--',
			' ',
			'TEST PASSED!',
			' ',
		],
		name: 'buffer-test.mgs:146:2',
	},
	'buffer-test.mgs:156:2': {
		messages: [
			'1--------10--------20--------30--------40--------50',
			'2: 456789--23456789--23456789--23456789--23456789--',
			'3: 456789--23456789--23456789--23456789--23456789--',
			'4: 456789--23456789--23456789--23456789--23456789--',
			'5: 456789--23456789--23456789--23456789--23456789--',
			'6: 456789--23456789--23456789--23456789--23456789--',
			'7: 456789--23456789--23456789--23456789--23456789--',
			'8: 456789--23456789--23456789--23456789--23456789--',
			'9: 456789--23456789--23456789--23456789--23456789--',
			'10: 56789--23456789--23456789--23456789--23456789--',
			'11: 56789--23456789--23456789--23456789--23456789--',
			'12: 56789--23456789--23456789--23456789--23456789--',
			'13: 56789--23456789--23456789--23456789--23456789--',
			'14: 56789--23456789--23456789--23456789--23456789--',
			'15: 56789--23456789--23456789--23456789--23456789--',
			'16: 56789--23456789--23456789--23456789--23456789--',
			'17: 56789--23456789--23456789--23456789--23456789--',
			'18: 56789--23456789--23456789--23456789--23456789--',
			'19: 56789--23456789--23456789--23456789--23456789--',
			'20: 56789--23456789--23456789--23456789--23456789--',
			'21: 56789--23456789--23456789--23456789--23456789--',
			'22: 56789--23456789--23456789--23456789--23456789--',
			'23: 56789--23456789--23456789--23456789--23456789--',
			'24: 56789--23456789--23456789--23456789--23456789--',
			'25: 56789--23456789--23456789--23456789--23456789--',
			'26: 56789--23456789--23456789--23456789--23456789--',
			'27: 56789--23456789--23456789--23456789--23456789--',
			'28: 56789--23456789--23456789--23456789--23456789--',
			'29: 56789--23456789--23456789--23456789--23456789--',
			'30: 56789--23456789--23456789--23456789--23456789--',
			' ',
			'If you see two options below, test passed!',
		],
		options: [
			{
				label: 'Back to menu',
				script: 'debug_buffertest',
			},
			{
				label: 'Stop',
				script: 'null_script',
			},
		],
		name: 'buffer-test.mgs:156:2',
	},
	'buffer-test.mgs:194:2': {
		messages: [
			'1--------10--------20--------30--------40--------60\n2: 456789--23456789--23456789--23456789--23456789--\n3: 456789--23456789--23456789--23456789--23456789--\n4: 456789--23456789--23456789--23456789--23456789--\n5: 456789--23456789--23456789--23456789--23456789--\n6: 456789--23456789--23456789--23456789--23456789--\n7: 456789--23456789--23456789--23456789--23456789--\n8: 456789--23456789--23456789--23456789--23456789--\n9: 456789--23456789--23456789--23456789--23456789--\n10: 56789--23456789--23456789--23456789--23456789--\n11: 56789--23456789--23456789--23456789--23456789--\n12: 56789--23456789--23456789--23456789--23456789--\n13: 56789--23456789--23456789--23456789--23456789--\n14: 56789--23456789--23456789--23456789--23456789--\n15: 56789--23456789--23456789--23456789--23456789--\n16: 56789--23456789--23456789--23456789--23456789--\n17: 56789--23456789--23456789--23456789--23456789--\n18: 56789--23456789--23456789--23456789--23456789--\n19: 56789--23456789--23456789--23456789--23456789--\n20: 56789--23456789--23456789--23456789--23456789--\n21: 56789--23456789--23456789--23456789--23456789--\n22: 56789--23456789--23456789--23456789--23456789--\n23: 56789--23456789--23456789--23456789--23456789--\n24: 56789--23456789--23456789--23456789--23456789--\n25: 56789--23456789--23456789--23456789--23456789--\n26: 56789--23456789--23456789--23456789--23456789--\n27: 56789--23456789--23456789--23456789--23456789--\n28: 56789--23456789--23456789--23456789--23456789--\n29: 56789--23456789--23456789--23456789--23456789--\n30: 56789--23456789--23456789--23456789--23456789--',
			' ',
			'If you see two options below, test passed!',
		],
		options: [
			{
				label: 'Back to menu',
				script: 'debug_buffertest',
			},
			{
				label: 'Stop',
				script: 'null_script',
			},
		],
		name: 'buffer-test.mgs:194:2',
	},
	'ch2-admin.mgs:196:2': {
		messages: ['\u0007 (DING)'],
		name: 'ch2-admin.mgs:196:2',
	},
	'ch2-admin.mgs:206:2': {
		messages: ['(Lambda wants to talk to you! Type \u001b[36mMAN\u001b[0m to answer.)'],
		name: 'ch2-admin.mgs:206:2',
	},
	'ch2-admin.mgs:227:2': {
		messages: ['\u0007 (DING)'],
		name: 'ch2-admin.mgs:227:2',
	},
	'ch2-admin.mgs:238:2': {
		messages: ['(Lambda wants to talk to you! Type \u001b[36mMAN\u001b[0m to answer.)'],
		name: 'ch2-admin.mgs:238:2',
	},
	'ch2-admin.mgs:245:2': {
		messages: ['\u0007 (DING)'],
		name: 'ch2-admin.mgs:245:2',
	},
	'ch2-admin.mgs:257:2': {
		messages: ['(Lambda wants to talk to you! Type \u001b[36mMAN\u001b[0m to answer.)'],
		name: 'ch2-admin.mgs:257:2',
	},
	'ch2-admin.mgs:278:2': {
		messages: [
			"\u001b[33mDEBUG>\u001b[0m: Set flag 'ch2_storyflag_round' to what value? (0-5)",
		],
		text_options: {
			0: 'debug_map_flags_for_round0',
			1: 'debug_map_flags_for_round1',
			2: 'debug_map_flags_for_round2',
			3: 'debug_map_flags_for_round3',
			4: 'debug_map_flags_for_round4',
			5: 'debug_map_flags_for_round5',
		},
		name: 'ch2-admin.mgs:278:2',
	},
	'ch2-admin.mgs:287:2': {
		messages: ['Nothing changed.'],
		name: 'ch2-admin.mgs:287:2',
	},
	'ch2-admin.mgs:343:2': {
		messages: ["Flag 'ch2_storyflag_round' is now $ch2_storyflag_round$"],
		name: 'ch2-admin.mgs:343:2',
	},
	'ch2-bakery.mgs:5:2': {
		messages: [
			'You looked around the \u001b[36mBAKERY\u001b[0m.',
			'    The place smells amazing! Warm, yeasty -- the very\nessence of nostalgia. The %Baker% keeps this place clean,\ntidy, and overflowing with baked goods.',
			' ',
		],
		name: 'ch2-bakery.mgs:5:2',
	},
	'ch2-bakery.mgs:14:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    He rarely spares a glance for you as he rushes about,\nbut his expression is warm when he does. He is smooth with\nhis motions around the kitchen; it's clear he's had a\nlifetime of practice.",
		],
		name: 'ch2-bakery.mgs:14:2',
	},
	'ch2-bakery.mgs:25:2': {
		messages: ['Entering \u001b[1mBAKERY\u001b[0m...'],
		name: 'ch2-bakery.mgs:25:2',
	},
	'ch2-birthday.mgs:11:3': {
		messages: [' ', '\u001b[33mDEBUG>\u001b[0m \u001b[36mSKIP\u001b[0m: skip this cutscene'],
		name: 'ch2-birthday.mgs:11:3',
	},
	'ch2-birthday.mgs:136:3': {
		messages: [' ', '\u001b[33mDEBUG>\u001b[0m \u001b[36mSKIP\u001b[0m: skip this cutscene'],
		name: 'ch2-birthday.mgs:136:3',
	},
	'ch2-bobsclub-basement.mgs:5:2': {
		messages: [
			"You looked around the \u001b[36mBOB'S CLUB BASEMENT\u001b[0m.",
			"    The downstairs strongly resembles the upstairs in terms\nof furnishings, though of course, it's much more heavily\npopulated. As for the Bobs themselves, what they lack in\nvariety they make up in volume -- both in terms of their\nquantity and their noise. Everyone is in the middle of a\nconversation, and they have to speak loudly to be heard over\nthe raucous dubstep.",
			' ',
		],
		name: 'ch2-bobsclub-basement.mgs:5:2',
	},
	'ch2-bobsclub-basement.mgs:14:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    Stoic and inscrutable, the giant stone golem could as\neasily be a hundred years old as a thousand. With his eyes\nglowing as they are, you can't be sure where he's looking,\nbut you wouldn't be surprised if his gaze was following you\nas you move about the room.",
		],
		name: 'ch2-bobsclub-basement.mgs:14:2',
	},
	'ch2-bobsclub-basement.mgs:21:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    %SELF% may share the same sharp edges and chiseled brow\nas his cousin, %Bob Austin%, but somehow %SELF%'s demeanor\nis more cheerful and friendly. It may be his mossy afro --\nor it may be the way he lifts his hands more freely, as if\nthey didn't weigh anything.",
		],
		name: 'ch2-bobsclub-basement.mgs:21:2',
	},
	'ch2-bobsclub-basement.mgs:28:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    A half dozen cans of assorted sodas peak through the\nmountain of ice within the chest, but the vast majority of\ncans are a bold orange, yellow, and green. The ice isn't\nvery melted yet, so all the cans must be frosty.",
		],
		name: 'ch2-bobsclub-basement.mgs:28:2',
	},
	'ch2-bobsclub-basement.mgs:35:2': {
		messages: [
			'You looked at one of the \u001b[35m%SELF%s\u001b[0m.',
			'    Each Bob has a military look to them: a holstered\nfirearm, combat boots, and a headset -- though the nature of\ntheir eyepieces escapes you. Each of these Bobs act alike,\nand apart from their colored uniforms, might as well be\nentirely interchangable with one another.',
		],
		name: 'ch2-bobsclub-basement.mgs:35:2',
	},
	'ch2-bobsclub-basement.mgs:42:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    Strangely, this Bob has a different cast to his skin, as\nif he were made of metal and plastic -- as if the shadows\ndidn't land quite right around his body. But perhaps that's\njust how people from the 'net usually look.",
		],
		name: 'ch2-bobsclub-basement.mgs:42:2',
	},
	'ch2-bobsclub-basement.mgs:49:2': {
		messages: [
			'You looked at \u001b[35mBob\u001b[0m.',
			'    ...Or you would, but there\'s a lot of Bobs around, and\n"Bob" is a bit vague, isn\'t it?',
		],
		name: 'ch2-bobsclub-basement.mgs:49:2',
	},
	'ch2-bobsclub-basement.mgs:56:2': {
		messages: [
			'You looked at the red \u001b[35m%SELF%\u001b[0m.',
			"    Classic party fare! It wouldn't be a party without\nplastic \u001b[1mAmerican Name Brand Party Cups (c)\u001b[0m!",
		],
		name: 'ch2-bobsclub-basement.mgs:56:2',
	},
	'ch2-bobsclub-basement.mgs:63:2': {
		messages: [
			'You looked at the \u001b[35mpizza\u001b[0m.',
			"    Plentiful boxes from a local pizza establishment, but\nthere's only cheese and pepperoni -- this party seems to be\nabout quantity instead of quality. From the shine of the\ncheese, the pizzas are a little greasier than was strictly\nnecessary. Still, the smell is enticing!",
		],
		name: 'ch2-bobsclub-basement.mgs:63:2',
	},
	'ch2-bobsclub-basement.mgs:74:2': {
		messages: ["Entering \u001b[1mBOB'S CLUB BASEMENT\u001b[0m..."],
		name: 'ch2-bobsclub-basement.mgs:74:2',
	},
	'ch2-bobsclub.mgs:12:2': {
		messages: [
			"You look around at the \u001b[35m\u001b[1mBob's Club\u001b[0m.",
			"    You can hear muffled, rhythmic thumping through the\nfloor, though there's no clear source.",
			' ',
		],
		name: 'ch2-bobsclub.mgs:12:2',
	},
	'ch2-bobsclub.mgs:21:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    This lone piece of furniture feels out of place when not\npart of a lineup of identical pieces. It's a melancholy\nimage, dwarfed in the open space.",
		],
		name: 'ch2-bobsclub.mgs:21:2',
	},
	'ch2-bobsclub.mgs:29:2': {
		messages: ['You looked at \u001b[35m%SELF%\u001b[0m.'],
		name: 'ch2-bobsclub.mgs:29:2',
	},
	'ch2-bobsclub.mgs:37:3': {
		messages: [
			"    Fancy glass goblets for fancy parties. These pieces are\ndefinitely reserved for fancy drink orders. Though from what\nyou've seen, the Bob's Club partygoers prefer to use red\nplastic party cups.",
		],
		name: 'ch2-bobsclub.mgs:37:3',
	},
	'ch2-bobsclub.mgs:33:3': {
		messages: [
			"    Fancy glass goblets for fancy parties. These pieces are\ndefinitely reserved for fancy drink orders. Not that you've\never seen a party in here.",
		],
		name: 'ch2-bobsclub.mgs:33:3',
	},
	'ch2-bobsclub.mgs:44:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"It's still sealed. The sides are bulging, as though it was\npacked tightly with something.",
		],
		name: 'ch2-bobsclub.mgs:44:2',
	},
	'ch2-bobsclub.mgs:51:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"It's not marked, though you always assumed barrels like this\nwould contain ale or beer or something. You suppose it could\njust as easily contain oyster crackers.",
		],
		name: 'ch2-bobsclub.mgs:51:2',
	},
	'ch2-bobsclub.mgs:58:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    There are hard water rings on the surface in several\nplaces. Most of it is dry, but some of the larger spots are\nstill holding onto droplets of water. Did someone set some\ndrinks here recently?',
		],
		name: 'ch2-bobsclub.mgs:58:2',
	},
	'ch2-bobsclub.mgs:66:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    Glass tumblers are packed together in lines on each\nshelf. None are missing; there are no gaps.',
		],
		name: 'ch2-bobsclub.mgs:66:2',
	},
	'ch2-bobsclub.mgs:73:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    There's splashes of water -- and an emaciated ice cube\n-- near the drain. Someone has used the sink recently.",
		],
		name: 'ch2-bobsclub.mgs:73:2',
	},
	'ch2-bobsclub.mgs:80:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    It\'s a larger-than-normal, industral-style refrigerator.\nThere are a handful of small magnets on the front, but they\nmostly consist of the letters "O" and "B".',
		],
		name: 'ch2-bobsclub.mgs:80:2',
	},
	'ch2-bobsclub.mgs:110:2': {
		messages: ['RESET'],
		name: 'ch2-bobsclub.mgs:110:2',
	},
	'ch2-bobsclub.mgs:120:2': {
		messages: ["Entering \u001b[1mBOB'S CLUB\u001b[0m..."],
		name: 'ch2-bobsclub.mgs:120:2',
	},
	'ch2-bobsclub.mgs:139:3': {
		messages: [
			' ',
			"\u001b[33mDEBUG>\u001b[0m Bob's Club\u001b[0m",
			'\u001b[33m>\u001b[0m \u001b[36mFIND CC\u001b[0m: you found CC in ch1',
			"\u001b[33m>\u001b[0m \u001b[36mUNFIND CC\u001b[0m: you didn't find CC in ch1",
			'\u001b[33m>\u001b[0m \u001b[36mWANT CC\u001b[0m: you know you want CC',
			"\u001b[33m>\u001b[0m \u001b[36mUNWANT CC\u001b[0m: you don't yet know you want CC",
			'\u001b[33m>\u001b[0m \u001b[36mCARRY CC\u001b[0m: you have CC on you',
			"\u001b[33m>\u001b[0m \u001b[36mUNCARRY CC\u001b[0m: you don't have CC on you",
			"\u001b[33m>\u001b[0m \u001b[36mBASEMENT\u001b[0m: you've been to the Bob's Club basement already",
			"\u001b[33m>\u001b[0m \u001b[36mUNBASEMENT\u001b[0m: you've haven't been to the Bob's Club basement\nyet",
			"\u001b[33m>\u001b[0m \u001b[36mTOOT\u001b[0m: you've finished Lambda's artifact tutorial already",
			"\u001b[33m>\u001b[0m \u001b[36mUNTOOT\u001b[0m: you haven't finished Lambda's artifact tutorial\nyet",
			"\u001b[33m>\u001b[0m \u001b[36mRESET\u001b[0m: set all above flags to false, and set the 'heard a\ndubstep rattle' to 0",
		],
		name: 'ch2-bobsclub.mgs:139:3',
	},
	'ch2-castle-1-bert.mgs:79:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Oh man, Bert! That guy... I haven't seen him in\nages! I forgot all about him!",
			' ',
			'\u001b[36mYOU\u001b[0m: What? You know Bert?',
		],
		name: 'ch2-castle-1-bert.mgs:79:3',
	},
	'ch2-castle-1-bert.mgs:73:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Bert? BERT! Oh my God, Bert! I remember that guy!',
			' ',
			'\u001b[36mYOU\u001b[0m: What? You know him?',
		],
		name: 'ch2-castle-1-bert.mgs:73:3',
	},
	'ch2-castle-1-bert.mgs:85:2': {
		messages: [
			' ',
			'\u001b[35mLAMBDA\u001b[0m: His name was a complete blank until you said it, but\nI recognized his face!',
		],
		name: 'ch2-castle-1-bert.mgs:85:2',
	},
	'ch2-castle-1-bert.mgs:90:3': {
		messages: [
			' ',
			'\u001b[36mYOU\u001b[0m: Wait, how did you see his face?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: The cameras! They're all around in -- look, it\ndoesn't matter. The point is....",
		],
		name: 'ch2-castle-1-bert.mgs:90:3',
	},
	'ch2-castle-1-bert.mgs:98:2': {
		messages: ['    Aw, man. The two of us? We go way back!', ' '],
		options: [
			{
				label: 'Should I go back and fetch him?',
				script: 'ch2_bert_secret_lambda_intro2',
			},
		],
		name: 'ch2-castle-1-bert.mgs:98:2',
	},
	'ch2-castle-1-bert.mgs:106:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Should I go back and fetch him? Let you talk to him?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: No, that... um, that won't be necessary. I can't\nexactly help him from where I am, and what he's doing sounds\npretty important. We shouldn't bother him.",
			"    ...Damn. It's been a while, though.",
			' ',
			'\u001b[36mYOU\u001b[0m: Wow, you know Bert, huh?',
		],
		name: 'ch2-castle-1-bert.mgs:106:2',
	},
	'ch2-castle-1.mgs:16:2': {
		messages: ['You looked around the \u001b[36mCASTLE ENTRANCE\u001b[0m.'],
		name: 'ch2-castle-1.mgs:16:2',
	},
	'ch2-castle-1.mgs:25:3': {
		messages: [
			'    The banners have seen better days, but the room looks\nmuch better without the large slabs of debris blocking the\ndoors. The air smells cleaner, too.',
			' ',
		],
		name: 'ch2-castle-1.mgs:25:3',
	},
	'ch2-castle-1.mgs:20:3': {
		messages: [
			'    This castle might have been glorious once, but it seems\nthat time has not been kind to it. The edges of its banners\nare fraying and grungy, and you\'re not sure you\'ll ever get\nthe "used castle smell" out of your hat.',
			' ',
		],
		name: 'ch2-castle-1.mgs:20:3',
	},
	'ch2-castle-1.mgs:35:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    It's one majestic computer, full of your sweat, blood,\nand tears -- in some proportion.",
		],
		name: 'ch2-castle-1.mgs:35:2',
	},
	'ch2-castle-1.mgs:44:2': {
		messages: ['You looked at the \u001b[35m%SELF%\u001b[0m.', ' '],
		name: 'ch2-castle-1.mgs:44:2',
	},
	'ch2-castle-1.mgs:49:2': {
		messages: ['This hardy beige box contains:'],
		name: 'ch2-castle-1.mgs:49:2',
	},
	'ch2-castle-1.mgs:50:2': {
		messages: ['    - wires', '    - what looks like a huge circuit board'],
		name: 'ch2-castle-1.mgs:50:2',
	},
	'ch2-castle-1.mgs:56:3': {
		messages: ['    - a heatsink'],
		name: 'ch2-castle-1.mgs:56:3',
	},
	'ch2-castle-1.mgs:59:3': {
		messages: ['    - a power supply (2 kW)'],
		name: 'ch2-castle-1.mgs:59:3',
	},
	'ch2-castle-1.mgs:63:3': {
		messages: ['    - a hard drive'],
		name: 'ch2-castle-1.mgs:63:3',
	},
	'ch2-castle-1.mgs:67:3': {
		messages: ['    - a bunch of RAM chips'],
		name: 'ch2-castle-1.mgs:67:3',
	},
	'ch2-castle-1.mgs:70:3': {
		messages: ['    - a system clock'],
		name: 'ch2-castle-1.mgs:70:3',
	},
	'ch2-castle-1.mgs:73:3': {
		messages: ['    - a CPU'],
		name: 'ch2-castle-1.mgs:73:3',
	},
	'ch2-castle-1.mgs:76:2': {
		messages: ['On the outside is:'],
		name: 'ch2-castle-1.mgs:76:2',
	},
	'ch2-castle-1.mgs:83:4': {
		messages: ['    - a monitor'],
		name: 'ch2-castle-1.mgs:83:4',
	},
	'ch2-castle-1.mgs:86:4': {
		messages: ['    - a keyboard'],
		name: 'ch2-castle-1.mgs:86:4',
	},
	'ch2-castle-1.mgs:89:4': {
		messages: ['    - a mouse'],
		name: 'ch2-castle-1.mgs:89:4',
	},
	'ch2-castle-1.mgs:92:2': {
		messages: ['    - a bunch of tiny penguin stickers', '    - and one yak sticker?'],
		name: 'ch2-castle-1.mgs:92:2',
	},
	'ch2-castle-1.mgs:107:3': {
		messages: ['You looked at the \u001b[35m%SELF%\u001b[0m.', '    ...Adorable!'],
		name: 'ch2-castle-1.mgs:107:3',
	},
	'ch2-castle-1.mgs:102:3': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    At least, you looked at the trash can itself. It's... a\ntrash can. It's pungent enough that you think it best to\nbreathe through your mouth for the moment.",
		],
		name: 'ch2-castle-1.mgs:102:3',
	},
	'ch2-castle-1.mgs:122:2': {
		messages: ['Entering \u001b[1mCASTLE ENTRANCE\u001b[0m...'],
		name: 'ch2-castle-1.mgs:122:2',
	},
	'ch2-castle-1.mgs:145:2': {
		messages: ['Entering \u001b[1mCASTLE ENTRANCE\u001b[0m...'],
		name: 'ch2-castle-1.mgs:145:2',
	},
	'ch2-castle-1.mgs:194:3': {
		messages: [
			' ',
			'\u001b[33mDEBUG>\u001b[0m this room only',
			'\u001b[33m>\u001b[0m \u001b[36mTOOT\u001b[0m: skip tutorial',
			"\u001b[33m>\u001b[0m \u001b[36mCREDITS\u001b[0m: roll credits as if you've beaten the game",
			'\u001b[33m>\u001b[0m \u001b[36mGET _\u001b[0m: pick up the named item',
			'\u001b[33m>\u001b[0m \u001b[36mROUND _\u001b[0m: collect the items for that round',
			'\u001b[33m>\u001b[0m \u001b[36mWALK\u001b[0m: set XA on_interact to do the walk part',
		],
		name: 'ch2-castle-1.mgs:194:3',
	},
	'ch2-castle-1.mgs:406:2': {
		messages: [
			'(You better finish your conversation with Lambda before\nattempting to \u001b[36mGO\u001b[0m anywhere....)',
			' ',
			'(Type \u001b[36mMAN\u001b[0m to resume the converstion.)',
		],
		name: 'ch2-castle-1.mgs:406:2',
	},
	'ch2-castle-1.mgs:655:2': {
		messages: ['Starting'],
		name: 'ch2-castle-1.mgs:655:2',
	},
	'ch2-castle-1.mgs:853:2': {
		messages: [
			'Loading MGZ',
			' ',
			'Memory: 1048576k/1049216k available (1162k kernel code,\n6812k reserved, 482k data,240k init, Ok highmem)',
			' ',
			'Dentry-cache hash table entries: 32768 (order: 6, 262144\nbytes)',
			'Buffer-cache hash table entries: 8192 (order: 3, 32768\nbytes)',
			'Page-cache hash table entries: 65536 (order: 6, 262144\nbytes)',
			'Inode-cache hash table entries: 16384 (order: 5, 131072\nbytes)',
			' ',
			'Enabling fast FPU save and restore... done.',
			'Enabling unmasked SIMD FPU exception support... done.',
			"Checking 'hlt' instruction... OK.",
			' ',
			'MGX NET9.0 for MGX 6.0',
			'BIOS Vendor: Konami Computer Entertainment Japan',
			'BIOS Version: 5.73',
		],
		name: 'ch2-castle-1.mgs:853:2',
	},
	'ch2-castle-1.mgs:872:2': {
		messages: [' ', 'Starting kswapd v3.0'],
		name: 'ch2-castle-1.mgs:872:2',
	},
	'ch2-castle-1.mgs:877:2': {
		messages: [' ', 'pty: 256 Unix98 ptys configured'],
		name: 'ch2-castle-1.mgs:877:2',
	},
	'ch2-castle-1.mgs:882:2': {
		messages: ['Uniform Multi-Platform E-IDE driver Revision: 9.11'],
		name: 'ch2-castle-1.mgs:882:2',
	},
	'ch2-castle-1.mgs:886:2': {
		messages: ['    ide0: BM_DMA at 0xf000-0xf007, BIOS settings: da0:DMA,\nda1:pio'],
		name: 'ch2-castle-1.mgs:886:2',
	},
	'ch2-castle-1.mgs:890:2': {
		messages: ['19623/16/255 from BIOS ignored'],
		name: 'ch2-castle-1.mgs:890:2',
	},
	'ch2-castle-1.mgs:894:2': {
		messages: [' ', 'da0: C/H/S=19623/16/255 from BIOS ignored'],
		name: 'ch2-castle-1.mgs:894:2',
	},
	'ch2-castle-1.mgs:899:2': {
		messages: [
			'da0: TOKUGAWA HD4192 E, ATA DISK drive',
			'da1: TOKUGAWA CF2048J, REMOVABLE drive',
		],
		name: 'ch2-castle-1.mgs:899:2',
	},
	'ch2-castle-1.mgs:904:2': {
		messages: ['ide0 at 0x1f0-0x1f7, 0x3f6 on irq 14'],
		name: 'ch2-castle-1.mgs:904:2',
	},
	'ch2-castle-1.mgs:908:2': {
		messages: [
			'da0: 160126848 sectors (81984 MB) w/2048KiB Cache,\nCHS-158856/16/63, UDMA(33)',
			'Partition check:',
		],
		name: 'ch2-castle-1.mgs:908:2',
	},
	'ch2-castle-1.mgs:913:2': {
		messages: ['    da0: da01 da02 da03 <da06 da06 dao7>'],
		name: 'ch2-castle-1.mgs:913:2',
	},
	'ch2-castle-1.mgs:917:2': {
		messages: [' ', 'eth0: ARMSTECH Corporation 826557, 00:03:47:70:29:86, IRQ 9.'],
		name: 'ch2-castle-1.mgs:917:2',
	},
	'ch2-castle-1.mgs:922:2': {
		messages: [' '],
		name: 'ch2-castle-1.mgs:922:2',
	},
	'ch2-castle-1.mgs:926:2': {
		messages: ['NET9: MGX TCP/IP 4.0 for NET9.0', 'IP Proyocols: ICMP, UDP, TCP, IGMP'],
		name: 'ch2-castle-1.mgs:926:2',
	},
	'ch2-castle-1.mgs:931:2': {
		messages: [
			'IP: routing cache hash table of 512 buckets, 4Kbytes',
			'ICP: hash tables configured (established 8192 bind 8192)',
		],
		name: 'ch2-castle-1.mgs:931:2',
	},
	'ch2-castle-1.mgs:936:2': {
		messages: ['NET4: Un*x domain sockets 1.0/SMP for MGX NET 9.0'],
		name: 'ch2-castle-1.mgs:936:2',
	},
	'ch2-castle-1.mgs:940:2': {
		messages: [' ', 'UFS: Mounted root (ext4 filesystem) readonly'],
		name: 'ch2-castle-1.mgs:940:2',
	},
	'ch2-castle-1.mgs:945:2': {
		messages: [
			'Freeing unused kernel memory: 176k freed',
			'Adding Swap: 211640k swap space (priority -1)',
		],
		name: 'ch2-castle-1.mgs:945:2',
	},
	'ch2-castle-1.mgs:950:2': {
		messages: [' '],
		name: 'ch2-castle-1.mgs:950:2',
	},
	'ch2-castle-1.mgs:954:2': {
		messages: ['INIT Version 5.64', 'Welcome to MONORITH SERVICE SYSTEM'],
		name: 'ch2-castle-1.mgs:954:2',
	},
	'ch2-castle-1.mgs:959:2': {
		messages: [
			'PROVIDED BY STRATELOGIC INC.,LTD.',
			'FOR USE ONLY ON THE CONSOLE"CYBERSPACE_4" ',
		],
		name: 'ch2-castle-1.mgs:959:2',
	},
	'ch2-castle-1.mgs:964:2': {
		messages: [
			'######################CAUTION#########################',
			'FOR MILITARY USE ONLY.',
		],
		name: 'ch2-castle-1.mgs:964:2',
	},
	'ch2-castle-1.mgs:969:2': {
		messages: [
			'UNAUTHORIZED PERSONNEL MAKING ACCESS OR ATTEMPTING ACCESS\nWILL BE',
			'PENALIZED SEVERELY UNDER MARTIAL LAW.',
		],
		name: 'ch2-castle-1.mgs:969:2',
	},
	'ch2-castle-1.mgs:974:2': {
		messages: ['######################CAUTION#########################', ' '],
		name: 'ch2-castle-1.mgs:974:2',
	},
	'ch2-castle-1.mgs:979:2': {
		messages: ['Mounting proc filesystem'],
		name: 'ch2-castle-1.mgs:979:2',
	},
	'ch2-castle-1.mgs:983:2': {
		messages: ['Configuring kernel parameters'],
		name: 'ch2-castle-1.mgs:983:2',
	},
	'ch2-castle-1.mgs:987:2': {
		messages: ['Loading default keymap'],
		name: 'ch2-castle-1.mgs:987:2',
	},
	'ch2-castle-1.mgs:991:2': {
		messages: ['Activating swap partitions'],
		name: 'ch2-castle-1.mgs:991:2',
	},
	'ch2-castle-1.mgs:995:2': {
		messages: ['Setting hostname policenauts'],
		name: 'ch2-castle-1.mgs:995:2',
	},
	'ch2-castle-1.mgs:999:2': {
		messages: ['Checking root filesystem'],
		name: 'ch2-castle-1.mgs:999:2',
	},
	'ch2-castle-1.mgs:1003:2': {
		messages: ['/dev/da01: clean, 2676/788800 files, 492275/3155200  blocks'],
		name: 'ch2-castle-1.mgs:1003:2',
	},
	'ch2-castle-1.mgs:1007:2': {
		messages: [' '],
		name: 'ch2-castle-1.mgs:1007:2',
	},
	'ch2-castle-1.mgs:1011:2': {
		messages: ['Remounting root filesystem in read-write mode', 'Finding module dependencies'],
		name: 'ch2-castle-1.mgs:1011:2',
	},
	'ch2-castle-1.mgs:1016:2': {
		messages: [' '],
		name: 'ch2-castle-1.mgs:1016:2',
	},
	'ch2-castle-1.mgs:1020:2': {
		messages: ['/dev/da05: clean, 21/82328 files, 10415/329301 blocks'],
		name: 'ch2-castle-1.mgs:1020:2',
	},
	'ch2-castle-1.mgs:1024:2': {
		messages: ['/dev/da06: clean, 75098/9729792 files, 316284/38919168\nblocks'],
		name: 'ch2-castle-1.mgs:1024:2',
	},
	'ch2-castle-1.mgs:1028:2': {
		messages: ['/dev/da07: clean, 20881/9729792 files, 834953/38919168\nblocks'],
		name: 'ch2-castle-1.mgs:1028:2',
	},
	'ch2-castle-1.mgs:1032:2': {
		messages: [' ', ' '],
		name: 'ch2-castle-1.mgs:1032:2',
	},
	'ch2-castle-1.mgs:1037:2': {
		messages: ['Mounting local filesystems'],
		name: 'ch2-castle-1.mgs:1037:2',
	},
	'ch2-castle-1.mgs:1041:2': {
		messages: ['Enabling swap space'],
		name: 'ch2-castle-1.mgs:1041:2',
	},
	'ch2-castle-1.mgs:1045:2': {
		messages: ['INIT: Entering runlevel: 4', 'Entering non-interactive startup'],
		name: 'ch2-castle-1.mgs:1045:2',
	},
	'ch2-castle-1.mgs:1050:2': {
		messages: ['Setting network parameters', 'Bringing up interface lo'],
		name: 'ch2-castle-1.mgs:1050:2',
	},
	'ch2-castle-1.mgs:1055:2': {
		messages: ['Bringing up interface eth0', ' '],
		name: 'ch2-castle-1.mgs:1055:2',
	},
	'ch2-castle-1.mgs:1060:2': {
		messages: ['MONORITH MGX 2.1.5', 'Kernel 6.2.38'],
		name: 'ch2-castle-1.mgs:1060:2',
	},
	'ch2-castle-1.mgs:1071:2': {
		messages: [
			'GibsonOS Release 5.7 Version Generic_801-02 [UNIX(R) System\nV Release 4.0]',
			'Copyright (c) 1983-1999, Sun Microsystems, Inc.',
		],
		name: 'ch2-castle-1.mgs:1071:2',
	},
	'ch2-castle-1.mgs:1076:2': {
		messages: ['Hostname: sunrise'],
		name: 'ch2-castle-1.mgs:1076:2',
	},
	'ch2-castle-1.mgs:1080:2': {
		messages: ['The system is coming up.  Please wait.'],
		name: 'ch2-castle-1.mgs:1080:2',
	},
	'ch2-castle-1.mgs:1084:2': {
		messages: ['checking ufs filesystems'],
		name: 'ch2-castle-1.mgs:1084:2',
	},
	'ch2-castle-1.mgs:1088:2': {
		messages: ['/dev/rdsk/c0t0d0s7: is clean.'],
		name: 'ch2-castle-1.mgs:1088:2',
	},
	'ch2-castle-1.mgs:1092:2': {
		messages: ['in.rdisc: No interfaces up'],
		name: 'ch2-castle-1.mgs:1092:2',
	},
	'ch2-castle-1.mgs:1096:2': {
		messages: ['starting routing daemon.'],
		name: 'ch2-castle-1.mgs:1096:2',
	},
	'ch2-castle-1.mgs:1100:2': {
		messages: [
			"starting rpc services: rpcbindkeyserv: failed to generate\nhost's netname when establishing root's key.",
		],
		name: 'ch2-castle-1.mgs:1100:2',
	},
	'ch2-castle-1.mgs:1104:2': {
		messages: ['keyserv done'],
		name: 'ch2-castle-1.mgs:1104:2',
	},
	'ch2-castle-1.mgs:1108:2': {
		messages: ['Setting default interface for multicast: add net 224.0.0.0:\ngateway sunrise'],
		name: 'ch2-castle-1.mgs:1108:2',
	},
	'ch2-castle-1.mgs:1112:2': {
		messages: ['syslog service starting.'],
		name: 'ch2-castle-1.mgs:1112:2',
	},
	'ch2-castle-1.mgs:1116:2': {
		messages: ['Print services started.'],
		name: 'ch2-castle-1.mgs:1116:2',
	},
	'ch2-castle-1.mgs:1120:2': {
		messages: [
			'Mar 18 16:38:52 sunrise sendmail[195]: My unqualified host\nname (localhost) unknown; sleeping for retry',
		],
		name: 'ch2-castle-1.mgs:1120:2',
	},
	'ch2-castle-1.mgs:1124:2': {
		messages: ['volume management starting.'],
		name: 'ch2-castle-1.mgs:1124:2',
	},
	'ch2-castle-1.mgs:1128:2': {
		messages: ['The system is ready.'],
		name: 'ch2-castle-1.mgs:1128:2',
	},
	'ch2-castle-1.mgs:1132:2': {
		messages: [
			' ',
			'sunrise console login: Mar 18 16:38:54 sunrise snmpXdmid:\nError in Adding Row for Subscription Table Entry',
		],
		name: 'ch2-castle-1.mgs:1132:2',
	},
	'ch2-castle-1.mgs:1137:2': {
		messages: [
			'Mar 18 16:38:54 sunrise snmpXdmid: Failed to add filter to\nSP for Event delivery',
		],
		name: 'ch2-castle-1.mgs:1137:2',
	},
	'ch2-castle-1.mgs:1141:2': {
		messages: [' ', '************************************************************', '*'],
		name: 'ch2-castle-1.mgs:1141:2',
	},
	'ch2-castle-1.mgs:1147:2': {
		messages: ['* Starting Desktop Login on display :0...', '* '],
		name: 'ch2-castle-1.mgs:1147:2',
	},
	'ch2-castle-1.mgs:1152:2': {
		messages: ['* Wait for the Desktop Login screen before logging in.', '* '],
		name: 'ch2-castle-1.mgs:1152:2',
	},
	'ch2-castle-1.mgs:1157:2': {
		messages: ['************************************************************'],
		name: 'ch2-castle-1.mgs:1157:2',
	},
	'ch2-castle-1.mgs:1167:2': {
		messages: ['GibsonOS version 3.7.1-TLS'],
		name: 'ch2-castle-1.mgs:1167:2',
	},
	'ch2-castle-1.mgs:1171:2': {
		messages: [
			'Memory: 1048576k/1049216k available',
			' ',
			'Dentry-cache hash table entries: 32768 (order: 6, 262144 bytes)',
			'Buffer-cache hash table entries: 8192 (order: 3, 32768 bytes)',
			'Page-cache hash table entries: 65536 (order: 6, 262144 bytes)',
			'Inode-cache hash table entries: 16384 (order: 5, 131072 bytes)',
			' ',
			'Enabling fast FPU save and restore... done.',
			'Enabling unmasked SIMD FPU exception support... done.',
			"Checking 'hlt' instruction... OK.",
		],
		name: 'ch2-castle-1.mgs:1171:2',
	},
	'ch2-castle-1.mgs:1185:2': {
		messages: [
			' ',
			'GibBOOT 4.0',
			'BIOS Vendor: Gibson Computing Corporation Limited',
			'BIOS Version: 2.14',
		],
		name: 'ch2-castle-1.mgs:1185:2',
	},
	'ch2-castle-1.mgs:1192:2': {
		messages: [' ', 'Partition check:'],
		name: 'ch2-castle-1.mgs:1192:2',
	},
	'ch2-castle-1.mgs:1197:2': {
		messages: ['    da0: da01 da02 da03 <da06 da06 dao7>'],
		name: 'ch2-castle-1.mgs:1197:2',
	},
	'ch2-castle-1.mgs:1201:2': {
		messages: [' ', 'Mounting local filesystems'],
		name: 'ch2-castle-1.mgs:1201:2',
	},
	'ch2-castle-1.mgs:1206:2': {
		messages: ['Enabling swap space'],
		name: 'ch2-castle-1.mgs:1206:2',
	},
	'ch2-castle-1.mgs:1210:2': {
		messages: ['INIT: Entering runlevel: 4', 'Entering non-interactive startup'],
		name: 'ch2-castle-1.mgs:1210:2',
	},
	'ch2-castle-1.mgs:1215:2': {
		messages: ['Setting network parameters', 'Bringing up interface lo'],
		name: 'ch2-castle-1.mgs:1215:2',
	},
	'ch2-castle-1.mgs:1220:2': {
		messages: ['Bringing up interface eth0'],
		name: 'ch2-castle-1.mgs:1220:2',
	},
	'ch2-castle-1.mgs:1224:2': {
		messages: [' ', 'Starting intercom manager'],
		name: 'ch2-castle-1.mgs:1224:2',
	},
	'ch2-castle-1.mgs:1229:2': {
		messages: ['   Status: \u001b[32mOK\u001b[0m', 'Starting door manager'],
		name: 'ch2-castle-1.mgs:1229:2',
	},
	'ch2-castle-1.mgs:1234:2': {
		messages: [
			'   Status: \u001b[32mOK\u001b[0m',
			'Fetching latest from underground data center',
		],
		name: 'ch2-castle-1.mgs:1234:2',
	},
	'ch2-castle-1.mgs:1239:2': {
		messages: [
			'   Status: \u001b[31mERROR\u001b[0m',
			'   Connection refused',
			'Launching power plant controller',
		],
		name: 'ch2-castle-1.mgs:1239:2',
	},
	'ch2-castle-1.mgs:1245:2': {
		messages: ['   Status: \u001b[32mOK\u001b[0m', 'Launching HVAC controller'],
		name: 'ch2-castle-1.mgs:1245:2',
	},
	'ch2-castle-1.mgs:1250:2': {
		messages: ['   Status: \u001b[32mOK\u001b[0m', 'Establishing Ring Zero bridge'],
		name: 'ch2-castle-1.mgs:1250:2',
	},
	'ch2-castle-1.mgs:1255:2': {
		messages: ['   Status: \u001b[32mOK\u001b[0m', 'Installing additional support packages'],
		name: 'ch2-castle-1.mgs:1255:2',
	},
	'ch2-castle-1.mgs:1260:2': {
		messages: ['No GPU devices found', 'Reticulating splines'],
		name: 'ch2-castle-1.mgs:1260:2',
	},
	'ch2-castle-1.mgs:1265:2': {
		messages: [' ', '\u001b[32mBoot OK\u001b[0m', 'Launching desktop environment'],
		name: 'ch2-castle-1.mgs:1265:2',
	},
	'ch2-castle-1.mgs:1407:4': {
		messages: ['(Type \u001b[36mMAN\u001b[0m to finish your conversation with Lambda.)'],
		name: 'ch2-castle-1.mgs:1407:4',
	},
	'ch2-castle-1.mgs:1506:2': {
		messages: ['\u001b[35mLAMBDA\u001b[0m: Testing, testing....'],
		name: 'ch2-castle-1.mgs:1506:2',
	},
	'ch2-castle-1.mgs:1534:4': {
		messages: ['(Type \u001b[36mMAN\u001b[0m to continue your conversation with Lambda.)'],
		name: 'ch2-castle-1.mgs:1534:4',
	},
	'ch2-castle-11.mgs:5:2': {
		messages: ['You looked around the \u001b[36mCASTLE HALLWAY FRONT\u001b[0m.'],
		name: 'ch2-castle-11.mgs:5:2',
	},
	'ch2-castle-11.mgs:14:3': {
		messages: [
			'    Despite a little bit of lingering damage from the recent\nquake, the castle entryway is much neater than before. The\ncobbled mainframe hums contentedly, and soon the rest of the\ncastle, too, will be back to its old self.',
			' ',
		],
		name: 'ch2-castle-11.mgs:14:3',
	},
	'ch2-castle-11.mgs:9:3': {
		messages: [
			"    The ceiling has collapsed, probably from the recent\nearthquake. What's left standing appears stable, fortunately\n-- at least, structurally stable.",
			' ',
		],
		name: 'ch2-castle-11.mgs:9:3',
	},
	'ch2-castle-11.mgs:23:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    A large crow or raven, one whose eyes seem to pierce you\nto your soul -- and one who's had too much coffee, by the\nway he's moving.",
		],
		name: 'ch2-castle-11.mgs:23:2',
	},
	'ch2-castle-11.mgs:36:2': {
		messages: ['Entering \u001b[1mCASTLE HALLWAY FRONT\u001b[0m...'],
		name: 'ch2-castle-11.mgs:36:2',
	},
	'ch2-castle-11.mgs:57:3': {
		messages: ['Entering \u001b[1mCASTLE HALLWAY FRONT\u001b[0m...'],
		name: 'ch2-castle-11.mgs:57:3',
	},
	'ch2-castle-11.mgs:54:3': {
		messages: [
			'Discovered \u001b[1m\u001b[36mCASTLE HALLWAY FRONT\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-11.mgs:54:3',
	},
	'ch2-castle-12-ws.mgs:141:3': {
		messages: ['T '],
		name: 'ch2-castle-12-ws.mgs:141:3',
	},
	'ch2-castle-12-ws.mgs:139:3': {
		messages: ['\u001b[33m\u001b[1mT \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:139:3',
	},
	'ch2-castle-12-ws.mgs:146:3': {
		messages: ['M '],
		name: 'ch2-castle-12-ws.mgs:146:3',
	},
	'ch2-castle-12-ws.mgs:144:3': {
		messages: ['\u001b[33m\u001b[1mM \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:144:3',
	},
	'ch2-castle-12-ws.mgs:148:2': {
		messages: ['T '],
		name: 'ch2-castle-12-ws.mgs:148:2',
	},
	'ch2-castle-12-ws.mgs:152:3': {
		messages: ['V I N Y L '],
		name: 'ch2-castle-12-ws.mgs:152:3',
	},
	'ch2-castle-12-ws.mgs:150:3': {
		messages: ['\u001b[33m\u001b[1mV I N Y L \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:150:3',
	},
	'ch2-castle-12-ws.mgs:154:2': {
		messages: ['U J Z D U H E A A U Z '],
		name: 'ch2-castle-12-ws.mgs:154:2',
	},
	'ch2-castle-12-ws.mgs:158:3': {
		messages: ['M '],
		name: 'ch2-castle-12-ws.mgs:158:3',
	},
	'ch2-castle-12-ws.mgs:156:3': {
		messages: ['\u001b[33m\u001b[1mM \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:156:3',
	},
	'ch2-castle-12-ws.mgs:160:2': {
		messages: ['Q Z G S M '],
		name: 'ch2-castle-12-ws.mgs:160:2',
	},
	'ch2-castle-12-ws.mgs:165:3': {
		messages: ['---'],
		name: 'ch2-castle-12-ws.mgs:165:3',
	},
	'ch2-castle-12-ws.mgs:163:3': {
		messages: ['aux'],
		name: 'ch2-castle-12-ws.mgs:163:3',
	},
	'ch2-castle-12-ws.mgs:167:2': {
		messages: ['  '],
		name: 'ch2-castle-12-ws.mgs:167:2',
	},
	'ch2-castle-12-ws.mgs:171:3': {
		messages: ['-----------'],
		name: 'ch2-castle-12-ws.mgs:171:3',
	},
	'ch2-castle-12-ws.mgs:169:3': {
		messages: ['synthesizer'],
		name: 'ch2-castle-12-ws.mgs:169:3',
	},
	'ch2-castle-12-ws.mgs:180:3': {
		messages: ['A '],
		name: 'ch2-castle-12-ws.mgs:180:3',
	},
	'ch2-castle-12-ws.mgs:178:3': {
		messages: ['\u001b[33m\u001b[1mA \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:178:3',
	},
	'ch2-castle-12-ws.mgs:185:3': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:185:3',
	},
	'ch2-castle-12-ws.mgs:183:3': {
		messages: ['\u001b[33m\u001b[1mI \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:183:3',
	},
	'ch2-castle-12-ws.mgs:187:2': {
		messages: ['P '],
		name: 'ch2-castle-12-ws.mgs:187:2',
	},
	'ch2-castle-12-ws.mgs:191:3': {
		messages: ['M '],
		name: 'ch2-castle-12-ws.mgs:191:3',
	},
	'ch2-castle-12-ws.mgs:189:3': {
		messages: ['\u001b[33m\u001b[1mM \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:189:3',
	},
	'ch2-castle-12-ws.mgs:193:2': {
		messages: ['L K '],
		name: 'ch2-castle-12-ws.mgs:193:2',
	},
	'ch2-castle-12-ws.mgs:197:3': {
		messages: ['C H I P T U N E '],
		name: 'ch2-castle-12-ws.mgs:197:3',
	},
	'ch2-castle-12-ws.mgs:195:3': {
		messages: ['\u001b[33m\u001b[1mC H I P T U N E \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:195:3',
	},
	'ch2-castle-12-ws.mgs:199:2': {
		messages: ['F B P S '],
		name: 'ch2-castle-12-ws.mgs:199:2',
	},
	'ch2-castle-12-ws.mgs:203:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:203:3',
	},
	'ch2-castle-12-ws.mgs:201:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:201:3',
	},
	'ch2-castle-12-ws.mgs:205:2': {
		messages: ['P Q R S A P '],
		name: 'ch2-castle-12-ws.mgs:205:2',
	},
	'ch2-castle-12-ws.mgs:210:3': {
		messages: ['---'],
		name: 'ch2-castle-12-ws.mgs:210:3',
	},
	'ch2-castle-12-ws.mgs:208:3': {
		messages: ['bpm'],
		name: 'ch2-castle-12-ws.mgs:208:3',
	},
	'ch2-castle-12-ws.mgs:212:2': {
		messages: ['   '],
		name: 'ch2-castle-12-ws.mgs:212:2',
	},
	'ch2-castle-12-ws.mgs:216:3': {
		messages: ['----------'],
		name: 'ch2-castle-12-ws.mgs:216:3',
	},
	'ch2-castle-12-ws.mgs:214:3': {
		messages: ['soundtrack'],
		name: 'ch2-castle-12-ws.mgs:214:3',
	},
	'ch2-castle-12-ws.mgs:225:3': {
		messages: ['P '],
		name: 'ch2-castle-12-ws.mgs:225:3',
	},
	'ch2-castle-12-ws.mgs:223:3': {
		messages: ['\u001b[33m\u001b[1mP \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:223:3',
	},
	'ch2-castle-12-ws.mgs:230:3': {
		messages: ['C '],
		name: 'ch2-castle-12-ws.mgs:230:3',
	},
	'ch2-castle-12-ws.mgs:228:3': {
		messages: ['\u001b[33m\u001b[1mC \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:228:3',
	},
	'ch2-castle-12-ws.mgs:232:2': {
		messages: ['V F '],
		name: 'ch2-castle-12-ws.mgs:232:2',
	},
	'ch2-castle-12-ws.mgs:236:3': {
		messages: ['U '],
		name: 'ch2-castle-12-ws.mgs:236:3',
	},
	'ch2-castle-12-ws.mgs:234:3': {
		messages: ['\u001b[33m\u001b[1mU \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:234:3',
	},
	'ch2-castle-12-ws.mgs:238:2': {
		messages: ['F '],
		name: 'ch2-castle-12-ws.mgs:238:2',
	},
	'ch2-castle-12-ws.mgs:242:3': {
		messages: ['A '],
		name: 'ch2-castle-12-ws.mgs:242:3',
	},
	'ch2-castle-12-ws.mgs:240:3': {
		messages: ['\u001b[33m\u001b[1mA \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:240:3',
	},
	'ch2-castle-12-ws.mgs:244:2': {
		messages: ['X S Y N V R Z K K Y '],
		name: 'ch2-castle-12-ws.mgs:244:2',
	},
	'ch2-castle-12-ws.mgs:248:3': {
		messages: ['D '],
		name: 'ch2-castle-12-ws.mgs:248:3',
	},
	'ch2-castle-12-ws.mgs:246:3': {
		messages: ['\u001b[33m\u001b[1mD \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:246:3',
	},
	'ch2-castle-12-ws.mgs:250:2': {
		messages: ['F '],
		name: 'ch2-castle-12-ws.mgs:250:2',
	},
	'ch2-castle-12-ws.mgs:254:3': {
		messages: ['R '],
		name: 'ch2-castle-12-ws.mgs:254:3',
	},
	'ch2-castle-12-ws.mgs:252:3': {
		messages: ['\u001b[33m\u001b[1mR \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:252:3',
	},
	'ch2-castle-12-ws.mgs:256:2': {
		messages: ['O S U L '],
		name: 'ch2-castle-12-ws.mgs:256:2',
	},
	'ch2-castle-12-ws.mgs:260:3': {
		messages: ['M '],
		name: 'ch2-castle-12-ws.mgs:260:3',
	},
	'ch2-castle-12-ws.mgs:258:3': {
		messages: ['\u001b[33m\u001b[1mM \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:258:3',
	},
	'ch2-castle-12-ws.mgs:266:3': {
		messages: ['----'],
		name: 'ch2-castle-12-ws.mgs:266:3',
	},
	'ch2-castle-12-ws.mgs:264:3': {
		messages: ['bass'],
		name: 'ch2-castle-12-ws.mgs:264:3',
	},
	'ch2-castle-12-ws.mgs:268:2': {
		messages: ['  '],
		name: 'ch2-castle-12-ws.mgs:268:2',
	},
	'ch2-castle-12-ws.mgs:272:3': {
		messages: ['----------'],
		name: 'ch2-castle-12-ws.mgs:272:3',
	},
	'ch2-castle-12-ws.mgs:270:3': {
		messages: ['phonograph'],
		name: 'ch2-castle-12-ws.mgs:270:3',
	},
	'ch2-castle-12-ws.mgs:281:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:281:3',
	},
	'ch2-castle-12-ws.mgs:279:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:279:3',
	},
	'ch2-castle-12-ws.mgs:286:3': {
		messages: ['R '],
		name: 'ch2-castle-12-ws.mgs:286:3',
	},
	'ch2-castle-12-ws.mgs:284:3': {
		messages: ['\u001b[33m\u001b[1mR \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:284:3',
	},
	'ch2-castle-12-ws.mgs:288:2': {
		messages: ['S T S '],
		name: 'ch2-castle-12-ws.mgs:288:2',
	},
	'ch2-castle-12-ws.mgs:292:3': {
		messages: ['S '],
		name: 'ch2-castle-12-ws.mgs:292:3',
	},
	'ch2-castle-12-ws.mgs:290:3': {
		messages: ['\u001b[33m\u001b[1mS \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:290:3',
	},
	'ch2-castle-12-ws.mgs:294:2': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:294:2',
	},
	'ch2-castle-12-ws.mgs:298:3': {
		messages: ['U '],
		name: 'ch2-castle-12-ws.mgs:298:3',
	},
	'ch2-castle-12-ws.mgs:296:3': {
		messages: ['\u001b[33m\u001b[1mU \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:296:3',
	},
	'ch2-castle-12-ws.mgs:300:2': {
		messages: ['K A S Y P N K D '],
		name: 'ch2-castle-12-ws.mgs:300:2',
	},
	'ch2-castle-12-ws.mgs:304:3': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:304:3',
	},
	'ch2-castle-12-ws.mgs:302:3': {
		messages: ['\u001b[33m\u001b[1mI \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:302:3',
	},
	'ch2-castle-12-ws.mgs:306:2': {
		messages: ['H I '],
		name: 'ch2-castle-12-ws.mgs:306:2',
	},
	'ch2-castle-12-ws.mgs:310:3': {
		messages: ['A '],
		name: 'ch2-castle-12-ws.mgs:310:3',
	},
	'ch2-castle-12-ws.mgs:308:3': {
		messages: ['\u001b[33m\u001b[1mA \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:308:3',
	},
	'ch2-castle-12-ws.mgs:312:2': {
		messages: ['N P F '],
		name: 'ch2-castle-12-ws.mgs:312:2',
	},
	'ch2-castle-12-ws.mgs:316:3': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:316:3',
	},
	'ch2-castle-12-ws.mgs:314:3': {
		messages: ['\u001b[33m\u001b[1mI \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:314:3',
	},
	'ch2-castle-12-ws.mgs:318:2': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:318:2',
	},
	'ch2-castle-12-ws.mgs:323:3': {
		messages: ['----'],
		name: 'ch2-castle-12-ws.mgs:323:3',
	},
	'ch2-castle-12-ws.mgs:321:3': {
		messages: ['beat'],
		name: 'ch2-castle-12-ws.mgs:321:3',
	},
	'ch2-castle-12-ws.mgs:325:2': {
		messages: ['  '],
		name: 'ch2-castle-12-ws.mgs:325:2',
	},
	'ch2-castle-12-ws.mgs:329:3': {
		messages: ['----------'],
		name: 'ch2-castle-12-ws.mgs:329:3',
	},
	'ch2-castle-12-ws.mgs:327:3': {
		messages: ['microphone'],
		name: 'ch2-castle-12-ws.mgs:327:3',
	},
	'ch2-castle-12-ws.mgs:335:2': {
		messages: ['T '],
		name: 'ch2-castle-12-ws.mgs:335:2',
	},
	'ch2-castle-12-ws.mgs:339:3': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:339:3',
	},
	'ch2-castle-12-ws.mgs:337:3': {
		messages: ['\u001b[33m\u001b[1mO \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:337:3',
	},
	'ch2-castle-12-ws.mgs:341:2': {
		messages: ['H G '],
		name: 'ch2-castle-12-ws.mgs:341:2',
	},
	'ch2-castle-12-ws.mgs:345:3': {
		messages: ['L '],
		name: 'ch2-castle-12-ws.mgs:345:3',
	},
	'ch2-castle-12-ws.mgs:343:3': {
		messages: ['\u001b[33m\u001b[1mL \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:343:3',
	},
	'ch2-castle-12-ws.mgs:347:2': {
		messages: ['Q '],
		name: 'ch2-castle-12-ws.mgs:347:2',
	},
	'ch2-castle-12-ws.mgs:351:3': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:351:3',
	},
	'ch2-castle-12-ws.mgs:349:3': {
		messages: ['\u001b[33m\u001b[1mI \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:349:3',
	},
	'ch2-castle-12-ws.mgs:353:2': {
		messages: ['B '],
		name: 'ch2-castle-12-ws.mgs:353:2',
	},
	'ch2-castle-12-ws.mgs:357:3': {
		messages: ['X '],
		name: 'ch2-castle-12-ws.mgs:357:3',
	},
	'ch2-castle-12-ws.mgs:355:3': {
		messages: ['\u001b[33m\u001b[1mX \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:355:3',
	},
	'ch2-castle-12-ws.mgs:359:2': {
		messages: ['V L H N P I '],
		name: 'ch2-castle-12-ws.mgs:359:2',
	},
	'ch2-castle-12-ws.mgs:363:3': {
		messages: ['A '],
		name: 'ch2-castle-12-ws.mgs:363:3',
	},
	'ch2-castle-12-ws.mgs:361:3': {
		messages: ['\u001b[33m\u001b[1mA \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:361:3',
	},
	'ch2-castle-12-ws.mgs:365:2': {
		messages: ['Z V W '],
		name: 'ch2-castle-12-ws.mgs:365:2',
	},
	'ch2-castle-12-ws.mgs:369:3': {
		messages: ['D '],
		name: 'ch2-castle-12-ws.mgs:369:3',
	},
	'ch2-castle-12-ws.mgs:367:3': {
		messages: ['\u001b[33m\u001b[1mD \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:367:3',
	},
	'ch2-castle-12-ws.mgs:371:2': {
		messages: ['V N '],
		name: 'ch2-castle-12-ws.mgs:371:2',
	},
	'ch2-castle-12-ws.mgs:375:3': {
		messages: ['X '],
		name: 'ch2-castle-12-ws.mgs:375:3',
	},
	'ch2-castle-12-ws.mgs:373:3': {
		messages: ['\u001b[33m\u001b[1mX \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:373:3',
	},
	'ch2-castle-12-ws.mgs:377:2': {
		messages: ['B Y '],
		name: 'ch2-castle-12-ws.mgs:377:2',
	},
	'ch2-castle-12-ws.mgs:382:3': {
		messages: ['----'],
		name: 'ch2-castle-12-ws.mgs:382:3',
	},
	'ch2-castle-12-ws.mgs:380:3': {
		messages: ['hifi'],
		name: 'ch2-castle-12-ws.mgs:380:3',
	},
	'ch2-castle-12-ws.mgs:384:2': {
		messages: ['  '],
		name: 'ch2-castle-12-ws.mgs:384:2',
	},
	'ch2-castle-12-ws.mgs:388:3': {
		messages: ['----------'],
		name: 'ch2-castle-12-ws.mgs:388:3',
	},
	'ch2-castle-12-ws.mgs:386:3': {
		messages: ['headphones'],
		name: 'ch2-castle-12-ws.mgs:386:3',
	},
	'ch2-castle-12-ws.mgs:394:2': {
		messages: ['Y '],
		name: 'ch2-castle-12-ws.mgs:394:2',
	},
	'ch2-castle-12-ws.mgs:398:3': {
		messages: ['P '],
		name: 'ch2-castle-12-ws.mgs:398:3',
	},
	'ch2-castle-12-ws.mgs:396:3': {
		messages: ['\u001b[33m\u001b[1mP \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:396:3',
	},
	'ch2-castle-12-ws.mgs:400:2': {
		messages: ['U M '],
		name: 'ch2-castle-12-ws.mgs:400:2',
	},
	'ch2-castle-12-ws.mgs:404:3': {
		messages: ['A '],
		name: 'ch2-castle-12-ws.mgs:404:3',
	},
	'ch2-castle-12-ws.mgs:402:3': {
		messages: ['\u001b[33m\u001b[1mA \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:402:3',
	},
	'ch2-castle-12-ws.mgs:406:2': {
		messages: ['Y W '],
		name: 'ch2-castle-12-ws.mgs:406:2',
	},
	'ch2-castle-12-ws.mgs:410:3': {
		messages: ['C '],
		name: 'ch2-castle-12-ws.mgs:410:3',
	},
	'ch2-castle-12-ws.mgs:408:3': {
		messages: ['\u001b[33m\u001b[1mC \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:408:3',
	},
	'ch2-castle-12-ws.mgs:412:2': {
		messages: ['E M A O '],
		name: 'ch2-castle-12-ws.mgs:412:2',
	},
	'ch2-castle-12-ws.mgs:416:3': {
		messages: ['C O M P A C T '],
		name: 'ch2-castle-12-ws.mgs:416:3',
	},
	'ch2-castle-12-ws.mgs:414:3': {
		messages: ['\u001b[33m\u001b[1mC O M P A C T \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:414:3',
	},
	'ch2-castle-12-ws.mgs:421:3': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:421:3',
	},
	'ch2-castle-12-ws.mgs:419:3': {
		messages: ['\u001b[33m\u001b[1mI \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:419:3',
	},
	'ch2-castle-12-ws.mgs:423:2': {
		messages: ['P '],
		name: 'ch2-castle-12-ws.mgs:423:2',
	},
	'ch2-castle-12-ws.mgs:427:3': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:427:3',
	},
	'ch2-castle-12-ws.mgs:425:3': {
		messages: ['\u001b[33m\u001b[1mI \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:425:3',
	},
	'ch2-castle-12-ws.mgs:429:2': {
		messages: ['V '],
		name: 'ch2-castle-12-ws.mgs:429:2',
	},
	'ch2-castle-12-ws.mgs:433:3': {
		messages: ['C '],
		name: 'ch2-castle-12-ws.mgs:433:3',
	},
	'ch2-castle-12-ws.mgs:431:3': {
		messages: ['\u001b[33m\u001b[1mC \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:431:3',
	},
	'ch2-castle-12-ws.mgs:435:2': {
		messages: ['Z '],
		name: 'ch2-castle-12-ws.mgs:435:2',
	},
	'ch2-castle-12-ws.mgs:440:3': {
		messages: ['----'],
		name: 'ch2-castle-12-ws.mgs:440:3',
	},
	'ch2-castle-12-ws.mgs:438:3': {
		messages: ['lofi'],
		name: 'ch2-castle-12-ws.mgs:438:3',
	},
	'ch2-castle-12-ws.mgs:442:2': {
		messages: ['   '],
		name: 'ch2-castle-12-ws.mgs:442:2',
	},
	'ch2-castle-12-ws.mgs:446:3': {
		messages: ['---------'],
		name: 'ch2-castle-12-ws.mgs:446:3',
	},
	'ch2-castle-12-ws.mgs:444:3': {
		messages: ['subwoofer'],
		name: 'ch2-castle-12-ws.mgs:444:3',
	},
	'ch2-castle-12-ws.mgs:455:3': {
		messages: ['V '],
		name: 'ch2-castle-12-ws.mgs:455:3',
	},
	'ch2-castle-12-ws.mgs:453:3': {
		messages: ['\u001b[33m\u001b[1mV \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:453:3',
	},
	'ch2-castle-12-ws.mgs:460:3': {
		messages: ['H '],
		name: 'ch2-castle-12-ws.mgs:460:3',
	},
	'ch2-castle-12-ws.mgs:458:3': {
		messages: ['\u001b[33m\u001b[1mH \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:458:3',
	},
	'ch2-castle-12-ws.mgs:462:2': {
		messages: ['Y K '],
		name: 'ch2-castle-12-ws.mgs:462:2',
	},
	'ch2-castle-12-ws.mgs:466:3': {
		messages: ['S '],
		name: 'ch2-castle-12-ws.mgs:466:3',
	},
	'ch2-castle-12-ws.mgs:464:3': {
		messages: ['\u001b[33m\u001b[1mS \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:464:3',
	},
	'ch2-castle-12-ws.mgs:471:3': {
		messages: ['E Q U E N C E R '],
		name: 'ch2-castle-12-ws.mgs:471:3',
	},
	'ch2-castle-12-ws.mgs:469:3': {
		messages: ['\u001b[33m\u001b[1mE Q U E N C E R \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:469:3',
	},
	'ch2-castle-12-ws.mgs:473:2': {
		messages: ['Z P W V Q R '],
		name: 'ch2-castle-12-ws.mgs:473:2',
	},
	'ch2-castle-12-ws.mgs:477:3': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:477:3',
	},
	'ch2-castle-12-ws.mgs:475:3': {
		messages: ['\u001b[33m\u001b[1mO \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:475:3',
	},
	'ch2-castle-12-ws.mgs:482:3': {
		messages: ['N '],
		name: 'ch2-castle-12-ws.mgs:482:3',
	},
	'ch2-castle-12-ws.mgs:480:3': {
		messages: ['\u001b[33m\u001b[1mN \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:480:3',
	},
	'ch2-castle-12-ws.mgs:484:2': {
		messages: ['M '],
		name: 'ch2-castle-12-ws.mgs:484:2',
	},
	'ch2-castle-12-ws.mgs:488:3': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:488:3',
	},
	'ch2-castle-12-ws.mgs:486:3': {
		messages: ['\u001b[33m\u001b[1mO \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:486:3',
	},
	'ch2-castle-12-ws.mgs:490:2': {
		messages: ['V U '],
		name: 'ch2-castle-12-ws.mgs:490:2',
	},
	'ch2-castle-12-ws.mgs:495:3': {
		messages: ['----'],
		name: 'ch2-castle-12-ws.mgs:495:3',
	},
	'ch2-castle-12-ws.mgs:493:3': {
		messages: ['midi'],
		name: 'ch2-castle-12-ws.mgs:493:3',
	},
	'ch2-castle-12-ws.mgs:497:2': {
		messages: ['   '],
		name: 'ch2-castle-12-ws.mgs:497:2',
	},
	'ch2-castle-12-ws.mgs:501:3': {
		messages: ['---------'],
		name: 'ch2-castle-12-ws.mgs:501:3',
	},
	'ch2-castle-12-ws.mgs:499:3': {
		messages: ['sequencer'],
		name: 'ch2-castle-12-ws.mgs:499:3',
	},
	'ch2-castle-12-ws.mgs:507:2': {
		messages: ['F '],
		name: 'ch2-castle-12-ws.mgs:507:2',
	},
	'ch2-castle-12-ws.mgs:511:3': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:511:3',
	},
	'ch2-castle-12-ws.mgs:509:3': {
		messages: ['\u001b[33m\u001b[1mO \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:509:3',
	},
	'ch2-castle-12-ws.mgs:513:2': {
		messages: ['N F '],
		name: 'ch2-castle-12-ws.mgs:513:2',
	},
	'ch2-castle-12-ws.mgs:517:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:517:3',
	},
	'ch2-castle-12-ws.mgs:515:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:515:3',
	},
	'ch2-castle-12-ws.mgs:519:2': {
		messages: ['N M W W T '],
		name: 'ch2-castle-12-ws.mgs:519:2',
	},
	'ch2-castle-12-ws.mgs:523:3': {
		messages: ['C '],
		name: 'ch2-castle-12-ws.mgs:523:3',
	},
	'ch2-castle-12-ws.mgs:521:3': {
		messages: ['\u001b[33m\u001b[1mC \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:521:3',
	},
	'ch2-castle-12-ws.mgs:525:2': {
		messages: ['G X E Q H Z O J '],
		name: 'ch2-castle-12-ws.mgs:525:2',
	},
	'ch2-castle-12-ws.mgs:529:3': {
		messages: ['G '],
		name: 'ch2-castle-12-ws.mgs:529:3',
	},
	'ch2-castle-12-ws.mgs:527:3': {
		messages: ['\u001b[33m\u001b[1mG \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:527:3',
	},
	'ch2-castle-12-ws.mgs:531:2': {
		messages: ['J '],
		name: 'ch2-castle-12-ws.mgs:531:2',
	},
	'ch2-castle-12-ws.mgs:535:3': {
		messages: ['D '],
		name: 'ch2-castle-12-ws.mgs:535:3',
	},
	'ch2-castle-12-ws.mgs:533:3': {
		messages: ['\u001b[33m\u001b[1mD \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:533:3',
	},
	'ch2-castle-12-ws.mgs:537:2': {
		messages: ['J J R '],
		name: 'ch2-castle-12-ws.mgs:537:2',
	},
	'ch2-castle-12-ws.mgs:542:3': {
		messages: ['----'],
		name: 'ch2-castle-12-ws.mgs:542:3',
	},
	'ch2-castle-12-ws.mgs:540:3': {
		messages: ['song'],
		name: 'ch2-castle-12-ws.mgs:540:3',
	},
	'ch2-castle-12-ws.mgs:544:2': {
		messages: ['   '],
		name: 'ch2-castle-12-ws.mgs:544:2',
	},
	'ch2-castle-12-ws.mgs:548:3': {
		messages: ['---------'],
		name: 'ch2-castle-12-ws.mgs:548:3',
	},
	'ch2-castle-12-ws.mgs:546:3': {
		messages: ['recording'],
		name: 'ch2-castle-12-ws.mgs:546:3',
	},
	'ch2-castle-12-ws.mgs:554:2': {
		messages: ['D '],
		name: 'ch2-castle-12-ws.mgs:554:2',
	},
	'ch2-castle-12-ws.mgs:558:3': {
		messages: ['N '],
		name: 'ch2-castle-12-ws.mgs:558:3',
	},
	'ch2-castle-12-ws.mgs:556:3': {
		messages: ['\u001b[33m\u001b[1mN \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:556:3',
	},
	'ch2-castle-12-ws.mgs:563:3': {
		messages: ['C '],
		name: 'ch2-castle-12-ws.mgs:563:3',
	},
	'ch2-castle-12-ws.mgs:561:3': {
		messages: ['\u001b[33m\u001b[1mC \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:561:3',
	},
	'ch2-castle-12-ws.mgs:565:2': {
		messages: ['T '],
		name: 'ch2-castle-12-ws.mgs:565:2',
	},
	'ch2-castle-12-ws.mgs:569:3': {
		messages: ['R '],
		name: 'ch2-castle-12-ws.mgs:569:3',
	},
	'ch2-castle-12-ws.mgs:567:3': {
		messages: ['\u001b[33m\u001b[1mR \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:567:3',
	},
	'ch2-castle-12-ws.mgs:571:2': {
		messages: ['V N Q D '],
		name: 'ch2-castle-12-ws.mgs:571:2',
	},
	'ch2-castle-12-ws.mgs:575:3': {
		messages: ['S '],
		name: 'ch2-castle-12-ws.mgs:575:3',
	},
	'ch2-castle-12-ws.mgs:573:3': {
		messages: ['\u001b[33m\u001b[1mS \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:573:3',
	},
	'ch2-castle-12-ws.mgs:580:3': {
		messages: ['A '],
		name: 'ch2-castle-12-ws.mgs:580:3',
	},
	'ch2-castle-12-ws.mgs:578:3': {
		messages: ['\u001b[33m\u001b[1mA \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:578:3',
	},
	'ch2-castle-12-ws.mgs:582:2': {
		messages: ['V '],
		name: 'ch2-castle-12-ws.mgs:582:2',
	},
	'ch2-castle-12-ws.mgs:586:3': {
		messages: ['S T R E A M '],
		name: 'ch2-castle-12-ws.mgs:586:3',
	},
	'ch2-castle-12-ws.mgs:584:3': {
		messages: ['\u001b[33m\u001b[1mS T R E A M \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:584:3',
	},
	'ch2-castle-12-ws.mgs:588:2': {
		messages: ['G A '],
		name: 'ch2-castle-12-ws.mgs:588:2',
	},
	'ch2-castle-12-ws.mgs:592:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:592:3',
	},
	'ch2-castle-12-ws.mgs:590:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:590:3',
	},
	'ch2-castle-12-ws.mgs:594:2': {
		messages: ['H O E Z '],
		name: 'ch2-castle-12-ws.mgs:594:2',
	},
	'ch2-castle-12-ws.mgs:599:3': {
		messages: ['----'],
		name: 'ch2-castle-12-ws.mgs:599:3',
	},
	'ch2-castle-12-ws.mgs:597:3': {
		messages: ['tape'],
		name: 'ch2-castle-12-ws.mgs:597:3',
	},
	'ch2-castle-12-ws.mgs:601:2': {
		messages: ['   '],
		name: 'ch2-castle-12-ws.mgs:601:2',
	},
	'ch2-castle-12-ws.mgs:605:3': {
		messages: ['---------'],
		name: 'ch2-castle-12-ws.mgs:605:3',
	},
	'ch2-castle-12-ws.mgs:603:3': {
		messages: ['frequency'],
		name: 'ch2-castle-12-ws.mgs:603:3',
	},
	'ch2-castle-12-ws.mgs:611:2': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:611:2',
	},
	'ch2-castle-12-ws.mgs:615:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:615:3',
	},
	'ch2-castle-12-ws.mgs:613:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:613:3',
	},
	'ch2-castle-12-ws.mgs:617:2': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:617:2',
	},
	'ch2-castle-12-ws.mgs:621:3': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:621:3',
	},
	'ch2-castle-12-ws.mgs:619:3': {
		messages: ['\u001b[33m\u001b[1mO \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:619:3',
	},
	'ch2-castle-12-ws.mgs:623:2': {
		messages: ['R O B B '],
		name: 'ch2-castle-12-ws.mgs:623:2',
	},
	'ch2-castle-12-ws.mgs:627:3': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:627:3',
	},
	'ch2-castle-12-ws.mgs:625:3': {
		messages: ['\u001b[33m\u001b[1mO \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:625:3',
	},
	'ch2-castle-12-ws.mgs:629:2': {
		messages: ['D '],
		name: 'ch2-castle-12-ws.mgs:629:2',
	},
	'ch2-castle-12-ws.mgs:633:3': {
		messages: ['S '],
		name: 'ch2-castle-12-ws.mgs:633:3',
	},
	'ch2-castle-12-ws.mgs:631:3': {
		messages: ['\u001b[33m\u001b[1mS \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:631:3',
	},
	'ch2-castle-12-ws.mgs:635:2': {
		messages: ['Q L Y U E M L T '],
		name: 'ch2-castle-12-ws.mgs:635:2',
	},
	'ch2-castle-12-ws.mgs:639:3': {
		messages: ['C '],
		name: 'ch2-castle-12-ws.mgs:639:3',
	},
	'ch2-castle-12-ws.mgs:637:3': {
		messages: ['\u001b[33m\u001b[1mC \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:637:3',
	},
	'ch2-castle-12-ws.mgs:644:3': {
		messages: ['A U D I O '],
		name: 'ch2-castle-12-ws.mgs:644:3',
	},
	'ch2-castle-12-ws.mgs:642:3': {
		messages: ['\u001b[33m\u001b[1mA U D I O \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:642:3',
	},
	'ch2-castle-12-ws.mgs:650:3': {
		messages: ['-----'],
		name: 'ch2-castle-12-ws.mgs:650:3',
	},
	'ch2-castle-12-ws.mgs:648:3': {
		messages: ['album'],
		name: 'ch2-castle-12-ws.mgs:648:3',
	},
	'ch2-castle-12-ws.mgs:652:2': {
		messages: ['  '],
		name: 'ch2-castle-12-ws.mgs:652:2',
	},
	'ch2-castle-12-ws.mgs:656:3': {
		messages: ['---------'],
		name: 'ch2-castle-12-ws.mgs:656:3',
	},
	'ch2-castle-12-ws.mgs:654:3': {
		messages: ['broadcast'],
		name: 'ch2-castle-12-ws.mgs:654:3',
	},
	'ch2-castle-12-ws.mgs:662:2': {
		messages: ['W V Q F '],
		name: 'ch2-castle-12-ws.mgs:662:2',
	},
	'ch2-castle-12-ws.mgs:666:3': {
		messages: ['D '],
		name: 'ch2-castle-12-ws.mgs:666:3',
	},
	'ch2-castle-12-ws.mgs:664:3': {
		messages: ['\u001b[33m\u001b[1mD \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:664:3',
	},
	'ch2-castle-12-ws.mgs:668:2': {
		messages: ['V J '],
		name: 'ch2-castle-12-ws.mgs:668:2',
	},
	'ch2-castle-12-ws.mgs:672:3': {
		messages: ['N '],
		name: 'ch2-castle-12-ws.mgs:672:3',
	},
	'ch2-castle-12-ws.mgs:670:3': {
		messages: ['\u001b[33m\u001b[1mN \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:670:3',
	},
	'ch2-castle-12-ws.mgs:674:2': {
		messages: ['O O '],
		name: 'ch2-castle-12-ws.mgs:674:2',
	},
	'ch2-castle-12-ws.mgs:678:3': {
		messages: ['S '],
		name: 'ch2-castle-12-ws.mgs:678:3',
	},
	'ch2-castle-12-ws.mgs:676:3': {
		messages: ['\u001b[33m\u001b[1mS \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:676:3',
	},
	'ch2-castle-12-ws.mgs:680:2': {
		messages: ['R Q N '],
		name: 'ch2-castle-12-ws.mgs:680:2',
	},
	'ch2-castle-12-ws.mgs:684:3': {
		messages: ['M I D I '],
		name: 'ch2-castle-12-ws.mgs:684:3',
	},
	'ch2-castle-12-ws.mgs:682:3': {
		messages: ['\u001b[33m\u001b[1mM I D I \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:682:3',
	},
	'ch2-castle-12-ws.mgs:686:2': {
		messages: ['D W '],
		name: 'ch2-castle-12-ws.mgs:686:2',
	},
	'ch2-castle-12-ws.mgs:690:3': {
		messages: ['S '],
		name: 'ch2-castle-12-ws.mgs:690:3',
	},
	'ch2-castle-12-ws.mgs:688:3': {
		messages: ['\u001b[33m\u001b[1mS \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:688:3',
	},
	'ch2-castle-12-ws.mgs:695:3': {
		messages: ['A '],
		name: 'ch2-castle-12-ws.mgs:695:3',
	},
	'ch2-castle-12-ws.mgs:693:3': {
		messages: ['\u001b[33m\u001b[1mA \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:693:3',
	},
	'ch2-castle-12-ws.mgs:697:2': {
		messages: ['Y Y O '],
		name: 'ch2-castle-12-ws.mgs:697:2',
	},
	'ch2-castle-12-ws.mgs:702:3': {
		messages: ['-----'],
		name: 'ch2-castle-12-ws.mgs:702:3',
	},
	'ch2-castle-12-ws.mgs:700:3': {
		messages: ['audio'],
		name: 'ch2-castle-12-ws.mgs:700:3',
	},
	'ch2-castle-12-ws.mgs:704:2': {
		messages: ['   '],
		name: 'ch2-castle-12-ws.mgs:704:2',
	},
	'ch2-castle-12-ws.mgs:708:3': {
		messages: ['--------'],
		name: 'ch2-castle-12-ws.mgs:708:3',
	},
	'ch2-castle-12-ws.mgs:706:3': {
		messages: ['surround'],
		name: 'ch2-castle-12-ws.mgs:706:3',
	},
	'ch2-castle-12-ws.mgs:717:3': {
		messages: ['R '],
		name: 'ch2-castle-12-ws.mgs:717:3',
	},
	'ch2-castle-12-ws.mgs:715:3': {
		messages: ['\u001b[33m\u001b[1mR \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:715:3',
	},
	'ch2-castle-12-ws.mgs:719:2': {
		messages: ['S O N U '],
		name: 'ch2-castle-12-ws.mgs:719:2',
	},
	'ch2-castle-12-ws.mgs:723:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:723:3',
	},
	'ch2-castle-12-ws.mgs:721:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:721:3',
	},
	'ch2-castle-12-ws.mgs:728:3': {
		messages: ['G '],
		name: 'ch2-castle-12-ws.mgs:728:3',
	},
	'ch2-castle-12-ws.mgs:726:3': {
		messages: ['\u001b[33m\u001b[1mG \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:726:3',
	},
	'ch2-castle-12-ws.mgs:730:2': {
		messages: ['M J '],
		name: 'ch2-castle-12-ws.mgs:730:2',
	},
	'ch2-castle-12-ws.mgs:734:3': {
		messages: ['H '],
		name: 'ch2-castle-12-ws.mgs:734:3',
	},
	'ch2-castle-12-ws.mgs:732:3': {
		messages: ['\u001b[33m\u001b[1mH \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:732:3',
	},
	'ch2-castle-12-ws.mgs:739:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:739:3',
	},
	'ch2-castle-12-ws.mgs:737:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:737:3',
	},
	'ch2-castle-12-ws.mgs:744:3': {
		messages: ['A D P H O N E S '],
		name: 'ch2-castle-12-ws.mgs:744:3',
	},
	'ch2-castle-12-ws.mgs:742:3': {
		messages: ['\u001b[33m\u001b[1mA D P H O N E S \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:742:3',
	},
	'ch2-castle-12-ws.mgs:749:3': {
		messages: ['T '],
		name: 'ch2-castle-12-ws.mgs:749:3',
	},
	'ch2-castle-12-ws.mgs:747:3': {
		messages: ['\u001b[33m\u001b[1mT \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:747:3',
	},
	'ch2-castle-12-ws.mgs:754:3': {
		messages: ['L '],
		name: 'ch2-castle-12-ws.mgs:754:3',
	},
	'ch2-castle-12-ws.mgs:752:3': {
		messages: ['\u001b[33m\u001b[1mL \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:752:3',
	},
	'ch2-castle-12-ws.mgs:759:3': {
		messages: ['L '],
		name: 'ch2-castle-12-ws.mgs:759:3',
	},
	'ch2-castle-12-ws.mgs:757:3': {
		messages: ['\u001b[33m\u001b[1mL \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:757:3',
	},
	'ch2-castle-12-ws.mgs:761:2': {
		messages: ['U O '],
		name: 'ch2-castle-12-ws.mgs:761:2',
	},
	'ch2-castle-12-ws.mgs:765:3': {
		messages: ['B '],
		name: 'ch2-castle-12-ws.mgs:765:3',
	},
	'ch2-castle-12-ws.mgs:763:3': {
		messages: ['\u001b[33m\u001b[1mB \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:763:3',
	},
	'ch2-castle-12-ws.mgs:771:3': {
		messages: ['-----'],
		name: 'ch2-castle-12-ws.mgs:771:3',
	},
	'ch2-castle-12-ws.mgs:769:3': {
		messages: ['codec'],
		name: 'ch2-castle-12-ws.mgs:769:3',
	},
	'ch2-castle-12-ws.mgs:773:2': {
		messages: ['   '],
		name: 'ch2-castle-12-ws.mgs:773:2',
	},
	'ch2-castle-12-ws.mgs:777:3': {
		messages: ['--------'],
		name: 'ch2-castle-12-ws.mgs:777:3',
	},
	'ch2-castle-12-ws.mgs:775:3': {
		messages: ['speakers'],
		name: 'ch2-castle-12-ws.mgs:775:3',
	},
	'ch2-castle-12-ws.mgs:783:2': {
		messages: ['M '],
		name: 'ch2-castle-12-ws.mgs:783:2',
	},
	'ch2-castle-12-ws.mgs:787:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:787:3',
	},
	'ch2-castle-12-ws.mgs:785:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:785:3',
	},
	'ch2-castle-12-ws.mgs:789:2': {
		messages: ['X R F U '],
		name: 'ch2-castle-12-ws.mgs:789:2',
	},
	'ch2-castle-12-ws.mgs:793:3': {
		messages: ['R '],
		name: 'ch2-castle-12-ws.mgs:793:3',
	},
	'ch2-castle-12-ws.mgs:791:3': {
		messages: ['\u001b[33m\u001b[1mR \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:791:3',
	},
	'ch2-castle-12-ws.mgs:798:3': {
		messages: ['R H Y '],
		name: 'ch2-castle-12-ws.mgs:798:3',
	},
	'ch2-castle-12-ws.mgs:796:3': {
		messages: ['\u001b[33m\u001b[1mR H Y \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:796:3',
	},
	'ch2-castle-12-ws.mgs:803:3': {
		messages: ['T '],
		name: 'ch2-castle-12-ws.mgs:803:3',
	},
	'ch2-castle-12-ws.mgs:801:3': {
		messages: ['\u001b[33m\u001b[1mT \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:801:3',
	},
	'ch2-castle-12-ws.mgs:808:3': {
		messages: ['H M '],
		name: 'ch2-castle-12-ws.mgs:808:3',
	},
	'ch2-castle-12-ws.mgs:806:3': {
		messages: ['\u001b[33m\u001b[1mH M \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:806:3',
	},
	'ch2-castle-12-ws.mgs:810:2': {
		messages: ['W H G C R '],
		name: 'ch2-castle-12-ws.mgs:810:2',
	},
	'ch2-castle-12-ws.mgs:814:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:814:3',
	},
	'ch2-castle-12-ws.mgs:812:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:812:3',
	},
	'ch2-castle-12-ws.mgs:816:2': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:816:2',
	},
	'ch2-castle-12-ws.mgs:820:3': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:820:3',
	},
	'ch2-castle-12-ws.mgs:818:3': {
		messages: ['\u001b[33m\u001b[1mO \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:818:3',
	},
	'ch2-castle-12-ws.mgs:825:3': {
		messages: ['B '],
		name: 'ch2-castle-12-ws.mgs:825:3',
	},
	'ch2-castle-12-ws.mgs:823:3': {
		messages: ['\u001b[33m\u001b[1mB \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:823:3',
	},
	'ch2-castle-12-ws.mgs:827:2': {
		messages: ['H '],
		name: 'ch2-castle-12-ws.mgs:827:2',
	},
	'ch2-castle-12-ws.mgs:831:3': {
		messages: ['P '],
		name: 'ch2-castle-12-ws.mgs:831:3',
	},
	'ch2-castle-12-ws.mgs:829:3': {
		messages: ['\u001b[33m\u001b[1mP \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:829:3',
	},
	'ch2-castle-12-ws.mgs:836:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:836:3',
	},
	'ch2-castle-12-ws.mgs:834:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:834:3',
	},
	'ch2-castle-12-ws.mgs:842:3': {
		messages: ['-----'],
		name: 'ch2-castle-12-ws.mgs:842:3',
	},
	'ch2-castle-12-ws.mgs:840:3': {
		messages: ['laser'],
		name: 'ch2-castle-12-ws.mgs:840:3',
	},
	'ch2-castle-12-ws.mgs:844:2': {
		messages: ['   '],
		name: 'ch2-castle-12-ws.mgs:844:2',
	},
	'ch2-castle-12-ws.mgs:848:3': {
		messages: ['--------'],
		name: 'ch2-castle-12-ws.mgs:848:3',
	},
	'ch2-castle-12-ws.mgs:846:3': {
		messages: ['chiptune'],
		name: 'ch2-castle-12-ws.mgs:846:3',
	},
	'ch2-castle-12-ws.mgs:854:2': {
		messages: ['W R '],
		name: 'ch2-castle-12-ws.mgs:854:2',
	},
	'ch2-castle-12-ws.mgs:858:3': {
		messages: ['C '],
		name: 'ch2-castle-12-ws.mgs:858:3',
	},
	'ch2-castle-12-ws.mgs:856:3': {
		messages: ['\u001b[33m\u001b[1mC \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:856:3',
	},
	'ch2-castle-12-ws.mgs:860:2': {
		messages: ['P G C T '],
		name: 'ch2-castle-12-ws.mgs:860:2',
	},
	'ch2-castle-12-ws.mgs:864:3': {
		messages: ['S Y N '],
		name: 'ch2-castle-12-ws.mgs:864:3',
	},
	'ch2-castle-12-ws.mgs:862:3': {
		messages: ['\u001b[33m\u001b[1mS Y N \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:862:3',
	},
	'ch2-castle-12-ws.mgs:869:3': {
		messages: ['T '],
		name: 'ch2-castle-12-ws.mgs:869:3',
	},
	'ch2-castle-12-ws.mgs:867:3': {
		messages: ['\u001b[33m\u001b[1mT \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:867:3',
	},
	'ch2-castle-12-ws.mgs:874:3': {
		messages: ['H E S I Z E '],
		name: 'ch2-castle-12-ws.mgs:874:3',
	},
	'ch2-castle-12-ws.mgs:872:3': {
		messages: ['\u001b[33m\u001b[1mH E S I Z E \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:872:3',
	},
	'ch2-castle-12-ws.mgs:879:3': {
		messages: ['R '],
		name: 'ch2-castle-12-ws.mgs:879:3',
	},
	'ch2-castle-12-ws.mgs:877:3': {
		messages: ['\u001b[33m\u001b[1mR \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:877:3',
	},
	'ch2-castle-12-ws.mgs:881:2': {
		messages: ['T A '],
		name: 'ch2-castle-12-ws.mgs:881:2',
	},
	'ch2-castle-12-ws.mgs:885:3': {
		messages: ['F '],
		name: 'ch2-castle-12-ws.mgs:885:3',
	},
	'ch2-castle-12-ws.mgs:883:3': {
		messages: ['\u001b[33m\u001b[1mF \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:883:3',
	},
	'ch2-castle-12-ws.mgs:890:3': {
		messages: ['U '],
		name: 'ch2-castle-12-ws.mgs:890:3',
	},
	'ch2-castle-12-ws.mgs:888:3': {
		messages: ['\u001b[33m\u001b[1mU \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:888:3',
	},
	'ch2-castle-12-ws.mgs:895:3': {
		messages: ['M '],
		name: 'ch2-castle-12-ws.mgs:895:3',
	},
	'ch2-castle-12-ws.mgs:893:3': {
		messages: ['\u001b[33m\u001b[1mM \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:893:3',
	},
	'ch2-castle-12-ws.mgs:897:2': {
		messages: ['T '],
		name: 'ch2-castle-12-ws.mgs:897:2',
	},
	'ch2-castle-12-ws.mgs:901:3': {
		messages: ['A '],
		name: 'ch2-castle-12-ws.mgs:901:3',
	},
	'ch2-castle-12-ws.mgs:899:3': {
		messages: ['\u001b[33m\u001b[1mA \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:899:3',
	},
	'ch2-castle-12-ws.mgs:907:3': {
		messages: ['-----'],
		name: 'ch2-castle-12-ws.mgs:907:3',
	},
	'ch2-castle-12-ws.mgs:905:3': {
		messages: ['media'],
		name: 'ch2-castle-12-ws.mgs:905:3',
	},
	'ch2-castle-12-ws.mgs:909:2': {
		messages: ['   '],
		name: 'ch2-castle-12-ws.mgs:909:2',
	},
	'ch2-castle-12-ws.mgs:913:3': {
		messages: ['--------'],
		name: 'ch2-castle-12-ws.mgs:913:3',
	},
	'ch2-castle-12-ws.mgs:911:3': {
		messages: ['cassette'],
		name: 'ch2-castle-12-ws.mgs:911:3',
	},
	'ch2-castle-12-ws.mgs:919:2': {
		messages: ['U D W '],
		name: 'ch2-castle-12-ws.mgs:919:2',
	},
	'ch2-castle-12-ws.mgs:923:3': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:923:3',
	},
	'ch2-castle-12-ws.mgs:921:3': {
		messages: ['\u001b[33m\u001b[1mO \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:921:3',
	},
	'ch2-castle-12-ws.mgs:925:2': {
		messages: ['H K X Q H Y '],
		name: 'ch2-castle-12-ws.mgs:925:2',
	},
	'ch2-castle-12-ws.mgs:929:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:929:3',
	},
	'ch2-castle-12-ws.mgs:927:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:927:3',
	},
	'ch2-castle-12-ws.mgs:934:3': {
		messages: ['F R E Q U '],
		name: 'ch2-castle-12-ws.mgs:934:3',
	},
	'ch2-castle-12-ws.mgs:932:3': {
		messages: ['\u001b[33m\u001b[1mF R E Q U \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:932:3',
	},
	'ch2-castle-12-ws.mgs:939:3': {
		messages: ['E '],
		name: 'ch2-castle-12-ws.mgs:939:3',
	},
	'ch2-castle-12-ws.mgs:937:3': {
		messages: ['\u001b[33m\u001b[1mE \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:937:3',
	},
	'ch2-castle-12-ws.mgs:944:3': {
		messages: ['N C Y '],
		name: 'ch2-castle-12-ws.mgs:944:3',
	},
	'ch2-castle-12-ws.mgs:942:3': {
		messages: ['\u001b[33m\u001b[1mN C Y \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:942:3',
	},
	'ch2-castle-12-ws.mgs:949:3': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:949:3',
	},
	'ch2-castle-12-ws.mgs:947:3': {
		messages: ['\u001b[33m\u001b[1mI \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:947:3',
	},
	'ch2-castle-12-ws.mgs:954:3': {
		messages: ['M '],
		name: 'ch2-castle-12-ws.mgs:954:3',
	},
	'ch2-castle-12-ws.mgs:952:3': {
		messages: ['\u001b[33m\u001b[1mM \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:952:3',
	},
	'ch2-castle-12-ws.mgs:956:2': {
		messages: ['T I '],
		name: 'ch2-castle-12-ws.mgs:956:2',
	},
	'ch2-castle-12-ws.mgs:960:3': {
		messages: ['T '],
		name: 'ch2-castle-12-ws.mgs:960:3',
	},
	'ch2-castle-12-ws.mgs:958:3': {
		messages: ['\u001b[33m\u001b[1mT \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:958:3',
	},
	'ch2-castle-12-ws.mgs:966:3': {
		messages: ['-----'],
		name: 'ch2-castle-12-ws.mgs:966:3',
	},
	'ch2-castle-12-ws.mgs:964:3': {
		messages: ['music'],
		name: 'ch2-castle-12-ws.mgs:964:3',
	},
	'ch2-castle-12-ws.mgs:968:2': {
		messages: ['    '],
		name: 'ch2-castle-12-ws.mgs:968:2',
	},
	'ch2-castle-12-ws.mgs:972:3': {
		messages: ['-------'],
		name: 'ch2-castle-12-ws.mgs:972:3',
	},
	'ch2-castle-12-ws.mgs:970:3': {
		messages: ['vocoder'],
		name: 'ch2-castle-12-ws.mgs:970:3',
	},
	'ch2-castle-12-ws.mgs:978:2': {
		messages: ['S '],
		name: 'ch2-castle-12-ws.mgs:978:2',
	},
	'ch2-castle-12-ws.mgs:982:3': {
		messages: ['S U R '],
		name: 'ch2-castle-12-ws.mgs:982:3',
	},
	'ch2-castle-12-ws.mgs:980:3': {
		messages: ['\u001b[33m\u001b[1mS U R \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:980:3',
	},
	'ch2-castle-12-ws.mgs:987:3': {
		messages: ['R '],
		name: 'ch2-castle-12-ws.mgs:987:3',
	},
	'ch2-castle-12-ws.mgs:985:3': {
		messages: ['\u001b[33m\u001b[1mR \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:985:3',
	},
	'ch2-castle-12-ws.mgs:992:3': {
		messages: ['O U N D '],
		name: 'ch2-castle-12-ws.mgs:992:3',
	},
	'ch2-castle-12-ws.mgs:990:3': {
		messages: ['\u001b[33m\u001b[1mO U N D \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:990:3',
	},
	'ch2-castle-12-ws.mgs:994:2': {
		messages: ['V E B G '],
		name: 'ch2-castle-12-ws.mgs:994:2',
	},
	'ch2-castle-12-ws.mgs:998:3': {
		messages: ['B R '],
		name: 'ch2-castle-12-ws.mgs:998:3',
	},
	'ch2-castle-12-ws.mgs:996:3': {
		messages: ['\u001b[33m\u001b[1mB R \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:996:3',
	},
	'ch2-castle-12-ws.mgs:1003:3': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:1003:3',
	},
	'ch2-castle-12-ws.mgs:1001:3': {
		messages: ['\u001b[33m\u001b[1mO \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1001:3',
	},
	'ch2-castle-12-ws.mgs:1008:3': {
		messages: ['A D C A S T '],
		name: 'ch2-castle-12-ws.mgs:1008:3',
	},
	'ch2-castle-12-ws.mgs:1006:3': {
		messages: ['\u001b[33m\u001b[1mA D C A S T \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1006:3',
	},
	'ch2-castle-12-ws.mgs:1013:3': {
		messages: ['H '],
		name: 'ch2-castle-12-ws.mgs:1013:3',
	},
	'ch2-castle-12-ws.mgs:1011:3': {
		messages: ['\u001b[33m\u001b[1mH \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1011:3',
	},
	'ch2-castle-12-ws.mgs:1015:2': {
		messages: ['K A '],
		name: 'ch2-castle-12-ws.mgs:1015:2',
	},
	'ch2-castle-12-ws.mgs:1020:3': {
		messages: ['-----'],
		name: 'ch2-castle-12-ws.mgs:1020:3',
	},
	'ch2-castle-12-ws.mgs:1018:3': {
		messages: ['radio'],
		name: 'ch2-castle-12-ws.mgs:1018:3',
	},
	'ch2-castle-12-ws.mgs:1022:2': {
		messages: ['    '],
		name: 'ch2-castle-12-ws.mgs:1022:2',
	},
	'ch2-castle-12-ws.mgs:1026:3': {
		messages: ['-------'],
		name: 'ch2-castle-12-ws.mgs:1026:3',
	},
	'ch2-castle-12-ws.mgs:1024:3': {
		messages: ['compact'],
		name: 'ch2-castle-12-ws.mgs:1024:3',
	},
	'ch2-castle-12-ws.mgs:1032:2': {
		messages: ['L '],
		name: 'ch2-castle-12-ws.mgs:1032:2',
	},
	'ch2-castle-12-ws.mgs:1036:3': {
		messages: ['S O U N '],
		name: 'ch2-castle-12-ws.mgs:1036:3',
	},
	'ch2-castle-12-ws.mgs:1034:3': {
		messages: ['\u001b[33m\u001b[1mS O U N \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1034:3',
	},
	'ch2-castle-12-ws.mgs:1041:3': {
		messages: ['D '],
		name: 'ch2-castle-12-ws.mgs:1041:3',
	},
	'ch2-castle-12-ws.mgs:1039:3': {
		messages: ['\u001b[33m\u001b[1mD \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1039:3',
	},
	'ch2-castle-12-ws.mgs:1046:3': {
		messages: ['T R A C K '],
		name: 'ch2-castle-12-ws.mgs:1046:3',
	},
	'ch2-castle-12-ws.mgs:1044:3': {
		messages: ['\u001b[33m\u001b[1mT R A C K \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1044:3',
	},
	'ch2-castle-12-ws.mgs:1048:2': {
		messages: ['C '],
		name: 'ch2-castle-12-ws.mgs:1048:2',
	},
	'ch2-castle-12-ws.mgs:1052:3': {
		messages: ['T R E '],
		name: 'ch2-castle-12-ws.mgs:1052:3',
	},
	'ch2-castle-12-ws.mgs:1050:3': {
		messages: ['\u001b[33m\u001b[1mT R E \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1050:3',
	},
	'ch2-castle-12-ws.mgs:1057:3': {
		messages: ['B '],
		name: 'ch2-castle-12-ws.mgs:1057:3',
	},
	'ch2-castle-12-ws.mgs:1055:3': {
		messages: ['\u001b[33m\u001b[1mB \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1055:3',
	},
	'ch2-castle-12-ws.mgs:1062:3': {
		messages: ['L E '],
		name: 'ch2-castle-12-ws.mgs:1062:3',
	},
	'ch2-castle-12-ws.mgs:1060:3': {
		messages: ['\u001b[33m\u001b[1mL E \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1060:3',
	},
	'ch2-castle-12-ws.mgs:1064:2': {
		messages: ['P R C '],
		name: 'ch2-castle-12-ws.mgs:1064:2',
	},
	'ch2-castle-12-ws.mgs:1068:3': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:1068:3',
	},
	'ch2-castle-12-ws.mgs:1066:3': {
		messages: ['\u001b[33m\u001b[1mI \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1066:3',
	},
	'ch2-castle-12-ws.mgs:1070:2': {
		messages: ['D Y M '],
		name: 'ch2-castle-12-ws.mgs:1070:2',
	},
	'ch2-castle-12-ws.mgs:1075:3': {
		messages: ['-----'],
		name: 'ch2-castle-12-ws.mgs:1075:3',
	},
	'ch2-castle-12-ws.mgs:1073:3': {
		messages: ['vinyl'],
		name: 'ch2-castle-12-ws.mgs:1073:3',
	},
	'ch2-castle-12-ws.mgs:1077:2': {
		messages: ['     '],
		name: 'ch2-castle-12-ws.mgs:1077:2',
	},
	'ch2-castle-12-ws.mgs:1081:3': {
		messages: ['------'],
		name: 'ch2-castle-12-ws.mgs:1081:3',
	},
	'ch2-castle-12-ws.mgs:1079:3': {
		messages: ['volume'],
		name: 'ch2-castle-12-ws.mgs:1079:3',
	},
	'ch2-castle-12-ws.mgs:1090:3': {
		messages: ['V O L U M E '],
		name: 'ch2-castle-12-ws.mgs:1090:3',
	},
	'ch2-castle-12-ws.mgs:1088:3': {
		messages: ['\u001b[33m\u001b[1mV O L U M E \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1088:3',
	},
	'ch2-castle-12-ws.mgs:1095:3': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:1095:3',
	},
	'ch2-castle-12-ws.mgs:1093:3': {
		messages: ['\u001b[33m\u001b[1mI \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1093:3',
	},
	'ch2-castle-12-ws.mgs:1097:2': {
		messages: ['O '],
		name: 'ch2-castle-12-ws.mgs:1097:2',
	},
	'ch2-castle-12-ws.mgs:1101:3': {
		messages: ['A N A L O G '],
		name: 'ch2-castle-12-ws.mgs:1101:3',
	},
	'ch2-castle-12-ws.mgs:1099:3': {
		messages: ['\u001b[33m\u001b[1mA N A L O G \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1099:3',
	},
	'ch2-castle-12-ws.mgs:1103:2': {
		messages: ['F '],
		name: 'ch2-castle-12-ws.mgs:1103:2',
	},
	'ch2-castle-12-ws.mgs:1107:3': {
		messages: ['A '],
		name: 'ch2-castle-12-ws.mgs:1107:3',
	},
	'ch2-castle-12-ws.mgs:1105:3': {
		messages: ['\u001b[33m\u001b[1mA \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1105:3',
	},
	'ch2-castle-12-ws.mgs:1109:2': {
		messages: ['D V M A '],
		name: 'ch2-castle-12-ws.mgs:1109:2',
	},
	'ch2-castle-12-ws.mgs:1113:3': {
		messages: ['F '],
		name: 'ch2-castle-12-ws.mgs:1113:3',
	},
	'ch2-castle-12-ws.mgs:1111:3': {
		messages: ['\u001b[33m\u001b[1mF \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1111:3',
	},
	'ch2-castle-12-ws.mgs:1115:2': {
		messages: ['C K Z D '],
		name: 'ch2-castle-12-ws.mgs:1115:2',
	},
	'ch2-castle-12-ws.mgs:1120:3': {
		messages: ['------'],
		name: 'ch2-castle-12-ws.mgs:1120:3',
	},
	'ch2-castle-12-ws.mgs:1118:3': {
		messages: ['analog'],
		name: 'ch2-castle-12-ws.mgs:1118:3',
	},
	'ch2-castle-12-ws.mgs:1122:2': {
		messages: ['    '],
		name: 'ch2-castle-12-ws.mgs:1122:2',
	},
	'ch2-castle-12-ws.mgs:1126:3': {
		messages: ['------'],
		name: 'ch2-castle-12-ws.mgs:1126:3',
	},
	'ch2-castle-12-ws.mgs:1124:3': {
		messages: ['treble'],
		name: 'ch2-castle-12-ws.mgs:1124:3',
	},
	'ch2-castle-12-ws.mgs:1132:2': {
		messages: ['U I X X H X E '],
		name: 'ch2-castle-12-ws.mgs:1132:2',
	},
	'ch2-castle-12-ws.mgs:1136:3': {
		messages: ['N '],
		name: 'ch2-castle-12-ws.mgs:1136:3',
	},
	'ch2-castle-12-ws.mgs:1134:3': {
		messages: ['\u001b[33m\u001b[1mN \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1134:3',
	},
	'ch2-castle-12-ws.mgs:1141:3': {
		messages: ['S P E A K E R '],
		name: 'ch2-castle-12-ws.mgs:1141:3',
	},
	'ch2-castle-12-ws.mgs:1139:3': {
		messages: ['\u001b[33m\u001b[1mS P E A K E R \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1139:3',
	},
	'ch2-castle-12-ws.mgs:1146:3': {
		messages: ['S '],
		name: 'ch2-castle-12-ws.mgs:1146:3',
	},
	'ch2-castle-12-ws.mgs:1144:3': {
		messages: ['\u001b[33m\u001b[1mS \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1144:3',
	},
	'ch2-castle-12-ws.mgs:1148:2': {
		messages: ['K S V '],
		name: 'ch2-castle-12-ws.mgs:1148:2',
	},
	'ch2-castle-12-ws.mgs:1152:3': {
		messages: ['I '],
		name: 'ch2-castle-12-ws.mgs:1152:3',
	},
	'ch2-castle-12-ws.mgs:1150:3': {
		messages: ['\u001b[33m\u001b[1mI \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1150:3',
	},
	'ch2-castle-12-ws.mgs:1154:2': {
		messages: ['K Z X Y N '],
		name: 'ch2-castle-12-ws.mgs:1154:2',
	},
	'ch2-castle-12-ws.mgs:1159:3': {
		messages: ['------'],
		name: 'ch2-castle-12-ws.mgs:1159:3',
	},
	'ch2-castle-12-ws.mgs:1157:3': {
		messages: ['mixing'],
		name: 'ch2-castle-12-ws.mgs:1157:3',
	},
	'ch2-castle-12-ws.mgs:1161:2': {
		messages: ['    '],
		name: 'ch2-castle-12-ws.mgs:1161:2',
	},
	'ch2-castle-12-ws.mgs:1165:3': {
		messages: ['------'],
		name: 'ch2-castle-12-ws.mgs:1165:3',
	},
	'ch2-castle-12-ws.mgs:1163:3': {
		messages: ['stream'],
		name: 'ch2-castle-12-ws.mgs:1163:3',
	},
	'ch2-castle-12-ws.mgs:1171:2': {
		messages: ['Q X C '],
		name: 'ch2-castle-12-ws.mgs:1171:2',
	},
	'ch2-castle-12-ws.mgs:1175:3': {
		messages: ['P H O N O '],
		name: 'ch2-castle-12-ws.mgs:1175:3',
	},
	'ch2-castle-12-ws.mgs:1173:3': {
		messages: ['\u001b[33m\u001b[1mP H O N O \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1173:3',
	},
	'ch2-castle-12-ws.mgs:1180:3': {
		messages: ['G '],
		name: 'ch2-castle-12-ws.mgs:1180:3',
	},
	'ch2-castle-12-ws.mgs:1178:3': {
		messages: ['\u001b[33m\u001b[1mG \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1178:3',
	},
	'ch2-castle-12-ws.mgs:1185:3': {
		messages: ['R A P H '],
		name: 'ch2-castle-12-ws.mgs:1185:3',
	},
	'ch2-castle-12-ws.mgs:1183:3': {
		messages: ['\u001b[33m\u001b[1mR A P H \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1183:3',
	},
	'ch2-castle-12-ws.mgs:1187:2': {
		messages: ['O Y '],
		name: 'ch2-castle-12-ws.mgs:1187:2',
	},
	'ch2-castle-12-ws.mgs:1191:3': {
		messages: ['S '],
		name: 'ch2-castle-12-ws.mgs:1191:3',
	},
	'ch2-castle-12-ws.mgs:1189:3': {
		messages: ['\u001b[33m\u001b[1mS \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1189:3',
	},
	'ch2-castle-12-ws.mgs:1196:3': {
		messages: ['U B W O O F E R '],
		name: 'ch2-castle-12-ws.mgs:1196:3',
	},
	'ch2-castle-12-ws.mgs:1194:3': {
		messages: ['\u001b[33m\u001b[1mU B W O O F E R \u001b[0m\u001b[31m'],
		name: 'ch2-castle-12-ws.mgs:1194:3',
	},
	'ch2-castle-12-ws.mgs:1198:2': {
		messages: ['C '],
		name: 'ch2-castle-12-ws.mgs:1198:2',
	},
	'ch2-castle-12-ws.mgs:1203:3': {
		messages: ['------'],
		name: 'ch2-castle-12-ws.mgs:1203:3',
	},
	'ch2-castle-12-ws.mgs:1201:3': {
		messages: ['rhythm'],
		name: 'ch2-castle-12-ws.mgs:1201:3',
	},
	'ch2-castle-12-ws.mgs:1205:2': {
		messages: ['    '],
		name: 'ch2-castle-12-ws.mgs:1205:2',
	},
	'ch2-castle-12-ws.mgs:1209:3': {
		messages: ['------'],
		name: 'ch2-castle-12-ws.mgs:1209:3',
	},
	'ch2-castle-12-ws.mgs:1207:3': {
		messages: ['stereo'],
		name: 'ch2-castle-12-ws.mgs:1207:3',
	},
	ch2_ws_input: {
		messages: [' '],
		text_options: {
			Q: 'ch2_ws_guess_quit',
			QUIT: 'ch2_ws_guess_quit',
			EXIT: 'ch2_ws_guess_quit',
			ALBUM: 'ch2_ws_guess_album',
			ANALOG: 'ch2_ws_guess_analog',
			AUDIO: 'ch2_ws_guess_audio',
			AUX: 'ch2_ws_guess_aux',
			BASS: 'ch2_ws_guess_bass',
			BEAT: 'ch2_ws_guess_beat',
			BPM: 'ch2_ws_guess_bpm',
			BROADCAST: 'ch2_ws_guess_broadcast',
			CASSETTE: 'ch2_ws_guess_cassette',
			CHIPTUNE: 'ch2_ws_guess_chiptune',
			CODEC: 'ch2_ws_guess_codec',
			COMPACT: 'ch2_ws_guess_compact',
			FREQUENCY: 'ch2_ws_guess_frequency',
			HEADPHONES: 'ch2_ws_guess_headphones',
			HIFI: 'ch2_ws_guess_hifi',
			LASER: 'ch2_ws_guess_laser',
			LOFI: 'ch2_ws_guess_lofi',
			MEDIA: 'ch2_ws_guess_media',
			MICROPHONE: 'ch2_ws_guess_microphone',
			MIDI: 'ch2_ws_guess_midi',
			MIXING: 'ch2_ws_guess_mixing',
			MUSIC: 'ch2_ws_guess_music',
			PHONOGRAPH: 'ch2_ws_guess_phonograph',
			RADIO: 'ch2_ws_guess_radio',
			RECORDING: 'ch2_ws_guess_recording',
			RHYTHM: 'ch2_ws_guess_rhythm',
			SEQUENCER: 'ch2_ws_guess_sequencer',
			SONG: 'ch2_ws_guess_song',
			SOUNDTRACK: 'ch2_ws_guess_soundtrack',
			SPEAKERS: 'ch2_ws_guess_speakers',
			STEREO: 'ch2_ws_guess_stereo',
			STREAM: 'ch2_ws_guess_stream',
			SUBWOOFER: 'ch2_ws_guess_subwoofer',
			SURROUND: 'ch2_ws_guess_surround',
			SYNTHESIZER: 'ch2_ws_guess_synthesizer',
			TAPE: 'ch2_ws_guess_tape',
			TREBLE: 'ch2_ws_guess_treble',
			VINYL: 'ch2_ws_guess_vinyl',
			VOCODER: 'ch2_ws_guess_vocoder',
			VOLUME: 'ch2_ws_guess_volume',
			ALBUMS: 'ch2_ws_guess_albums',
			BASE: 'ch2_ws_guess_base',
			BEATS: 'ch2_ws_guess_beats',
			BROADCASTS: 'ch2_ws_guess_broadcasts',
			CASSETTES: 'ch2_ws_guess_cassettes',
			CHIPTUNES: 'ch2_ws_guess_chiptunes',
			CODECS: 'ch2_ws_guess_codecs',
			FREQUENCIES: 'ch2_ws_guess_frequencies',
			GRAMOPHONE: 'ch2_ws_guess_gramophone',
			HEADPHONE: 'ch2_ws_guess_headphone',
			LASERS: 'ch2_ws_guess_lasers',
			MICROPHONES: 'ch2_ws_guess_microphones',
			PHONES: 'ch2_ws_guess_phones',
			PHONE: 'ch2_ws_guess_phone',
			MIC: 'ch2_ws_guess_mic',
			MUSICIAN: 'ch2_ws_guess_musician',
			RADIOS: 'ch2_ws_guess_radios',
			RECORDINGS: 'ch2_ws_guess_recordings',
			RECORD: 'ch2_ws_guess_record',
			SEQUENCE: 'ch2_ws_guess_sequence',
			SEQUENCERS: 'ch2_ws_guess_sequencers',
			SING: 'ch2_ws_guess_sing',
			SINGING: 'ch2_ws_guess_singing',
			SONGS: 'ch2_ws_guess_songs',
			SOUND: 'ch2_ws_guess_sound',
			SOUNDTRACKS: 'ch2_ws_guess_soundtracks',
			SYNTH: 'ch2_ws_guess_synth',
			SYNTHESIZERS: 'ch2_ws_guess_synthesizers',
			TRACK: 'ch2_ws_guess_track',
			TRACKS: 'ch2_ws_guess_tracks',
			SPEAKER: 'ch2_ws_guess_speaker',
			STEREOS: 'ch2_ws_guess_stereos',
			STREAMS: 'ch2_ws_guess_streams',
			SUBWOOFERS: 'ch2_ws_guess_subwoofers',
			TAPES: 'ch2_ws_guess_tapes',
			TUNE: 'ch2_ws_guess_tune',
			TUNES: 'ch2_ws_guess_tunes',
			VINYLS: 'ch2_ws_guess_vinyls',
			VOCODERS: 'ch2_ws_guess_vocoders',
			'GLITTERING PRIZES': 'ch2_ws_guess_cheat',
		},
		name: 'ch2_ws_input',
	},
	'ch2-castle-12-ws.mgs:2527:4': {
		messages: ['My head is all jumbled up. I can almost remember....'],
		name: 'ch2-castle-12-ws.mgs:2527:4',
	},
	'ch2-castle-12-ws.mgs:2519:4': {
		messages: ["You know? I think you've done it! Everything is clear to me now!"],
		name: 'ch2-castle-12-ws.mgs:2519:4',
	},
	'ch2-castle-12-ws.mgs:2523:4': {
		messages: ['Oh boy! What else is there inside my head?'],
		name: 'ch2-castle-12-ws.mgs:2523:4',
	},
	'ch2-castle-12-ws.mgs:1954:3': {
		messages: ["Whoa! Look who's a medieval man!"],
		name: 'ch2-castle-12-ws.mgs:1954:3',
	},
	'ch2-castle-12-ws.mgs:1958:3': {
		messages: ["Huh? I don't think I know that word."],
		name: 'ch2-castle-12-ws.mgs:1958:3',
	},
	'ch2-castle-12-ws.mgs:1962:3': {
		messages: ["ALBUMS? Love your enthusiasm, but I'm a single-slot kind of guy."],
		name: 'ch2-castle-12-ws.mgs:1962:3',
	},
	'ch2-castle-12-ws.mgs:1966:3': {
		messages: ['BASE? Hmmm. Is that how you spell that?'],
		name: 'ch2-castle-12-ws.mgs:1966:3',
	},
	'ch2-castle-12-ws.mgs:1970:3': {
		messages: ["BEATS? Almost, but not quite what I'm looking for."],
		name: 'ch2-castle-12-ws.mgs:1970:3',
	},
	'ch2-castle-12-ws.mgs:1974:3': {
		messages: ["BROADCASTS? Optimistic, but I don't know about that."],
		name: 'ch2-castle-12-ws.mgs:1974:3',
	},
	'ch2-castle-12-ws.mgs:1978:3': {
		messages: ['CASSETTES? As in multiple? What decade is this?'],
		name: 'ch2-castle-12-ws.mgs:1978:3',
	},
	'ch2-castle-12-ws.mgs:1982:3': {
		messages: ["CHIPTUNES? I think you're a smidge off, but keep trying."],
		name: 'ch2-castle-12-ws.mgs:1982:3',
	},
	'ch2-castle-12-ws.mgs:1986:3': {
		messages: ["CODECS? I think you're nearly there, but not quite."],
		name: 'ch2-castle-12-ws.mgs:1986:3',
	},
	'ch2-castle-12-ws.mgs:1990:3': {
		messages: ["FREQUENCIES? Almost, but not what I'm thinking of."],
		name: 'ch2-castle-12-ws.mgs:1990:3',
	},
	'ch2-castle-12-ws.mgs:1994:3': {
		messages: ['GRAMOPHONE? Are you just making things up now?'],
		name: 'ch2-castle-12-ws.mgs:1994:3',
	},
	'ch2-castle-12-ws.mgs:1998:3': {
		messages: ["HEADPHONE? Is that like a 'scissor'? Or a 'pant'?"],
		name: 'ch2-castle-12-ws.mgs:1998:3',
	},
	'ch2-castle-12-ws.mgs:2002:3': {
		messages: ['LASERS? Almost, but not quite. Sounds fun though!'],
		name: 'ch2-castle-12-ws.mgs:2002:3',
	},
	'ch2-castle-12-ws.mgs:2006:3': {
		messages: ['MICROPHONES? Do I look like I need more than one?'],
		name: 'ch2-castle-12-ws.mgs:2006:3',
	},
	'ch2-castle-12-ws.mgs:2010:3': {
		messages: ['PHONES? Close, but way off.'],
		name: 'ch2-castle-12-ws.mgs:2010:3',
	},
	'ch2-castle-12-ws.mgs:2014:3': {
		messages: ['PHONE? Getting close to something, I can feel it.'],
		name: 'ch2-castle-12-ws.mgs:2014:3',
	},
	'ch2-castle-12-ws.mgs:2018:3': {
		messages: ["MIC? No, but I think that's almost something."],
		name: 'ch2-castle-12-ws.mgs:2018:3',
	},
	'ch2-castle-12-ws.mgs:2022:3': {
		messages: ["MUSICIAN? A bit overboard, but you're on to something."],
		name: 'ch2-castle-12-ws.mgs:2022:3',
	},
	'ch2-castle-12-ws.mgs:2026:3': {
		messages: ["RADIOS? Sorry, there's only one of me here."],
		name: 'ch2-castle-12-ws.mgs:2026:3',
	},
	'ch2-castle-12-ws.mgs:2030:3': {
		messages: ["RECORDINGS? Close, but I think you're going a bit overboard."],
		name: 'ch2-castle-12-ws.mgs:2030:3',
	},
	'ch2-castle-12-ws.mgs:2034:3': {
		messages: ['RECORD? Aha, yes! Oh, no, wait. Not this time. Close though.'],
		name: 'ch2-castle-12-ws.mgs:2034:3',
	},
	'ch2-castle-12-ws.mgs:2038:3': {
		messages: ["SEQUENCE? You're getting somewhere, but no dice this time."],
		name: 'ch2-castle-12-ws.mgs:2038:3',
	},
	'ch2-castle-12-ws.mgs:2042:3': {
		messages: ['SEQUENCERS? Were that I was that cool! Maybe scale that back.'],
		name: 'ch2-castle-12-ws.mgs:2042:3',
	},
	'ch2-castle-12-ws.mgs:2046:3': {
		messages: ["SING? I feel like that's close, but I don't know."],
		name: 'ch2-castle-12-ws.mgs:2046:3',
	},
	'ch2-castle-12-ws.mgs:2050:3': {
		messages: ["SINGING? I mean sure, but... no, that's not what I'm missing."],
		name: 'ch2-castle-12-ws.mgs:2050:3',
	},
	'ch2-castle-12-ws.mgs:2054:3': {
		messages: ['SONGS? Almost! Not exactly though.'],
		name: 'ch2-castle-12-ws.mgs:2054:3',
	},
	'ch2-castle-12-ws.mgs:2058:3': {
		messages: ["SOUND? I mean sure, but... no, not what I'm looking for."],
		name: 'ch2-castle-12-ws.mgs:2058:3',
	},
	'ch2-castle-12-ws.mgs:2062:3': {
		messages: ["SOUNDTRACKS? Enthusiastic, aren't you! Not quite, though."],
		name: 'ch2-castle-12-ws.mgs:2062:3',
	},
	'ch2-castle-12-ws.mgs:2066:3': {
		messages: ['SYNTH? Getting there, but I think you can go bigger!'],
		name: 'ch2-castle-12-ws.mgs:2066:3',
	},
	'ch2-castle-12-ws.mgs:2070:3': {
		messages: ['SYNTHESIZERS? Almost there, but maybe a little different.'],
		name: 'ch2-castle-12-ws.mgs:2070:3',
	},
	'ch2-castle-12-ws.mgs:2074:3': {
		messages: ["TRACK? Was it more than that? It's on the tip of my silicon."],
		name: 'ch2-castle-12-ws.mgs:2074:3',
	},
	'ch2-castle-12-ws.mgs:2078:3': {
		messages: ["TRACKS? No, but I think that's close."],
		name: 'ch2-castle-12-ws.mgs:2078:3',
	},
	'ch2-castle-12-ws.mgs:2082:3': {
		messages: ["SPEAKER? Hey, I'm more sophisticated than that! Go bigger!"],
		name: 'ch2-castle-12-ws.mgs:2082:3',
	},
	'ch2-castle-12-ws.mgs:2086:3': {
		messages: ['STEREOS? Can you use the word like that? Was it something similar?'],
		name: 'ch2-castle-12-ws.mgs:2086:3',
	},
	'ch2-castle-12-ws.mgs:2090:3': {
		messages: ["STREAMS? I'm loving the river vibe, but not exactly right."],
		name: 'ch2-castle-12-ws.mgs:2090:3',
	},
	'ch2-castle-12-ws.mgs:2094:3': {
		messages: ['SUBWOOFERS? I hardly know her!'],
		name: 'ch2-castle-12-ws.mgs:2094:3',
	},
	'ch2-castle-12-ws.mgs:2098:3': {
		messages: ['TAPES? So close, but a little too much.'],
		name: 'ch2-castle-12-ws.mgs:2098:3',
	},
	'ch2-castle-12-ws.mgs:2102:3': {
		messages: ["TUNE? Hmmm... almost, but not quite. Maybe it's something more."],
		name: 'ch2-castle-12-ws.mgs:2102:3',
	},
	'ch2-castle-12-ws.mgs:2106:3': {
		messages: ['TUNES? Hmmm, maybe something else, something similar.'],
		name: 'ch2-castle-12-ws.mgs:2106:3',
	},
	'ch2-castle-12-ws.mgs:2110:3': {
		messages: ["VINYLS? No, I don't know if that's quite how that goes."],
		name: 'ch2-castle-12-ws.mgs:2110:3',
	},
	'ch2-castle-12-ws.mgs:2114:3': {
		messages: ["VOCODERS? Technically, yes, but not what I'm looking for this time."],
		name: 'ch2-castle-12-ws.mgs:2114:3',
	},
	'ch2-castle-12-ws.mgs:2123:4': {
		messages: ['\u001b[33mALBUM\u001b[0m! Oh, of course! This is my bread and butter!'],
		name: 'ch2-castle-12-ws.mgs:2123:4',
	},
	'ch2-castle-12-ws.mgs:2119:4': {
		messages: ["ALBUM? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2119:4',
	},
	'ch2-castle-12-ws.mgs:2133:4': {
		messages: ['\u001b[33mANALOG\u001b[0m! Yeah! Who could forget that warm, velvety sound?'],
		name: 'ch2-castle-12-ws.mgs:2133:4',
	},
	'ch2-castle-12-ws.mgs:2129:4': {
		messages: ["ANALOG? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2129:4',
	},
	'ch2-castle-12-ws.mgs:2143:4': {
		messages: ["\u001b[33mAUDIO\u001b[0m! That's right! My raison d'etre! My joie de vivre!"],
		name: 'ch2-castle-12-ws.mgs:2143:4',
	},
	'ch2-castle-12-ws.mgs:2139:4': {
		messages: ["AUDIO? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2139:4',
	},
	'ch2-castle-12-ws.mgs:2153:4': {
		messages: ['\u001b[33mAUX\u001b[0m! How could I forget? Who would ever want to lose this?'],
		name: 'ch2-castle-12-ws.mgs:2153:4',
	},
	'ch2-castle-12-ws.mgs:2149:4': {
		messages: ["AUX? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2149:4',
	},
	'ch2-castle-12-ws.mgs:2163:4': {
		messages: [
			"\u001b[33mBASS\u001b[0m! Oh, yeah! I'm all about that low frequency! It's the butter zone!",
		],
		name: 'ch2-castle-12-ws.mgs:2163:4',
	},
	'ch2-castle-12-ws.mgs:2159:4': {
		messages: ["BASS? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2159:4',
	},
	'ch2-castle-12-ws.mgs:2173:4': {
		messages: ["\u001b[33mBEAT\u001b[0m! It's all coming back! Makes my LEDs all tingly."],
		name: 'ch2-castle-12-ws.mgs:2173:4',
	},
	'ch2-castle-12-ws.mgs:2169:4': {
		messages: ["BEAT? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2169:4',
	},
	'ch2-castle-12-ws.mgs:2183:4': {
		messages: ['\u001b[33mBPM\u001b[0m! Oh, yeah! Reminds me of my buddy, Metronome!'],
		name: 'ch2-castle-12-ws.mgs:2183:4',
	},
	'ch2-castle-12-ws.mgs:2179:4': {
		messages: ["BPM? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2179:4',
	},
	'ch2-castle-12-ws.mgs:2193:4': {
		messages: [
			'\u001b[33mBROADCAST\u001b[0m! Oh, yeah! Reminds me of those aluminum flags I used to wear.',
		],
		name: 'ch2-castle-12-ws.mgs:2193:4',
	},
	'ch2-castle-12-ws.mgs:2189:4': {
		messages: ["BROADCAST? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2189:4',
	},
	'ch2-castle-12-ws.mgs:2203:4': {
		messages: [
			"\u001b[33mCASSETTE\u001b[0m! Oh, I remember those! They're so cute and spindly!",
		],
		name: 'ch2-castle-12-ws.mgs:2203:4',
	},
	'ch2-castle-12-ws.mgs:2199:4': {
		messages: ["CASSETTE? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2199:4',
	},
	'ch2-castle-12-ws.mgs:2213:4': {
		messages: ['\u001b[33mCHIPTUNE\u001b[0m! Oh, right! So sine wavey and squarey....'],
		name: 'ch2-castle-12-ws.mgs:2213:4',
	},
	'ch2-castle-12-ws.mgs:2209:4': {
		messages: ["CHIPTUNE? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2209:4',
	},
	'ch2-castle-12-ws.mgs:2223:4': {
		messages: ["\u001b[33mCODEC\u001b[0m! Oh, that's right, I think I know a few of these."],
		name: 'ch2-castle-12-ws.mgs:2223:4',
	},
	'ch2-castle-12-ws.mgs:2219:4': {
		messages: ["CODEC? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2219:4',
	},
	'ch2-castle-12-ws.mgs:2233:4': {
		messages: [
			'\u001b[33mCOMPACT\u001b[0m! Ha! Compact discs? More like--yeah, no, I got nothing.',
		],
		name: 'ch2-castle-12-ws.mgs:2233:4',
	},
	'ch2-castle-12-ws.mgs:2229:4': {
		messages: ["COMPACT? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2229:4',
	},
	'ch2-castle-12-ws.mgs:2243:4': {
		messages: [
			"\u001b[33mFREQUENCY\u001b[0m! That's the best! Dial it in, find the sweet spot....",
		],
		name: 'ch2-castle-12-ws.mgs:2243:4',
	},
	'ch2-castle-12-ws.mgs:2239:4': {
		messages: ["FREQUENCY? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2239:4',
	},
	'ch2-castle-12-ws.mgs:2253:4': {
		messages: [
			"\u001b[33mHEADPHONES\u001b[0m! Yeah, I remember these! Let's get tinitus together!",
		],
		name: 'ch2-castle-12-ws.mgs:2253:4',
	},
	'ch2-castle-12-ws.mgs:2249:4': {
		messages: ["HEADPHONES? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2249:4',
	},
	'ch2-castle-12-ws.mgs:2263:4': {
		messages: [
			'\u001b[33mHIFI\u001b[0m! Who could forget? My audio standards are through the ROOF!',
		],
		name: 'ch2-castle-12-ws.mgs:2263:4',
	},
	'ch2-castle-12-ws.mgs:2259:4': {
		messages: ["HIFI? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2259:4',
	},
	'ch2-castle-12-ws.mgs:2273:4': {
		messages: [
			"\u001b[33mLASER\u001b[0m! Ahaha, that's right! It's all about the 1s and 0s, isn't it?",
		],
		name: 'ch2-castle-12-ws.mgs:2273:4',
	},
	'ch2-castle-12-ws.mgs:2269:4': {
		messages: ["LASER? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2269:4',
	},
	'ch2-castle-12-ws.mgs:2283:4': {
		messages: ["\u001b[33mLOFI\u001b[0m! Oh, so nostalgic! Oh... I'm tearing up."],
		name: 'ch2-castle-12-ws.mgs:2283:4',
	},
	'ch2-castle-12-ws.mgs:2279:4': {
		messages: ["LOFI? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2279:4',
	},
	'ch2-castle-12-ws.mgs:2293:4': {
		messages: [
			"\u001b[33mMEDIA\u001b[0m! Oh, that's right! Anything you can throw at me, I can take!",
		],
		name: 'ch2-castle-12-ws.mgs:2293:4',
	},
	'ch2-castle-12-ws.mgs:2289:4': {
		messages: ["MEDIA? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2289:4',
	},
	'ch2-castle-12-ws.mgs:2303:4': {
		messages: [
			'\u001b[33mMICROPHONE\u001b[0m! Oh yeah! I used to host karaoke parties all the time!',
		],
		name: 'ch2-castle-12-ws.mgs:2303:4',
	},
	'ch2-castle-12-ws.mgs:2299:4': {
		messages: ["MICROPHONE? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2299:4',
	},
	'ch2-castle-12-ws.mgs:2313:4': {
		messages: [
			"\u001b[33mMIDI\u001b[0m! WOW, that's right! Who has a classy sound font? This guy!",
		],
		name: 'ch2-castle-12-ws.mgs:2313:4',
	},
	'ch2-castle-12-ws.mgs:2309:4': {
		messages: ["MIDI? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2309:4',
	},
	'ch2-castle-12-ws.mgs:2323:4': {
		messages: ["\u001b[33mMIXING\u001b[0m! Aha, so that's what my second tape deck was for!"],
		name: 'ch2-castle-12-ws.mgs:2323:4',
	},
	'ch2-castle-12-ws.mgs:2319:4': {
		messages: ["MIXING? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2319:4',
	},
	'ch2-castle-12-ws.mgs:2333:4': {
		messages: [
			'\u001b[33mMUSIC\u001b[0m! Oh, yes! I remember! This is the best part about all of this!',
		],
		name: 'ch2-castle-12-ws.mgs:2333:4',
	},
	'ch2-castle-12-ws.mgs:2329:4': {
		messages: ["MUSIC? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2329:4',
	},
	'ch2-castle-12-ws.mgs:2343:4': {
		messages: [
			"\u001b[33mPHONOGRAPH\u001b[0m! Oh, that's right, my great-grandpa! That takes me back.",
		],
		name: 'ch2-castle-12-ws.mgs:2343:4',
	},
	'ch2-castle-12-ws.mgs:2339:4': {
		messages: ["PHONOGRAPH? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2339:4',
	},
	'ch2-castle-12-ws.mgs:2353:4': {
		messages: [
			"\u001b[33mRADIO\u001b[0m! Yeah, let's take a caller! Let's go to a commercial!",
		],
		name: 'ch2-castle-12-ws.mgs:2353:4',
	},
	'ch2-castle-12-ws.mgs:2349:4': {
		messages: ["RADIO? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2349:4',
	},
	'ch2-castle-12-ws.mgs:2363:4': {
		messages: [
			"\u001b[33mRECORDING\u001b[0m! Yes! This is the best part! It's like having a time machine!",
		],
		name: 'ch2-castle-12-ws.mgs:2363:4',
	},
	'ch2-castle-12-ws.mgs:2359:4': {
		messages: ["RECORDING? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2359:4',
	},
	'ch2-castle-12-ws.mgs:2373:4': {
		messages: [
			"\u001b[33mRHYTHM\u001b[0m! Yeah! You've hit the nail on the head! That's why we're here!",
		],
		name: 'ch2-castle-12-ws.mgs:2373:4',
	},
	'ch2-castle-12-ws.mgs:2369:4': {
		messages: ["RHYTHM? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2369:4',
	},
	'ch2-castle-12-ws.mgs:2383:4': {
		messages: [
			'\u001b[33mSEQUENCER\u001b[0m! Oh yeah! I always wanted to be one of these when I grew up.',
		],
		name: 'ch2-castle-12-ws.mgs:2383:4',
	},
	'ch2-castle-12-ws.mgs:2379:4': {
		messages: ["SEQUENCER? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2379:4',
	},
	'ch2-castle-12-ws.mgs:2393:4': {
		messages: [
			'\u001b[33mSONG\u001b[0m! Oh, yes! These are like stories, or like memories! I remember....',
		],
		name: 'ch2-castle-12-ws.mgs:2393:4',
	},
	'ch2-castle-12-ws.mgs:2389:4': {
		messages: ["SONG? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2389:4',
	},
	'ch2-castle-12-ws.mgs:2403:4': {
		messages: ["\u001b[33mSOUNDTRACK\u001b[0m! Aha! Wonderful. I'm remembering...."],
		name: 'ch2-castle-12-ws.mgs:2403:4',
	},
	'ch2-castle-12-ws.mgs:2399:4': {
		messages: ["SOUNDTRACK? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2399:4',
	},
	'ch2-castle-12-ws.mgs:2413:4': {
		messages: ['\u001b[33mSPEAKERS\u001b[0m! Oh, yeah! Without these, music would be DEAD.'],
		name: 'ch2-castle-12-ws.mgs:2413:4',
	},
	'ch2-castle-12-ws.mgs:2409:4': {
		messages: ["SPEAKERS? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2409:4',
	},
	'ch2-castle-12-ws.mgs:2423:4': {
		messages: [
			'\u001b[33mSTEREO\u001b[0m! Ooh ooh! Yeah, I control the horizontal... of a sort.',
		],
		name: 'ch2-castle-12-ws.mgs:2423:4',
	},
	'ch2-castle-12-ws.mgs:2419:4': {
		messages: ["STEREO? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2419:4',
	},
	'ch2-castle-12-ws.mgs:2433:4': {
		messages: ["\u001b[33mSTREAM\u001b[0m! Oh, yeah! Buffer 'til the cows come home!"],
		name: 'ch2-castle-12-ws.mgs:2433:4',
	},
	'ch2-castle-12-ws.mgs:2429:4': {
		messages: ["STREAM? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2429:4',
	},
	'ch2-castle-12-ws.mgs:2443:4': {
		messages: ["\u001b[33mSUBWOOFER\u001b[0m! Oh, that's right! Let's rattle some windows!"],
		name: 'ch2-castle-12-ws.mgs:2443:4',
	},
	'ch2-castle-12-ws.mgs:2439:4': {
		messages: ["SUBWOOFER? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2439:4',
	},
	'ch2-castle-12-ws.mgs:2453:4': {
		messages: [
			'\u001b[33mSURROUND\u001b[0m! I remember filling the world with sound from all around!',
		],
		name: 'ch2-castle-12-ws.mgs:2453:4',
	},
	'ch2-castle-12-ws.mgs:2449:4': {
		messages: ["SURROUND? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2449:4',
	},
	'ch2-castle-12-ws.mgs:2463:4': {
		messages: [
			'\u001b[33mSYNTHESIZER\u001b[0m! Oh! I had a job in college where I worked as one of these.',
		],
		name: 'ch2-castle-12-ws.mgs:2463:4',
	},
	'ch2-castle-12-ws.mgs:2459:4': {
		messages: ["SYNTHESIZER? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2459:4',
	},
	'ch2-castle-12-ws.mgs:2473:4': {
		messages: [
			'\u001b[33mTAPE\u001b[0m! Aha, I remember... those things give me indigestion! Yuck!',
		],
		name: 'ch2-castle-12-ws.mgs:2473:4',
	},
	'ch2-castle-12-ws.mgs:2469:4': {
		messages: ["TAPE? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2469:4',
	},
	'ch2-castle-12-ws.mgs:2483:4': {
		messages: ['\u001b[33mTREBLE\u001b[0m! Of course! Sends shivers down my copper wiring!'],
		name: 'ch2-castle-12-ws.mgs:2483:4',
	},
	'ch2-castle-12-ws.mgs:2479:4': {
		messages: ["TREBLE? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2479:4',
	},
	'ch2-castle-12-ws.mgs:2493:4': {
		messages: [
			'\u001b[33mVINYL\u001b[0m! Oh! What a nostalgic thought! Reminds me of old grandpappy....',
		],
		name: 'ch2-castle-12-ws.mgs:2493:4',
	},
	'ch2-castle-12-ws.mgs:2489:4': {
		messages: ["VINYL? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2489:4',
	},
	'ch2-castle-12-ws.mgs:2503:4': {
		messages: ['\u001b[33mVOCODER\u001b[0m! Oh, yeah! I remembered how to do a Dalek voice!'],
		name: 'ch2-castle-12-ws.mgs:2503:4',
	},
	'ch2-castle-12-ws.mgs:2499:4': {
		messages: ["VOCODER? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2499:4',
	},
	'ch2-castle-12-ws.mgs:2513:4': {
		messages: ['\u001b[33mVOLUME\u001b[0m! Aha, I remember this! And why stop at 11?'],
		name: 'ch2-castle-12-ws.mgs:2513:4',
	},
	'ch2-castle-12-ws.mgs:2509:4': {
		messages: ["VOLUME? Oh, but you've found that one already."],
		name: 'ch2-castle-12-ws.mgs:2509:4',
	},
	'ch2-castle-12.mgs:12:2': {
		messages: ['You looked around the \u001b[36mCASTLE HALLWAY BACK\u001b[0m.'],
		name: 'ch2-castle-12.mgs:12:2',
	},
	'ch2-castle-12.mgs:21:3': {
		messages: [
			"    Cleared of debris, the hall is much larger than it\nappeared when you first arrived. Without the monitor and\nit's welcoming slideshow, however, the room feels quite a\nbit emptier as well.",
			' ',
		],
		name: 'ch2-castle-12.mgs:21:3',
	},
	'ch2-castle-12.mgs:16:3': {
		messages: [
			"    The air is a little stuffier here than it had been\nnearer the entrance. Perhaps more was destroyed in this\nroom, more dust scattered and more moisture entrapped, or\nperhaps it's a sign that you've come deeper into the castle.",
			' ',
		],
		name: 'ch2-castle-12.mgs:16:3',
	},
	'ch2-castle-12.mgs:30:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    The man is professionalism itself, from his well-fitten\nsuit and his professional body language -- apart from the\nexpression on his face, which is incongruously aggressive.\nYou think you can make out the sound of growling.',
		],
		name: 'ch2-castle-12.mgs:30:2',
	},
	'ch2-castle-12.mgs:38:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    It's a massive volume open to a page filled with names\nin eclectic handwriting. An elegant gold bookmark, attached\nto the book at the top of the spine, is draped across the\nopposite page.",
		],
		name: 'ch2-castle-12.mgs:38:2',
	},
	'ch2-castle-12.mgs:46:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    This machine is massive by modern standards, large\nenough to house four CDs in the CD changer up top and two\ncassette decks side-by-side the front face. It's thoroughly\nwired into the wall.",
		],
		name: 'ch2-castle-12.mgs:46:2',
	},
	'ch2-castle-12.mgs:59:2': {
		messages: ['Entering \u001b[1mCASTLE HALLWAY BACK\u001b[0m...'],
		name: 'ch2-castle-12.mgs:59:2',
	},
	'ch2-castle-12.mgs:80:3': {
		messages: ['Entering \u001b[1mCASTLE HALLWAY BACK\u001b[0m...'],
		name: 'ch2-castle-12.mgs:80:3',
	},
	'ch2-castle-12.mgs:77:3': {
		messages: [
			'Discovered \u001b[1m\u001b[36mCASTLE HALLWAY BACK\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-12.mgs:77:3',
	},
	ch2_ws_rowstart: {
		messages: ['\u001b[31m'],
		name: 'ch2_ws_rowstart',
	},
	ch2_ws_col: {
		messages: ['\u001b[0m   '],
		name: 'ch2_ws_col',
	},
	'ch2-castle-12.mgs:340:2': {
		messages: [
			'                          \u001b[1mWORD SEARCH!\u001b[0m',
			'Find words meaningful to the stereo system to cut through its amnesia.',
			'         Type a word! (or type Q to quit)            \u001b[33mPts to win: $ch2_ws_flags_tally$/20\u001b[0m',
		],
		name: 'ch2-castle-12.mgs:340:2',
	},
	'ch2-castle-12.mgs:385:3': {
		messages: [
			"\u001b[33mSTEREO\u001b[0m: Oh! Oh! Oh! Goodness! I think you've done it! I\n\u001b[1mremember!\u001b[0m I'm a \u001b[1m\u001b[33mSTEREO SYSTEM\u001b[0m! Hey, check this out! There's\nmusic inside me! LET'S GOOOOO!",
			' ',
		],
		options: [
			{
				label: 'Good for you!',
				script: 'ch2_ws_cutscene',
			},
		],
		name: 'ch2-castle-12.mgs:385:3',
	},
	'ch2-castle-12.mgs:362:3': {
		messages: ['\u001b[33mSTEREO\u001b[0m: All done for now? Well, thanks for taking a look.'],
		name: 'ch2-castle-12.mgs:362:3',
	},
	'ch2-castle-12.mgs:373:4': {
		messages: [
			'\u001b[33mSTEREO\u001b[0m: Done for now? Okay, thanks for trying.',
			"    Oh, you know what? I bet if you found \u001b[33m$diff$\u001b[0m more words,\nI'd be as right as rain. Try again later, if you would?",
		],
		name: 'ch2-castle-12.mgs:373:4',
	},
	'ch2-castle-12.mgs:369:4': {
		messages: [
			'\u001b[33mSTEREO\u001b[0m: Oh oh oh, so close! I bet I only need \u001b[33mone more\u001b[0m word\nbefore everything comes together! Try again soon, would ya?',
		],
		name: 'ch2-castle-12.mgs:369:4',
	},
	'ch2-castle-12.mgs:379:3': {
		messages: [
			'\u001b[33mSTEREO\u001b[0m: Hey! Thanks for helping me remember who I am! Good\nluck out there!',
		],
		name: 'ch2-castle-12.mgs:379:3',
	},
	'ch2-castle-12.mgs:425:2': {
		messages: [
			'\u001b[33mSTEREO\u001b[0m: Huh? Is there someone there? I-I think I hear a\nvoice!',
			' ',
		],
		options: [
			{
				label: 'Hello.',
				script: 'ch2_stereo_intro2a',
			},
			{
				label: 'Howdy.',
				script: 'ch2_stereo_intro2b',
			},
			{
				label: 'Ahoy.',
				script: 'ch2_stereo_intro2c',
			},
		],
		name: 'ch2-castle-12.mgs:425:2',
	},
	'ch2-castle-12.mgs:436:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Hello. Are you okay?'],
		name: 'ch2-castle-12.mgs:436:2',
	},
	'ch2-castle-12.mgs:441:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Howdy. Are you okay?'],
		name: 'ch2-castle-12.mgs:441:2',
	},
	'ch2-castle-12.mgs:446:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Ahoy. Are you okay?'],
		name: 'ch2-castle-12.mgs:446:2',
	},
	'ch2-castle-12.mgs:451:2': {
		messages: [
			' ',
			"\u001b[33mSTEREO\u001b[0m: Sure! Um, maybe? I can't remember. I think I might\nbe hurt. Last thing I remember was some shaking, then a\nthud. But I can't remember who I am or what I'm doing here.\nOther than that, I'm doing great.",
			' ',
		],
		options: [
			{
				label: 'You have amnesia?',
				script: 'ch2_stereo_intro3',
			},
		],
		name: 'ch2-castle-12.mgs:451:2',
	},
	'ch2-castle-12.mgs:460:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: You have amnesia?',
			' ',
			"\u001b[33mSTEREO\u001b[0m: I don't know. Would I remember if I had amnesia?",
			' ',
		],
		options: [
			{
				label: "You're a stereo system. You're supposed to play music.",
				script: 'ch2_stereo_intro4',
			},
		],
		name: 'ch2-castle-12.mgs:460:2',
	},
	'ch2-castle-12.mgs:470:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: You're a stereo system. You're supposed to play music.",
			' ',
			"\u001b[33mSTEREO\u001b[0m: I don't know what that stuff is. My mind is all\njumbled up. Let's see... can you get any closer? I'm on the\ncusp of understanding what you're talking about, but I need\na little help.",
			' ',
		],
		options: [
			{
				label: 'Help like what?',
				script: 'ch2_stereo_intro5',
			},
		],
		name: 'ch2-castle-12.mgs:470:2',
	},
	'ch2-castle-12.mgs:481:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Help like what?',
			' ',
			"\u001b[33mSTEREO\u001b[0m: Can you dig through my mind and help me find the\nright words? The words I need to remember? They're all mixed\nup, top to down, left to right... and maybe diagonal.",
			"    Here. I'll just show you:",
			' ',
		],
		options: [
			{
				label: '(Get closer)',
				script: 'ch2_ws_doturn',
			},
		],
		name: 'ch2-castle-12.mgs:481:2',
	},
	'ch2-castle-13.mgs:15:2': {
		messages: [
			'You looked around the \u001b[36mCASTLE THRONE ROOM\u001b[0m.',
			'    Tall, imposing statues line the walls, regal and bovine.\nBanners bearing the castle crest hang beside them. The\nfloors gleam in the torchlight. The whole place is fancy\nenough that it makes you feel like you should stand a little\nstraighter.',
			' ',
		],
		name: 'ch2-castle-13.mgs:15:2',
	},
	'ch2-castle-13.mgs:24:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    You're not sure whether his glowing green eyes are\nevidence of powerful magic or whether this is typical for\nhis species. You keep your distance, determined not to learn\nfirsthand.",
			'    The lizard wizard is frowning at you -- you think.',
		],
		name: 'ch2-castle-13.mgs:24:2',
	},
	'ch2-castle-13.mgs:33:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    You're not sure what aspect of his gelatinous body might\nbe his face -- if he even has one. His jiggling seems more\nborn from nervousness than aggression, at least.",
		],
		name: 'ch2-castle-13.mgs:33:2',
	},
	'ch2-castle-13.mgs:46:2': {
		messages: ['Entering \u001b[1mCASTLE THRONE ROOM\u001b[0m...'],
		name: 'ch2-castle-13.mgs:46:2',
	},
	'ch2-castle-13.mgs:71:3': {
		messages: ['Entering \u001b[1mCASTLE THRONE ROOM\u001b[0m...'],
		name: 'ch2-castle-13.mgs:71:3',
	},
	'ch2-castle-13.mgs:68:3': {
		messages: [
			'Discovered \u001b[1m\u001b[36mCASTLE THRONE ROOM\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-13.mgs:68:3',
	},
	'ch2-castle-13.mgs:154:3': {
		messages: [' ', '\u001b[33mDEBUG>\u001b[0m \u001b[36mSKIP\u001b[0m: skip this cutscene'],
		name: 'ch2-castle-13.mgs:154:3',
	},
	'ch2-castle-14.mgs:9:2': {
		messages: [
			"You looked around \u001b[36mKING GIBSON'S BEDROOM\u001b[0m.",
			"    Opulent and pretentious -- perhaps the archetypal royal\nbedroom. You're not sure whether the heirloom four poster\nbed completes the look or is just over the top. But you\nconcede that the red and gold looks fabulous together.",
			' ',
		],
		name: 'ch2-castle-14.mgs:9:2',
	},
	'ch2-castle-14.mgs:18:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    His bearing is not as imposing as his physique, but\nperhaps he was simply shaken by the earthquake and his\nsubsequent isolation. His horns are shiny, as if they were\noiled or waxed.',
		],
		name: 'ch2-castle-14.mgs:18:2',
	},
	'ch2-castle-14.mgs:26:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    It\'s a small boxy number pad. On the underside is a plug\nsocket and a scribbled message: "The default admin password\ncan be found throughout the castle\'s --"',
			'    Unfortunately, the vital portion of the message has worn\noff with time.',
		],
		name: 'ch2-castle-14.mgs:26:2',
	},
	'ch2-castle-14.mgs:62:3': {
		messages: ["Entering \u001b[1mKING GIBSON'S BEDROOM\u001b[0m..."],
		name: 'ch2-castle-14.mgs:62:3',
	},
	'ch2-castle-14.mgs:59:3': {
		messages: [
			"Discovered \u001b[1m\u001b[36mKING GIBSON'S BEDROOM\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!",
		],
		name: 'ch2-castle-14.mgs:59:3',
	},
	'ch2-castle-14.mgs:301:2': {
		messages: [
			'\u001b[31mUSER CONFIG CORRUPTED!\u001b[0m Cannot unlock door with PINs! Perform\nmanual unlocks with admin password.',
			'Enter password:',
		],
		text_options: {
			AUTHENTICATE: 'interact_ch2_keypad_good_pass',
		},
		name: 'ch2-castle-14.mgs:301:2',
	},
	'ch2-castle-14.mgs:310:2': {
		messages: ['\u001b[31mPassword incorrect!\u001b[0m', 'Touch keypad to try again.'],
		name: 'ch2-castle-14.mgs:310:2',
	},
	'ch2-castle-14.mgs:318:2': {
		messages: ['\u001b[32mDOOR UNLOCKED\u001b[0m'],
		name: 'ch2-castle-14.mgs:318:2',
	},
	'ch2-castle-21.mgs:11:2': {
		messages: [
			'You looked around the \u001b[36mWORKSHOP\u001b[0m.',
			'    The scents of solder and ozone fill the room. While\nthere are less chairs than workstations, scratches on the\nfloor show signs of people enthusiastically skating between\ndesks.',
			' ',
		],
		name: 'ch2-castle-21.mgs:11:2',
	},
	'ch2-castle-21.mgs:20:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    A plain white goose reminiscent of one -- or several --\nyou've seen before. You wonder whether the red bow is some\nattempt at a disguise, and whether you have actually met\nthis goose before.",
		],
		name: 'ch2-castle-21.mgs:20:2',
	},
	'ch2-castle-21.mgs:28:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    A solemn cockatiel, if ever there was one. His crest\nlifts slightly once in a while.',
		],
		name: 'ch2-castle-21.mgs:28:2',
	},
	'ch2-castle-21.mgs:36:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    Frankie's fingers are flying furiously across the\nkeyboard. The text on the screen is far too small for you to\nread clearly, but the words are colored in an interesting\npattern.",
		],
		name: 'ch2-castle-21.mgs:36:2',
	},
	'ch2-castle-21.mgs:44:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    Bizarrely out of place is this golden, flakey pastry\nwith its glistening ruby filling. Though not steaming hot,\nor even warm, it's still fresh enough to eat.",
		],
		name: 'ch2-castle-21.mgs:44:2',
	},
	'ch2-castle-21.mgs:51:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    The colored spools on the left of the device are\ncounterparts to the one currently attached, as if the line\nof yellow plastic might be swapped out with any of the other\ncolors.',
		],
		name: 'ch2-castle-21.mgs:51:2',
	},
	'ch2-castle-21.mgs:58:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    Their yellow plastic seems to match that from the spool\nattached to the nearby device. In fact, the figurines\nthemselves seem to have been built up by lines of the stuff.',
		],
		name: 'ch2-castle-21.mgs:58:2',
	},
	'ch2-castle-21.mgs:65:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    Inside is a mishmash of cables, most of which are worn.\nThey're all tangled to the point that any one cable might be\nnear impossible to extract on its own.",
		],
		name: 'ch2-castle-21.mgs:65:2',
	},
	'ch2-castle-21.mgs:73:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    The metal pens evoke a mild industrial hazard. It seems\nthe kind of thing that might hurt you if you don't know what\nyou're doing.",
		],
		name: 'ch2-castle-21.mgs:73:2',
	},
	'ch2-castle-21.mgs:86:2': {
		messages: ['Entering \u001b[1mWORKSHOP\u001b[0m...'],
		name: 'ch2-castle-21.mgs:86:2',
	},
	'ch2-castle-21.mgs:105:3': {
		messages: ['Entering \u001b[1mWORKSHOP\u001b[0m...'],
		name: 'ch2-castle-21.mgs:105:3',
	},
	'ch2-castle-21.mgs:102:3': {
		messages: [
			'Discovered \u001b[1m\u001b[36mWORKSHOP\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-21.mgs:102:3',
	},
	'ch2-castle-21.mgs:485:3': {
		messages: [
			"\u001b[31mDEBUG>\u001b[0m: Something went wrong splitting into entity wrapup\nscripts after shared behavior in\n'interact_ch2_room21_split'! 'CALLBACK' value: $CALLBACK$",
		],
		name: 'ch2-castle-21.mgs:485:3',
	},
	'ch2-castle-22.mgs:5:2': {
		messages: [
			'You looked around the \u001b[36mSERVER ROOM\u001b[0m.',
			'    Racks upon racks of servers hum with a buzz so deep you\ncan feel it through your bones. Cold air flows in from\nsomewhere, presumably to keep the stacks cool, but it\nrustles your hat and clothes.',
			' ',
		],
		name: 'ch2-castle-22.mgs:5:2',
	},
	'ch2-castle-22.mgs:14:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    The purple fur of this rabbit-like creature looks\nincredibly soft. You're tempted to pet it, but that may in\nfact be a rude thing to do to a sapient creature. Rude, or\nweird.",
		],
		name: 'ch2-castle-22.mgs:14:2',
	},
	'ch2-castle-22.mgs:22:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    His cool, slick hair looks like it would take a lot of\ntime to care for. %SELF% might spend as much time on it as\nhe does his work, even when catastrophe had struck the\ncastle.',
		],
		name: 'ch2-castle-22.mgs:22:2',
	},
	'ch2-castle-22.mgs:35:2': {
		messages: ['Entering \u001b[1mSERVER ROOM\u001b[0m...'],
		name: 'ch2-castle-22.mgs:35:2',
	},
	'ch2-castle-22.mgs:54:3': {
		messages: ['Entering \u001b[1mSERVER ROOM\u001b[0m...'],
		name: 'ch2-castle-22.mgs:54:3',
	},
	'ch2-castle-22.mgs:51:3': {
		messages: [
			'Discovered \u001b[1m\u001b[36mSERVER ROOM\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-22.mgs:51:3',
	},
	'ch2-castle-23.mgs:5:2': {
		messages: [
			'You looked around the \u001b[36mPOWER PLANT\u001b[0m.',
			'    The room is filled with hisses and a whirring or\nrumbling noise. Scores of pipes sprawl everywhere. Some of\nthe gauges are labeled "pressure" -- and some of the pipes\nseem to be warm when you draw a hand close.',
			' ',
		],
		name: 'ch2-castle-23.mgs:5:2',
	},
	'ch2-castle-23.mgs:14:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    She's staring you, but it's like she's trying trying not\nto \u001b[1mlook\u001b[0m like she's staring at you. She gives you a tight\nsmile as if encouraging you to be on your best behavior.",
		],
		name: 'ch2-castle-23.mgs:14:2',
	},
	'ch2-castle-23.mgs:21:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    His hands are moving about a small circuit board in a\nway that makes it clear he's done this a hundred times. You\nseem to be outside his notice.",
		],
		name: 'ch2-castle-23.mgs:21:2',
	},
	'ch2-castle-23.mgs:28:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    Her attention is fixed on the numerous gauges and dials\nat her workstation. She seems to be concentrating fiercely,\nif the twitch of her tail is any indication.',
		],
		name: 'ch2-castle-23.mgs:28:2',
	},
	'ch2-castle-23.mgs:41:2': {
		messages: ['Entering \u001b[1mPOWER PLANT\u001b[0m...'],
		name: 'ch2-castle-23.mgs:41:2',
	},
	'ch2-castle-23.mgs:58:3': {
		messages: ['Entering \u001b[1mPOWER PLANT\u001b[0m...'],
		name: 'ch2-castle-23.mgs:58:3',
	},
	'ch2-castle-23.mgs:55:3': {
		messages: [
			'Discovered \u001b[1m\u001b[36mPOWER PLANT\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-23.mgs:55:3',
	},
	'ch2-castle-23.mgs:66:3': {
		messages: [
			' ',
			'\u001b[33mDEBUG>\u001b[0m \u001b[36mGET THING\u001b[0m to acquire Cactus Cooler',
		],
		name: 'ch2-castle-23.mgs:66:3',
	},
	'ch2-castle-31.mgs:5:2': {
		messages: [
			'You looked around the \u001b[36mGRAND HALL\u001b[0m.',
			'    This place seems to be a hybrid entertainment\nampitheater and mess hall. But, empty of people and other\ndistractions, the stage -- and its performers -- steal all\nyour attention.',
			' ',
		],
		name: 'ch2-castle-31.mgs:5:2',
	},
	'ch2-castle-31.mgs:13:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    Lanky and brooding, his glare moves back and forth\nbetween you and the ceiling. At your guess, he's the band\nlead singer.",
		],
		name: 'ch2-castle-31.mgs:13:2',
	},
	'ch2-castle-31.mgs:20:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    Theodore is the bulkiest of the three band members, and\nlooks to be half falling asleep.',
		],
		name: 'ch2-castle-31.mgs:20:2',
	},
	'ch2-castle-31.mgs:27:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    Periodically she watches you as you move around the\nroom, but she is feigning disinterest.',
		],
		name: 'ch2-castle-31.mgs:27:2',
	},
	'ch2-castle-31.mgs:35:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    Large and boxy, with velvety round circles set onto its\nface. It all looks very expensive.',
		],
		name: 'ch2-castle-31.mgs:35:2',
	},
	'ch2-castle-31.mgs:43:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    The "1023 MB" logo is surprisingly well done, with its\nthoughtful serifs and clean linework. The professional logo\nand the aggressive red of the drumset make a strange\ncontrast with the ragtag musicians.',
		],
		name: 'ch2-castle-31.mgs:43:2',
	},
	'ch2-castle-31.mgs:50:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    Complete with a pair of chairs, the set is all tall and\nfancy like those at a high class cocktail bar. All the\ntables could support are a handful of tiny plates and very\ntall, very narrow drinks. Not much fun in your opinion.',
		],
		name: 'ch2-castle-31.mgs:50:2',
	},
	'ch2-castle-31.mgs:64:2': {
		messages: ['Entering \u001b[1mGRAND HALL\u001b[0m...'],
		name: 'ch2-castle-31.mgs:64:2',
	},
	'ch2-castle-31.mgs:85:3': {
		messages: ['Entering \u001b[1mGRAND HALL\u001b[0m...'],
		name: 'ch2-castle-31.mgs:85:3',
	},
	'ch2-castle-31.mgs:82:3': {
		messages: [
			'Discovered \u001b[1m\u001b[36mGRAND HALL\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-31.mgs:82:3',
	},
	'ch2-castle-31.mgs:107:3': {
		messages: [
			' ',
			'\u001b[33mDEBUG>\u001b[0m Play Simon Says!',
			'\u001b[33m>\u001b[0m \u001b[36mSIMON\u001b[0m: replay last game type (default: low)',
			'\u001b[33m>\u001b[0m \u001b[36mSIMON HIGH\u001b[0m: play high game (easier on desktop)',
			'\u001b[33m>\u001b[0m \u001b[36mSIMON LOW\u001b[0m: play low game (easier on the real badge)',
			'\u001b[33m>\u001b[0m \u001b[36mSIMON WIN\u001b[0m: play the win animation(s)',
			'\u001b[33m>\u001b[0m \u001b[36mSIMON LOSE\u001b[0m: play the lose animation(s)',
		],
		name: 'ch2-castle-31.mgs:107:3',
	},
	'ch2-castle-32.mgs:5:2': {
		messages: [
			'You looked around the \u001b[36mCASTLE KITCHEN\u001b[0m.',
			'    This room seems to be a combination employee break room\nand industrial-strength kitchen. The smell of the place is a\nstange combination of corporate disinfectant and maybe-fresh\ncoffee.',
			' ',
		],
		name: 'ch2-castle-32.mgs:5:2',
	},
	'ch2-castle-32.mgs:14:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    Fresh and fragrant. You appreciate the care to flavor\nthat this cook is putting into whatever it is they're\nintending to cook. You also appreciate that fact that you\ndon't have to cut them yourself.",
		],
		name: 'ch2-castle-32.mgs:14:2',
	},
	'ch2-castle-32.mgs:21:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    The glassy surface is very clean, perfectly black and\nvery shiny.',
		],
		name: 'ch2-castle-32.mgs:21:2',
	},
	'ch2-castle-32.mgs:29:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    This old, moist stone golem hums softly to himself while\nhe munches on his Skittles. When you look directly at him,\nhe casts a smile your way.',
		],
		name: 'ch2-castle-32.mgs:29:2',
	},
	'ch2-castle-32.mgs:37:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    The young larvae seems entirely oblivious to his\nmother's panic. He stares at you with wonder, as if you're\nthe most interesting thing he's seen all day.",
		],
		name: 'ch2-castle-32.mgs:37:2',
	},
	'ch2-castle-32.mgs:45:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    She's checking %Samson% over again and again, as if the\nchild's condition might have changed in the last few\nseconds. Her antenna swivels toward you when you come close.",
		],
		name: 'ch2-castle-32.mgs:45:2',
	},
	'ch2-castle-32.mgs:53:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    You can't decide whether the promise of spicy nacho\noutweighs the fact that the chips are made of metal and\nsilicon. The image on the package (enlarged to show texture)\nisn't helping. You're astounded there's a market for this.",
		],
		name: 'ch2-castle-32.mgs:53:2',
	},
	'ch2-castle-32.mgs:61:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    At first glance, the machine contains the standard\nsmattering of snacks, but you eventually notice some\noddities: red twisted pair licorice, lemon silicon wafers,\nand mixed nuts-and-bolts granola bars.',
		],
		name: 'ch2-castle-32.mgs:61:2',
	},
	'ch2-castle-32.mgs:69:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    Warm and fresh -- by some corporate standard. It's\ncoffee that aims for the floor and achieves its goals\ncompletely.",
		],
		name: 'ch2-castle-32.mgs:69:2',
	},
	'ch2-castle-32.mgs:84:2': {
		messages: ['Entering \u001b[1mCASTLE KITCHEN\u001b[0m...'],
		name: 'ch2-castle-32.mgs:84:2',
	},
	'ch2-castle-32.mgs:105:3': {
		messages: ['Entering \u001b[1mCASTLE KITCHEN\u001b[0m...'],
		name: 'ch2-castle-32.mgs:105:3',
	},
	'ch2-castle-32.mgs:102:3': {
		messages: [
			'Discovered \u001b[1m\u001b[36mCASTLE KITCHEN\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-32.mgs:102:3',
	},
	'ch2-castle-32.mgs:125:3': {
		messages: [' ', '\u001b[33mDEBUG>\u001b[0m \u001b[36mWANT CHIPS\u001b[0m'],
		name: 'ch2-castle-32.mgs:125:3',
	},
	'ch2-castle-33.mgs:7:2': {
		messages: [
			'You looked around the \u001b[36mHYDROPONICS ROOM\u001b[0m.',
			'    This room is sweetly humid and surprisingly cold. The\nfaint buzz of the lights compete with a dripping noise\ncoming from the pipes tucked into the rims of each box. You\ncatch a whiff of leafy green onion.',
			' ',
		],
		name: 'ch2-castle-33.mgs:7:2',
	},
	'ch2-castle-33.mgs:16:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    The cat is gray around the whiskers, but he moves with\nenergy and precision. He appears happy to be receiving a\nvisitor.',
		],
		name: 'ch2-castle-33.mgs:16:2',
	},
	'ch2-castle-33.mgs:34:3': {
		messages: ['Entering \u001b[1mHYDROPONICS ROOM\u001b[0m...'],
		name: 'ch2-castle-33.mgs:34:3',
	},
	'ch2-castle-33.mgs:31:3': {
		messages: [
			'Discovered \u001b[1m\u001b[36mHYDROPONICS ROOM\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-33.mgs:31:3',
	},
	'ch2-castle-33.mgs:49:3': {
		messages: [
			' ',
			'\u001b[33mDEBUG>\u001b[0m \u001b[36mMOUSEGAME\u001b[0m: start the mouse game!',
		],
		name: 'ch2-castle-33.mgs:49:3',
	},
	hanoi_size_warning: {
		messages: ['     \u001b[35mCannot place larger plate on top of a smaller plate!\u001b[0m'],
		name: 'hanoi_size_warning',
	},
	hanoi_won_message1a: {
		messages: ['         ||      \u001b[32mYOU WON! Plate #6 grabbed!\u001b[0m'],
		name: 'hanoi_won_message1a',
	},
	hanoi_won_message2a: {
		messages: ['                 \u001b[32mYOU WON! Plate #6 grabbed!\u001b[0m'],
		name: 'hanoi_won_message2a',
	},
	hanoi_won_message3a: {
		messages: ['                 \u001b[32mYOU WON! Plate #6 grabbed!\u001b[0m      ||'],
		name: 'hanoi_won_message3a',
	},
	hanoi_won_message1b: {
		messages: ['         ||              \u001b[32mScore: $hanoi_move_count$\u001b[0m'],
		name: 'hanoi_won_message1b',
	},
	hanoi_won_message2b: {
		messages: ['                         \u001b[32mScore: $hanoi_move_count$\u001b[0m'],
		name: 'hanoi_won_message2b',
	},
	hanoi_won_message3b2: {
		messages: [
			'                         \u001b[32mScore: $hanoi_move_count$\u001b[0m               ||',
		],
		name: 'hanoi_won_message3b2',
	},
	hanoi_won_message3b3: {
		messages: [
			'                         \u001b[32mScore: $hanoi_move_count$\u001b[0m              ||',
		],
		name: 'hanoi_won_message3b3',
	},
	hanoi_won_message3b4: {
		messages: [
			'                         \u001b[32mScore: $hanoi_move_count$\u001b[0m             ||',
		],
		name: 'hanoi_won_message3b4',
	},
	hanoi_space: {
		messages: ['                    '],
		name: 'hanoi_space',
	},
	hanoi_cursor_arm: {
		messages: ['         ||         '],
		name: 'hanoi_cursor_arm',
	},
	hanoi_cursor_hinge: {
		messages: ['        /  \\        '],
		name: 'hanoi_cursor_hinge',
	},
	hanoi_cursor_grip_0: {
		messages: ['       [    ]       '],
		name: 'hanoi_cursor_grip_0',
	},
	hanoi_cursor_grip_1: {
		messages: ['       [1111]       '],
		name: 'hanoi_cursor_grip_1',
	},
	hanoi_cursor_grip_2: {
		messages: ['      [222222]      '],
		name: 'hanoi_cursor_grip_2',
	},
	hanoi_cursor_grip_3: {
		messages: ['     [33333333]     '],
		name: 'hanoi_cursor_grip_3',
	},
	hanoi_cursor_grip_4: {
		messages: ['    [4444444444]    '],
		name: 'hanoi_cursor_grip_4',
	},
	hanoi_cursor_grip_5: {
		messages: ['   [555555555555]   '],
		name: 'hanoi_cursor_grip_5',
	},
	hanoi_cursor_grip_6: {
		messages: ['  [66666666666666]  '],
		name: 'hanoi_cursor_grip_6',
	},
	hanoi_cursor_grip_7: {
		messages: [' [7777777777777777] '],
		name: 'hanoi_cursor_grip_7',
	},
	hanoi_plate_1: {
		messages: ['        1111        '],
		name: 'hanoi_plate_1',
	},
	hanoi_plate_2: {
		messages: ['       222222       '],
		name: 'hanoi_plate_2',
	},
	hanoi_plate_3: {
		messages: ['      33333333      '],
		name: 'hanoi_plate_3',
	},
	hanoi_plate_4: {
		messages: ['     4444444444     '],
		name: 'hanoi_plate_4',
	},
	hanoi_plate_5: {
		messages: ['    555555555555    '],
		name: 'hanoi_plate_5',
	},
	hanoi_plate_6: {
		messages: ['   66666666666666   '],
		name: 'hanoi_plate_6',
	},
	hanoi_plate_7: {
		messages: ['  7777777777777777  '],
		name: 'hanoi_plate_7',
	},
	'ch2-castle-34-hanoi.mgs:308:2': {
		messages: [
			' ',
			' ',
			'============================================================',
			'=------------------ \u001b[35mTHE PLATES OF HANOI\u001b[0m -------------------=',
			'=----------------- Grab plate #6 to win! ------------------=',
			'============================================================',
		],
		name: 'ch2-castle-34-hanoi.mgs:308:2',
	},
	'ch2-castle-34-hanoi.mgs:416:2': {
		messages: [
			'============================================================',
			'  \u001b[36mJoysticks\u001b[0m to control grabber arm, \u001b[36mHAX button\u001b[0m to quit ~OR~',
			'  Tray (\u001b[36m1\u001b[0m-\u001b[36m3\u001b[0m) to grab/release plate, (\u001b[36mT\u001b[0m)ips, (\u001b[36mR\u001b[0m)eset, (\u001b[36mQ\u001b[0m)uit',
			'============================================================',
		],
		name: 'ch2-castle-34-hanoi.mgs:416:2',
	},
	'ch2-castle-34-hanoi.mgs:425:3': {
		messages: [
			'\u001b[35mTIP:\u001b[0m You only need uncover (and grab) the #6 plate; you need not move\nit to another tray and build the tower of plates again.',
			'\u001b[35mTIP:\u001b[0m Only put odd numbered plates on top of even plates and vice\nversa. E.g. put plate \u001b[1m1\u001b[0m on top of plate \u001b[1m4\u001b[0m, not \u001b[1m3\u001b[0m or \u001b[1m5\u001b[0m.',
		],
		name: 'ch2-castle-34-hanoi.mgs:425:3',
	},
	'ch2-castle-34-hanoi.mgs:455:3': {
		messages: [
			' ',
			'Quitting \u001b[35mPlates of Hanoi\u001b[0m (your progress has been saved)',
		],
		name: 'ch2-castle-34-hanoi.mgs:455:3',
	},
	'ch2-castle-34-hanoi.mgs:539:3': {
		messages: ['\u001b[31mERROR!\u001b[0m Tray #1 is already empty. Cannot pop!'],
		name: 'ch2-castle-34-hanoi.mgs:539:3',
	},
	'ch2-castle-34-hanoi.mgs:569:3': {
		messages: ['\u001b[31mERROR!\u001b[0m No value to push to Array #1!'],
		name: 'ch2-castle-34-hanoi.mgs:569:3',
	},
	'ch2-castle-34-hanoi.mgs:571:3': {
		messages: ['\u001b[31mERROR!\u001b[0m Array #1 is full! Cannot push!'],
		name: 'ch2-castle-34-hanoi.mgs:571:3',
	},
	'ch2-castle-34-hanoi.mgs:603:4': {
		messages: [' '],
		name: 'ch2-castle-34-hanoi.mgs:603:4',
	},
	'ch2-castle-34-hanoi.mgs:618:31': {
		messages: ['1'],
		name: 'ch2-castle-34-hanoi.mgs:618:31',
	},
	'ch2-castle-34-hanoi.mgs:619:36': {
		messages: ['2'],
		name: 'ch2-castle-34-hanoi.mgs:619:36',
	},
	'ch2-castle-34-hanoi.mgs:620:36': {
		messages: ['3'],
		name: 'ch2-castle-34-hanoi.mgs:620:36',
	},
	'ch2-castle-34-hanoi.mgs:621:36': {
		messages: ['4'],
		name: 'ch2-castle-34-hanoi.mgs:621:36',
	},
	'ch2-castle-34-hanoi.mgs:622:36': {
		messages: ['5'],
		name: 'ch2-castle-34-hanoi.mgs:622:36',
	},
	'ch2-castle-34-hanoi.mgs:623:36': {
		messages: ['6'],
		name: 'ch2-castle-34-hanoi.mgs:623:36',
	},
	'ch2-castle-34-hanoi.mgs:624:36': {
		messages: ['7'],
		name: 'ch2-castle-34-hanoi.mgs:624:36',
	},
	array_print_left: {
		messages: ['\u001b[35m[\u001b[0m '],
		name: 'array_print_left',
	},
	array_print_right: {
		messages: [' '],
		name: 'array_print_right',
	},
	'ch2-castle-34-hanoi.mgs:631:3': {
		messages: ['\u001b[31mERROR!\u001b[0m Array #2 is already empty. Cannot pop!'],
		name: 'ch2-castle-34-hanoi.mgs:631:3',
	},
	'ch2-castle-34-hanoi.mgs:661:3': {
		messages: ['\u001b[31mERROR!\u001b[0m No value to push to Array #2!'],
		name: 'ch2-castle-34-hanoi.mgs:661:3',
	},
	'ch2-castle-34-hanoi.mgs:663:3': {
		messages: ['\u001b[31mERROR!\u001b[0m Array #2 is full! Cannot push!'],
		name: 'ch2-castle-34-hanoi.mgs:663:3',
	},
	'ch2-castle-34-hanoi.mgs:695:4': {
		messages: [' '],
		name: 'ch2-castle-34-hanoi.mgs:695:4',
	},
	'ch2-castle-34-hanoi.mgs:712:3': {
		messages: ['\u001b[31mERROR!\u001b[0m Array #3 is already empty. Cannot pop!'],
		name: 'ch2-castle-34-hanoi.mgs:712:3',
	},
	'ch2-castle-34-hanoi.mgs:742:3': {
		messages: ['\u001b[31mERROR!\u001b[0m No value to push to Array #3!'],
		name: 'ch2-castle-34-hanoi.mgs:742:3',
	},
	'ch2-castle-34-hanoi.mgs:744:3': {
		messages: ['\u001b[31mERROR!\u001b[0m Array #3 is full! Cannot push!'],
		name: 'ch2-castle-34-hanoi.mgs:744:3',
	},
	'ch2-castle-34-hanoi.mgs:776:4': {
		messages: [' '],
		name: 'ch2-castle-34-hanoi.mgs:776:4',
	},
	'ch2-castle-34.mgs:5:2': {
		messages: [
			'You looked around the \u001b[36mCASTLE PANTRY\u001b[0m.',
			'    Well-stocked with canned, bottled, barrelled, and bagged\nfoods, the place smells vaguely of cumin and garlic.',
			' ',
		],
		name: 'ch2-castle-34.mgs:5:2',
	},
	'ch2-castle-34.mgs:14:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    It\'s an ordinary cardboard box with the words "THE\nORANGE" written on the sides.',
		],
		name: 'ch2-castle-34.mgs:14:2',
	},
	'ch2-castle-34.mgs:22:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    Wines of a wide range of vintages lie nestled in little\nnooks on the rack. Some of these vintages are quite old, yet\none of them claims to be from next year.',
		],
		name: 'ch2-castle-34.mgs:22:2',
	},
	'ch2-castle-34.mgs:30:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    Atop each plastic shelf are lots of ingredients one\nwould need to feed the residents of a castle this large,\nwith plenty extra. Despite this, a conspicuously large\nquantity of the foods shelved here are snacks.',
		],
		name: 'ch2-castle-34.mgs:30:2',
	},
	'ch2-castle-34.mgs:38:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    Plates, bowls, glasses, napkins, tablecloths. It would\nbe really hard to reach the supplies in the back of the\nshelf, but you can see stacks of plastic cups behind\neverything else.',
		],
		name: 'ch2-castle-34.mgs:38:2',
	},
	'ch2-castle-34.mgs:46:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    %SELF% wears an apron, bearing the teltale signs of\nregular, frequent use.',
		],
		name: 'ch2-castle-34.mgs:46:2',
	},
	'ch2-castle-34.mgs:64:3': {
		messages: ['Entering the \u001b[1mCASTLE PANTRY\u001b[0m...'],
		name: 'ch2-castle-34.mgs:64:3',
	},
	'ch2-castle-34.mgs:61:3': {
		messages: [
			'Discovered the \u001b[1m\u001b[36mCASTLE PANTRY\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-34.mgs:61:3',
	},
	'ch2-castle-99.mgs:22:2': {
		messages: [
			'You looked around the \u001b[36mSECRET LAB\u001b[0m.',
			"    To say the room looked \"lived in\" is an understatement.\nThere's a musty, stuffy smell, as if the air doesn't\nproperly circulate -- as well as a hint of ozone. It's clear\nLambda hasn't received company in some time.",
			' ',
		],
		name: 'ch2-castle-99.mgs:22:2',
	},
	'ch2-castle-99.mgs:31:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    %SELF% could be the dictionary image for the word\n"disheveled." Above deep purple robes he wears a white\nlabcoat, rife with pockets. The lenses of his round glasses\nseem to magnify the dark circles under his eyes.',
		],
		name: 'ch2-castle-99.mgs:31:2',
	},
	'ch2-castle-99.mgs:39:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    It's difficult to tell whether the machine is orange on\npurpose or if it is simply very thoroughly rusted. Its legs\nlook odd, somehow -- you imagine it could scoot around the\nfloor without moving any of the joints in its legs.",
		],
		name: 'ch2-castle-99.mgs:39:2',
	},
	'ch2-castle-99.mgs:47:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    The screen displays a map of the castle, a vague audit\nof the castle's contents, and a diagram of the current\nmainframe. The diagram has a list of parts on the side,\nincluded some rejected alternates.",
		],
		name: 'ch2-castle-99.mgs:47:2',
	},
	'ch2-castle-99.mgs:55:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    Each book in the line is very tall. Black-and-white\ndrawings adorn every cover alongside bright, saturated\ncolors.',
		],
		name: 'ch2-castle-99.mgs:55:2',
	},
	'ch2-castle-99.mgs:63:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    A can of food, claiming to take very little preparation\nin order to eat. This can is already open, and Lambda has\napparently supplemented the dried food bars with ketchup.',
		],
		name: 'ch2-castle-99.mgs:63:2',
	},
	'ch2-castle-99.mgs:71:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    The large poster depicts five astronauts. Must be one of\nthose "japanese animes" you\'ve heard about -- one of them\neven has blue hair. You gotta have blue hair.',
		],
		name: 'ch2-castle-99.mgs:71:2',
	},
	'ch2-castle-99.mgs:79:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    The filing cabinet is stuffed full of cables. Each\ndrawer has only one kind of cable in it, but the\norganization stops there.',
		],
		name: 'ch2-castle-99.mgs:79:2',
	},
	'ch2-castle-99.mgs:87:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    The lights on this computer flicker madly. Whatever it's\ndoing, it's sure working hard. The beige enclosure matches\nthe devices attached to it, all of which show signs of\nyellowing on the edges.",
		],
		name: 'ch2-castle-99.mgs:87:2',
	},
	'ch2-castle-99.mgs:95:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    An ordinary cardboard box. Inside are rations, bottles\nof ketchup, as well as a rubber snake.',
		],
		name: 'ch2-castle-99.mgs:95:2',
	},
	'ch2-castle-99.mgs:113:3': {
		messages: ['Entering \u001b[1mSECRET LAB\u001b[0m...'],
		name: 'ch2-castle-99.mgs:113:3',
	},
	'ch2-castle-99.mgs:110:3': {
		messages: [
			'Discovered \u001b[1m\u001b[36mSECRET LAB\u001b[0m! Room added to \u001b[36mMAP\u001b[0m!',
		],
		name: 'ch2-castle-99.mgs:110:3',
	},
	'ch2-castle-99.mgs:136:4': {
		messages: [' ', '\u001b[33mDEBUG>\u001b[0m \u001b[36mSKIP\u001b[0m: skip this cutscene'],
		name: 'ch2-castle-99.mgs:136:4',
	},
	'ch2-castle-outside.mgs:5:2': {
		messages: [
			'You looked around the \u001b[36mCASTLE EXTERIOR\u001b[0m.',
			'    The building itself is undeniably ominous with its\nstark, charcoal-colored stone. You can just make out that\nthe green orbs of light embedded in its walls are flickering\nslightly. A subtle humming emanates from the nearby pillars.\nIt is no surprise that the townsfolk avoid this place.',
			' ',
		],
		name: 'ch2-castle-outside.mgs:5:2',
	},
	'ch2-castle-outside.mgs:13:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    A worn wooden sign inscribed with the words "King\nGibson\'s castle."',
		],
		name: 'ch2-castle-outside.mgs:13:2',
	},
	'ch2-castle-outside.mgs:28:2': {
		messages: ['Entering \u001b[1mCASTLE EXTERIOR\u001b[0m...'],
		name: 'ch2-castle-outside.mgs:28:2',
	},
	spacer: {
		messages: [' ', '------------', ' '],
		name: 'spacer',
	},
	lambda_over: {
		messages: ['\u001b[1mlambda-talk\u001b[0m: connection closed successfully'],
		name: 'lambda_over',
	},
	'ch2-common.mgs:133:4': {
		messages: [
			'\u001b[33m+--------------------------+\u001b[0m',
			'\u001b[33m|  DEBUG MODE IS NOW OFF!  |\u001b[0m',
			'\u001b[33m+--------------------------+\u001b[0m',
		],
		name: 'ch2-common.mgs:133:4',
	},
	'ch2-common.mgs:124:4': {
		messages: [
			'\u001b[33m+-------------------------+\u001b[0m',
			'\u001b[33m|  DEBUG MODE IS NOW ON!  |\u001b[0m',
			'\u001b[33m+-------------------------+\u001b[0m',
		],
		name: 'ch2-common.mgs:124:4',
	},
	'ch2-goosefacts.mgs:5:5': {
		messages: ['You are no longer subscribed to goose facts.'],
		name: 'ch2-goosefacts.mgs:5:5',
	},
	'ch2-goosefacts.mgs:13:9': {
		messages: [' \n\u001b[32mYou are subscribed to goose facts! HONK!\u0007\u001b[0m\n '],
		name: 'ch2-goosefacts.mgs:13:9',
	},
	'ch2-goosefacts.mgs:15:13': {
		messages: [
			'Did you know? \u001b[1mGeese are monogamous!\u001b[0m They form strong bonds\nand have complex mating rituals, engaging in courtship\ndisplays which include honking, wing-flapping, and\nhead-bobbing.',
		],
		name: 'ch2-goosefacts.mgs:15:13',
	},
	'ch2-goosefacts.mgs:19:13': {
		messages: [
			"Did you know? \u001b[1mGeese are excellent navigators!\u001b[0m They have a\nremarkable ability to navigate over long distances,\nscientists believe they utilize the earth's magnetic fields,\nthe sun's position and landmarks to contextualize location.",
		],
		name: 'ch2-goosefacts.mgs:19:13',
	},
	'ch2-goosefacts.mgs:23:13': {
		messages: [
			'Did you know? \u001b[1mGeese have complex communication systems!\u001b[0m\nOutside of honking, geese employ a range of vocalizations as\nwell as head-bobbing and wing-flapping to communicate with\ntheir flock.',
		],
		name: 'ch2-goosefacts.mgs:23:13',
	},
	'ch2-goosefacts.mgs:27:13': {
		messages: [
			'Did you know? \u001b[1mThe most common goose name is\n\u001b[1mGoosey-McGooseface!\u001b[0m',
		],
		name: 'ch2-goosefacts.mgs:27:13',
	},
	'ch2-goosefacts.mgs:31:13': {
		messages: [
			'Did you know? \u001b[1mGeese have long lifespans!\u001b[0m They can live up to\ntwo decades in the wild.',
		],
		name: 'ch2-goosefacts.mgs:31:13',
	},
	'ch2-goosefacts.mgs:35:13': {
		messages: [
			'Did you know? \u001b[1mGeese assist in controlling weeds!\u001b[0m Their\nfeeding habits consist of mainly grass and vegetation, in\nsome cases geese are introduced to environments to assist\nwith the control of invasive species.',
		],
		name: 'ch2-goosefacts.mgs:35:13',
	},
	'ch2-goosefacts.mgs:39:13': {
		messages: [
			'Did you know? \u001b[1mGeese are important ecological indicators!\u001b[0m\nGeese rely on wetlands for nesting and feeding, by\nmonitoring geese populations, ecologists can gain insights\ninto the overall health of wetland habitats.',
		],
		name: 'ch2-goosefacts.mgs:39:13',
	},
	'ch2-goosefacts.mgs:43:13': {
		messages: [
			'Did you know? \u001b[1mA single Canadian goose has between 20,000 and\n\u001b[1m25,000 individual feathers!\u001b[0m',
		],
		name: 'ch2-goosefacts.mgs:43:13',
	},
	'ch2-goosefacts.mgs:47:13': {
		messages: [
			'Did you know? \u001b[1mGeese mate for life!\u001b[0m Like many other bird\nspecies including puffins, swans, and eagles, geese mate for\nlife forming a bond from between 2-3 years until death.',
		],
		name: 'ch2-goosefacts.mgs:47:13',
	},
	'ch2-goosefacts.mgs:51:13': {
		messages: [
			'Did you know? \u001b[1mThe collective pronoun for geese are called\n\u001b[1mgaggles or skeins!\u001b[0m',
		],
		name: 'ch2-goosefacts.mgs:51:13',
	},
	'ch2-goosefacts.mgs:55:13': {
		messages: [
			'Did you know? \u001b[1mUndercover geese are quite prevalent!\u001b[0m Secret\nagents have been known to disguise themselves as geese to\ninfiltrate bird communities and gather intelligence. Their\ncover is usually blown when they start honking during covert\noperations.',
		],
		name: 'ch2-goosefacts.mgs:55:13',
	},
	'ch2-goosefacts.mgs:59:13': {
		messages: [
			'Did you know? \u001b[1mGeese have complex sport rituals!\u001b[0m Geese hold\ntheir own version of the Olympics, featuring events like\nsynchronized swimming, aerial acrobatics, and honking\nmarathons. The gold medalists are awarded with an extra-long\nhonk of honor.',
		],
		name: 'ch2-goosefacts.mgs:59:13',
	},
	'ch2-goosefacts.mgs:63:13': {
		messages: [
			'Did you know? \u001b[1mGeese form secret societies!\u001b[0m Geese have a\nsecret society called "The Order of the Golden Gander,"\ndedicated to preserving ancient goose wisdom and plotting\nelaborate pranks on humans. Membership is by invitation only\nand involves a rigorous initiation ritual known as the "Honk\nof Allegiance."',
		],
		name: 'ch2-goosefacts.mgs:63:13',
	},
	'ch2-goosefacts.mgs:67:13': {
		messages: [
			'Did you know? \u001b[1mGeese are skilled technologists!\u001b[0m Geese are\ntech-savvy birds and have their own Silicon Valley-esque hub\nknown as "Honkitech Valley." They\'re pioneers in inventing\ngadgets like the feather-resistant smartphone and the GPS\n(Goose Positioning System) for navigating migratory routes.',
		],
		name: 'ch2-goosefacts.mgs:67:13',
	},
	'ch2-goosefacts.mgs:71:13': {
		messages: [
			'Did you know? \u001b[1mGeese cannot fly when molting!\u001b[0m When shedding\ntheir feathers during the end of their breeding season geese\nare unable to fly. This lasts for between 20-40 days until\nthey regrow.',
		],
		name: 'ch2-goosefacts.mgs:71:13',
	},
	'ch2-goosefacts.mgs:75:13': {
		messages: [
			'Did you know? \u001b[1mGoslings bond with the first living thing they\n\u001b[1msee!\u001b[0m Newly hatched geese (called goslings) assume the first\nliving thing they see is their mother. This is known as\n"imprinting".',
		],
		name: 'ch2-goosefacts.mgs:75:13',
	},
	'ch2-goosefacts.mgs:79:13': {
		messages: [
			'Did you know? \u001b[1mGeese make constant improvements to their\n\u001b[1mnests!\u001b[0m Geese keep their nests for several years and make\nconstant improvements using twigs, feathers, bark, and\nleaves.',
		],
		name: 'ch2-goosefacts.mgs:79:13',
	},
	'ch2-goosefacts.mgs:83:13': {
		messages: [
			'Did you know? \u001b[1mGeese have been domesticated for thousands of\n\u001b[1myears!\u001b[0m Geese have been domesticated for at least 3,000\nyears. There are references to geese in ancient Egyptian\nhieroglyphics.',
		],
		name: 'ch2-goosefacts.mgs:83:13',
	},
	'ch2-goosefacts.mgs:87:13': {
		messages: [
			'Did you know? \u001b[1mGeese have advanced detection techniques!\u001b[0m\nGeese are natural sleuths and operate their own detective\nagency, specializing in solving "fowl" play cases. With\ntheir keen observational skills and honed instincts, they\'ve\ncracked some of the toughest rake theft mysteries.',
		],
		name: 'ch2-goosefacts.mgs:87:13',
	},
	'ch2-goosefacts.mgs:91:13': {
		messages: [
			"Did you know? \u001b[1mGeese have complex oral histories!\u001b[0m In ancient\ngoose mythology, it's believed that the world rests on the\nback of a giant cosmic goose, whose honks create the rhythms\nof the universe.",
		],
		name: 'ch2-goosefacts.mgs:91:13',
	},
	'ch2-goosefacts.mgs:95:9': {
		messages: [' \nReply \u001b[32mSTOP\u001b[0m to stop receiving goose facts.'],
		name: 'ch2-goosefacts.mgs:95:9',
	},
	'ch2-greenhouse.mgs:5:2': {
		messages: [
			'You looked around the \u001b[36mGREENHOUSE\u001b[0m.',
			'    The interior is bright and warm, and the air is lightly\nmuggy. Fragrance from the ether nettle blossoms tempers the\nscent of greenery and soil. The raised planters smells\nearthy but not musty.',
			' ',
		],
		name: 'ch2-greenhouse.mgs:5:2',
	},
	'ch2-greenhouse.mgs:14:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    He's softly humming to himself, probably a song from one\nof those musicals he's always going on about. His eyes dart\nback and forth across the screen.",
		],
		name: 'ch2-greenhouse.mgs:14:2',
	},
	'ch2-greenhouse.mgs:22:2': {
		messages: [
			'You looked at the ethernettles.',
			'    The blossoms are strangely fluffy, as if the petals were\ngraced with downy hair. The plants themselves are less\ninviting, with their spines and the sharp corners on their\nleaves.',
		],
		name: 'ch2-greenhouse.mgs:22:2',
	},
	'ch2-greenhouse.mgs:30:2': {
		messages: ['You looked at \u001b[35m%SELF%\u001b[0m.\n', '    The '],
		name: 'ch2-greenhouse.mgs:30:2',
	},
	'ch2-greenhouse.mgs:36:2': {
		messages: [' blossoms are strangely fluffy, as if the petals\n'],
		name: 'ch2-greenhouse.mgs:36:2',
	},
	'ch2-greenhouse.mgs:39:2': {
		messages: [
			'were graced with downy hair. The plant itself is less\ninviting, with its spines and the sharp corners on its\nleaves.',
		],
		name: 'ch2-greenhouse.mgs:39:2',
	},
	'ch2-greenhouse.mgs:44:2': {
		messages: [' blossoms are strangely fluffy, as if\n'],
		name: 'ch2-greenhouse.mgs:44:2',
	},
	'ch2-greenhouse.mgs:47:2': {
		messages: [
			'the petals were graced with downy hair. The plant itself is\nless inviting, with its spines and the sharp corners on its\nleaves.',
		],
		name: 'ch2-greenhouse.mgs:47:2',
	},
	'ch2-greenhouse.mgs:54:2': {
		messages: ['orange-and-white'],
		name: 'ch2-greenhouse.mgs:54:2',
	},
	'ch2-greenhouse.mgs:60:2': {
		messages: ['orange'],
		name: 'ch2-greenhouse.mgs:60:2',
	},
	'ch2-greenhouse.mgs:66:2': {
		messages: ['green-and-white'],
		name: 'ch2-greenhouse.mgs:66:2',
	},
	'ch2-greenhouse.mgs:72:2': {
		messages: ['blue'],
		name: 'ch2-greenhouse.mgs:72:2',
	},
	'ch2-greenhouse.mgs:78:2': {
		messages: ['blue-and-white'],
		name: 'ch2-greenhouse.mgs:78:2',
	},
	'ch2-greenhouse.mgs:84:2': {
		messages: ['green'],
		name: 'ch2-greenhouse.mgs:84:2',
	},
	'ch2-greenhouse.mgs:90:2': {
		messages: ['brown-and-white'],
		name: 'ch2-greenhouse.mgs:90:2',
	},
	'ch2-greenhouse.mgs:96:2': {
		messages: ['brown'],
		name: 'ch2-greenhouse.mgs:96:2',
	},
	'ch2-greenhouse.mgs:102:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    This cable looks hopelessly tangled. You hope no one\nneeds to use this one any time soon.',
		],
		name: 'ch2-greenhouse.mgs:102:2',
	},
	'ch2-greenhouse.mgs:110:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    The looping on the bundle is tight and neat, like the\ncable was only just freed from its plastic packaging. The\nfriendly blue makes it look like a network cable to you, but\nyou're not sure why.",
		],
		name: 'ch2-greenhouse.mgs:110:2',
	},
	'ch2-greenhouse.mgs:118:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    The bag looks to be a bajillion pounds, and is well\nworn. It's dirty but in a wholesome, earthy way.",
		],
		name: 'ch2-greenhouse.mgs:118:2',
	},
	'ch2-greenhouse.mgs:126:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    An arcane black box with a series of enigmatic green\nlights across the front. It's slightly warm.",
		],
		name: 'ch2-greenhouse.mgs:126:2',
	},
	'ch2-greenhouse.mgs:141:2': {
		messages: ['Entering \u001b[1mGREENHOUSE\u001b[0m...'],
		name: 'ch2-greenhouse.mgs:141:2',
	},
	'ch2-lodge-rtfm.mgs:5:2': {
		messages: [
			'You looked around at the \u001b[36mRTFM ROOM\u001b[0m.',
			'    The books in this room seem older than those in the rest\nof the library. More leather bindings, more handwritten\npages. The air is mustier, but not in an unpleasant way.',
			' ',
		],
		name: 'ch2-lodge-rtfm.mgs:5:2',
	},
	'ch2-lodge-rtfm.mgs:14:2': {
		messages: [
			'You looked at the book called "\u001b[35m%SELF%\u001b[0m."',
			"    Worn, and apparently forgotten. It's splayed on the\nground as if it had been knocked down unknowingly.",
		],
		name: 'ch2-lodge-rtfm.mgs:14:2',
	},
	'ch2-lodge-rtfm.mgs:22:2': {
		messages: [
			'You looked at the book called "\u001b[35m%SELF%\u001b[0m."',
			'    The cover is crisp and clean as if the book were brand\nnew. The bright and simple geometric design on the cover is\nthe epitome of a textbook choosing to not commit to its\nsubject.',
		],
		name: 'ch2-lodge-rtfm.mgs:22:2',
	},
	'ch2-lodge-rtfm.mgs:30:2': {
		messages: [
			'You looked at the book called "\u001b[35m%SELF%\u001b[0m."',
			"    The page edges are misaligned as if the book were bound\nby hand. The gold leaf lettering on the cover certainly\nlooks hand done. It's one of a set of four.",
		],
		name: 'ch2-lodge-rtfm.mgs:30:2',
	},
	books_extra: {
		messages: [
			'You looked at the book called "\u001b[35m%SELF%\u001b[0m."',
			'    This tome resembles the hand-made "Entities" books, but\nthis one was more neatly constructed and is less worn. It\'s\none of a set of two.',
		],
		name: 'books_extra',
	},
	red_letter_pamphlet: {
		messages: [
			'You looked at the book called "\u001b[35m%SELF%\u001b[0m."',
			'    This sheet -- and its nearby counterpart -- are ripped\non the left side, as if torn from a bound book. The paper is\nyellowed, particularly on the edges, and the ink is smeared\nin places.',
			'    Some words are written in an ominous red.',
		],
		name: 'red_letter_pamphlet',
	},
	'ch2-lodge-rtfm.mgs:70:2': {
		messages: ['Entering \u001b[1mRTFM ROOM\u001b[0m...'],
		name: 'ch2-lodge-rtfm.mgs:70:2',
	},
	'ch2-lodge.mgs:5:2': {
		messages: [
			'You looked around the \u001b[36mLIBRARY\u001b[0m.',
			'    The sight of endless books -- and the smell of books,\nnew and old! Is there another single sight on the planet\nthat promises such boundless knowledge, fantastic adventure,\nor exquisite trivia factoids?',
			' ',
		],
		name: 'ch2-lodge.mgs:5:2',
	},
	'ch2-lodge.mgs:14:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    Its eyes are fixed on your every movement. This is\nprobably normal for a cat.',
		],
		name: 'ch2-lodge.mgs:14:2',
	},
	'ch2-lodge.mgs:22:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    The child monster-bug wears his heart on his... arms? In\nany case, he is clearly excited by what he's reading.",
		],
		name: 'ch2-lodge.mgs:22:2',
	},
	'ch2-lodge.mgs:30:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    The cover of this book is so vague that it's unclear\nwhich sport it's celebrating.",
		],
		name: 'ch2-lodge.mgs:30:2',
	},
	'ch2-lodge.mgs:38:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    The magazine itself seems not to have run long, as this\nissue claims to be both the third issue and the final issue.\nThe glossy cover is a badly-Photoshopped collage of\nimprobable monsters in implausible situations.',
		],
		name: 'ch2-lodge.mgs:38:2',
	},
	'ch2-lodge.mgs:46:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    Overall, you're left with confusion as to why a\ncalculator would require a whole book to use it properly.",
		],
		name: 'ch2-lodge.mgs:46:2',
	},
	'ch2-lodge.mgs:57:2': {
		messages: ['Entering \u001b[1mLIBRARY\u001b[0m...'],
		name: 'ch2-lodge.mgs:57:2',
	},
	'ch2-lodge.mgs:231:4': {
		messages: ['\u0007'],
		name: 'ch2-lodge.mgs:231:4',
	},
	'ch2-look_scripts.mgs:3:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    A bear of a man, yet he doesn't have an aggressive\nbearing. His eyes drift around his environment as if\npatiently regarding everything, considering each one in\nturn.",
		],
		name: 'ch2-look_scripts.mgs:3:2',
	},
	'ch2-look_scripts.mgs:10:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    The man may genuinely be having trouble standing still;\nhe is fidgetting with his fingers, and the robe at his feet\nis jerking slightly, rhythmically, as if he is aggressively\ntapping his toes.',
		],
		name: 'ch2-look_scripts.mgs:10:2',
	},
	'ch2-look_scripts.mgs:17:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    The man is old enough that his expression is cryptic.\nHis eyes are all but entirely hidden under his sagging lids.\nHe nods his head as if approving your efforts. Or is he\ngenuinely falling asleep?',
		],
		name: 'ch2-look_scripts.mgs:17:2',
	},
	'ch2-look_scripts.mgs:24:2': {
		messages: [
			'You looked at \u001b[36myourself\u001b[0m.',
			'    Your assessment? You need a haircut!',
		],
		name: 'ch2-look_scripts.mgs:24:2',
	},
	'ch2-look_scripts.mgs:32:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    It's difficult to tell whether the machine is orange on\npurpose or if it is simply thoroughly rusted. Its legs look\nodd, somehow -- you imagine it could scoot around the floor\nwithout moving any of the joints in its legs.",
		],
		name: 'ch2-look_scripts.mgs:32:2',
	},
	'ch2-look_scripts.mgs:40:2': {
		messages: [
			'You looked at the \u001b[35m%save floppy%\u001b[0m.',
			'    Wow, someone 3D-printed a save icon. What will they\nthink up next?',
		],
		name: 'ch2-look_scripts.mgs:40:2',
	},
	'ch2-magehouse.mgs:5:2': {
		messages: [
			'You looked around \u001b[36mYOUR HOUSE\u001b[0m.',
			"    There's a certain smell to home that you'll always\nremember and that will always be nostalgic for you -- maybe\nit's the smell of ozone that seems to follow Aunt Zippy and\nUncle Zappy around the room.",
			' ',
		],
		name: 'ch2-magehouse.mgs:5:2',
	},
	'ch2-magehouse.mgs:14:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    It\'s your childhood goldfish. An adage comes to your\nmind at the sight of him: "You shouldn\'t feed Mr. Tickles\nthree hams!"',
		],
		name: 'ch2-magehouse.mgs:14:2',
	},
	'ch2-magehouse.mgs:22:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    %SELF%'s color brightens as you approach, and the edges\nof his body fuzzes very slightly. You've come to understand\nthis change in his aspect as a smile -- you smile back.",
		],
		name: 'ch2-magehouse.mgs:22:2',
	},
	'ch2-magehouse.mgs:30:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    She nods encouragingly at you as you pass her. Love is\napparent in her glowing, golden-yellow eyes.',
		],
		name: 'ch2-magehouse.mgs:30:2',
	},
	'ch2-magehouse.mgs:38:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    Aunt Zippy gave you this journal on your previous\nbirthday. You haven't written in it every day, but you're\nstill proud that you're about a third of the way through it.\nThere's a good number of doodles in there, too: dragons and\nfireballs, mostly.",
		],
		name: 'ch2-magehouse.mgs:38:2',
	},
	'ch2-magehouse.mgs:46:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    It's one of the moving boxes you brought to your current\nhouse in town from your old house in the country. Still\nunpacked after all this time... which makes you wonder\nwhether the contents were ultimately that important to you.",
		],
		name: 'ch2-magehouse.mgs:46:2',
	},
	'ch2-magehouse.mgs:61:3': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    It's one of those new flat-button models. Its tiny\nseven-segment display is glowing a soft blue-green -- but\nyou don't have the heart to tell it that it's got the time\nwrong.",
		],
		name: 'ch2-magehouse.mgs:61:3',
	},
	'ch2-magehouse.mgs:55:3': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    It's one of those new flat-button models. Its tiny\nseven-segment display is glowing a soft blue-green... and\nyou've just realized it's got the time wrong by an hour.",
		],
		name: 'ch2-magehouse.mgs:55:3',
	},
	'ch2-magehouse.mgs:70:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    It's the remains of a very special cake that Aunt Zippy\nand Uncle Zappy made for your birthday -- lemon sponge and\npink buttercream.",
		],
		name: 'ch2-magehouse.mgs:70:2',
	},
	'ch2-magehouse.mgs:82:2': {
		messages: ['Entering \u001b[1mYOUR HOUSE\u001b[0m...'],
		name: 'ch2-magehouse.mgs:82:2',
	},
	'ch2-oldcouplehouse.mgs:5:2': {
		messages: [
			"You looked around \u001b[36mBEATRICE'S HOUSE\u001b[0m.",
			'    The interior has a cozy, lived-in feel to it. All the\nfurniture is of an older style and worn down on some of the\nedges. A house for two, and it has been that way for a long\ntime. Probably, like, 100 years or something.',
			' ',
		],
		name: 'ch2-oldcouplehouse.mgs:5:2',
	},
	'ch2-oldcouplehouse.mgs:14:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    No matter what shape he takes, it's clearly still\n%SELF%.",
		],
		name: 'ch2-oldcouplehouse.mgs:14:2',
	},
	'ch2-oldcouplehouse.mgs:22:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			'    Is that exasperation in her eyes or is she just old?\nRight now, she might be both.',
		],
		name: 'ch2-oldcouplehouse.mgs:22:2',
	},
	'ch2-oldcouplehouse.mgs:33:2': {
		messages: ["Entering \u001b[1mBEATRICE'S HOUSE\u001b[0m..."],
		name: 'ch2-oldcouplehouse.mgs:33:2',
	},
	ch2_describe_monitor: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You'll need a computer \u001b[35mMONITOR\u001b[0m if you want to see\nanything the computer is doing. I'm pretty sure there's a\n\u001b[35mmonitor in the next room of the castle\u001b[0m that no one is using.\nBe sure to take its video cable and power cable, too.",
		],
		name: 'ch2_describe_monitor',
	},
	ch2_describe_heatsink: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The mainframe generates so much heat we'll need a\n\u001b[35mHEAT SINK\u001b[0m -- or any means of drawing heat away from the CPU.\nThe \u001b[35mpower plant guys\u001b[0m can probably help you out on that\nfront.",
		],
		name: 'ch2_describe_heatsink',
	},
	ch2_describe_powersupply: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The mainframe will need a \u001b[35mPOWER SUPPLY\u001b[0m to turn AC\npower from the wall into DC power. We'll need the kind that\ngoes on the inside of a computer enclosure. According to the\ncastle's inventory sheets, the \u001b[35mserver room\u001b[0m has a bunch\nextra. I'm sure they'd let you take one.",
		],
		name: 'ch2_describe_powersupply',
	},
	ch2_describe_keyboard: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You're definitely going to need a \u001b[35mKEYBOARD\u001b[0m.\nFortunately the \u001b[35mband in the Great Hall\u001b[0m has one they're not\nexactly using. Okay, it's not QWERTY or DVORAK so much as it\nis a twelve-tone scale, but I think it'll work as an input\ndevice. Better than nothing, anyway.",
		],
		name: 'ch2_describe_keyboard',
	},
	ch2_describe_mouse: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: To be honest, you don't need a \u001b[35mMOUSE\u001b[0m to use a\ncomputer, but a lot of people prefer not to use the keyboard\nalone. I think it might be nice for you to have if you're\nnot used to a terminal.",
			"    Mice might be hard to come by, though, so if I were you,\nI'd \u001b[35mask a cat to fetch one\u001b[0m for you.",
		],
		name: 'ch2_describe_mouse',
	},
	ch2_describe_harddrive: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: As I said before, to make a \u001b[35mHARD DRIVE\u001b[0m we'll need\ntwo things:",
			'    First, a \u001b[35mPLATE\u001b[0m. But not just any plate -- we need a\nplate with high iron content in its glaze. \u001b[35mAsk the kitchen\n\u001b[35mstaff\u001b[0m if they have a plate like that.',
			"    Next, a \u001b[35mNEEDLE\u001b[0m, like a record player needle. There's a\n\u001b[35mphonograph player somewhere in the central wing\u001b[0m of the\ncastle. That might be your best bet.",
		],
		name: 'ch2_describe_harddrive',
	},
	ch2_describe_plate: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: To build a \u001b[35mhard drive\u001b[0m, we'll need a \u001b[35mPLATE\u001b[0m. But not\njust any plate -- we need a plate with high iron content in\nits glaze. \u001b[35mAsk the kitchen staff\u001b[0m if they have a plate like\nthat.",
		],
		name: 'ch2_describe_plate',
	},
	ch2_describe_needle: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: To build a \u001b[35mhard drive\u001b[0m, we'll need a \u001b[35mNEEDLE\u001b[0m, like a\nrecord player needle. There's a \u001b[35mphonograph player somewhere\n\u001b[35min the central wing\u001b[0m of the castle. That might be your best\nbet.",
		],
		name: 'ch2_describe_needle',
	},
	ch2_describe_clock: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: We'll need a \u001b[35mCLOCK\u001b[0m to keep all the computer parts\ncoordinated. Normally CPU clocks are very tiny quartz\ncrystals, which are shaped to oscillate at a specific\nrate....",
			'    In our case... well, I know \u001b[35mKing Gibson has a nice\n\u001b[35mgrandfather clock in his bedroom\u001b[0m. Maybe ask him if you can\nuse it.',
		],
		name: 'ch2_describe_clock',
	},
	ch2_describe_cpu: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The \u001b[35mCPU\u001b[0m is like the brain of the computer. There\naren't any spare lying around, but we can approximate one.",
			"    We'll need something to act as the \u001b[1mregister file\u001b[0m -- that\nis, the place the CPU keeps the very small set values that a\nprogram modifies with each instruction. An \u001b[35mABACUS\u001b[0m should\nwork well for this. Looks like \u001b[35mFrankie in the \u001b[35mworkshop\u001b[0m has\none.",
			"    For the rest, we'll need a volunteer who is very small\nand will make decisions very consistently. The best\ncandidate is \u001b[35mAurelius\u001b[0m, the \u001b[35mGOLDFISH\u001b[0m in the \u001b[35mthrone room\u001b[0m. Just\nmake sure he understands what he's getting into.",
			'    Once you have both, \u001b[35msolder them together\u001b[0m in the\nworkshop.',
		],
		name: 'ch2_describe_cpu',
	},
	ch2_describe_goldfish: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: To make a CPU, we'll need a volunteer to act as the\ninterpretor and executor of program data. We'll need someone\nwe can trust will make decisions very consistently, as well\nas someone very small. The only one around here that fits\nthe bill is the \u001b[35mKing's regent, Aurelius\u001b[0m. He's the \u001b[35mGOLDFISH\u001b[0m\nin the \u001b[35mthrone room\u001b[0m.",
		],
		name: 'ch2_describe_goldfish',
	},
	ch2_describe_abacus: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: To make a CPU, we'll need something to act as the\n\u001b[1mregister file\u001b[0m -- that is, the place the CPU keeps the very\nsmall set of values that a program modifies with each\ninstruction. An \u001b[35mABACUS\u001b[0m should work well for this. Looks like\n\u001b[35mFrankie in the \u001b[35mworkshop\u001b[0m has one.",
		],
		name: 'ch2_describe_abacus',
	},
	ch2_describe_ramchips: {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: For \u001b[35mRAM\u001b[0m... I'll admit I'm at a complete loss. I'm\nfinding nothing in the inventory sheets that might work. But\n\u001b[35mask the hardware guys in the \u001b[35mworkshop\u001b[0m. Those guys know their\nstuff, and I trust them to come up with something.",
		],
		name: 'ch2_describe_ramchips',
	},
	'ch2-parts-list.mgs:67:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Really? Around here? Parts like what?', ' '],
		name: 'ch2-parts-list.mgs:67:2',
	},
	'ch2-parts-list.mgs:72:2': {
		messages: [' '],
		options: [
			{
				label: 'What else?',
				script: 'ch2_toot_step5b',
			},
		],
		name: 'ch2-parts-list.mgs:72:2',
	},
	'ch2-parts-list.mgs:79:2': {
		messages: ['\u001b[36mYOU\u001b[0m: What else?', ' '],
		name: 'ch2-parts-list.mgs:79:2',
	},
	'ch2-parts-list.mgs:84:2': {
		messages: [' '],
		options: [
			{
				label: 'Then what?',
				script: 'ch2_toot_step5c',
			},
		],
		name: 'ch2-parts-list.mgs:84:2',
	},
	'ch2-parts-list.mgs:91:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Then what?', ' '],
		name: 'ch2-parts-list.mgs:91:2',
	},
	'ch2-parts-list.mgs:96:2': {
		messages: [' '],
		options: [
			{
				label: 'Anything else?',
				script: 'ch2_toot_step5e',
			},
		],
		name: 'ch2-parts-list.mgs:96:2',
	},
	'ch2-parts-list.mgs:107:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Anything else?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: And... the rest might be a little tricky. I'll keep\nlooking for options, but for now just start with those\nthree. Let me rig up a command real quick... and....",
			'    There we go. Now you can type \u001b[36mPARTS\u001b[0m to call me about the\nparts list specifically.',
		],
		name: 'ch2-parts-list.mgs:107:2',
	},
	'ch2-parts-list.mgs:125:2': {
		messages: [
			"    You know, I'm actually getting a little excited about\nbuilding this thing! We can actually do this!",
			' ',
		],
		options: [
			{
				label: "Let's do it!",
				script: 'ch2_toot_step99_end',
			},
			{
				label: 'Actually, I had a different question.',
				script: 'ch2_toot_step99_continue',
			},
		],
		name: 'ch2-parts-list.mgs:125:2',
	},
	'ch2-parts-list.mgs:135:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Yeah, let's do it!",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Great! And don't forget to type \u001b[36mHELP\u001b[0m to see all the\ncommands you can use. You'll probably need to use all of\nthem.",
			'    Good luck!',
			' ',
		],
		name: 'ch2-parts-list.mgs:135:2',
	},
	'ch2-parts-list.mgs:147:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Actually, I had a different question.',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Sure. What did you want to know?',
		],
		name: 'ch2-parts-list.mgs:147:2',
	},
	'ch2-parts-list.mgs:161:3': {
		messages: [' '],
		name: 'ch2-parts-list.mgs:161:3',
	},
	'ch2-parts-list.mgs:165:2': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Sorry, um, that was a bit of a tangent. But I\nactually wanted you to know that I have another round of\nparts for the parts list.',
			'    Just as a heads up, these parts are going to be a\nlittle... abstract.',
			' ',
		],
		options: [
			{
				label: 'Abstract?',
				script: 'ch2_lambda_round_2_parts2',
			},
		],
		name: 'ch2-parts-list.mgs:165:2',
	},
	'ch2-parts-list.mgs:175:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Abstract? What is that supposed to mean?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Yeah, so, like the hard drive, for example. I can't\nfind one in storage anywhere, and no one I've contacted have\nany to spare, so we're going to have to \u001b[35mmake one\u001b[0m.",
			'    Old-style hard drives are made of spinning plates of\nmetal, and they have a little read head in there that can\nmagnetically interact with the plate... I mean, it needs\nelectricity, but it can read a 1 and a 0, or change a 1 to a\n0... that is, magnetic fields and electric fields are sort\nof the same thing, in the sense that --',
			' ',
		],
		options: [
			{
				label: '...What?',
				script: 'ch2_lambda_round_2_parts3',
			},
		],
		name: 'ch2-parts-list.mgs:175:2',
	},
	'ch2-parts-list.mgs:187:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: ...What?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: \u001b[2m*ahem*\u001b[0m Well, it's all pretty cool, but the point\nis... we'll need a \u001b[35mplate\u001b[0m and we'll need a \u001b[35mneedle\u001b[0m, and\ntogether they can approximate a hard drive.",
			' ',
			'\u001b[36mYOU\u001b[0m: Plate? Like a dinner plate?',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Like I said...',
			'    ...\u001b[1mabstract\u001b[0m.',
			' ',
		],
		options: [
			{
				label: 'Is this really going to work?',
				script: 'ch2_lambda_round_2_parts4',
			},
		],
		name: 'ch2-parts-list.mgs:187:2',
	},
	'ch2-parts-list.mgs:203:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Is this really going to work?',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: ...\u001b[1mSure\u001b[0m.',
			' ',
		],
		options: [
			{
				label: "Okay, so what's the new parts list?",
				script: 'ch2_lambda_round_2_parts5a',
			},
		],
		name: 'ch2-parts-list.mgs:203:2',
	},
	'ch2-parts-list.mgs:214:2': {
		messages: ["\u001b[36mYOU\u001b[0m: Okay, so what's the new parts list?", ' '],
		name: 'ch2-parts-list.mgs:214:2',
	},
	'ch2-parts-list.mgs:219:2': {
		messages: [' '],
		options: [
			{
				label: 'Then what?',
				script: 'ch2_lambda_round_2_parts5b',
			},
		],
		name: 'ch2-parts-list.mgs:219:2',
	},
	'ch2-parts-list.mgs:228:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Then what?', ' '],
		name: 'ch2-parts-list.mgs:228:2',
	},
	'ch2-parts-list.mgs:233:2': {
		messages: [' '],
		options: [
			{
				label: 'Okay, and then?',
				script: 'ch2_lambda_round_2_parts5c',
			},
		],
		name: 'ch2-parts-list.mgs:233:2',
	},
	'ch2-parts-list.mgs:241:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Okay, and then?', ' '],
		name: 'ch2-parts-list.mgs:241:2',
	},
	'ch2-parts-list.mgs:246:2': {
		messages: [
			'    Once you have both items, go to the workshop and solder\nthem together into a \u001b[35mHARD DRIVE\u001b[0m.',
		],
		name: 'ch2-parts-list.mgs:246:2',
	},
	'ch2-parts-list.mgs:249:2': {
		messages: [' '],
		options: [
			{
				label: 'Anything else?',
				script: 'ch2_lambda_round_2_parts5d',
			},
		],
		name: 'ch2-parts-list.mgs:249:2',
	},
	'ch2-parts-list.mgs:261:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Anything else?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: That's all for the moment. The last few parts are\ngoing to be really esoteric compared to these, so I'll need\nmore time to come up with ideas.",
			"    I'll leave you to it. Good luck.",
			' ',
		],
		name: 'ch2-parts-list.mgs:261:2',
	},
	'ch2-parts-list.mgs:276:2': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Hey, there! I saw that you finished the last list,\nand had just worked out the last few parts we need....',
			' ',
		],
		options: [
			{
				label: "Does that mean we're almost done?",
				script: 'ch2_bert_message_lambda_intro1a',
			},
			{
				label: 'Wait! What about Bert?',
				script: 'ch2_bert_message_lambda_intro1b',
			},
		],
		name: 'ch2-parts-list.mgs:276:2',
	},
	'ch2-parts-list.mgs:285:2': {
		messages: ["\u001b[36mYOU\u001b[0m: Oh yeah? Does that mean we're almost done?"],
		name: 'ch2-parts-list.mgs:285:2',
	},
	'ch2-parts-list.mgs:293:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Wait! What about Bert? Have you heard anything?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Heard anything from Bert? No, nothing. I'm sorry.\nWe'll just have to keep being patient.",
			' ',
		],
		options: [
			{
				label: 'Okay....',
				script: 'ch2_bert_message_lambda_intro2',
			},
		],
		name: 'ch2-parts-list.mgs:293:2',
	},
	'ch2-parts-list.mgs:303:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Okay.... I don't like it, but I guess I don't have much\nchoice.",
			"    You said you had the last few parts. Does that mean\nwe're almost done?",
		],
		name: 'ch2-parts-list.mgs:303:2',
	},
	'ch2-parts-list.mgs:311:2': {
		messages: [
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Yeah, we're getting pretty close to the end here.\nOnly a few parts left, but one is a bit of a doozy.",
			' ',
		],
		options: [
			{
				label: 'In what way?',
				script: 'ch2_lambda_round_3_parts2',
			},
		],
		name: 'ch2-parts-list.mgs:311:2',
	},
	'ch2-parts-list.mgs:321:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: In what way?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Well, we'll have to make a CPU from scratch, but\nI've worked it out so we only need two things.",
			"    We'll need something to act as the \u001b[1mregister file\u001b[0m -- that\nis, the place the CPU keeps the very small set of values\nthat a program modifies with each instruction. An \u001b[35mABACUS\u001b[0m\nshould work well for this. Looks like \u001b[35mFrankie in the\n\u001b[35mworkshop\u001b[0m has one.",
			"    For the rest of the CPU, including the interpretation of\nprogram instructions and changing the values on the abacus\nitself, we'll need a... volunteer.",
			' ',
		],
		options: [
			{
				label: 'Volunteer?',
				script: 'ch2_lambda_round_3_parts2b',
			},
		],
		name: 'ch2-parts-list.mgs:321:2',
	},
	'ch2-parts-list.mgs:333:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Volunteer?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Yes. We'll need a living, sentient being to agree to\nbe... \"combined\"... with the abacus. It'll have to be\nsomeone we can trust will make decisions very consistently,\nas well as someone very small. The only one around here that\nfits the bill is the \u001b[35mKing's regent, Aurelius\u001b[0m. He's the\n\u001b[35mGOLDFISH\u001b[0m in the \u001b[35mthrone room\u001b[0m.",
			"    It'll be a temporary thing -- just until I can have a\nCPU delivered by mail order. Given that, I think he'll\nagree.",
			' ',
		],
		options: [
			{
				label: 'Will he be okay in the meantime?',
				script: 'ch2_lambda_round_3_parts2c',
			},
		],
		name: 'ch2-parts-list.mgs:333:2',
	},
	'ch2-parts-list.mgs:344:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Will he be okay in the meantime?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Actually, yes. Due to the nature of what we're doing\nand where we're doing it, the volunteer's mind will remain\nintact. And their body can be completely restored at a later\ntime -- whatever can be soldered can be unsoldered, after\nall.",
			"    It's still an uncomfortable prospect to ask someone to\ndo this, which is why I want you to make sure he understands\nwhat he's getting into, and that he's doing it willingly.\nI'm counting on you.",
			' ',
		],
		options: [
			{
				label: "He's a goldfish. Won't soldering him cook him?",
				script: 'ch2_lambda_round_3_parts2d',
			},
		],
		name: 'ch2-parts-list.mgs:344:2',
	},
	'ch2-parts-list.mgs:355:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: He's a goldfish. Won't soldering him cook him?",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: It'll be fine. I've quadruple checked.",
			' ',
		],
		options: [
			{
				label: 'All right. What else?',
				script: 'ch2_lambda_round_3_parts3',
			},
		],
		name: 'ch2-parts-list.mgs:355:2',
	},
	'ch2-parts-list.mgs:365:2': {
		messages: ['\u001b[36mYOU\u001b[0m: All right. What else?', ' '],
		name: 'ch2-parts-list.mgs:365:2',
	},
	'ch2-parts-list.mgs:370:2': {
		messages: [' '],
		options: [
			{
				label: 'Anything else?',
				script: 'ch2_lambda_round_3_parts4',
			},
		],
		name: 'ch2-parts-list.mgs:370:2',
	},
	'ch2-parts-list.mgs:378:2': {
		messages: ['\u001b[36mYOU\u001b[0m: And then?', ' '],
		name: 'ch2-parts-list.mgs:378:2',
	},
	'ch2-parts-list.mgs:383:2': {
		messages: [' '],
		options: [
			{
				label: 'And then?',
				script: 'ch2_lambda_round_3_parts5',
			},
		],
		name: 'ch2-parts-list.mgs:383:2',
	},
	'ch2-parts-list.mgs:391:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: And then?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Then we're done.",
			"    After that, you'll have to install the OS, and I'm still\ntweaking that. I should be done right about when you finish\nup there.",
			'    Remember you can type \u001b[36mPARTS\u001b[0m To see the parts list again.\nGood luck.',
			' ',
		],
		name: 'ch2-parts-list.mgs:391:2',
	},
	'ch2-parts-list.mgs:407:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Hiya, %PLAYER%! I see that you're finished building\nthe mainframe. As it happens, I'm finished with the OS, too.\nAll that's left is for you to come pick it up.",
			' ',
		],
		options: [
			{
				label: "Pick it up? Can't you drop it off?",
				script: 'ch2_lambda_round_4b',
			},
		],
		name: 'ch2-parts-list.mgs:407:2',
	},
	'ch2-parts-list.mgs:415:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Pick it up? Can't you drop it off?",
			'    Say, where are you, anyway?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: I'm somewhere split off, isolated from the rest of\nthe castle. All conventional exits and entrances have been\ndestroyed, but you should still be able to reach me. I'll\nexplain more after you arrive.",
			' ',
		],
		options: [
			{
				label: 'No entrances? How am I supposed to get there?',
				script: 'ch2_lambda_round_4c',
			},
		],
		name: 'ch2-parts-list.mgs:415:2',
	},
	'ch2-parts-list.mgs:426:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: No entrances? How am I supposed to get there?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: I've granted you access to the \u001b[36mWARP\u001b[0m command. You can\nuse it to go to any place you've ever been, even if it's not\nan adjacent space to your current room. Oh, and I've also\nset the \"visit\" flag to my lab, which will make the system\nthink you've been here before.",
			"    All you'd have to do then is enter \u001b[36mWARP SECRET LAB\u001b[0m into\nthe console, and you'll zip right to where I am now.",
			' ',
		],
		options: [
			{
				label: "But can't you warp out here? Why do I need to come to you?",
				script: 'ch2_lambda_round_4d',
			},
		],
		name: 'ch2-parts-list.mgs:426:2',
	},
	'ch2-parts-list.mgs:437:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: But can't you warp out here? Why do I need to come to\nyou?",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: It's... well, it's all very complicated, %PLAYER%.\nLike I said, I'll explain once you get here.",
			"    I'll... uh, I guess I'll see you soon. Good luck.",
			' ',
		],
		name: 'ch2-parts-list.mgs:437:2',
	},
	'ch2-parts-list.mgs:464:3': {
		messages: [
			"You look at the \u001b[35mmonitor\u001b[0m: a modestly large flat screen\nmonitor or television. The casing feels flimsy in your\nhands, but since the screen is unpowered, you can't judge\nits image quality at the moment.",
		],
		name: 'ch2-parts-list.mgs:464:3',
	},
	'ch2-parts-list.mgs:460:3': {
		messages: [
			"You look at the \u001b[35mmonitor\u001b[0m: a modestly large flat screen\nmonitor or television. The colors are crispy enough, though\nthere's a dead pixel in the lower-right corner.",
		],
		name: 'ch2-parts-list.mgs:460:3',
	},
	'ch2-parts-list.mgs:471:2': {
		messages: [
			'You look at the \u001b[35mheat sink\u001b[0m: a bizarre bank of metal prongs,\nlike a tuning fork crossed with a head of broccoli.',
		],
		name: 'ch2-parts-list.mgs:471:2',
	},
	'ch2-parts-list.mgs:477:2': {
		messages: [
			"You look at the can of \u001b[35mCactus Cooler\u001b[0m: a mundane aluminum can\nof soda -- apparently some kind of pineapple-orange\nconcoction, vaguely desert themed. It's still cold.",
		],
		name: 'ch2-parts-list.mgs:477:2',
	},
	'ch2-parts-list.mgs:483:2': {
		messages: [
			'You look at the \u001b[35mpower supply\u001b[0m: an enigmatic box with a grill\nand a fan right underneath. A beefy cable sticks out of the\nside.',
		],
		name: 'ch2-parts-list.mgs:483:2',
	},
	'ch2-parts-list.mgs:489:2': {
		messages: [
			"You look at the \u001b[35mkeyboard\u001b[0m -- that is, the \u001b[35mkeytar\u001b[0m: there's the\nnormal piano-type keys, but there's assorted buttons\nscattered around the frame, too -- though these are not\nentirely labeled.",
		],
		name: 'ch2-parts-list.mgs:489:2',
	},
	'ch2-parts-list.mgs:495:2': {
		messages: [
			'You look at the \u001b[35mmouse\u001b[0m: black, round, with two buttons and a\nscroll wheel. It lacks a wire, but comes with a dongle\nsidekick.',
		],
		name: 'ch2-parts-list.mgs:495:2',
	},
	'ch2-parts-list.mgs:501:2': {
		messages: [
			'You look at the \u001b[35mhard drive\u001b[0m: a magical fusion of a dinner\nplate and a phonograph needle, the sight of which is somehow\nimpossible to put into words.',
		],
		name: 'ch2-parts-list.mgs:501:2',
	},
	'ch2-parts-list.mgs:507:2': {
		messages: [
			'You look at the \u001b[35mplate\u001b[0m: a fancy orange dinner plate, with\ninlaid gold around the rim.',
		],
		name: 'ch2-parts-list.mgs:507:2',
	},
	'ch2-parts-list.mgs:513:2': {
		messages: [
			'You look at the \u001b[35mneedle\u001b[0m: an ordinary phonograph needle, meant\nfor being drawn across a vinyl record.',
		],
		name: 'ch2-parts-list.mgs:513:2',
	},
	'ch2-parts-list.mgs:519:2': {
		messages: [
			'You look at the \u001b[35mRAM chips\u001b[0m: a super beefy, super spicy, super\npoofy bag of silicon chips. You wonder if they make Cool\nRanch RAM.',
		],
		name: 'ch2-parts-list.mgs:519:2',
	},
	'ch2-parts-list.mgs:530:3': {
		messages: [
			"You look at the \u001b[35mclock\u001b[0m: a giant grandfather clock that's\ndefinitely larger than you. Never mind how it fits in your\npocket.",
		],
		name: 'ch2-parts-list.mgs:530:3',
	},
	'ch2-parts-list.mgs:526:3': {
		messages: [
			"You look at the \u001b[35mclock\u001b[0m: a giant grandfather clock that's\ndefinitely larger than you. Never mind how it could fit in\nyour pocket.",
		],
		name: 'ch2-parts-list.mgs:526:3',
	},
	'ch2-parts-list.mgs:537:2': {
		messages: [
			'You look at the \u001b[35mCPU\u001b[0m -- and are amazed at how classy the\ngoldfish looks after having been soldered with the abacus.\nIt defies description. Aurelius is really taking this\nseriously.',
		],
		name: 'ch2-parts-list.mgs:537:2',
	},
	'ch2-parts-list.mgs:543:2': {
		messages: [
			'You look at the \u001b[35mgoldfish\u001b[0m: a small orange koi inside a\nstandard goldfish bowl, complete with plastic decorations.\nAurelius has a patient eye fixed upon you.',
		],
		name: 'ch2-parts-list.mgs:543:2',
	},
	'ch2-parts-list.mgs:549:2': {
		messages: [
			"You look at the \u001b[35mmanual\u001b[0m: a modest-sized book depicting a\nsophisticated calculator. Overall, you're left with\nconfusion as to why a calculator would require a whole book\nto use it properly.",
		],
		name: 'ch2-parts-list.mgs:549:2',
	},
	'ch2-parts-list.mgs:555:2': {
		messages: [
			'You look at the \u001b[35mabacus\u001b[0m: a few dozen black beads set into\nrods on a wooden frame.',
		],
		name: 'ch2-parts-list.mgs:555:2',
	},
	'ch2-parts-list.mgs:561:2': {
		messages: [
			'You look at the CD containing the \u001b[35mmainframe OS\u001b[0m: the label is\ncompletely white, with no markings or writing on the top.\nThe reverse side is very clean, and it makes patterns of\nreflected light when you angle it against the light.',
		],
		name: 'ch2-parts-list.mgs:561:2',
	},
	newline: {
		messages: ['\n'],
		name: 'newline',
	},
	space: {
		messages: [' '],
		name: 'space',
	},
	dot: {
		messages: ['.'],
		name: 'dot',
	},
	player: {
		messages: ['\u001b[36m@\u001b[0m'],
		name: 'player',
	},
	item: {
		messages: ['\u001b[32m?\u001b[0m'],
		name: 'item',
	},
	'ch2-serial-map.mgs:10:2': {
		messages: ['-------------------------------'],
		name: 'ch2-serial-map.mgs:10:2',
	},
	'ch2-serial-map.mgs:14:2': {
		messages: ['|  '],
		name: 'ch2-serial-map.mgs:14:2',
	},
	'ch2-serial-map.mgs:18:3': {
		messages: ['      '],
		name: 'ch2-serial-map.mgs:18:3',
	},
	'ch2-serial-map.mgs:16:3': {
		messages: ['/----\\'],
		name: 'ch2-serial-map.mgs:16:3',
	},
	'ch2-serial-map.mgs:20:2': {
		messages: ['      '],
		name: 'ch2-serial-map.mgs:20:2',
	},
	'ch2-serial-map.mgs:24:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:24:3',
	},
	'ch2-serial-map.mgs:22:3': {
		messages: ['-'],
		name: 'ch2-serial-map.mgs:22:3',
	},
	'ch2-serial-map.mgs:26:2': {
		messages: ['      CASTLE  |'],
		name: 'ch2-serial-map.mgs:26:2',
	},
	'ch2-serial-map.mgs:30:2': {
		messages: ['|  '],
		name: 'ch2-serial-map.mgs:30:2',
	},
	'ch2-serial-map.mgs:34:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:34:3',
	},
	'ch2-serial-map.mgs:32:3': {
		messages: ['|.'],
		name: 'ch2-serial-map.mgs:32:3',
	},
	'ch2-serial-map.mgs:57:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:57:3',
	},
	'ch2-serial-map.mgs:55:3': {
		messages: ['.|'],
		name: 'ch2-serial-map.mgs:55:3',
	},
	'ch2-serial-map.mgs:59:2': {
		messages: ['     '],
		name: 'ch2-serial-map.mgs:59:2',
	},
	'ch2-serial-map.mgs:63:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:63:3',
	},
	'ch2-serial-map.mgs:61:3': {
		messages: ['/.\\'],
		name: 'ch2-serial-map.mgs:61:3',
	},
	'ch2-serial-map.mgs:65:2': {
		messages: ['        MAP  |'],
		name: 'ch2-serial-map.mgs:65:2',
	},
	'ch2-serial-map.mgs:69:2': {
		messages: ['|  '],
		name: 'ch2-serial-map.mgs:69:2',
	},
	'ch2-serial-map.mgs:73:3': {
		messages: ['      '],
		name: 'ch2-serial-map.mgs:73:3',
	},
	'ch2-serial-map.mgs:71:3': {
		messages: ['------'],
		name: 'ch2-serial-map.mgs:71:3',
	},
	'ch2-serial-map.mgs:75:2': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:75:2',
	},
	'ch2-serial-map.mgs:79:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:79:3',
	},
	'ch2-serial-map.mgs:77:3': {
		messages: ['/..'],
		name: 'ch2-serial-map.mgs:77:3',
	},
	'ch2-serial-map.mgs:102:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:102:3',
	},
	'ch2-serial-map.mgs:100:3': {
		messages: ['.\\'],
		name: 'ch2-serial-map.mgs:100:3',
	},
	'ch2-serial-map.mgs:104:2': {
		messages: ['           |'],
		name: 'ch2-serial-map.mgs:104:2',
	},
	'ch2-serial-map.mgs:108:2': {
		messages: ['|           '],
		name: 'ch2-serial-map.mgs:108:2',
	},
	'ch2-serial-map.mgs:112:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:112:3',
	},
	'ch2-serial-map.mgs:110:3': {
		messages: ['-'],
		name: 'ch2-serial-map.mgs:110:3',
	},
	'ch2-serial-map.mgs:117:3': {
		messages: ['     '],
		name: 'ch2-serial-map.mgs:117:3',
	},
	'ch2-serial-map.mgs:115:3': {
		messages: ['--+--'],
		name: 'ch2-serial-map.mgs:115:3',
	},
	'ch2-serial-map.mgs:122:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:122:3',
	},
	'ch2-serial-map.mgs:120:3': {
		messages: ['-'],
		name: 'ch2-serial-map.mgs:120:3',
	},
	'ch2-serial-map.mgs:124:2': {
		messages: ['           |'],
		name: 'ch2-serial-map.mgs:124:2',
	},
	'ch2-serial-map.mgs:128:2': {
		messages: ['|            '],
		name: 'ch2-serial-map.mgs:128:2',
	},
	'ch2-serial-map.mgs:132:3': {
		messages: ['     '],
		name: 'ch2-serial-map.mgs:132:3',
	},
	'ch2-serial-map.mgs:130:3': {
		messages: ['|...|'],
		name: 'ch2-serial-map.mgs:130:3',
	},
	'ch2-serial-map.mgs:134:2': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:134:2',
	},
	'ch2-serial-map.mgs:138:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:138:3',
	},
	'ch2-serial-map.mgs:136:3': {
		messages: ['---'],
		name: 'ch2-serial-map.mgs:136:3',
	},
	'ch2-serial-map.mgs:143:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:143:3',
	},
	'ch2-serial-map.mgs:141:3': {
		messages: ['-'],
		name: 'ch2-serial-map.mgs:141:3',
	},
	'ch2-serial-map.mgs:148:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:148:3',
	},
	'ch2-serial-map.mgs:146:3': {
		messages: ['---'],
		name: 'ch2-serial-map.mgs:146:3',
	},
	'ch2-serial-map.mgs:150:2': {
		messages: ['  |'],
		name: 'ch2-serial-map.mgs:150:2',
	},
	'ch2-serial-map.mgs:154:2': {
		messages: ['|   '],
		name: 'ch2-serial-map.mgs:154:2',
	},
	'ch2-serial-map.mgs:158:3': {
		messages: ['     '],
		name: 'ch2-serial-map.mgs:158:3',
	},
	'ch2-serial-map.mgs:156:3': {
		messages: ['-----'],
		name: 'ch2-serial-map.mgs:156:3',
	},
	'ch2-serial-map.mgs:160:2': {
		messages: ['    '],
		name: 'ch2-serial-map.mgs:160:2',
	},
	'ch2-serial-map.mgs:164:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:164:3',
	},
	'ch2-serial-map.mgs:162:3': {
		messages: ['|.'],
		name: 'ch2-serial-map.mgs:162:3',
	},
	'ch2-serial-map.mgs:178:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:178:3',
	},
	'ch2-serial-map.mgs:176:3': {
		messages: ['.|'],
		name: 'ch2-serial-map.mgs:176:3',
	},
	'ch2-serial-map.mgs:180:2': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:180:2',
	},
	'ch2-serial-map.mgs:184:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:184:3',
	},
	'ch2-serial-map.mgs:182:3': {
		messages: ['|'],
		name: 'ch2-serial-map.mgs:182:3',
	},
	'ch2-serial-map.mgs:207:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:207:3',
	},
	'ch2-serial-map.mgs:205:3': {
		messages: ['|'],
		name: 'ch2-serial-map.mgs:205:3',
	},
	'ch2-serial-map.mgs:230:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:230:3',
	},
	'ch2-serial-map.mgs:228:3': {
		messages: ['|'],
		name: 'ch2-serial-map.mgs:228:3',
	},
	'ch2-serial-map.mgs:232:2': {
		messages: ['  |'],
		name: 'ch2-serial-map.mgs:232:2',
	},
	'ch2-serial-map.mgs:236:2': {
		messages: ['|  '],
		name: 'ch2-serial-map.mgs:236:2',
	},
	'ch2-serial-map.mgs:240:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:240:3',
	},
	'ch2-serial-map.mgs:238:3': {
		messages: ['/..'],
		name: 'ch2-serial-map.mgs:238:3',
	},
	'ch2-serial-map.mgs:254:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:254:3',
	},
	'ch2-serial-map.mgs:252:3': {
		messages: ['..\\'],
		name: 'ch2-serial-map.mgs:252:3',
	},
	'ch2-serial-map.mgs:256:2': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:256:2',
	},
	'ch2-serial-map.mgs:260:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:260:3',
	},
	'ch2-serial-map.mgs:258:3': {
		messages: ['|.'],
		name: 'ch2-serial-map.mgs:258:3',
	},
	'ch2-serial-map.mgs:274:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:274:3',
	},
	'ch2-serial-map.mgs:272:3': {
		messages: ['.|'],
		name: 'ch2-serial-map.mgs:272:3',
	},
	'ch2-serial-map.mgs:276:2': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:276:2',
	},
	'ch2-serial-map.mgs:280:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:280:3',
	},
	'ch2-serial-map.mgs:278:3': {
		messages: ['-'],
		name: 'ch2-serial-map.mgs:278:3',
	},
	'ch2-serial-map.mgs:285:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:285:3',
	},
	'ch2-serial-map.mgs:283:3': {
		messages: ['-+'],
		name: 'ch2-serial-map.mgs:283:3',
	},
	'ch2-serial-map.mgs:290:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:290:3',
	},
	'ch2-serial-map.mgs:288:3': {
		messages: ['-'],
		name: 'ch2-serial-map.mgs:288:3',
	},
	'ch2-serial-map.mgs:295:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:295:3',
	},
	'ch2-serial-map.mgs:293:3': {
		messages: ['+-'],
		name: 'ch2-serial-map.mgs:293:3',
	},
	'ch2-serial-map.mgs:300:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:300:3',
	},
	'ch2-serial-map.mgs:298:3': {
		messages: ['-'],
		name: 'ch2-serial-map.mgs:298:3',
	},
	'ch2-serial-map.mgs:302:2': {
		messages: ['  |'],
		name: 'ch2-serial-map.mgs:302:2',
	},
	'ch2-serial-map.mgs:306:2': {
		messages: ['|  '],
		name: 'ch2-serial-map.mgs:306:2',
	},
	'ch2-serial-map.mgs:310:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:310:3',
	},
	'ch2-serial-map.mgs:308:3': {
		messages: ['\\..'],
		name: 'ch2-serial-map.mgs:308:3',
	},
	'ch2-serial-map.mgs:324:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:324:3',
	},
	'ch2-serial-map.mgs:322:3': {
		messages: ['../'],
		name: 'ch2-serial-map.mgs:322:3',
	},
	'ch2-serial-map.mgs:326:2': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:326:2',
	},
	'ch2-serial-map.mgs:330:3': {
		messages: ['     '],
		name: 'ch2-serial-map.mgs:330:3',
	},
	'ch2-serial-map.mgs:328:3': {
		messages: ['|...|'],
		name: 'ch2-serial-map.mgs:328:3',
	},
	'ch2-serial-map.mgs:332:2': {
		messages: ['    '],
		name: 'ch2-serial-map.mgs:332:2',
	},
	'ch2-serial-map.mgs:336:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:336:3',
	},
	'ch2-serial-map.mgs:334:3': {
		messages: ['|.'],
		name: 'ch2-serial-map.mgs:334:3',
	},
	'ch2-serial-map.mgs:350:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:350:3',
	},
	'ch2-serial-map.mgs:348:3': {
		messages: ['.|'],
		name: 'ch2-serial-map.mgs:348:3',
	},
	'ch2-serial-map.mgs:352:2': {
		messages: ['   |'],
		name: 'ch2-serial-map.mgs:352:2',
	},
	'ch2-serial-map.mgs:356:2': {
		messages: ['|   '],
		name: 'ch2-serial-map.mgs:356:2',
	},
	'ch2-serial-map.mgs:360:3': {
		messages: ['     '],
		name: 'ch2-serial-map.mgs:360:3',
	},
	'ch2-serial-map.mgs:358:3': {
		messages: ['--+--'],
		name: 'ch2-serial-map.mgs:358:3',
	},
	'ch2-serial-map.mgs:362:2': {
		messages: ['    '],
		name: 'ch2-serial-map.mgs:362:2',
	},
	'ch2-serial-map.mgs:366:3': {
		messages: ['    '],
		name: 'ch2-serial-map.mgs:366:3',
	},
	'ch2-serial-map.mgs:364:3': {
		messages: ['--+-'],
		name: 'ch2-serial-map.mgs:364:3',
	},
	'ch2-serial-map.mgs:371:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:371:3',
	},
	'ch2-serial-map.mgs:369:3': {
		messages: ['-'],
		name: 'ch2-serial-map.mgs:369:3',
	},
	'ch2-serial-map.mgs:376:3': {
		messages: ['    '],
		name: 'ch2-serial-map.mgs:376:3',
	},
	'ch2-serial-map.mgs:374:3': {
		messages: ['----'],
		name: 'ch2-serial-map.mgs:374:3',
	},
	'ch2-serial-map.mgs:381:3': {
		messages: ['     '],
		name: 'ch2-serial-map.mgs:381:3',
	},
	'ch2-serial-map.mgs:379:3': {
		messages: ['--+--'],
		name: 'ch2-serial-map.mgs:379:3',
	},
	'ch2-serial-map.mgs:383:2': {
		messages: ['   |'],
		name: 'ch2-serial-map.mgs:383:2',
	},
	'ch2-serial-map.mgs:386:4': {
		messages: ["   \u001b[32m?\u001b[0m Look for \u001b[35mFrankie's\u001b[0m"],
		name: 'ch2-serial-map.mgs:386:4',
	},
	'ch2-serial-map.mgs:392:2': {
		messages: ['|   '],
		name: 'ch2-serial-map.mgs:392:2',
	},
	'ch2-serial-map.mgs:396:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:396:3',
	},
	'ch2-serial-map.mgs:394:3': {
		messages: ['|.'],
		name: 'ch2-serial-map.mgs:394:3',
	},
	'ch2-serial-map.mgs:419:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:419:3',
	},
	'ch2-serial-map.mgs:417:3': {
		messages: ['|'],
		name: 'ch2-serial-map.mgs:417:3',
	},
	'ch2-serial-map.mgs:421:2': {
		messages: ['    '],
		name: 'ch2-serial-map.mgs:421:2',
	},
	'ch2-serial-map.mgs:425:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:425:3',
	},
	'ch2-serial-map.mgs:423:3': {
		messages: ['|.'],
		name: 'ch2-serial-map.mgs:423:3',
	},
	'ch2-serial-map.mgs:448:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:448:3',
	},
	'ch2-serial-map.mgs:446:3': {
		messages: ['+'],
		name: 'ch2-serial-map.mgs:446:3',
	},
	'ch2-serial-map.mgs:453:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:453:3',
	},
	'ch2-serial-map.mgs:451:3': {
		messages: ['...'],
		name: 'ch2-serial-map.mgs:451:3',
	},
	'ch2-serial-map.mgs:467:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:467:3',
	},
	'ch2-serial-map.mgs:465:3': {
		messages: ['.'],
		name: 'ch2-serial-map.mgs:465:3',
	},
	'ch2-serial-map.mgs:481:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:481:3',
	},
	'ch2-serial-map.mgs:479:3': {
		messages: ['..|'],
		name: 'ch2-serial-map.mgs:479:3',
	},
	'ch2-serial-map.mgs:483:2': {
		messages: ['   |'],
		name: 'ch2-serial-map.mgs:483:2',
	},
	'ch2-serial-map.mgs:486:4': {
		messages: ['   \u001b[35mcalculator manual\u001b[0m'],
		name: 'ch2-serial-map.mgs:486:4',
	},
	'ch2-serial-map.mgs:492:2': {
		messages: ['|   '],
		name: 'ch2-serial-map.mgs:492:2',
	},
	'ch2-serial-map.mgs:496:3': {
		messages: ['     '],
		name: 'ch2-serial-map.mgs:496:3',
	},
	'ch2-serial-map.mgs:494:3': {
		messages: ['--+--'],
		name: 'ch2-serial-map.mgs:494:3',
	},
	'ch2-serial-map.mgs:501:3': {
		messages: ['    '],
		name: 'ch2-serial-map.mgs:501:3',
	},
	'ch2-serial-map.mgs:499:3': {
		messages: ['----'],
		name: 'ch2-serial-map.mgs:499:3',
	},
	'ch2-serial-map.mgs:506:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:506:3',
	},
	'ch2-serial-map.mgs:504:3': {
		messages: ['-'],
		name: 'ch2-serial-map.mgs:504:3',
	},
	'ch2-serial-map.mgs:511:3': {
		messages: ['   '],
		name: 'ch2-serial-map.mgs:511:3',
	},
	'ch2-serial-map.mgs:509:3': {
		messages: ['-+-'],
		name: 'ch2-serial-map.mgs:509:3',
	},
	'ch2-serial-map.mgs:516:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:516:3',
	},
	'ch2-serial-map.mgs:514:3': {
		messages: ['-'],
		name: 'ch2-serial-map.mgs:514:3',
	},
	'ch2-serial-map.mgs:521:3': {
		messages: ['         '],
		name: 'ch2-serial-map.mgs:521:3',
	},
	'ch2-serial-map.mgs:519:3': {
		messages: ['---------'],
		name: 'ch2-serial-map.mgs:519:3',
	},
	'ch2-serial-map.mgs:523:2': {
		messages: ['   |'],
		name: 'ch2-serial-map.mgs:523:2',
	},
	'ch2-serial-map.mgs:526:4': {
		messages: ['   in the library in town.'],
		name: 'ch2-serial-map.mgs:526:4',
	},
	'ch2-serial-map.mgs:532:2': {
		messages: ['|   '],
		name: 'ch2-serial-map.mgs:532:2',
	},
	'ch2-serial-map.mgs:536:3': {
		messages: ['    '],
		name: 'ch2-serial-map.mgs:536:3',
	},
	'ch2-serial-map.mgs:534:3': {
		messages: ['|...'],
		name: 'ch2-serial-map.mgs:534:3',
	},
	'ch2-serial-map.mgs:550:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:550:3',
	},
	'ch2-serial-map.mgs:548:3': {
		messages: ['.'],
		name: 'ch2-serial-map.mgs:548:3',
	},
	'ch2-serial-map.mgs:564:3': {
		messages: ['  '],
		name: 'ch2-serial-map.mgs:564:3',
	},
	'ch2-serial-map.mgs:562:3': {
		messages: ['..'],
		name: 'ch2-serial-map.mgs:562:3',
	},
	'ch2-serial-map.mgs:569:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:569:3',
	},
	'ch2-serial-map.mgs:567:3': {
		messages: ['+'],
		name: 'ch2-serial-map.mgs:567:3',
	},
	'ch2-serial-map.mgs:574:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:574:3',
	},
	'ch2-serial-map.mgs:572:3': {
		messages: ['.'],
		name: 'ch2-serial-map.mgs:572:3',
	},
	'ch2-serial-map.mgs:597:3': {
		messages: [' '],
		name: 'ch2-serial-map.mgs:597:3',
	},
	'ch2-serial-map.mgs:595:3': {
		messages: ['|'],
		name: 'ch2-serial-map.mgs:595:3',
	},
	'ch2-serial-map.mgs:599:2': {
		messages: ['            |'],
		name: 'ch2-serial-map.mgs:599:2',
	},
	'ch2-serial-map.mgs:603:2': {
		messages: ['|   '],
		name: 'ch2-serial-map.mgs:603:2',
	},
	'ch2-serial-map.mgs:607:3': {
		messages: ['       '],
		name: 'ch2-serial-map.mgs:607:3',
	},
	'ch2-serial-map.mgs:605:3': {
		messages: ['-------'],
		name: 'ch2-serial-map.mgs:605:3',
	},
	'ch2-serial-map.mgs:609:2': {
		messages: ['----+----          |'],
		name: 'ch2-serial-map.mgs:609:2',
	},
	'ch2-serial-map.mgs:611:3': {
		messages: ['   \u001b[32m?\u001b[0m Look for \u001b[35mCactus Cooler\u001b[0m'],
		name: 'ch2-serial-map.mgs:611:3',
	},
	'ch2-serial-map.mgs:613:3': {
		messages: ['   \u001b[32m?\u001b[0m Ask \u001b[35mStone Cold Bob Austin\u001b[0m'],
		name: 'ch2-serial-map.mgs:613:3',
	},
	'ch2-serial-map.mgs:615:3': {
		messages: ['   \u001b[32m?\u001b[0m Look for \u001b[35mSea Moss\u001b[0m'],
		name: 'ch2-serial-map.mgs:615:3',
	},
	'ch2-serial-map.mgs:617:3': {
		messages: ["   \u001b[32m?\u001b[0m Look for \u001b[35mFrankie's\u001b[0m"],
		name: 'ch2-serial-map.mgs:617:3',
	},
	'ch2-serial-map.mgs:622:2': {
		messages: ['|          |...'],
		name: 'ch2-serial-map.mgs:622:2',
	},
	'ch2-serial-map.mgs:632:2': {
		messages: ['...|          |'],
		name: 'ch2-serial-map.mgs:632:2',
	},
	'ch2-serial-map.mgs:634:3': {
		messages: ['   somewhere they keep'],
		name: 'ch2-serial-map.mgs:634:3',
	},
	'ch2-serial-map.mgs:636:3': {
		messages: ['   about Cactus Cooler; he brings'],
		name: 'ch2-serial-map.mgs:636:3',
	},
	'ch2-serial-map.mgs:638:3': {
		messages: ['   somewhere in the east wing'],
		name: 'ch2-serial-map.mgs:638:3',
	},
	'ch2-serial-map.mgs:640:3': {
		messages: ['   \u001b[35mcalculator manual\u001b[0m'],
		name: 'ch2-serial-map.mgs:640:3',
	},
	'ch2-serial-map.mgs:645:2': {
		messages: ['|          ----+----          |'],
		name: 'ch2-serial-map.mgs:645:2',
	},
	'ch2-serial-map.mgs:647:3': {
		messages: ['   refreshments or drinks.'],
		name: 'ch2-serial-map.mgs:647:3',
	},
	'ch2-serial-map.mgs:649:3': {
		messages: ['   loads to all his parties.'],
		name: 'ch2-serial-map.mgs:649:3',
	},
	'ch2-serial-map.mgs:651:3': {
		messages: ['   of the castle.'],
		name: 'ch2-serial-map.mgs:651:3',
	},
	'ch2-serial-map.mgs:653:3': {
		messages: ['   in the library in town.'],
		name: 'ch2-serial-map.mgs:653:3',
	},
	'ch2-serial-map.mgs:658:2': {
		messages: ['-------------------------------'],
		name: 'ch2-serial-map.mgs:658:2',
	},
	'ch2-serial-toot.mgs:8:2': {
		messages: ["\u001b[35mLAMBDA\u001b[0m: Let's pick up where we left off, shall we?"],
		name: 'ch2-serial-toot.mgs:8:2',
	},
	'ch2-serial-toot.mgs:18:3': {
		messages: [
			"\u001b[31mDEBUG>\u001b[0m: Welp, you've done something strange!",
			"    Variable 'ch2_toot_level' is $ch2_toot_level$",
			"    Script: 'ch2_toot_check'",
		],
		name: 'ch2-serial-toot.mgs:18:3',
	},
	'ch2-serial-toot.mgs:31:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Ahh, this is much more comfortable, isn't it?",
			"    So, yeah. You can type things into the console, and\ninteresting things will happen. First, let's try something\nbasic.",
		],
		name: 'ch2-serial-toot.mgs:31:2',
	},
	'ch2-serial-toot.mgs:42:2': {
		messages: ['    Try to choose one of the following options with the\nkeyboard.', ' '],
		name: 'ch2-serial-toot.mgs:42:2',
	},
	'ch2-serial-toot.mgs:50:2': {
		messages: ['(Type one of the numbers shown to choose that dialog\noption.)'],
		options: [
			{
				label: "Okay, I'll try.",
				script: 'ch2_toot_step1_okay',
			},
			{
				label: 'Make me.',
				script: 'ch2_toot_step1_notokay',
			},
		],
		name: 'ch2-serial-toot.mgs:50:2',
	},
	'ch2-serial-toot.mgs:59:2': {
		messages: ['\u001b[35mLAMBDA\u001b[0m: Good job!'],
		name: 'ch2-serial-toot.mgs:59:2',
	},
	'ch2-serial-toot.mgs:67:2': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Haha, well, that was a little aggressive, but well\ndone.',
		],
		name: 'ch2-serial-toot.mgs:67:2',
	},
	'ch2-serial-toot.mgs:74:2': {
		messages: [
			'    Note that dialog options begin with "0" instead of "1".\nThat\'s for "\u001b[1mcomputer reasons\u001b[0m."',
		],
		name: 'ch2-serial-toot.mgs:74:2',
	},
	'ch2-serial-toot.mgs:84:2': {
		messages: [
			'    So, um, the second type of dialog response is more "free\nform". For these, you can type whatever you want to advance\nthe conversation, but only some responses will have a useful\nresult.',
			'    Does that make sense?',
			' ',
		],
		name: 'ch2-serial-toot.mgs:84:2',
	},
	'ch2-serial-toot.mgs:93:2': {
		messages: ['(Type \u001b[36mYES\u001b[0m or \u001b[36mNO\u001b[0m)'],
		text_options: {
			SURE: 'ch2_toot_step2_yes_extra',
			YEAH: 'ch2_toot_step2_yes_extra',
			YAH: 'ch2_toot_step2_yes_extra',
			YA: 'ch2_toot_step2_yes_extra',
			YES: 'ch2_toot_step2_yes',
			YE: 'ch2_toot_step2_yes_extra',
			Y: 'ch2_toot_step2_yes_extra',
			NAH: 'ch2_toot_step2_no_extra',
			NO: 'ch2_toot_step2_no',
			N: 'ch2_toot_step2_no_extra',
		},
		name: 'ch2-serial-toot.mgs:93:2',
	},
	'ch2-serial-toot.mgs:107:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Sorry, that wasn't one of the choices! Want to try\nagain?",
			' ',
		],
		name: 'ch2-serial-toot.mgs:107:2',
	},
	'ch2-serial-toot.mgs:116:2': {
		messages: ["\u001b[35mLAMBDA\u001b[0m: Excellent! You've got it!"],
		name: 'ch2-serial-toot.mgs:116:2',
	},
	'ch2-serial-toot.mgs:124:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Excellent! You've also discovered that sometimes you\ncan type something a little different and still achieve your\ngoal, like typing \u001b[36mY\u001b[0m instead of \u001b[36mYES\u001b[0m.",
		],
		name: 'ch2-serial-toot.mgs:124:2',
	},
	'ch2-serial-toot.mgs:132:2': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Haha, you say that, but you clearly understand! Good\njob!',
		],
		name: 'ch2-serial-toot.mgs:132:2',
	},
	'ch2-serial-toot.mgs:140:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Well, you seem to understand, anyway! You've also\ndiscovered that sometimes you can type something a little\ndifferent and still achieve your goal, like typing \u001b[36mN\u001b[0m instead\nof \u001b[36mNO\u001b[0m.",
		],
		name: 'ch2-serial-toot.mgs:140:2',
	},
	'ch2-serial-toot.mgs:147:2': {
		messages: [
			'    Some free response options are left undisclosed, so feel\nfree to experiment when given a free response prompt.',
		],
		name: 'ch2-serial-toot.mgs:147:2',
	},
	'ch2-serial-toot.mgs:157:2': {
		messages: [
			'    Lastly, when you\'re not in a conversation with someone\nelse, you can use the artifact to run simple commands. You\nmight think of them as "magic words."',
			' ',
			'(Choose an option:)',
		],
		options: [
			{
				label: '"Magic words?" Neat!',
				script: 'ch2_toot_step3_magic',
			},
			{
				label: '"Magic words?" That\'s a bit ridiculous.',
				script: 'ch2_toot_step3_nomagic',
			},
		],
		name: 'ch2-serial-toot.mgs:157:2',
	},
	'ch2-serial-toot.mgs:168:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: "Magic words?" Neat!',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Yeah! Computers are nothing more than melted sand,\nrocks, and tiny bits of lightning, yet we can make them\nperform math and send words and images to someone else far\naway! It really \u001b[1mis\u001b[0m like magic, isn't it?",
		],
		name: 'ch2-serial-toot.mgs:168:2',
	},
	'ch2-serial-toot.mgs:178:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: "Magic words?" That\'s a bit ridiculous.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Sorry, that probably sounded patronizing. Yeah,\nthey're not really magic words, but thinking of them that\nway can make the artifact feel more magical, don't you\nthink?",
		],
		name: 'ch2-serial-toot.mgs:178:2',
	},
	'ch2-serial-toot.mgs:189:2': {
		messages: [
			"    Anyway, I'll wrap things up so you can try some magic\nwords--that is, some serial commands. I'll grant you access\nto a few that should be useful.",
		],
		name: 'ch2-serial-toot.mgs:189:2',
	},
	'ch2-serial-toot.mgs:197:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Let's pick up where we left off, shall we? Don't\nworry, we're almost done.",
		],
		name: 'ch2-serial-toot.mgs:197:2',
	},
	'ch2-serial-toot.mgs:204:2': {
		messages: [
			'    To see a list of the commands you can use, type \u001b[36mHELP\u001b[0m.\nAnd to learn about what a command does, type \u001b[36mMAN\u001b[0m followed by\nthe name of a command.',
			' ',
		],
		options: [
			{
				label: 'Wait, I thought \u001b[36mMAN\u001b[0m was how I talk to \u001b[1myou\u001b[0m.',
				script: 'ch2_toot_step3_end2',
			},
		],
		name: 'ch2-serial-toot.mgs:204:2',
	},
	'ch2-serial-toot.mgs:213:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Wait, I thought \u001b[36mMAN\u001b[0m was how I talk to \u001b[1myou\u001b[0m.',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Yeah, I set it up that way because I thought it\nwould be easy to remember. "Man" is short for "manual," so\nthink of \u001b[36mMAN\u001b[0m as being for times you need long form help.',
		],
		name: 'ch2-serial-toot.mgs:213:2',
	},
	'ch2-serial-toot.mgs:224:2': {
		messages: [
			"    So, um, now that you know the basics of using the\nartifact... I think we should work together to fix the\ncastle mainframe. I'm still not sure whether I can trust\nyou, but... well, now that the castle is half wrecked, I\nthink the mainframe could help clean up some of the damage,\nif nothing else.",
			' ',
		],
		options: [
			{
				label: 'How do we fix the mainframe?',
				script: 'ch2_toot_step4a',
			},
		],
		name: 'ch2-serial-toot.mgs:224:2',
	},
	'ch2-serial-toot.mgs:233:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: How do we fix the mainframe?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: We'll have to \u001b[36mbuild a new computer from scratch\u001b[0m.\nThere's items around the castle we could... um, MacGuyver...\nto build something functional. Most of the parts are less\nthan ideal, but we have little choice right now. I can put\ntogether a parts list.",
			' ',
		],
		options: [
			{
				label: "But I don't know how to build a computer!",
				script: 'ch2_toot_step4b_noob',
			},
			{
				label: "This'll be a cinch!",
				script: 'ch2_toot_step4b_pro',
			},
		],
		name: 'ch2-serial-toot.mgs:233:2',
	},
	'ch2-serial-toot.mgs:245:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: But I don't know how to build a computer!",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Don't worry, I've done it a hundred times. I walk\nyou through the whole thing one part at a time. It's not as\nhard as it sounds.",
			' ',
		],
		options: [
			{
				label: 'Really?',
				script: 'ch2_toot_step5a',
			},
		],
		name: 'ch2-serial-toot.mgs:245:2',
	},
	'ch2-serial-toot.mgs:256:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: This'll be a cinch!",
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Yeah! Building a new computer is never as hard as it\nsounds. And it looks like... yeah, I think we can scavenge\njust enough parts to make this really work.',
			' ',
		],
		options: [
			{
				label: 'Really?',
				script: 'ch2_toot_step5a',
			},
		],
		name: 'ch2-serial-toot.mgs:256:2',
	},
	'ch2-smithfamily.mgs:5:2': {
		messages: [
			"You looked around the\u001b[36mSMITH'S HOUSE\u001b[0m.",
			"    There are faint rubber skid marks on the floor and --\nimpressively -- the ceiling. One of the beds, likely the\nchild's, is more disheveled. Still, Mr. %Smith% does well to\nkeep the rest of the house tidy.",
			' ',
		],
		name: 'ch2-smithfamily.mgs:5:2',
	},
	'ch2-smithfamily.mgs:14:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			"    The child does not seem distressed that he has taken the\nform of sports equipment. On the contrary, best you can\ntell, he's elated. You shoot him a thumbs up, and he bounces\nup and down slightly.",
		],
		name: 'ch2-smithfamily.mgs:14:2',
	},
	'ch2-smithfamily.mgs:22:2': {
		messages: [
			'You looked at \u001b[35m%SELF%\u001b[0m.',
			"    Your neighbor seems to be taking the status of his son\nin stride. He's as friendly to you as ever, and is\nmaintaining a cheerful -- if slightly baffled -- expression.",
		],
		name: 'ch2-smithfamily.mgs:22:2',
	},
	'ch2-smithfamily.mgs:33:2': {
		messages: ["Entering \u001b[1mSMITH'S HOUSE\u001b[0m..."],
		name: 'ch2-smithfamily.mgs:33:2',
	},
	'ch2-town.mgs:5:2': {
		messages: [
			'You looked around the \u001b[36mTOWN\u001b[0m.',
			"    There's no place like home! You know practically every\npebble on every dirt patch, and every cracked brick in every\nbuilding.",
			' ',
		],
		name: 'ch2-town.mgs:5:2',
	},
	'ch2-town.mgs:30:2': {
		messages: ['Entering \u001b[1mTOWN\u001b[0m...'],
		name: 'ch2-town.mgs:30:2',
	},
	'ch2-town.mgs:124:3': {
		messages: [
			' ',
			'\u001b[33mDEBUG>\u001b[0m town\u001b[0m',
			'\u001b[33m>\u001b[0m \u001b[36mCUTBUG\u001b[0m: use player Y position for test',
			'\u001b[33m>\u001b[0m \u001b[36mCUTBUG AUTO\u001b[0m: run cutbugs 0-1030',
		],
		name: 'ch2-town.mgs:124:3',
	},
	'ch2-town.mgs:254:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    A worn wooden sign featuring the words "to King Gibson\'s\npalace" -- but "palace" is crossed out, and "castle" is\nscrawled above it.',
		],
		name: 'ch2-town.mgs:254:2',
	},
	'ch2-town.mgs:261:2': {
		messages: [
			'You looked at the \u001b[35m%SELF%\u001b[0m.',
			'    A worn wooden sign that says "LINQ PARKING."',
		],
		name: 'ch2-town.mgs:261:2',
	},
	'cutbug-test.mgs:15:5': {
		messages: ['\u001b[36mCUTBUG!\u001b[0m '],
		name: 'cutbug-test.mgs:15:5',
	},
	'cutbug-test.mgs:19:9': {
		messages: ['000'],
		name: 'cutbug-test.mgs:19:9',
	},
	'cutbug-test.mgs:23:9': {
		messages: ['00'],
		name: 'cutbug-test.mgs:23:9',
	},
	'cutbug-test.mgs:27:9': {
		messages: ['0'],
		name: 'cutbug-test.mgs:27:9',
	},
	'cutbug-test.mgs:31:5': {
		messages: ['$qty$\n'],
		name: 'cutbug-test.mgs:31:5',
	},
	'cutbug-test.mgs:39:13': {
		messages: ['\n'],
		name: 'cutbug-test.mgs:39:13',
	},
	'cutbug-test.mgs:41:13': {
		messages: ['1'],
		name: 'cutbug-test.mgs:41:13',
	},
	'cutbug-test.mgs:43:13': {
		messages: ['2'],
		name: 'cutbug-test.mgs:43:13',
	},
	'cutbug-test.mgs:45:13': {
		messages: ['3'],
		name: 'cutbug-test.mgs:45:13',
	},
	'cutbug-test.mgs:47:13': {
		messages: ['4'],
		name: 'cutbug-test.mgs:47:13',
	},
	'cutbug-test.mgs:49:13': {
		messages: ['5'],
		name: 'cutbug-test.mgs:49:13',
	},
	'cutbug-test.mgs:51:13': {
		messages: ['6'],
		name: 'cutbug-test.mgs:51:13',
	},
	'cutbug-test.mgs:53:13': {
		messages: ['7'],
		name: 'cutbug-test.mgs:53:13',
	},
	'cutbug-test.mgs:55:13': {
		messages: ['8'],
		name: 'cutbug-test.mgs:55:13',
	},
	'cutbug-test.mgs:57:13': {
		messages: ['9'],
		name: 'cutbug-test.mgs:57:13',
	},
	'cutbug-test.mgs:59:13': {
		messages: ['A'],
		name: 'cutbug-test.mgs:59:13',
	},
	'cutbug-test.mgs:61:13': {
		messages: ['B'],
		name: 'cutbug-test.mgs:61:13',
	},
	'cutbug-test.mgs:63:13': {
		messages: ['C'],
		name: 'cutbug-test.mgs:63:13',
	},
	'cutbug-test.mgs:65:13': {
		messages: ['D'],
		name: 'cutbug-test.mgs:65:13',
	},
	'cutbug-test.mgs:67:13': {
		messages: ['E'],
		name: 'cutbug-test.mgs:67:13',
	},
	'cutbug-test.mgs:69:13': {
		messages: ['F'],
		name: 'cutbug-test.mgs:69:13',
	},
	'command-colors.mgs:14:2': {
		messages: [
			'This is a test of the MGE ANSI color system!',
			'Also see options: bg, bold, dim',
			' ',
			'\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m',
		],
		name: 'command-colors.mgs:14:2',
	},
	'command-colors.mgs:23:2': {
		messages: [
			'MGE ANSI color test: "bg"',
			'\u001b[47m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-white',
			'\u001b[41m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-red',
			'\u001b[43m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-yellow',
			'\u001b[42m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-green',
			'\u001b[46m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-cyan',
			'\u001b[44m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-blue',
			'\u001b[45m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-magenta',
			'\u001b[40m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-black',
		],
		name: 'command-colors.mgs:23:2',
	},
	'command-colors.mgs:37:2': {
		messages: [
			'MGE ANSI color test: "bold"',
			'\u001b[1m\u001b[47m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-white',
			'\u001b[1m\u001b[41m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-red',
			'\u001b[1m\u001b[43m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-yellow',
			'\u001b[1m\u001b[42m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-green',
			'\u001b[1m\u001b[46m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-cyan',
			'\u001b[1m\u001b[44m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-blue',
			'\u001b[1m\u001b[45m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-magenta',
			'\u001b[1m\u001b[40m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-black',
		],
		name: 'command-colors.mgs:37:2',
	},
	'command-colors.mgs:51:2': {
		messages: [
			'MGE ANSI color test: "dim"',
			'\u001b[2m\u001b[47m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-white',
			'\u001b[2m\u001b[41m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-red',
			'\u001b[2m\u001b[43m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-yellow',
			'\u001b[2m\u001b[42m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-green',
			'\u001b[2m\u001b[46m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-cyan',
			'\u001b[2m\u001b[44m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-blue',
			'\u001b[2m\u001b[45m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-magenta',
			'\u001b[2m\u001b[40m\u001b[37mW\u001b[31mR\u001b[33mY\u001b[32mG\u001b[36mC\u001b[34mB\u001b[35mM\u001b[30mK\u001b[0m bg-black',
		],
		name: 'command-colors.mgs:51:2',
	},
	'command-commentary.mgs:13:2': {
		messages: [
			'\u001b[36m\u001b[1mSerial commentary\u001b[0m \u001b[36mis available for chapter 1!\u001b[0m Play the game\nnormally, and keep your eye on the serial console for\ngameplay tips, behind-the-scenes information, and DC801\nlore!',
			' ',
			'To enable or disable serial commentary, type \u001b[36mCOMMENTARY ON\u001b[0m\nor \u001b[36mCOMMENTARY OFF\u001b[0m at the main menu.',
		],
		name: 'command-commentary.mgs:13:2',
	},
	'command-commentary.mgs:28:3': {
		messages: ['Serial commentary was already on! :P'],
		name: 'command-commentary.mgs:28:3',
	},
	'command-commentary.mgs:23:3': {
		messages: [
			'Serial commentary is now \u001b[1mon\u001b[0m! (Turn it off again by typing\n\u001b[36mCOMMENTARY OFF\u001b[0m at the main menu.)',
		],
		name: 'command-commentary.mgs:23:3',
	},
	'command-commentary.mgs:42:3': {
		messages: ['Serial commentary was already off! :P'],
		name: 'command-commentary.mgs:42:3',
	},
	'command-commentary.mgs:37:3': {
		messages: [
			'Serial commentary is now \u001b[1moff\u001b[0m! (Turn it off again by typing\n\u001b[36mCOMMENTARY OFF\u001b[0m at the main menu.)',
		],
		name: 'command-commentary.mgs:37:3',
	},
	'command-eastereggs.mgs:18:2': {
		messages: [
			'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~~~^^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~^~?G#&#BGPY?!~~~~~~~~~~~~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~?#@@@@@@#GPGG5?~^~~~~~~~~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~7&@&&@@&&G5Y55GGP?~~~~~~~~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~?G555PPGJ:7GPGGBB#Y!~~~~~~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~!Y?!!5#GP###BB##BBG!~~~~~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~^?GPGB@@&G5Y77#B#PPB57~~~~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~JB55#@@@G^..!&#@BP&BP57~~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~!B5YB##&&BPP#@@&?~&@&GPJ~~~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~~75PPG5!P#&P~B#~:~&&&5YPY!~~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~~~7PJYYYPPY5B5!!P&#BBGGPPP7~~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~~~!YJ????JJ5PGG#BPP55GGBJGP5~~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~~~???7?JJYY5YYY5YYJJY5P5P5YP5~~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~~~J77?Y5Y555YJYJYYYYY55YJJJ5PJ^~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~~~J77?JJJYYYYYYYY5YYYJYYJ?5?P5~~~~~~~',
			'~~~~~~~~~~~~~~~~~~~~~~~~~!!77777?JYYYY5555YY5YYY?PB5P!~~~~~~',
			'^^~~~~~~~~~~~~~~~~~~~~~~~J!~!!!7?JJJJJYYYYYYYYYJ??BYP~~~~~~~',
			'J?7!~~~~~~~~~~~~~~~~~~~~~7~^~!!77??????7?JJJYY5YJ~^?B!~~~~~~',
			'5PPPPY?!~~~~~~~~~~~~~~~~~~?~^~!!777!!!!77?JJYJYJ?^.:7J~~~~~~',
			'7?JJY5PP5Y?!~~~~~~~~~~~~~~^^.~~!!!!!!!!!777?J?JJ~?^:^~~~~~~~',
			'~!!!77?JY5PP5Y?7~~~~~~~~~~~^^7~~~~~~~!!!!!777~?~P?7G!~~~~~~~',
			'~~~~~~!!77?JY55PP5Y?7~~~~~~~^7~~~~~~~!!!~!!!~!^^~7~5Y~~~~~~~',
			'~~~~~~~~~~~!!77?JJ55PP5Y?J577?7^^^~~~~~~~~!7~~~!J5!^~~~~!!~~',
			'~~~~~~~~~~~~~~~~!!77?JY5YJ?YY??^::::^^:^~~~!??JYYY^^~!7?J7~~',
			'~~~~~~~~~~~~~~~~~~~~~!!!!^^JY5PPP5Y?7!~^:^~JY?Y7Y7.^~7?7~!~~',
			'~~~~~~~~~~~~~~~~~~~~~~~~~~~~!!7??JY55PP5J7JYY5!:Y7 ^~~~~~~~~',
			' ',
			'       no you plover',
		],
		name: 'command-eastereggs.mgs:18:2',
	},
	'command-eastereggs.mgs:54:2': {
		messages: ['You hex a decimal. It looks surprised.'],
		name: 'command-eastereggs.mgs:54:2',
	},
	'command-eastereggs.mgs:61:2': {
		messages: ['Bless you.'],
		name: 'command-eastereggs.mgs:61:2',
	},
	'command-eastereggs.mgs:68:2': {
		messages: [
			"While I've never actually made a mistake, there have been a\nfew, let's call 'em \"stnanks,\" that could be worthy of a\ndo-over.",
		],
		name: 'command-eastereggs.mgs:68:2',
	},
	'command-inventory.mgs:15:2': {
		messages: [
			'\u001b[36m\u001b[1mMGE GENERAL COMMANDS MANUAL - INVENTORY\u001b[0m',
			' ',
			'Use this command to see what items you are currently\ncarrying. This command may also be triggered with the\nabbreviation \u001b[36mI\u001b[0m.',
		],
		name: 'command-inventory.mgs:15:2',
	},
	'command-inventory.mgs:21:3': {
		messages: [
			' ',
			'Some items may be combined at one of the solder stations in\nthe castle workshop.',
		],
		name: 'command-inventory.mgs:21:3',
	},
	'command-inventory.mgs:35:3': {
		messages: ['\u001b[36mINVENTORY:\u001b[0m'],
		name: 'command-inventory.mgs:35:3',
	},
	'command-inventory.mgs:42:4': {
		messages: ['    can of Cactus Cooler'],
		name: 'command-inventory.mgs:42:4',
	},
	'command-inventory.mgs:48:4': {
		messages: ['    heat sink'],
		name: 'command-inventory.mgs:48:4',
	},
	'command-inventory.mgs:54:4': {
		messages: ['    power supply'],
		name: 'command-inventory.mgs:54:4',
	},
	'command-inventory.mgs:60:4': {
		messages: ['    monitor'],
		name: 'command-inventory.mgs:60:4',
	},
	'command-inventory.mgs:67:4': {
		messages: ['    hard drive'],
		name: 'command-inventory.mgs:67:4',
	},
	'command-inventory.mgs:73:4': {
		messages: ['    dinner plate'],
		name: 'command-inventory.mgs:73:4',
	},
	'command-inventory.mgs:79:4': {
		messages: ['    phonograph needle'],
		name: 'command-inventory.mgs:79:4',
	},
	'command-inventory.mgs:85:4': {
		messages: ['    keyboard'],
		name: 'command-inventory.mgs:85:4',
	},
	'command-inventory.mgs:91:4': {
		messages: ['    mouse'],
		name: 'command-inventory.mgs:91:4',
	},
	'command-inventory.mgs:98:4': {
		messages: ['    ramchips'],
		name: 'command-inventory.mgs:98:4',
	},
	'command-inventory.mgs:104:4': {
		messages: ['    clock'],
		name: 'command-inventory.mgs:104:4',
	},
	'command-inventory.mgs:110:4': {
		messages: ['    cpu'],
		name: 'command-inventory.mgs:110:4',
	},
	'command-inventory.mgs:116:4': {
		messages: ['    goldfish'],
		name: 'command-inventory.mgs:116:4',
	},
	'command-inventory.mgs:122:4': {
		messages: ['    calculator manual'],
		name: 'command-inventory.mgs:122:4',
	},
	'command-inventory.mgs:128:4': {
		messages: ['    abacus'],
		name: 'command-inventory.mgs:128:4',
	},
	'command-inventory.mgs:135:4': {
		messages: ['    mainframe OS CD'],
		name: 'command-inventory.mgs:135:4',
	},
	'command-inventory.mgs:142:4': {
		messages: ['    mini rake'],
		name: 'command-inventory.mgs:142:4',
	},
	'command-inventory.mgs:149:4': {
		messages: ['    (nothing)'],
		name: 'command-inventory.mgs:149:4',
	},
	'command-man.mgs:18:2': {
		messages: [
			'\u001b[36m\u001b[1mMGE GENERAL COMMANDS MANUAL - MAN\u001b[0m',
			' ',
			'Displays manual pages for various MGE serial commands. Type\n\u001b[36mMAN\u001b[0m followed by the name of the command you want to read\nabout, e.g. \u001b[36mMAN LOOK\u001b[0m',
			' ',
			'\u001b[35mNOTE\u001b[0m: Hi, there, birthday mage! I\'ve rigged this thing to\ncall me if you use \u001b[36mMAN\u001b[0m as a single word. I "hacked" the man\npage to tell you that!',
		],
		name: 'command-man.mgs:18:2',
	},
	'command-man.mgs:31:2': {
		messages: [
			'\u001b[1mMAN PAGE NOT FOUND!\u001b[0m There is no documentation for that\ncommand, or that command does not exist.',
		],
		name: 'command-man.mgs:31:2',
	},
	'command-man.mgs:63:2': {
		messages: [
			'\u001b[1m\u001b[31mERROR\u001b[0m: \u001b[1mlambda-talk\u001b[0m timed out',
			' ',
			'Connection to secure network "GIBSON" could not be\nestablished. Please move artifact closer to castle base\nstation and try again.',
			' ',
			'\u001b[1mlambda-talk\u001b[0m: exited with code 1',
		],
		name: 'command-man.mgs:63:2',
	},
	'command-man.mgs:104:2': {
		messages: ['\u001b[35mLAMBDA\u001b[0m: What do you want to know?', ' '],
		name: 'command-man.mgs:104:2',
	},
	'command-man.mgs:119:2': {
		messages: ['(Ask about:)'],
		options: [
			{
				label: 'Parts',
				script: 'ch2_lambda_topic_parts',
			},
			{
				label: 'Using the artifact',
				script: 'ch2_lambda_topic_artifact',
			},
			{
				label: 'The mainframe',
				script: 'ch2_lambda_topic_mainframe',
			},
			{
				label: 'The castle',
				script: 'ch2_lambda_topic_castle',
			},
			{
				label: 'Someone specific',
				script: 'ch2_lambda_topic_person_start',
			},
			{
				label: '(Quit)',
				script: 'ch2_lambda_ishouldgo',
			},
		],
		name: 'command-man.mgs:119:2',
	},
	'command-man.mgs:130:2': {
		messages: ['(Ask about:)'],
		options: [
			{
				label: 'Using the artifact',
				script: 'ch2_lambda_topic_artifact',
			},
			{
				label: 'The mainframe',
				script: 'ch2_lambda_topic_mainframe',
			},
			{
				label: 'The castle',
				script: 'ch2_lambda_topic_castle',
			},
			{
				label: 'Someone specific',
				script: 'ch2_lambda_topic_person_start',
			},
			{
				label: '(Quit)',
				script: 'ch2_lambda_ishouldgo',
			},
		],
		name: 'command-man.mgs:130:2',
	},
	'command-man.mgs:142:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: I should go.',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: No problem! Just feel free to type \u001b[36mMAN\u001b[0m if you want\nto ask me a question about anything, and \u001b[36mHELP\u001b[0m if you want to\nknow all the commands you can use.',
			' ',
		],
		name: 'command-man.mgs:142:2',
	},
	'command-man.mgs:155:2': {
		messages: ['\u001b[35mLAMBDA\u001b[0m: You had a question about the parts?', ' '],
		name: 'command-man.mgs:155:2',
	},
	'command-man.mgs:162:2': {
		messages: ['(Ask about:)'],
		options: [
			{
				label: 'Parts list',
				script: 'ch2_lambda_topic_parts_list',
			},
			{
				label: 'Installing parts',
				script: 'ch2_lambda_topic_parts_installation',
			},
			{
				label: '(Go back)',
				script: 'command_man_normal_convo',
			},
		],
		name: 'command-man.mgs:162:2',
	},
	'command-man.mgs:171:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: What is the parts list?',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: To see the parts list, use the magic word -- that\nis, the command -- \u001b[36mPARTS\u001b[0m. To see information about a\nspecific part, type \u001b[36mPARTS\u001b[0m and then the name of the part. For\nexample, to ask about the monitor, type: \u001b[36mPARTS \u001b[36mMONITOR\u001b[0m.',
			' ',
		],
		name: 'command-man.mgs:171:2',
	},
	'command-man.mgs:183:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: How do I install the parts once I've got them?",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Just bring them to the mainframe enclosure in the\nfirst room of the castle. That's the sort of beige-looking\ncomputer box by the northernmost exit. The parts themselves\nshould be straightforward to install, but do feel free to\nask me for help.",
			' ',
		],
		name: 'command-man.mgs:183:2',
	},
	'command-man.mgs:194:2': {
		messages: ['\u001b[35mLAMBDA\u001b[0m: You had a question about the artifact?', ' '],
		name: 'command-man.mgs:194:2',
	},
	'command-man.mgs:202:3': {
		messages: ['(Ask about:)'],
		options: [
			{
				label: 'Magic words (Commands)',
				script: 'ch2_lambda_topic_artifact_words',
			},
			{
				label: '(Go back)',
				script: 'command_man_normal_convo',
			},
		],
		name: 'command-man.mgs:202:3',
	},
	'command-man.mgs:211:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: What can you tell me about "magic words?" You said they\nwere commands?',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Yeah, so, when I say "magic words" I mean serial\ncommands -- that is, things you type in the terminal to make\nthe castle artifact do something.',
			'    You can use the command \u001b[36mHELP\u001b[0m to see a list of commands\nthat are valid at the moment. To learn more about a specific\ncommand, type \u001b[36mMAN\u001b[0m plus the name of the command. For example,\ntype \u001b[36mMAN LOOK\u001b[0m to see the manual page for the \u001b[36mLOOK\u001b[0m command.',
			' ',
		],
		name: 'command-man.mgs:211:2',
	},
	'command-man.mgs:225:2': {
		messages: ['\u001b[35mLAMBDA\u001b[0m: You had a question about the mainframe?', ' '],
		name: 'command-man.mgs:225:2',
	},
	'command-man.mgs:233:3': {
		messages: ['(Ask about:)'],
		options: [
			{
				label: 'Why did you break it?',
				script: 'ch2_lambda_mainframe_broken',
			},
			{
				label: 'How broken is it?',
				script: 'ch2_lambda_mainframe_broken_1',
			},
			{
				label: 'How do we fix it?',
				script: 'ch2_lambda_mainframe_fix_1',
			},
			{
				label: '(Go back)',
				script: 'command_man_normal_convo',
			},
		],
		name: 'command-man.mgs:233:3',
	},
	'command-man.mgs:244:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Why did you break it?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Like I said, I broke it to keep it out of the \u001b[31mBig\n\u001b[31mBad\u001b[0m's hands.",
			"    That artifact is capable of doing quite a lot of damage,\nyou know. It's only a problem that we're lacking it now\nbecause of that recent earthquake.",
			' ',
		],
		name: 'command-man.mgs:244:2',
	},
	'command-man.mgs:256:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: What exactly about it is broken?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Well, sort of... everything. It's in a million\npieces, to be precise.",
			' ',
		],
		options: [
			{
				label: 'Thorough. Nice!',
				script: 'ch2_lambda_mainframe_broken_2',
			},
			{
				label: 'Was that necessary?',
				script: 'ch2_lambda_mainframe_broken_2',
			},
		],
		name: 'command-man.mgs:256:2',
	},
	'command-man.mgs:267:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Yeah, so, um... it might not have been necessary,\nstrictly speaking. I wiped its software first. That would've\nbeen enough on its own, to be honest.",
			"    I don't know. I just wanted to be \u001b[1msure\u001b[0m. I sort of regret\nit now.",
			' ',
		],
		name: 'command-man.mgs:267:2',
	},
	'command-man.mgs:293:3': {
		messages: [
			'\u001b[36mYOU\u001b[0m: How do we fix it? What do we need?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: The mainframe itself is all fixed -- which is to\nsay, we've bodged things well enough for now.",
			"    Though there's still the matter of Aurelius. I've\nalready sent for a CPU to come in the mail, so all we have\nto do is wait for it to get here, then we can swap it out\nand put him back to normal.",
			"    As for the other bodges... you know, maybe it's best not\nto mess with anything else if it's all working.",
			' ',
		],
		name: 'command-man.mgs:293:3',
	},
	'command-man.mgs:278:3': {
		messages: [
			'\u001b[36mYOU\u001b[0m: How do we fix it? What do we need?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: We'll have to build a new computer from scratch. The\nold bits are... well, just bits -- bits of copper and\nplastic and silicon debris.",
			"    But there should be enough \u001b[35mcomputer parts\u001b[0m scattered\nthroughout the castle. I have my parts list right here. The\nsoftware though... I'll, um, get back to you about that.",
			' ',
		],
		name: 'command-man.mgs:278:3',
	},
	'command-man.mgs:286:3': {
		messages: [
			'\u001b[36mYOU\u001b[0m: How do we fix it? What do we need?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: We've rebuilt the computer itself, so all we need\nnow is its operating system. I've got it ready now, so come\non up to my secret lab and I'll give it to you.",
			' ',
		],
		name: 'command-man.mgs:286:3',
	},
	'command-man.mgs:310:2': {
		messages: ['\u001b[35mLAMBDA\u001b[0m: You had a question about the castle?', ' '],
		name: 'command-man.mgs:310:2',
	},
	'command-man.mgs:318:3': {
		messages: ['(Ask about:)'],
		options: [
			{
				label: 'Whose castle is this?',
				script: 'ch2_lambda_castle_who',
			},
			{
				label: 'The earthquake caused damage?',
				script: 'ch2_lambda_castle_damage',
			},
			{
				label: '(Go back)',
				script: 'command_man_normal_convo',
			},
		],
		name: 'command-man.mgs:318:3',
	},
	'command-man.mgs:328:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Whose castle is this?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: I'm kind of surprised you didn't know, but it's King\nGibson's castle. He's in charge of the whole place. He used\nto be in charge of the whole geographical area, too, not\njust the castle structure itself, but -- well, the bits of\nland around here have become abruptly more isolated\nrecently. It's complicated.",
			' ',
		],
		name: 'command-man.mgs:328:2',
	},
	'command-man.mgs:338:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: The earthquake caused some damage?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: A bunch of doors got jammed or caved in. That's one\nof the reasons I'm letting you have the portable interface\n-- it'll let you get past blockages, and just about everyone\ninside the castle is trapped in place.",
			"    If the mainframe were still working, we would've been\nable to... well, it would have enabled people to get around,\nanyway.",
			' ',
		],
		name: 'command-man.mgs:338:2',
	},
	'command-man.mgs:352:2': {
		messages: ['\u001b[35mLAMBDA\u001b[0m: Who did you want to ask about?', ' '],
		name: 'command-man.mgs:352:2',
	},
	'command-man.mgs:359:2': {
		messages: ['    Um, did you want to ask about anyone else?', ' '],
		name: 'command-man.mgs:359:2',
	},
	'command-man.mgs:367:2': {
		messages: ['(Type a name, or type \u001b[36mBACK\u001b[0m to go back)'],
		text_options: {
			WIZARD: 'ch2_lambda_person_wizard',
			RACCOON: 'ch2_lambda_person_raccoon',
			KURO: 'ch2_lambda_person_kuro',
			CONCIERGE: 'ch2_lambda_person_concierge',
			'THE CONCIERGE': 'ch2_lambda_person_concierge',
			TEMPLETON: 'ch2_lambda_person_templeton',
			SEBASTIAN: 'ch2_lambda_person_sebastian',
			'THE GOLDFISH': 'ch2_lambda_person_goldfish',
			GOLDFISH: 'ch2_lambda_person_goldfish',
			AURELIUS: 'ch2_lambda_person_aurelius',
			KING: 'ch2_lambda_person_kinggibson',
			'THE KING': 'ch2_lambda_person_kinggibson',
			GIBSON: 'ch2_lambda_person_kinggibson',
			'KING GIBSON': 'ch2_lambda_person_kinggibson',
			ALVIN: 'ch2_lambda_person_alvin',
			SIMON: 'ch2_lambda_person_simon',
			THEODORE: 'ch2_lambda_person_theodore',
			'SEA MOSS': 'ch2_lambda_person_seamoss',
			GLORIA: 'ch2_lambda_person_gloria',
			SAMSON: 'ch2_lambda_person_samson',
			GREGORY: 'ch2_lambda_person_gregory',
			'THE CAT': 'ch2_lambda_person_the_cat',
			'A CAT': 'ch2_lambda_person_a_cat',
			CAT: 'ch2_lambda_person_a_cat',
			CLARA: 'ch2_lambda_person_clara',
			JEANPAUL: 'ch2_lambda_person_jeanpaul',
			'JEAN PAUL': 'ch2_lambda_person_jeanpaul',
			'JEAN-PAUL': 'ch2_lambda_person_jeanpaul',
			FRANKIE: 'ch2_lambda_person_frankie',
			SCUZZY: 'ch2_lambda_person_scuzzy',
			'C K WATT': 'ch2_lambda_person_ckwatt',
			CKWATT: 'ch2_lambda_person_ckwatt',
			ROCCO: 'ch2_lambda_person_rocco',
			TRACY: 'ch2_lambda_person_tracy',
			HELVETICA: 'ch2_lambda_person_helvetica',
			BOB: 'ch2_lambda_person_bob',
			'MARATHON BOB': 'ch2_lambda_person_marathonbob',
			'GUARDIAN BOB': 'ch2_lambda_person_guardianbob',
			'SOLID SNEK': 'ch2_lambda_person_solidsnek',
			ME: 'ch2_lambda_person_player',
			'BLACK MAGE': 'ch2_lambda_person_player',
			MAGE: 'ch2_lambda_person_player',
			YOU: 'ch2_lambda_person_lambda',
			LAMBDA: 'ch2_lambda_person_lambda',
			'THE BIG BAD': 'ch2_lambda_person_big_bad',
			'BIG BAD': 'ch2_lambda_person_big_bad',
			ALFONSO: 'ch2_lambda_person_alfonso',
			JACKOB: 'ch2_lambda_person_jackob',
			BERT: 'ch2_lambda_person_bert',
			XA: 'ch2_lambda_person_xa',
			XB: 'ch2_lambda_person_xb',
			XC: 'ch2_lambda_person_xc',
			BACK: 'command_man_normal_convo',
			Q: 'command_man_normal_convo',
			QUIT: 'command_man_normal_convo',
			STOP: 'command_man_normal_convo',
		},
		name: 'command-man.mgs:367:2',
	},
	'command-man.mgs:444:2': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Sorry, not sure who you mean. You might have to be\nmore specific.',
			' ',
		],
		name: 'command-man.mgs:444:2',
	},
	'command-man.mgs:459:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: What\'s with this "Wizard" guy?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Oh, yeah, the Wiz is pretty rad. He's awesome at\nsetting up custom software configurations.",
		],
		name: 'command-man.mgs:459:2',
	},
	'command-man.mgs:468:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: What's with the raccoon?",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: The raccoon? Oh, you mean the Wiz. He's awesome at\nsetting up custom software configurations.",
		],
		name: 'command-man.mgs:468:2',
	},
	'command-man.mgs:476:2': {
		messages: [
			"    You should have seen him at King Gibson's last Halloween\nparty! He'd found this little blue wizard's hat and cape....",
		],
		name: 'command-man.mgs:476:2',
	},
	'command-man.mgs:491:3': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about Kuro -- I mean, the little black bird in\nthe front hallway.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Sorry, I don't know any little black birds. Kuro\nmust be a visitor. If he's in the front hallway, then he\ndidn't get very far into the castle and must be trapped,\nseparated from whoever he must have wanted to visit. Poor\nthing.",
		],
		name: 'command-man.mgs:491:3',
	},
	'command-man.mgs:485:3': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about Kuro.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Sorry, I don't know anyone named Kuro.",
		],
		name: 'command-man.mgs:485:3',
	},
	'command-man.mgs:502:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about the castle concierge.', ' '],
		name: 'command-man.mgs:502:2',
	},
	'command-man.mgs:512:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Oh yeah, that guy! He looks fierce but he's actually\nreally friendly. His growling is a side effect of his\ncondition, chronic lycanthropy.",
			"    He's a music lover, if I'm remembering right. He's a\nlittle compulsive about it, always wanting something\nplaying....",
		],
		name: 'command-man.mgs:512:3',
	},
	'command-man.mgs:507:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The concierge? Have you been so deep into the castle\nhallway yet? But oh, you've probably guessed there's a\nconcierge, right? It's true that this is \u001b[1mthat\u001b[0m kind of\ncastle. Overly formal, I mean.",
			"    I don't remember too much about that guy, but... oh, I\nguess I don't remember him at all. We must never have\ncrossed paths much.",
		],
		name: 'command-man.mgs:507:3',
	},
	'command-man.mgs:522:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Templeton.', ' '],
		name: 'command-man.mgs:522:2',
	},
	'command-man.mgs:531:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Templeton is one of the king's advisors. You've met\nhim, so you understand how paranoid he can be, but in\npractice he provides a good balance to Sebastian, who is\nmore aggressive and who doesn't tend to think things through\nenough. He's really friendly, and a very heavy reader.",
		],
		name: 'command-man.mgs:531:3',
	},
	'command-man.mgs:527:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Templeton, Templeton. One of King Gibson's advisors,\nI think. Or was he a giant blancmange? Sorry, I guess I\ndon't know much about that guy.",
		],
		name: 'command-man.mgs:527:3',
	},
	'command-man.mgs:540:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Sebastian.', ' '],
		name: 'command-man.mgs:540:2',
	},
	'command-man.mgs:549:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Sebastian's heart is in the right place, but he's\nstubborn enough and brash enough that it can be hard to\nremember that, particularly if he has an opinion about\nsomething. But there's a reason King Gibson keeps him\naround, after all. He's good at his job.",
		],
		name: 'command-man.mgs:549:3',
	},
	'command-man.mgs:545:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Sebastian? He was one of King Gibson's advisors,\nwasn't he? I seem to recall him being combatative fairly\noften. Some kind of magic user, too.",
		],
		name: 'command-man.mgs:545:3',
	},
	'command-man.mgs:558:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about Aurelius.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Aurelius, the goldfish? He's the King's regent.",
		],
		name: 'command-man.mgs:558:2',
	},
	'command-man.mgs:567:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about the goldfish.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: The goldfish? You mean the castle goldfish?\nAurelius, his name is. He's the King's regent.",
		],
		name: 'command-man.mgs:567:2',
	},
	'command-man.mgs:575:2': {
		messages: [
			"    He mostly just goes to all the meetings and observes\neverything quietly. But when King Gibson is away, Aurelius\nis put in charge, and he does a fantastic job. He's a\nreasonable guy.",
		],
		name: 'command-man.mgs:575:2',
	},
	'command-man.mgs:583:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about King Gibson.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Well, he's king of the castle. That means he makes\nmost of the logistical decisions, and bears most of the\nresponsibility for what happens here. He knows a thing or\ntwo about tech but not to the level needed to maintain this\nplace, so he's made an effort to hire and train technicians\nand advisors to help him keep everything running.",
		],
		name: 'command-man.mgs:583:2',
	},
	'command-man.mgs:596:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Alvin.', ' '],
		name: 'command-man.mgs:596:2',
	},
	'command-man.mgs:606:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Alvin? Oh, you mean the Alvin from the band "1023\nMB."',
		],
		name: 'command-man.mgs:606:3',
	},
	'command-man.mgs:601:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Alvin? Oh, you mean the Alvin from the band "1023\nMB." Oh yeah, they were supposed to play tonight in the\ngrand hall.',
		],
		name: 'command-man.mgs:601:3',
	},
	'command-man.mgs:610:2': {
		messages: [
			"    Yeah, so, Alvin -- by reputation, she's the quiet,\nmysterious one of the group -- that's all I know.",
		],
		name: 'command-man.mgs:610:2',
	},
	'command-man.mgs:617:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Theodore.', ' '],
		name: 'command-man.mgs:617:2',
	},
	'command-man.mgs:627:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Theodore? Oh, you mean the Theodore from the band\n"1023 MB."',
		],
		name: 'command-man.mgs:627:3',
	},
	'command-man.mgs:622:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Theodore? Oh, you mean the Theodore from the band\n"1023 MB." Oh yeah, they were supposed to play tonight in\nthe grand hall.',
		],
		name: 'command-man.mgs:622:3',
	},
	'command-man.mgs:631:2': {
		messages: [
			"    Yeah, so, Theodore -- I've never met them personally.\nI've heard they're the straightforward, stoic type, though.",
		],
		name: 'command-man.mgs:631:2',
	},
	'command-man.mgs:638:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Simon.', ' '],
		name: 'command-man.mgs:638:2',
	},
	'command-man.mgs:648:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Simon? Oh, you mean the Simon from the band "1023\nMB."',
		],
		name: 'command-man.mgs:648:3',
	},
	'command-man.mgs:643:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Simon? Oh, you mean the Simon from the band "1023\nMB." Oh yeah, they were supposed to play tonight in the\ngrand hall.',
		],
		name: 'command-man.mgs:643:3',
	},
	'command-man.mgs:652:2': {
		messages: [
			"    Yeah, so, Simon -- from what I understand he's brash and\nkind of a pain to be around. Never met him, but I don't\nreally \u001b[1mwant\u001b[0m to meet him, you know?",
		],
		name: 'command-man.mgs:652:2',
	},
	'command-man.mgs:660:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Sea Moss.', ' '],
		name: 'command-man.mgs:660:2',
	},
	'command-man.mgs:671:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Yes! Sea Moss! He's a big computer tinkerer. Knows\neverything about all the weird, low-level layers of computer\ncircuitry, all the way down to the transistors themselves.",
			'    And he makes the best crepes, too, believe it or not!',
		],
		name: 'command-man.mgs:671:3',
	},
	'command-man.mgs:665:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Sea Moss? Sea Moss... I-I think I....',
			'    I think I used to be good friends with him, but... what\ndid we do together?',
			"    I seem to remember we... no, it's gone. I'm sorry.",
		],
		name: 'command-man.mgs:665:3',
	},
	'command-man.mgs:681:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Gloria.', ' '],
		name: 'command-man.mgs:681:2',
	},
	'command-man.mgs:690:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Oh, Gloria, the golden beetle. She's, um, a little\nprone to panic, but honestly she's good at her job. She\nmanages the castle payroll... that is, when she's not\ntrapped in the employee break room with her toddler after an\nearthquake.",
		],
		name: 'command-man.mgs:690:3',
	},
	'command-man.mgs:686:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Gloria? I think I recognize the name, but I can't\npicture a face. Maybe if I could just see who it was....",
		],
		name: 'command-man.mgs:686:3',
	},
	'command-man.mgs:699:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Samson.', ' '],
		name: 'command-man.mgs:699:2',
	},
	'command-man.mgs:708:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: I think Samson was the name of Gloria's kid, wasn't\nit? Was he two or three? Or five or six? I don't know. I was\nnever that good with children.",
		],
		name: 'command-man.mgs:708:3',
	},
	'command-man.mgs:704:3': {
		messages: ["\u001b[35mLAMBDA\u001b[0m: Samson? That name doesn't ring a bell."],
		name: 'command-man.mgs:704:3',
	},
	'command-man.mgs:717:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Gregory.', ' '],
		name: 'command-man.mgs:717:2',
	},
	'command-man.mgs:726:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Ah, Gregory! He runs the castle kitchens. He's a bit\ngray around the whiskers, but is still as quick as ever.\nExcellent taste, and great at improvising recipes.",
		],
		name: 'command-man.mgs:726:3',
	},
	'command-man.mgs:722:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: I think Gregory was the castle chef... maybe? I feel\nlike he's been there forever, but I can't remember what he\nlooks like.",
		],
		name: 'command-man.mgs:722:3',
	},
	'command-man.mgs:734:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about a cat.', ' '],
		name: 'command-man.mgs:734:2',
	},
	'command-man.mgs:738:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: A cat? The only cat I know is Gregory, I think. He's\nthe castle chef.",
		],
		name: 'command-man.mgs:738:2',
	},
	'command-man.mgs:745:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about the cat.', ' '],
		name: 'command-man.mgs:745:2',
	},
	'command-man.mgs:749:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The cat? The only cat I know is Gregory, I think.\nHe's the castle chef.",
		],
		name: 'command-man.mgs:749:2',
	},
	'command-man.mgs:757:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Clara.', ' '],
		name: 'command-man.mgs:757:2',
	},
	'command-man.mgs:761:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Clara? Clara... I think I remember seeing her name\non the new hires list recently, but I haven't met her. She's\nkitchen staff, though. Logistics, I think it was. Inventory\nmanagement or something.",
		],
		name: 'command-man.mgs:761:2',
	},
	'command-man.mgs:772:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Jean-Paul.', ' '],
		name: 'command-man.mgs:772:2',
	},
	'command-man.mgs:781:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Ah, Jean-Paul! He's a cockatiel -- that's a kind of\nparakeet. He's always tidy about his workspace. Unlike me,\nha ha.... Oh! You should hear him whistle sometime!",
		],
		name: 'command-man.mgs:781:3',
	},
	'command-man.mgs:777:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Jean-Paul. A French... hen? Chicken? Some kind of\nbird? Gosh, I really can't remember, I'm sorry.",
		],
		name: 'command-man.mgs:777:3',
	},
	'command-man.mgs:790:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Frankie.', ' '],
		name: 'command-man.mgs:790:2',
	},
	'command-man.mgs:799:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Frankie is a great guy to have around if you're\nexperiencing a hardware issue. They're our printer-wrangler,\nbe they 2D or 3D printers.",
		],
		name: 'command-man.mgs:799:3',
	},
	'command-man.mgs:795:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Hmm, "Frankie," let\'s see.... Was that one of the\nhardware guys? I can\'t remember anything else, sorry.',
		],
		name: 'command-man.mgs:795:3',
	},
	'command-man.mgs:808:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Scuzzy.', ' '],
		name: 'command-man.mgs:808:2',
	},
	'command-man.mgs:817:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Scuzzy? Oh yeah, that guy from the server room.',
			"    Scuzzy likes to see how things connect to each other.\nHe's always coming up with ways people can connect to each\nother, or ways for unrelated objects to fit together to\nbuild something cool. It's usually stuff you wouldn't think\nof, too.",
		],
		name: 'command-man.mgs:817:3',
	},
	'command-man.mgs:813:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Scuzzy? Or did you mean SCSI, that old data\ninterface? It was kind of a pain, to be honest. You couldn't\njust connect things together -- you had to daisy chain the\ndevices, and have a SCSI terminator at the end or none of it\nwould work. Good riddance.",
		],
		name: 'command-man.mgs:813:3',
	},
	'command-man.mgs:827:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about C. K. Watt.', ' '],
		name: 'command-man.mgs:827:2',
	},
	'command-man.mgs:836:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Oh, yeah, Charles. Oh, I'm sorry, I guess I should\ncall him Mr. Watt now. He recently got promoted, so he's\ntechnically my boss when it comes to my responsibilities\nwithin the castle. Er, not that the normal castle hierarchy\nis much in play at the moment.",
		],
		name: 'command-man.mgs:836:3',
	},
	'command-man.mgs:832:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: C. K. Watt? Isn't that a bit from Fawlty Towers? I\nmean, it's a bit of an obnoxious reference, isn't it?",
		],
		name: 'command-man.mgs:832:3',
	},
	'command-man.mgs:845:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Tracy.', ' '],
		name: 'command-man.mgs:845:2',
	},
	'command-man.mgs:854:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: That's right, Tracy is the logistics manager for the\npower plant. Makes sure the whole operation is funded and\nsupplied which in turn keeps the whole castle running.",
		],
		name: 'command-man.mgs:854:3',
	},
	'command-man.mgs:850:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Tracy. Hmm. I think there was someone named Tracy in\nthe power plant. Can't remember what their job was, though.",
		],
		name: 'command-man.mgs:850:3',
	},
	'command-man.mgs:863:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Rocco.', ' '],
		name: 'command-man.mgs:863:2',
	},
	'command-man.mgs:872:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Rocco builds and maintains the castle's computers.\nThe normal-sized computers, I mean. I guess once in a while\nhe also works on the castle itself. The castle is a\ncomputer, too, you know. That's why there's circuitry all\nover the place.",
			'    Huh, I just remembered this old project we did together\na few years ago. It was this tiny LED screen and some random\nSOC on this board he drew up. We got a pair of really cheap\njoysticks, and I programmed a bunch of little arcade games\nfor it.',
			"    Aw, man. He and I used to make a lot of cool stuff. I'd\ndo the software half, he the hardware half. I... I miss\nthose times. How did I forget about that?",
			"    I guess it's been a while since I've seen him in person.\nI hope he's doing okay.",
		],
		name: 'command-man.mgs:872:3',
	},
	'command-man.mgs:868:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Rocco was... hmm, let me see... was he someone from\nthe workshop? I think that's right. I don't know if we ever\ninteracted much.",
		],
		name: 'command-man.mgs:868:3',
	},
	'command-man.mgs:884:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Helvetica.', ' '],
		name: 'command-man.mgs:884:2',
	},
	'command-man.mgs:888:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: It's a classy font! Old school, maybe, but it's\ntightly designed. Don't let its simplicity fool you....",
			'    ...Oh, you meant a person named Helvetica? Hmm. I wonder\nif I know anyone named after a font.',
		],
		name: 'command-man.mgs:888:2',
	},
	'command-man.mgs:900:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about Bob.',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Bob? Which one? I know plenty. Fat Bobs, skinny\nBobs, Bobs who climb on rocks. Oh yeah, and Bobs who ARE\nrocks.',
			"    ...Well, okay, I actually don't \u001b[1mknow\u001b[0m any of them, but I\nknow \u001b[1mof\u001b[0m them.",
		],
		name: 'command-man.mgs:900:2',
	},
	'command-man.mgs:910:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about Guardian Bob.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Guardian Bob? Oh, right, that Lambert-or-Phong\nlooking guy. He's some kind of internet vigilante, I think.\nHe knows a few hacking tricks, but he seems white hat to me.\nI trust him.",
		],
		name: 'command-man.mgs:910:2',
	},
	'command-man.mgs:919:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about Solid Snek.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Hmm.... Did I know somebody who was called that? I\nmight be thinking of a movie I saw a while back. It sounds\nkinda like the name of a movie hero, y'know?",
			' ',
			'\u001b[36mYOU\u001b[0m: A movie hero? Called "snek"?',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Well, I think so.',
		],
		name: 'command-man.mgs:919:2',
	},
	'command-man.mgs:932:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about the Marathon Bobs.',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Right, so thirty years ago or more, gaming on the\nMacintosh was a \u001b[1mdoom\u001b[0med prospect. But then came a contender\nthat \u001b[1mquake\u001b[0md the very foundations of the platform: Marathon!',
			'    Anyway, "BoBs" were just some of the NPCs. Most of them\nwere good guys, but some of them were all evil and explodey.',
			"    Don't worry, no assimilated Bobs around here.",
		],
		name: 'command-man.mgs:932:2',
	},
	'command-man.mgs:950:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about XA.',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: XA is a device called an Exa, which is a tool I use\nto do certain kinds of administrative work. Mostly\nnetworking.',
			"    Exas are easy to program, but they take up a lot of\nspace when I use them inside the castle -- that is, in\nphysical space -- so I don't tend to use them much anymore.\nI guess I mostly like using them once in a while as a\ntinking project, like as a form a play.",
		],
		name: 'command-man.mgs:950:2',
	},
	'command-man.mgs:960:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about XB.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Oh, sure, XB. That was one of the Exas we used to\nhave around here. I'm afraid I stopped needing it for what I\nwas using it for, so I despawned it ages ago. Frankly, I\nforgot I used to have it.",
		],
		name: 'command-man.mgs:960:2',
	},
	'command-man.mgs:969:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about XC.', ' '],
		name: 'command-man.mgs:969:2',
	},
	'command-man.mgs:978:3': {
		messages: ["\u001b[35mLAMBDA\u001b[0m: Oh, sure, XC. That's the Exa I've got in my lab."],
		name: 'command-man.mgs:978:3',
	},
	'command-man.mgs:974:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: I mean, it's true I have an Exa named XC in here\nwith me. I guess you extrapolated the name XC, right?",
		],
		name: 'command-man.mgs:974:3',
	},
	'command-man.mgs:982:2': {
		messages: [
			"    Well, it's just another Exa, I guess, much like XA. In\nthis case, XC and XA are directly connected, so it's what I\nuse as an intercom into that front room.",
		],
		name: 'command-man.mgs:982:2',
	},
	'command-man.mgs:992:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about me!',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Oh, um, I don't actually know anything about you.",
			"    I guess... if anything... you've got a cool hat. That's\nnot nothing, I suppose.",
			' ',
		],
		options: [
			{
				label: "How did you know I'm wearing a hat?",
				script: 'ch2_lambda_person_player_2',
			},
		],
		name: 'command-man.mgs:992:2',
	},
	'command-man.mgs:1004:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: How did you know I'm wearing a hat?",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: That's, um... that would be because of the... well,\nthe cameras.",
			' ',
		],
		options: [
			{
				label: "Cameras? That's creepy!",
				script: 'ch2_lambda_person_player_2a',
			},
			{
				label: "Cameras? That's sensible.",
				script: 'ch2_lambda_person_player_2b',
			},
		],
		name: 'command-man.mgs:1004:2',
	},
	'command-man.mgs:1015:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Cameras? That's creepy.",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Yeah, I realize it doesn't sound great, having\ncameras everywhere. The cameras made a bit more sense back\nwhen there was a lot more traffic in and out, but thinking\nabout it, I guess it's pretty invasive. Funny, the things\nyou just get used to.",
		],
		name: 'command-man.mgs:1015:2',
	},
	'command-man.mgs:1024:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Cameras? That's a sensible measure to take.",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: You almost sound like you approve. They don't really\ndo much good, certainly not anymore, and it's a little\ninvasive, don't you think?",
			' ',
		],
		options: [
			{
				label: "It's not that invasive.",
				script: 'ch2_lambda_person_player_3b',
			},
			{
				label: "Okay, maybe it's a little invasive.",
				script: 'ch2_lambda_person_player_3a',
			},
		],
		name: 'command-man.mgs:1024:2',
	},
	'command-man.mgs:1035:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Okay, maybe it's a little invasive.",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Yeah. They've made it easier for me to help people\nin the castle from time to time, but I'm a little\nembarrassed to admit that they're everywhere.",
		],
		name: 'command-man.mgs:1035:2',
	},
	'command-man.mgs:1044:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: It's not that invasive.",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: It's true I would feel more nervous about a stranger\ninside the castle if the cameras were turned off or removed,\nbut I'm not going to argue they're not invasive.",
		],
		name: 'command-man.mgs:1044:2',
	},
	'command-man.mgs:1056:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about you!',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Me? Ohh, ummm... what's to know? I mean, I'm not\nthat interesting, really....",
		],
		name: 'command-man.mgs:1056:2',
	},
	'command-man.mgs:1065:2': {
		messages: [' ', '(Ask:)'],
		options: [
			{
				label: 'Where are you?',
				script: 'ch2_lambda_person_lambda_where',
			},
			{
				label: "What's your real name?",
				script: 'ch2_lambda_person_lambda_name',
			},
			{
				label: '(Go back)',
				script: 'ch2_lambda_topic_person_start',
			},
		],
		name: 'command-man.mgs:1065:2',
	},
	'command-man.mgs:1087:4': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Where are you? I mean -- spatially, where is that lab\nof yours? There weren't any doors inside.",
		],
		name: 'command-man.mgs:1087:4',
	},
	'command-man.mgs:1083:4': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Where are you? I mean, where are WE? There aren't any\ndoors here.",
		],
		name: 'command-man.mgs:1083:4',
	},
	'command-man.mgs:1091:3': {
		messages: [
			' ',
			"\u001b[35mLAMBDA\u001b[0m: I'd say it's a pocket dimension, but it's more\nmundane than that. It's just its own separate space\nsomewhere under the mountain. I set it all up back before\neverything went south, back when everyone was using the\nmainframe for all sorts of trivial nonsense.",
		],
		name: 'command-man.mgs:1091:3',
	},
	'command-man.mgs:1076:3': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Where are you?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: You know... um... it's kind of complicated. In a\nmanner of speaking, I'm inside the castle. Let's just say\nI'm nearby but not close.",
		],
		name: 'command-man.mgs:1076:3',
	},
	'command-man.mgs:1100:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: What\'s your real name? It\'s not really "Lambda," is it?',
			' ',
		],
		name: 'command-man.mgs:1100:2',
	},
	'command-man.mgs:1104:2': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Well, no. But you see... this is a little\nembarrassing, but....',
			"    I... sort of... don't remember my real name.",
			' ',
		],
		options: [
			{
				label: "You're kidding, right?",
				script: 'ch2_lambda_person_lambda_name_2a',
			},
			{
				label: 'How could you forget your own name? What happened?',
				script: 'ch2_lambda_person_lambda_name_2b',
			},
		],
		name: 'command-man.mgs:1104:2',
	},
	'command-man.mgs:1114:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: You're kidding, right?",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: You have to understand... this place, our\nmemories... it's all ones and zeroes.",
			'    When everything is digital, it is \u001b[1mabsolutely\u001b[0m possible\nfor information to disappear permanently. In my case....',
		],
		name: 'command-man.mgs:1114:2',
	},
	'command-man.mgs:1124:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: How could you forget your own name? What happened?',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Our world is entirely digital. All ones and zeroes.\nEven you and me. So what happened was....',
		],
		name: 'command-man.mgs:1124:2',
	},
	'command-man.mgs:1132:2': {
		messages: [
			'    ...I found the place in the world where my name linked\nto my data as an entity... and destroyed it.',
		],
		name: 'command-man.mgs:1132:2',
	},
	'command-man.mgs:1141:3': {
		messages: [
			"    The \u001b[31mBig Bad\u001b[0m couldn't target me with hacks without\nknowing my name, you see, so I made it impossible to learn\nmy name, or even know my name.",
			'    I severed more than I intended, but....',
		],
		name: 'command-man.mgs:1141:3',
	},
	'command-man.mgs:1136:3': {
		messages: [' '],
		options: [
			{
				label: 'What? But why?',
				script: 'ch2_lambda_person_lambda_name_3',
			},
		],
		name: 'command-man.mgs:1136:3',
	},
	'command-man.mgs:1150:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: What? But why?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: I did it to protect myself from the \u001b[31mBig Bad\u001b[0m. He\ncouldn't target me with hacks without knowing my name, so I\nmade it impossible to learn my name, or even know my name.",
			'    I severed more than I intended, but....',
		],
		name: 'command-man.mgs:1150:2',
	},
	'command-man.mgs:1160:2': {
		messages: [
			"    ...I found the place in the world where my name linked\nto my data as an entity... and destroyed it. The \u001b[31mBig Bad\u001b[0m\ncouldn't target me with hacks without knowing my name, you\nsee, so I made it impossible to learn my name, or even know\nmy name.",
			'    I severed more than I intended, but....',
		],
		name: 'command-man.mgs:1160:2',
	},
	'command-man.mgs:1167:2': {
		messages: [' ', '(Ask a followup question:)'],
		options: [
			{
				label: 'What else was severed?',
				script: 'ch2_lambda_person_lambda_name_followup_severed',
			},
			{
				label: "Is that why the Big Bad doesn't have a name?",
				script: 'ch2_lambda_person_lambda_name_followup_bigbad',
			},
			{
				label: 'Does a nickname not count as a name?',
				script: 'ch2_lambda_person_lambda_name_followup_nickname',
			},
			{
				label: 'Why "Lambda" though?',
				script: 'ch2_lambda_person_lambda_name_followup_lambda',
			},
			{
				label: '(Go back)',
				script: 'ch2_lambda_person_lambda_q',
			},
		],
		name: 'command-man.mgs:1167:2',
	},
	'command-man.mgs:1180:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: What else was severed?',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: There are gaps in my mind. I... I think they might\nhave appeared when I deleted my name. Hard to tell.',
			"    It's a lot harder to remember people, for a start. My\nskills seem to be intact, but I feel... disconnected. It's\nlike everything I \u001b[1mcan\u001b[0m remember is stripped of context.",
		],
		name: 'command-man.mgs:1180:2',
	},
	'command-man.mgs:1191:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Is that why the \u001b[31mBig Bad\u001b[0m doesn't have a name? Did he\ndestroy his name, too, so that other hackers can't target\nhim for hacks?",
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Probably. Good insight.',
			'    In his case, though, I think he likes the mystique, too.',
		],
		name: 'command-man.mgs:1191:2',
	},
	'command-man.mgs:1202:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Does a nickname not count as a name? I\'ve been calling\nyou "Lambda," after all. Isn\'t that a name?',
			' ',
			'\u001b[35mLAMBDA\u001b[0m: No, by "name" I don\'t mean the label on my messages,\nor what someone calls me.',
			"    I destroyed my \u001b[35mname\u001b[0m, which is to say I damaged the\nworld's mechanism of referring to me at all. If someone\nelse's memories link to me, that link has been severed,\nbecause my name is now a broken reference. I am an\nunreachable entity.",
			"    I've since learned that many links go in two\ndirections....",
		],
		name: 'command-man.mgs:1202:2',
	},
	'command-man.mgs:1214:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Why "Lambda" though?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: I thought of it on the spot. It's because I'm a\n\u001b[1mfunctionary with no name\u001b[0m, you see! You see?",
			'    No? Oh, um... never mind.',
		],
		name: 'command-man.mgs:1214:2',
	},
	'command-man.mgs:1227:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about the \u001b[31mBig Bad\u001b[0m.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Oh, um, that's complicated.",
			'    But he was ruthless. Smart, yes, and capable, but he\nseemed to lack compassion. Like it was a bother to him when\nother people brought up the problems his actions were\ncausing for other people. Like he might not have even\nnoticed otherwise.',
			' ',
		],
		options: [
			{
				label: "You're making it sound like you knew him.",
				script: 'ch2_lambda_person_big_bad2',
			},
		],
		name: 'command-man.mgs:1227:2',
	},
	'command-man.mgs:1238:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: You're making it sound like you knew him.",
			' ',
			'\u001b[35mLAMBDA\u001b[0m: I mean -- that is, we -- we were....',
			"    Um, y-yes, we were acquainted, you could say. We'd\ncertainly met. More than once. He always rubbed me the wrong\nway, though, even before he decided to do all the terrible\nthings he did.",
			"    It's, um... it's been long enough that the details are\nfuzzy. But even if I can't remember exactly how things might\nhave gone down, I can definitely remember the way he made me\nfeel when we interacted. I guess that's all I have to say\nabout that.",
		],
		name: 'command-man.mgs:1238:2',
	},
	'command-man.mgs:1252:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Alfonso.'],
		name: 'command-man.mgs:1252:2',
	},
	'command-man.mgs:1262:3': {
		messages: [
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Alfonso, yes! I look up to him a lot. And he's fond\nof me -- or, um, I guess he \u001b[1mwas\u001b[0m fond of me. N-not anymore, I\nguess.",
			"    I hope... I really do hope he'll try to get to know me\nagain. I was the rookie of the group, so I feel like they\nwere all sort of hard on me sometimes, but we mostly got\nalong back then....",
		],
		name: 'command-man.mgs:1262:3',
	},
	'command-man.mgs:1256:3': {
		messages: [
			' ',
			'\u001b[35mLAMBDA\u001b[0m: Alfonso? That name rings a bell... maybe? I-I feel\nlike I should know who that is.',
			"    Aw, man. I feel terrible. I'm having this sort of\npainful nostalgia about that name right now. Did I let him\ndown about something? Hmm.",
		],
		name: 'command-man.mgs:1256:3',
	},
	'command-man.mgs:1273:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Tell me about Jackob.'],
		name: 'command-man.mgs:1273:2',
	},
	'command-man.mgs:1282:3': {
		messages: [
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Jackob! He's the oldest village elder, of course, so\nhe's the most knowledgeable of all of us. Or... at least he\n\u001b[1mwas\u001b[0m. I-I confess he looked old and confused to me just now.\nThat was hard to watch. The Big Bad must have really done a\nnumber on him.",
		],
		name: 'command-man.mgs:1282:3',
	},
	'command-man.mgs:1277:3': {
		messages: [
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Jackob... Jackob.... That name is a bit odd, isn't\nit? There's something about that name... like there's\nsomething wrong about it. Is that really how it's spelled?",
		],
		name: 'command-man.mgs:1277:3',
	},
	'command-man.mgs:1301:3': {
		messages: ['\u001b[36mYOU\u001b[0m: About Bert....'],
		name: 'command-man.mgs:1301:3',
	},
	'command-man.mgs:1295:3': {
		messages: [
			'\u001b[36mYOU\u001b[0m: Tell me about Bert.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Bert? I don't know any Berts... I think? You know,\nmaybe -- no, no, I think I'm mixing myself up. I just had\nthe image of Sasquatch in my head for a second when you said\nthat.",
		],
		name: 'command-man.mgs:1295:3',
	},
	'command-man.mgs:1311:2': {
		messages: [' ', '(Ask about:)'],
		options: [
			{
				label: 'What is Bert like?',
				script: 'ch2_lambda_bert_like',
			},
			{
				label: "Bert's never mentioned you.",
				script: 'ch2_lambda_bert_mentioned',
			},
			{
				label: "What did he mean by 'back door?'",
				script: 'ch2_lambda_bert_door',
			},
			{
				label: 'Do you know if Bert left a message yet?',
				script: 'ch2_lambda_bert_message',
			},
			{
				label: '(Quit)',
				script: 'ch2_lambda_bert_quit',
			},
		],
		name: 'command-man.mgs:1311:2',
	},
	'command-man.mgs:1325:2': {
		messages: [
			'\u001b[36mYOU\u001b[0m: What is Bert like?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Bert is a surprisingly sweet guy. He doesn't say\nmuch, but he's actually pretty smart. And he's irritatingly\nstubborn when he gets stuck on something though. Once, way\nback, when....",
			'    Back when... hmmm.',
			' ',
			'\u001b[36mYOU\u001b[0m: What is it?',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: It was a fleeting thought, but it's gone now. Sorry,\nI can't remember what I was going to say.",
		],
		name: 'command-man.mgs:1325:2',
	},
	'command-man.mgs:1354:3': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Bert's never mentioned you.",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Well... he wouldn't have. He doesn't remember me at\nall.",
			"    I have a lot of regrets about everything, but he was\nactually one of the ones who argued that I take this course\nof action -- to sever the connection between \u001b[1mme\u001b[0m and my \u001b[1mname\u001b[0m\nand make everyone forget me. It's tragic, but this \u001b[1mis\u001b[0m what\nhe wanted.",
		],
		name: 'command-man.mgs:1354:3',
	},
	'command-man.mgs:1341:3': {
		messages: [
			"\u001b[36mYOU\u001b[0m: Bert's never mentioned you.",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Well... he might not know I'm here. In the castle.",
			' ',
			'\u001b[36mYOU\u001b[0m: But the village elders knew XA was here. In the castle.',
			' ',
			"\u001b[35mLAMBDA\u001b[0m: Yes, well, that's because....",
			"    Look... um... sometimes it's not so bad being left\nbehind, you know? They're all better off without me. It's\ncomplicated, but by staying apart, I'm keeping everyone\nsafer, believe it or not.",
		],
		name: 'command-man.mgs:1341:3',
	},
	'command-man.mgs:1366:2': {
		messages: [
			"\u001b[36mYOU\u001b[0m: What did Bert mean by 'back door?'",
			' ',
			'\u001b[35mLAMBDA\u001b[0m: A backdoor is a secret way into a secure area.\nHackers will create backdoors so they can still get in\nsomewhere after the normal entrance is no longer accessable\nto them.',
			' ',
			"\u001b[36mYOU\u001b[0m: But Bert's not a hacker. Or can \u001b[1manyone\u001b[0m use a backdoor?",
			' ',
			"\u001b[35mLAMBDA\u001b[0m: I mean, it's probably \u001b[1measier\u001b[0m if you're a hacker, but\na door's a door. Say, there's probably still a backdoor or\ntwo in the village you could find if you tried. No hacking\nrequired.",
		],
		name: 'command-man.mgs:1366:2',
	},
	'command-man.mgs:1381:2': {
		messages: ['\u001b[36mYOU\u001b[0m: Do you know if Bert left a message yet?', ' '],
		name: 'command-man.mgs:1381:2',
	},
	'command-man.mgs:1390:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You might want to double check with the Wiz, but I\nhaven't heard anything so far, sorry.",
		],
		name: 'command-man.mgs:1390:3',
	},
	'command-man.mgs:1386:3': {
		messages: ["\u001b[35mLAMBDA\u001b[0m: Haha! He's only been gone a moment! Be patient."],
		name: 'command-man.mgs:1386:3',
	},
	'command-map.mgs:12:2': {
		messages: [
			'\u001b[36m\u001b[1mMGE GENERAL COMMANDS MANUAL - MAP\u001b[0m',
			' ',
			"Displays an ASCII map of King Gibson's castle. Rooms are\nadded to the map as you visit them.",
			' ',
			"The \u001b[36m\u001b[1m@\u001b[0m symbol indicates which room you're in, and items from\nthe parts list are marked with \u001b[32m?\u001b[0m.",
		],
		name: 'command-map.mgs:12:2',
	},
	'command-map.mgs:25:2': {
		messages: [' '],
		name: 'command-map.mgs:25:2',
	},
	'command-map.mgs:32:2': {
		messages: ['\nCurrent location: \u001b[36m'],
		name: 'command-map.mgs:32:2',
	},
	'command-map.mgs:88:3': {
		messages: ['\u001b[0m\u001b[1m(outside the castle)'],
		name: 'command-map.mgs:88:3',
	},
	'command-map.mgs:36:3': {
		messages: ['CASTLE ENTRANCE'],
		name: 'command-map.mgs:36:3',
	},
	'command-map.mgs:40:3': {
		messages: ['CASTLE HALLWAY FRONT'],
		name: 'command-map.mgs:40:3',
	},
	'command-map.mgs:44:3': {
		messages: ['CASTLE HALLWAY BACK'],
		name: 'command-map.mgs:44:3',
	},
	'command-map.mgs:48:3': {
		messages: ['THRONE ROOM'],
		name: 'command-map.mgs:48:3',
	},
	'command-map.mgs:52:3': {
		messages: ["KING GIBSON'S BEDROOM"],
		name: 'command-map.mgs:52:3',
	},
	'command-map.mgs:56:3': {
		messages: ['WORKSHOP'],
		name: 'command-map.mgs:56:3',
	},
	'command-map.mgs:60:3': {
		messages: ['SERVER ROOM'],
		name: 'command-map.mgs:60:3',
	},
	'command-map.mgs:64:3': {
		messages: ['POWER PLANT'],
		name: 'command-map.mgs:64:3',
	},
	'command-map.mgs:68:3': {
		messages: ['GRAND HALL'],
		name: 'command-map.mgs:68:3',
	},
	'command-map.mgs:72:3': {
		messages: ['CASTLE KITCHEN'],
		name: 'command-map.mgs:72:3',
	},
	'command-map.mgs:76:3': {
		messages: ['HYDROPONICS ROOM'],
		name: 'command-map.mgs:76:3',
	},
	'command-map.mgs:80:3': {
		messages: ['CASTLE PANTRY'],
		name: 'command-map.mgs:80:3',
	},
	'command-map.mgs:84:3': {
		messages: ["LAMBDA'S LAB"],
		name: 'command-map.mgs:84:3',
	},
	'command-map.mgs:92:2': {
		messages: ['\u001b[0m\n'],
		name: 'command-map.mgs:92:2',
	},
	'command-parts.mgs:61:2': {
		messages: [
			'\u001b[36m\u001b[1mMGE GENERAL COMMANDS MANUAL - PARTS\u001b[0m',
			' ',
			'This command uses the program \u001b[1mlambda-talk\u001b[0m to call Lambda\nwith the subject line "parts." To learn about a specific\npart, add the part name, e.g. \u001b[36mPARTS MONITOR\u001b[0m.',
			' ',
			'\u001b[35mNOTE\u001b[0m: Hi, there, birthday mage! This is just something I\nrigged up so you could have a shortcut to ask me quick\nquestions about the parts list. :)',
		],
		name: 'command-parts.mgs:61:2',
	},
	'command-parts.mgs:78:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Not sure what you mean. Want to ask about one of\nthese instead?',
			' ',
		],
		name: 'command-parts.mgs:78:3',
	},
	'command-parts.mgs:97:3': {
		messages: ['\u001b[36mPARTS LIST\u001b[0m', ' '],
		name: 'command-parts.mgs:97:3',
	},
	'command-parts.mgs:135:3': {
		messages: ['- [ ] heat sink'],
		name: 'command-parts.mgs:135:3',
	},
	'command-parts.mgs:131:3': {
		messages: ['- [x] heat sink'],
		name: 'command-parts.mgs:131:3',
	},
	'command-parts.mgs:133:3': {
		messages: ['- [~] heat sink'],
		name: 'command-parts.mgs:133:3',
	},
	'command-parts.mgs:143:3': {
		messages: ['- [ ] power supply'],
		name: 'command-parts.mgs:143:3',
	},
	'command-parts.mgs:139:3': {
		messages: ['- [x] power supply'],
		name: 'command-parts.mgs:139:3',
	},
	'command-parts.mgs:141:3': {
		messages: ['- [~] power supply'],
		name: 'command-parts.mgs:141:3',
	},
	'command-parts.mgs:151:3': {
		messages: ['- [ ] monitor'],
		name: 'command-parts.mgs:151:3',
	},
	'command-parts.mgs:147:3': {
		messages: ['- [x] monitor'],
		name: 'command-parts.mgs:147:3',
	},
	'command-parts.mgs:149:3': {
		messages: ['- [~] monitor'],
		name: 'command-parts.mgs:149:3',
	},
	'command-parts.mgs:160:3': {
		messages: ['- [ ] hard drive'],
		name: 'command-parts.mgs:160:3',
	},
	'command-parts.mgs:156:3': {
		messages: ['- [x] hard drive'],
		name: 'command-parts.mgs:156:3',
	},
	'command-parts.mgs:158:3': {
		messages: ['- [~] hard drive'],
		name: 'command-parts.mgs:158:3',
	},
	'command-parts.mgs:167:3': {
		messages: ['    - [ ] dinner plate'],
		name: 'command-parts.mgs:167:3',
	},
	'command-parts.mgs:163:3': {
		messages: ['    - [x] dinner plate'],
		name: 'command-parts.mgs:163:3',
	},
	'command-parts.mgs:165:3': {
		messages: ['    - [~] dinner plate'],
		name: 'command-parts.mgs:165:3',
	},
	'command-parts.mgs:174:3': {
		messages: ['    - [ ] phonograph needle'],
		name: 'command-parts.mgs:174:3',
	},
	'command-parts.mgs:170:3': {
		messages: ['    - [x] phonograph needle'],
		name: 'command-parts.mgs:170:3',
	},
	'command-parts.mgs:172:3': {
		messages: ['    - [~] phonograph needle'],
		name: 'command-parts.mgs:172:3',
	},
	'command-parts.mgs:182:3': {
		messages: ['- [ ] keyboard'],
		name: 'command-parts.mgs:182:3',
	},
	'command-parts.mgs:178:3': {
		messages: ['- [x] keyboard'],
		name: 'command-parts.mgs:178:3',
	},
	'command-parts.mgs:180:3': {
		messages: ['- [~] keyboard'],
		name: 'command-parts.mgs:180:3',
	},
	'command-parts.mgs:190:3': {
		messages: ['- [ ] mouse'],
		name: 'command-parts.mgs:190:3',
	},
	'command-parts.mgs:186:3': {
		messages: ['- [x] mouse'],
		name: 'command-parts.mgs:186:3',
	},
	'command-parts.mgs:188:3': {
		messages: ['- [~] mouse'],
		name: 'command-parts.mgs:188:3',
	},
	'command-parts.mgs:199:3': {
		messages: ['- [ ] RAM chips'],
		name: 'command-parts.mgs:199:3',
	},
	'command-parts.mgs:195:3': {
		messages: ['- [x] RAM chips'],
		name: 'command-parts.mgs:195:3',
	},
	'command-parts.mgs:197:3': {
		messages: ['- [~] RAM chips'],
		name: 'command-parts.mgs:197:3',
	},
	'command-parts.mgs:207:3': {
		messages: ['- [ ] clock'],
		name: 'command-parts.mgs:207:3',
	},
	'command-parts.mgs:203:3': {
		messages: ['- [x] clock'],
		name: 'command-parts.mgs:203:3',
	},
	'command-parts.mgs:205:3': {
		messages: ['- [~] clock'],
		name: 'command-parts.mgs:205:3',
	},
	'command-parts.mgs:215:3': {
		messages: ['- [ ] cpu'],
		name: 'command-parts.mgs:215:3',
	},
	'command-parts.mgs:211:3': {
		messages: ['- [x] cpu'],
		name: 'command-parts.mgs:211:3',
	},
	'command-parts.mgs:213:3': {
		messages: ['- [~] cpu'],
		name: 'command-parts.mgs:213:3',
	},
	'command-parts.mgs:222:3': {
		messages: ['    - [ ] goldfish'],
		name: 'command-parts.mgs:222:3',
	},
	'command-parts.mgs:218:3': {
		messages: ['    - [x] goldfish'],
		name: 'command-parts.mgs:218:3',
	},
	'command-parts.mgs:220:3': {
		messages: ['    - [~] goldfish'],
		name: 'command-parts.mgs:220:3',
	},
	'command-parts.mgs:229:3': {
		messages: ['    - [ ] abacus'],
		name: 'command-parts.mgs:229:3',
	},
	'command-parts.mgs:225:3': {
		messages: ['    - [x] abacus'],
		name: 'command-parts.mgs:225:3',
	},
	'command-parts.mgs:227:3': {
		messages: ['    - [~] abacus'],
		name: 'command-parts.mgs:227:3',
	},
	'command-parts.mgs:238:3': {
		messages: ['    - [ ] mainframe os'],
		name: 'command-parts.mgs:238:3',
	},
	'command-parts.mgs:234:3': {
		messages: ['    - [x] mainframe os'],
		name: 'command-parts.mgs:234:3',
	},
	'command-parts.mgs:236:3': {
		messages: ['    - [~] mainframe os'],
		name: 'command-parts.mgs:236:3',
	},
	'command-parts.mgs:241:2': {
		messages: [
			' ',
			'(For information about one of the above parts, type \u001b[36mPARTS\u001b[0m\nfollowed by the part name.)',
		],
		name: 'command-parts.mgs:241:2',
	},
	'command-parts.mgs:265:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Hold on! Don't get ahead of yourself, haha.... For\nnow just focus on the below:",
			' ',
		],
		name: 'command-parts.mgs:265:2',
	},
	'command-parts.mgs:273:2': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: I don't know if that will be of any use, but... want\nto ask about something else?",
		],
		name: 'command-parts.mgs:273:2',
	},
	'command-parts.mgs:284:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You've got the monitor all set up already. If it\nlooks broken, it's only because the mainframe can't boot up\nyet.",
		],
		name: 'command-parts.mgs:284:3',
	},
	'command-parts.mgs:286:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Looks like you've got the monitor already. To\ninstall it, all you'll need to do is find the matching ports\non the mainframe enclosure. It's all keyed, so there's no\nplugging anything in the wrong way.\n    Oh, and don't forget to plug the monitor into power.",
		],
		name: 'command-parts.mgs:286:3',
	},
	'command-parts.mgs:290:2': {
		messages: [' '],
		name: 'command-parts.mgs:290:2',
	},
	'command-parts.mgs:296:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You've got the heat sink ready to go, but you'll\nneed to install the CPU first, so, uh, you can just leave it\nthere for the moment.",
		],
		name: 'command-parts.mgs:296:3',
	},
	'command-parts.mgs:298:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Looks like you've got the heat sink already! So, uh,\nI sort of forgot you can't install that until the CPU is in\nthere, so just set it aside for the moment. We'll do the\nactual install later.",
		],
		name: 'command-parts.mgs:298:3',
	},
	'command-parts.mgs:302:2': {
		messages: [' '],
		name: 'command-parts.mgs:302:2',
	},
	'command-parts.mgs:308:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The power supply is in place already. Notice,\nthough, that it's got a bunch of smaller wires coming off of\nit -- you'll need to plug other components into those later.\nEverything is keyed, so it should be obvious how everything\nshould be plugged when the time comes.",
		],
		name: 'command-parts.mgs:308:3',
	},
	'command-parts.mgs:310:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: There's a spot where the power supply goes -- it\nshould be fairly obvious. Then screw it in so it won't\nwiggle around in there.",
		],
		name: 'command-parts.mgs:310:3',
	},
	'command-parts.mgs:314:2': {
		messages: [' '],
		name: 'command-parts.mgs:314:2',
	},
	'command-parts.mgs:326:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: You\'ve got a keyboard plugged in already... though I\nrealize it\'s not going to be the easiest to use. But hey,\ndid you know that very early keyboards used a lot of\n"chords" as part of their normal input paradigm?\n    ...Yeah, they kind of sucked. QWERTY is much nicer.',
		],
		name: 'command-parts.mgs:326:3',
	},
	'command-parts.mgs:328:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: I've checked up on that specific model of keytar,\nand fortunately it can connect to a computer over USB. Just\nplug it into the outside of the case and you're good to go.\n    A MIDI interface would have been trickier, but I'm sure\nwe could have found an adaptor around somewhere.",
		],
		name: 'command-parts.mgs:328:3',
	},
	'command-parts.mgs:332:2': {
		messages: [' '],
		name: 'command-parts.mgs:332:2',
	},
	'command-parts.mgs:341:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You've got your mouse dongle plugged in, so the\nmouse will work fine now once we get the rest of the machine\nup and running. Oh, that's assuming its batteries are\ncharged, I guess.",
		],
		name: 'command-parts.mgs:341:3',
	},
	'command-parts.mgs:343:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Installing the mouse is easy. All you have to do is\nplug the end into a USB port. If it's an optical mouse, you\ncan tell it's plugged in correctly if the red laser comes on\nonce you turn on the computer.\n    Oh, whoops, yours is wireless, huh? Well, then, just\nplug the dongle into one of the USB ports, and make sure the\nmouse has fresh batteries.",
		],
		name: 'command-parts.mgs:343:3',
	},
	'command-parts.mgs:347:2': {
		messages: [' '],
		name: 'command-parts.mgs:347:2',
	},
	'command-parts.mgs:361:3': {
		messages: [
			'    Use one of the solder stations in the workshop to\ncombine both items into a \u001b[35mHARD DRIVE\u001b[0m.',
		],
		name: 'command-parts.mgs:361:3',
	},
	'command-parts.mgs:356:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The hard drive is already in place, so we'll have\nall the on-board storage we'll need. Not sure how much space\nwe'll have, given how it was constructed, but... I'm sure\nit'll be fine.",
		],
		name: 'command-parts.mgs:356:3',
	},
	'command-parts.mgs:358:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The hard drive will need to be plugged into two\ncables: first, a power cable from the power supply, and\nsecond, a SATA cable off the motherboard.\n    Since that hard drive is... uh, unconventional... just\ntry your best to attach those cables somehow. You'll know if\nit fits.",
		],
		name: 'command-parts.mgs:358:3',
	},
	'command-parts.mgs:365:2': {
		messages: [' '],
		name: 'command-parts.mgs:365:2',
	},
	'command-parts.mgs:374:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: You\'ve already... um, "used" the plate to make a\n\u001b[35mhard drive\u001b[0m. You\'re good.',
		],
		name: 'command-parts.mgs:374:3',
	},
	'command-parts.mgs:379:4': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Now that you have both the \u001b[35mplate\u001b[0m and \u001b[35mneedle\u001b[0m, you can\nuse one of the solder stations to combine them.\n    Huh, I can confirm that the iron content of the plate is\nhigh enough for this to actually work. Not that I was\nworried....',
		],
		name: 'command-parts.mgs:379:4',
	},
	'command-parts.mgs:377:4': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You've got a good \u001b[35mplate\u001b[0m already. So now what you\nneed is a phonograph \u001b[35mneedle\u001b[0m to act as a read head.",
		],
		name: 'command-parts.mgs:377:4',
	},
	'command-parts.mgs:384:2': {
		messages: [' '],
		name: 'command-parts.mgs:384:2',
	},
	'command-parts.mgs:393:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: You\'ve already... um, "used" the \u001b[35mneedle\u001b[0m to make a\n\u001b[35mhard drive\u001b[0m. You\'re good.',
		],
		name: 'command-parts.mgs:393:3',
	},
	'command-parts.mgs:398:4': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Now that you have both the \u001b[35mneedle\u001b[0m and \u001b[35mplate\u001b[0m, you can\nuse one of the solder stations to combine them.\n    Oh, wow, it looks like that phonograph needle is\nelectric. Weird, but also serendipitous.',
		],
		name: 'command-parts.mgs:398:4',
	},
	'command-parts.mgs:396:4': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You've got a \u001b[35mneedle\u001b[0m for a read head already. So now\nwhat you need is a dinner \u001b[35mplate\u001b[0m to act as a hard drive\nplatter.",
		],
		name: 'command-parts.mgs:396:4',
	},
	'command-parts.mgs:403:2': {
		messages: [' '],
		name: 'command-parts.mgs:403:2',
	},
	'command-parts.mgs:412:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The RAM is in place, nice and tight. They're all\nset.",
		],
		name: 'command-parts.mgs:412:3',
	},
	'command-parts.mgs:414:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: To install RAM... \"chips...\" you'll need to find\npairs of matching RAM slots on the motherboard. Usually\nyou'd want to use two or four -- it just can't be an odd\nnumber. And then....\n    Well, it's going to be really freaky, but you need to\n\u001b[1mSHOVE\u001b[0m them in there, all right? They need to really \u001b[1mCRUNCH\u001b[0m\non in there.",
		],
		name: 'command-parts.mgs:414:3',
	},
	'command-parts.mgs:418:2': {
		messages: [' '],
		name: 'command-parts.mgs:418:2',
	},
	'command-parts.mgs:430:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The clock's installed already. It's just... you\nknow... clocking away.",
		],
		name: 'command-parts.mgs:430:3',
	},
	'command-parts.mgs:432:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: So the system clock is normally built in, and --\nwell, you know what? You got that giant grandfather clock to\nfit inside your pocket somehow, so just... uh... do that\nagain, but for the mainframe enclosure instead.',
		],
		name: 'command-parts.mgs:432:3',
	},
	'command-parts.mgs:436:2': {
		messages: [' '],
		name: 'command-parts.mgs:436:2',
	},
	'command-parts.mgs:445:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Your CPU is in place already, ready to go off and be\nthe brain of the whole operation.',
		],
		name: 'command-parts.mgs:445:3',
	},
	'command-parts.mgs:447:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Line up the CPU with the slot, and gently set it\ndown. Then press the clamp down to lock it in place.\n    Now the icky part. You got to put thermal paste on\nthere. Try not to get any on your hands, and try to place it\nso there won't be any bubbles when you press the heat sink\non top. Then... well, press the heat sink on top.",
		],
		name: 'command-parts.mgs:447:3',
	},
	'command-parts.mgs:451:2': {
		messages: [' '],
		name: 'command-parts.mgs:451:2',
	},
	'command-parts.mgs:460:3': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: You\'ve already... um, "used" the goldfish to make a\nCPU. You\'re good.',
		],
		name: 'command-parts.mgs:460:3',
	},
	'command-parts.mgs:465:4': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: Now that you have both the goldfish and abacus, you\ncan use one of the solder stations to combine them.\n    Ah... don't worry about the fact that the goldfish is\nsentient and its identity will be transmogrified by this.\nIt's all going to be fine.",
		],
		name: 'command-parts.mgs:465:4',
	},
	'command-parts.mgs:463:4': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: You\'ve got the goldfish already, the "thinking" part\nof the CPU, so you\'ll need to pick up the other half: the\nabacus.',
		],
		name: 'command-parts.mgs:463:4',
	},
	'command-parts.mgs:470:2': {
		messages: [' '],
		name: 'command-parts.mgs:470:2',
	},
	'command-parts.mgs:479:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You've already got the abacus combined with the\ngoldfish into a CPU, so don't worry about the abacus half of\nthings now.",
		],
		name: 'command-parts.mgs:479:3',
	},
	'command-parts.mgs:484:4': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: Now that you have both the abacus and goldfish, you\ncan use one of the solder stations to combine them.',
		],
		name: 'command-parts.mgs:484:4',
	},
	'command-parts.mgs:482:4': {
		messages: [
			'\u001b[35mLAMBDA\u001b[0m: You\'ve got an abacus already, the "data" part of the\nCPU, so you\'ll need to pick up the other half: the goldfish.',
		],
		name: 'command-parts.mgs:482:4',
	},
	'command-parts.mgs:489:2': {
		messages: [' '],
		name: 'command-parts.mgs:489:2',
	},
	'command-parts.mgs:499:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You've got the mainframe OS now, so head on back to\nfirst room of the castle -- the room with the the mainframe\nenclosure -- so the Wizard can install it for you. Good\nluck.",
		],
		name: 'command-parts.mgs:499:3',
	},
	'command-parts.mgs:495:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: The operating system isn't quite ready yet. Sorry.\nKeep working on the hardware and I'll keep working on\ngetting the OS ready for you.",
		],
		name: 'command-parts.mgs:495:3',
	},
	'command-parts.mgs:497:3': {
		messages: [
			"\u001b[35mLAMBDA\u001b[0m: You'll all done with the mainframe hardware, so come\nget the OS from me in my \u001b[36mSECRET LAB\u001b[0m. Use \u001b[36mWARP\u001b[0m to reach me.",
		],
		name: 'command-parts.mgs:497:3',
	},
	'command-parts.mgs:501:2': {
		messages: [' '],
		name: 'command-parts.mgs:501:2',
	},
	'command-rtfm.mgs:11:2': {
		messages: [
			'\u001b[36m\u001b[1mMGE GENERAL COMMANDS MANUAL - RTFM\u001b[0m',
			' ',
			"A portable copy of the books and pamphlets kept within the\n\u001b[35minner sanctum\u001b[0m at the back of the library. They primarily\ndescribe how to use Ring Zero's hex editor, but also contain\nperipheral information.",
			' ',
			'Fun fact, \u001b[1m\u001b[36mRTFM\u001b[0m stands for "read the \u001b[31mflamin\'\u001b[0m manual."',
		],
		name: 'command-rtfm.mgs:11:2',
	},
	'command-rtfm.mgs:24:2': {
		messages: [
			'\u001b[1m\u001b[36mRTFM!\u001b[0m Hex editor docs! Read which book?',
			'    1: \u001b[32mEntities 1\u001b[0m',
			'    2: \u001b[32mEntities 2\u001b[0m',
			'    3: \u001b[32mEntities 3\u001b[0m',
			'    4: \u001b[32mEntities 4\u001b[0m',
			'    5: \u001b[32mHex Edits 1\u001b[0m',
			'    6: \u001b[32mHex Edits 2\u001b[0m',
			'    A: \u001b[34mBits & Bytes\u001b[0m',
			'    B: \u001b[34mMath\u001b[0m',
			'    C: \u001b[31mBook Origins\u001b[0m',
			'    D: \u001b[31mRed Letters\u001b[0m',
			'    Q: QUIT',
		],
		text_options: {
			1: 'serial_entities1',
			2: 'serial_entities2',
			3: 'serial_entities3',
			4: 'serial_entities4',
			5: 'serial_hexediting',
			6: 'serial_hexediting2',
			a: 'serial_bitsbytes',
			b: 'serial_math',
			c: 'serial_bookorigins',
			d: 'serial_redletters',
			q: 'command_rtfm_quit',
			quit: 'command_rtfm_quit',
		},
		name: 'command-rtfm.mgs:24:2',
	},
	'command-rtfm.mgs:54:2': {
		messages: [
			' ',
			'\u001b[1m\u001b[36mRTFM:\u001b[0m\u001b[1m Read another? (Y/N) (or type a book id: 1-6, A-D)',
		],
		text_options: {
			1: 'serial_entities1',
			2: 'serial_entities2',
			3: 'serial_entities3',
			4: 'serial_entities4',
			5: 'serial_hexediting',
			6: 'serial_hexediting2',
			a: 'serial_bitsbytes',
			b: 'serial_math',
			c: 'serial_bookorigins',
			d: 'serial_redletters',
			q: 'command_rtfm_quit',
			quit: 'command_rtfm_quit',
			n: 'command_rtfm_quit',
			no: 'command_rtfm_quit',
			y: 'command_rtfm',
			yes: 'command_rtfm',
		},
		name: 'command-rtfm.mgs:54:2',
	},
	'command-rtfm.mgs:78:2': {
		messages: ['Invalid book id! Restarting....'],
		name: 'command-rtfm.mgs:78:2',
	},
	'command-rtfm.mgs:85:2': {
		messages: ['\u001b[1m\u001b[36mRTFM!\u001b[0m Thanks for reading!'],
		name: 'command-rtfm.mgs:85:2',
	},
	'command-rtfm.mgs:92:2': {
		messages: [
			'\u001b[1m\u001b[32mRTFM #1 - ENTITIES 1\u001b[0m',
			' ',
			'After many years of research, we have discovered the data\nstructure of all living beings, as well as miscellaneous\ninanimate objects.',
			"    In all cases, hackable beings and objects -- or\n'entities' -- are driven by 32 bytes of data, appearing as\ntwo rows of 16 bytes.",
			'    [\u001b[36mX X X X X X X X X X X X \u001b[35mY Y Y Y\u001b[0m]',
			'    The first twelve bytes (\u001b[36mX\u001b[0m) on the first row are the\nentity\'s true name, given in something called "Ass Key."',
			"    After the name, the next four bytes (\u001b[35mY\u001b[0m) are the entity's\nposition in the world, two bytes for X and two bytes for Y.",
			'    The position of each byte within each pair is backwards\nrelative to what seems to us to be logical -- and from what\nwe understand, a Mr. N. Dian is to blame.',
		],
		name: 'command-rtfm.mgs:92:2',
	},
	'command-rtfm.mgs:107:2': {
		messages: [
			'\u001b[1m\u001b[32mRTFM #2 - ENTITIES 2\u001b[0m',
			' ',
			'The second row of entity data is far more complicated.',
			'    [\u001b[36mX X \u001b[35mY Y\u001b[0m . . . . . . . . . . . .]',
			'    The first pair of bytes (\u001b[36mX\u001b[0m) seems to affect what the\nentity does when interacted with\u001b[0m. Changing these values is\nfrequently counterproductive.',
			'    However, changing the second pair of bytes (\u001b[35mY\u001b[0m) causes\nunspeakable chaos. We have learned to leave these bytes\nundisturbed.',
			'    [. . . . \u001b[36mA A \u001b[35mB B \u001b[32mC\u001b[0m . . . . . . .]',
			'    The next five bytes apparently concern how an entity\nappears, but the last byte (\u001b[32mC\u001b[0m) affects the others in ways we\nare still trying to understand.',
			'    The first pair (\u001b[36mA\u001b[0m) is more useful, seeming to change the\nentity type, or which among its category the entity appears\nto be.',
			"    The second pair (\u001b[35mB\u001b[0m) appears to do nothing the vast\nmajority of the time, but occasionally it changes the\nentity's appearance in odd ways -- it's almost as if certain\nentities exist in a series along a parallel dimension, and\nwe can simply choose which dimension is realized.",
			'    Again, all two-byte pairs are backwards in their\nmanifestation. We are preparing a strongly-worded letter to\nMr. N. Dian.',
		],
		name: 'command-rtfm.mgs:107:2',
	},
	'command-rtfm.mgs:125:2': {
		messages: [
			'\u001b[1m\u001b[32mRTFM #3 - ENTITIES 3\u001b[0m',
			' ',
			'The next three bytes on the second row apparently describe\nhow the entity is behaving.',
			'    [. . . . . . . . . \u001b[36mX \u001b[35mY \u001b[32mZ\u001b[0m . . . .]',
			'    The first byte (\u001b[36mX\u001b[0m) describes the action the entity is\ncurrently performing, while the next (\u001b[35mY\u001b[0m) describes how far\nalong into the action the entity has progressed.',
			'    Alas, not all entities are capable of all actions,\nthough some appear delightfully animated.',
			'    The next byte (\u001b[32mZ\u001b[0m) first appeared only to represent the\ncardinal direction the entity is facing, but we have\ndiscovered a secret:',
			'    If this byte is considered not as a unit but instead as\na series of 8 bits, then the largest bit toggles a bizarre\ndisruption in appearance, which we have found useful to\ncause great alarm and panic among our less-enlightened\nneighbors.',
		],
		name: 'command-rtfm.mgs:125:2',
	},
	'command-rtfm.mgs:140:2': {
		messages: [
			'\u001b[1m\u001b[32mRTFM #4 - ENTITIES 4\u001b[0m',
			' ',
			'The final four bytes are quite abstract.',
			'    [. . . . . . . . . . . . \u001b[36mX X \u001b[35mY Y\u001b[0m]',
			'    The first pair (\u001b[36mX\u001b[0m) seems to us to bond the entity to a\nphysical place -- a beloved path, a favorite chair, etc.',
			'    The function of the final pair (\u001b[35mY\u001b[0m) escapes us, at least\nfor the moment.',
			'    There may yet be undiscovered secrets, and the world may\nyet change around us, rendering invalid the structure we\nhave already mapped. But we will endeavor to continue our\nresearch.',
		],
		name: 'command-rtfm.mgs:140:2',
	},
	'command-rtfm.mgs:154:2': {
		messages: [
			'\u001b[1m\u001b[32mRTFM #5 - HEX EDITS 1\u001b[0m',
			' ',
			"\u001b[36mTriangle\u001b[0m, a button thought by most scholars to do nothing,\napparently provides a shortcut to an entity's first row of\ndata.",
			'    Once inside the hex editor, however, this button instead\nincrements the currently-selected byte by one.',
			'    Its companion, the \u001b[35mX\u001b[0m button, decrements the\ncurrently-selected byte.',
			'    Both \u001b[36mtriangle\u001b[0m and \u001b[35mX\u001b[0m thus provide convenient ways of\naltering data, but when outside the hex editor, we must rely\non the standard methods:',
			'    Pressing the bit buttons while the correct operator\n(XOR, ADD, SUB) is selected.',
		],
		name: 'command-rtfm.mgs:154:2',
	},
	'command-rtfm.mgs:168:2': {
		messages: [
			'\u001b[1m\u001b[32mRTFM #6 - HEX EDITS 2\u001b[0m',
			' ',
			'Some advanced tricks we have discovered:',
			'    Holding \u001b[36mPAGE\u001b[0m and pressing a \u001b[35mMEM\u001b[0m button reassigns the \u001b[35mMEM\n\u001b[35mshortcut\u001b[0m to the currently-selected hex cell.',
			'    Conveniently, \u001b[35mMEM references\u001b[0m are relative to the entity\nthe cursor is positioned within.',
			"    Though we've found little reason to change the mapping\nmore than a handful of times. Our favorite bytes continue to\nbe the same four.",
			'    In addition, the use of --',
			' ',
			'(...The last page appears to be missing!)',
		],
		name: 'command-rtfm.mgs:168:2',
	},
	'command-rtfm.mgs:184:2': {
		messages: [
			'\u001b[1m\u001b[34mRTFM #A - BITS & BYTES\u001b[0m',
			' ',
			'A bit is a one or a zero. But combine eight of them, and you\ncan describe numbers up to 255 -- a byte.',
			'    For simplicity, it is best to think of a byte as a pair\nof numbers between 0 and 15 -- or 0 and F.',
			' ',
			"(There's more text here, but it's dry and uninteresting.\nYour eyes glaze over....)",
		],
		name: 'command-rtfm.mgs:184:2',
	},
	'command-rtfm.mgs:197:2': {
		messages: [
			'\u001b[1m\u001b[34mRTFM #B - MATH\u001b[0m',
			' ',
			'You know what ADDing and SUBtracting does, but XOR is less\nintuitive -- unless you are looking at the bits making up\neach byte.',
			'    In which case, think of XOR as a toggle on a single bit.',
			"    It's like each byte is actually eight boolean switches!\nAmazing!",
		],
		name: 'command-rtfm.mgs:197:2',
	},
	'command-rtfm.mgs:209:2': {
		messages: [
			'\u001b[1m\u001b[31mRTFM #C - BOOK ORIGINS\u001b[0m',
			' ',
			'\u001b[1mMeeting minutes\u001b[0m: Smarch 32nd, year 1337',
			"\u001b[1mSubject\u001b[0m: who wrote the 'Entity' and 'Hex Edits' books?",
			'    \u001b[35mAlfonso\u001b[0m: Whoever wrote those books must have had access\nto the real Ring Zero.',
			'    \u001b[35mBert\u001b[0m: The \u001b[31mBig Bad\u001b[0m?',
			'    \u001b[35mJackob\u001b[0m: But the \u001b[31mBig Bad\u001b[0m had no accomplices, and there\nwere clearly multiple people doing this research.',
			'    \u001b[35mAlfonso\u001b[0m: Then perhaps the \u001b[31mBig Bad\u001b[0m was not the first mage\nto have Ring Zero. Perhaps he will not be the last.',
			'    \u001b[35mBert\u001b[0m: Or is there more than one ring?',
		],
		name: 'command-rtfm.mgs:209:2',
	},
	'command-rtfm.mgs:225:2': {
		messages: [
			'\u001b[1m\u001b[31mRTFM #D - RED LETTERS\u001b[0m',
			' ',
			'\u001b[1mMeeting minutes\u001b[0m: Smarch 16th, year 1337',
			'\u001b[1mSubject\u001b[0m: a rubbing taken from a dilapidated granite plaque\nfound deep in the Fortran Forest: \u001b[31m"RED LETTERS MARK THE\n\u001b[31mHACKER."\u001b[0m',
			"    \u001b[35mAlfonso\u001b[0m: Obviously this is a reference to a calendar.\nPerhaps the power to hack is granted to mages on specific\ndays -- 'red-letter' days!",
			'    \u001b[35mJackob\u001b[0m: You mean mages can only become hackers on\nnational holidays? Certainly not!',
			"    \u001b[35mAlfonso\u001b[0m: What else might it mean by 'red letters,' then?\nPerhaps... when a mage becomes a hacker, it IS a red-letter\nday!",
			"    \u001b[35mJackob\u001b[0m: Or perhaps the phrase 'red letters' is a red\nherring!",
		],
		name: 'command-rtfm.mgs:225:2',
	},
	'command-warp.mgs:103:2': {
		messages: [
			'\u001b[36m\u001b[1mMGE GENERAL COMMANDS MANUAL - WARP\u001b[0m',
			' ',
			"A powerful command that teleports you to a room you've been\nto before.",
			' ',
			'To see a list of valid warp desinations, use \u001b[36mWARP\u001b[0m on its own\n(without a room name).',
			' ',
			'NOTE: Long distance warps may require access to the Gibson\nwifi network. If encountering problems, please reduce your\ndistance to the nearest castle wireless base station.',
		],
		name: 'command-warp.mgs:103:2',
	},
	'command-warp.mgs:118:2': {
		messages: [
			'\u001b[1m\u001b[31mWARP FAILED!\u001b[0m You have not been to that destination yet or\nthat destination does not exist.',
		],
		name: 'command-warp.mgs:118:2',
	},
	'command-warp.mgs:127:2': {
		messages: [
			'List of valid \u001b[36mWARP\u001b[0m destinations:',
			' ',
			'\u001b[1m-------------------- CASTLE --------------------\u001b[0m',
			'  Castle exterior          Server room',
			'  Castle entrance          Power plant',
			'  Castle hallway front     Grand hall',
			'  Castle hallway back      Castle kitchen',
			'  Castle throne room       Hydroponics room',
			"  King Gibson's bedroom    Castle pantry",
			'  Workshop                 Secret lab',
			' ',
			'\u001b[1m-------------------- TOWN ----------------------\u001b[0m',
			"  Town                     Bob's Club",
			"  Bakery                   Bob's Club basement",
			"  Greenhouse               Beatrice's house",
			"  Library                  Smith's house",
			'  RTFM room                My house',
		],
		name: 'command-warp.mgs:127:2',
	},
	'command-warp.mgs:147:3': {
		messages: ['  WOPR room'],
		name: 'command-warp.mgs:147:3',
	},
	'command-warp.mgs:242:2': {
		messages: [
			'\u001b[1m\u001b[31mERROR\u001b[0m: \u001b[1mwarp-assistant\u001b[0m timed out',
			' ',
			'DNS lookup for warp destination failed. Could not confirm\ncoordinates of destination. Aborting!',
			' ',
			'Check your wifi connection and try again.',
			' ',
			'\u001b[1mwarp-assistant\u001b[0m: exited with code -1',
		],
		name: 'command-warp.mgs:242:2',
	},
	'commands-default.mgs:3:2': {
		messages: [
			'\u001b[36m\u001b[1mMGE GENERAL COMMANDS MANUAL - LOOK\u001b[0m',
			' ',
			"Describes the room you're in. Will describe entities instead\nif an entity name is provided after the word \u001b[36mLOOK\u001b[0m.",
			' ',
			"Importantly, it can list a room's exits, even if they are\ninvisible.",
			' ',
			'This command may also be triggered with the alias \u001b[36mEXAMINE\u001b[0m or\nthe abbreviations \u001b[36mL\u001b[0m or \u001b[36mX\u001b[0m.',
		],
		name: 'commands-default.mgs:3:2',
	},
	'commands-default.mgs:16:2': {
		messages: [
			'\u001b[36m\u001b[1mMGE GENERAL COMMANDS MANUAL - GO\u001b[0m',
			' ',
			'Lets you travel to an adjacent room, even if the actual,\nphysical door is blocked, locked, or hidden. Type \u001b[36mGO\u001b[0m\nfollowed by the name of the exit, e.g. \u001b[36mGO NORTH\u001b[0m',
			' ',
			"To learn the names of the current room's exits, use \u001b[36mLOOK\u001b[0m.",
		],
		name: 'commands-default.mgs:16:2',
	},
	'commands-default.mgs:27:2': {
		messages: [
			'\u001b[36m\u001b[1mMGE GENERAL COMMANDS MANUAL - HELP\u001b[0m',
			' ',
			'Provides general information for the serial terminal,\nincluding a list of valid serial commands.',
		],
		name: 'commands-default.mgs:27:2',
	},
	'main_menu.mgs:39:3': {
		messages: [
			' ',
			'\u001b[33mDEBUG>\u001b[0m main menu only:',
			'\u001b[33m>\u001b[0m \u001b[36mBUFFER TEST\u001b[0m: test serial messages sizes',
			'\u001b[33m>\u001b[0m \u001b[36mHUB\u001b[0m: go to debug hub map',
			'\u001b[33m>\u001b[0m \u001b[36mCH2\u001b[0m: start ch2 (birthday cutscene)',
			'\u001b[33m>\u001b[0m \u001b[36mDEBUG\u001b[0m: ch2 room #1, after first half of Lambda convo',
			"\u001b[33m>\u001b[0m \u001b[36mBOB\u001b[0m: ch2 bob's club entrance",
			"\u001b[33m>\u001b[0m \u001b[36mBOB2\u001b[0m: ch2 bob's club basement",
			"\u001b[33m>\u001b[0m \u001b[36mBOB3\u001b[0m: ch2 bob's club basement (after cutscene)",
			'\u001b[33m>\u001b[0m \u001b[36mSIMON\u001b[0m: fast forward to the Simon Says part',
			'\u001b[33m>\u001b[0m \u001b[36mKING\u001b[0m: skip to cutscene where the king meets his advisors',
			'\u001b[33m>\u001b[0m \u001b[36mBOOT\u001b[0m: pretend to boot the weird computer',
			'\u001b[33m>\u001b[0m \u001b[36mPOST\u001b[0m: skip to the post credits scene',
			'\u001b[33m>\u001b[0m \u001b[36mSKIP _\u001b[0m: skip ahead to that round (and set all prev flags)',
			' ',
			'\u001b[33mDEBUG>\u001b[0m whole game:',
			'\u001b[33m>\u001b[0m \u001b[36mRTFM\u001b[0m: Early access to RTFM books',
			'\u001b[33m>\u001b[0m \u001b[36mSTORYFLAG _\u001b[0m: choose round (whole game, not just menu)',
			'\u001b[33m>\u001b[0m \u001b[36mWARP _\u001b[0m: warp to that castle room',
		],
		name: 'main_menu.mgs:39:3',
	},
	'main_menu.mgs:91:2': {
		messages: ['Honk!\u0007'],
		name: 'main_menu.mgs:91:2',
	},
	'woprhouse.mgs:8:3': {
		messages: ['Entering \u001b[1mWOPR ROOM\u001b[0m...'],
		name: 'woprhouse.mgs:8:3',
	},
	'woprhouse.mgs:44:3': {
		messages: [
			"\u001b[31mERROR:\u001b[0m You're in chapter '$current_chapter$'??",
			'Back to the main menu for you!',
		],
		name: 'woprhouse.mgs:44:3',
	},
};
