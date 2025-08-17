import { colorDifferentStrings } from '../parser-tests.ts';
import { Dialog, DialogDefinition } from '../parser-types.ts';

export type EncoderDialog = {
	alignment: string;
	entity?: string;
	messages: string[];
	border_tileset?: string;
	portrait?: string;
	name?: string;
	emote?: number;
	response_type?: 'SELECT_FROM_SHORT_LIST';
	options?: {
		label: string;
		script: string;
	}[];
};

export const firstMessage = (dialog: EncoderDialog | Dialog): string => {
	return dialog.messages[0].split(' ')[0];
};
export const messagesSummary = (dialogs: EncoderDialog[] | Dialog[]): string => {
	const summary = dialogs.map((dialog: EncoderDialog | Dialog) => {
		const length = dialog.messages.length;
		const words = dialog.messages.map((v) => v.split(' ').slice(0, 3).join(' '));
		return `${length}("${words}")`;
	});
	return summary.join(',');
};

export const compareDialogs = (expected: EncoderDialog, found: Dialog): string[] => {
	const problems: string[] = [];
	['alignment', 'entity', 'border_tileset', 'portrait', 'name', 'emote'].forEach((prop) => {
		if (expected[prop] !== found[prop]) {
			if (!expected[prop] && !found[prop]) {
				// it's okay, they're both falsy
				// (meant for dialog identifiers with a blank name)
			} else {
				problems.push(`Expected ${prop} "${expected[prop]}", found "${found[prop]}"`);
			}
		}
	});
	const expectedLength = expected.messages.length;
	const foundLength = found.messages.length;
	if (expectedLength !== foundLength) {
		problems.push(
			`Found ${foundLength} messages (${firstMessage(found)}), ` +
				`expected ${expectedLength} (${firstMessage(expected)})`,
		);
	} else {
		expected.messages.forEach((expectedMessage, i) => {
			const foundMessage = found.messages[i];
			if (foundMessage !== expectedMessage) {
				const diff = colorDifferentStrings(expectedMessage, foundMessage).diff;
				const pp = ' '.repeat(String(i).length);
				problems.push(`Message diff [${i}]: ${diff.replace(/\n/g, '\\n')}`);
				problems.push(`${pp}       Expected: ${expectedMessage.replace(/\n/g, '\\n')}`);
			}
		});
	}
	// no options? done early:
	if (!expected.response_type && !found.response_type) {
		return problems;
	}
	if (!expected.response_type) {
		problems.push(`Found response_type value, expected none`);
	}
	if (!found.response_type) {
		problems.push(`Expected response_type value, found none`);
	}
	if (!expected.options || expected.options.length === 0) {
		problems.push(`Expected dialog lacks options`);
		return problems;
	}
	if (!found.options || found.options.length === 0) {
		problems.push(`Found dialog lacks options`);
		return problems;
	}
	// if you're here, both dialogs have options, so let's compare them
	if (found.options.length !== expected.options.length) {
		problems.push(`Dialog option lengths do not match`);
		return problems;
	}
	found.options.forEach((foundOption, i) => {
		if (expected.options === undefined) {
			throw new Error("TS should be okay with this, surely? No? Didn't I just -- never mind");
		}
		const expectedOption = expected.options[i];
		const expectedFusion = `"${expectedOption.label}" = "${expectedOption.script}"`;
		const foundFusion = `"${foundOption.label}" = "${foundOption.script}"`;
		if (expectedFusion !== foundFusion) {
			const diff = colorDifferentStrings(expectedFusion, foundFusion).diff;
			const pp = ' '.repeat(String(i).length);
			problems.push(`Option diff [${i}]: ${diff.replace(/\n/g, '\\n')}}`);
			problems.push(`${pp}      Expected: ${expectedFusion.replace(/\n/g, '\\n')}`);
		}
	});
	return problems;
};

export const compareBigDialog = (
	expected: EncoderDialog[],
	found: Dialog[],
	nameType: 'dialogName' | 'fileName',
	name: string,
	id?: number | string,
): string[] => {
	if (!found) {
		const errorMessage =
			nameType === 'dialogName'
				? `Did not find expected dialog named "${name}"`
				: `Did not find "${name}" [${id}] dialog`;
		return [errorMessage];
	}
	if (!expected) {
		const errorMessage =
			nameType === 'dialogName'
				? `Found unexpected dialog named "${name}"`
				: `Unexpected dialog "${name}" [${id !== undefined ? id : '??'}]`;
		return [errorMessage];
	}
	if (found.length !== expected.length) {
		const errorMessage =
			nameType === 'dialogName'
				? `"${name}": found ${found.length} dialogs, expected ${expected.length}`
				: `"${name}" [${id !== undefined ? id : '??'}]: found ${found.length} dialogs, expected ${expected.length}`;
		return [errorMessage];
	}
	const errors: string[] = [];
	found.forEach((foundItem, i) => {
		const expectedItem = expected[i];
		const diffs = compareDialogs(expectedItem, foundItem);
		if (diffs.length) {
			errors.push(
				...diffs.map((v) => {
					return '\t' + v;
				}),
			);
		}
	});
	if (errors.length) {
		const header =
			nameType === 'dialogName'
				? `Named dialog "${name}" has the following issue(s):\n`
				: `Anonymous dialog "${name}" [${id !== undefined ? id : '??'}] has the following issue(s):`;

		errors[0] = header + '\n' + errors[0];
	}
	return errors;
};

export const compareSeriesOfBigDialogs = (
	expected: EncoderDialog[][],
	found: DialogDefinition[],
	fileName: string,
): string[] => {
	if (!found) {
		return [`Did not find file "${fileName}" for anonymous dialog comparison`];
	}
	if (!expected) {
		return [`Found unexpected file "${fileName}" for anonymous dialog comparison`];
	}
	const errors: string[] = [];
	const homelessFound: Record<string, Dialog[][]> = {};
	const homelessExpected: Record<string, EncoderDialog[][]> = {};
	expected.forEach((expectedDialog, i) => {
		const localErrors: string[] = [];
		if (!found[i]) {
			localErrors.push('missing dialog with fingerprint ' + messagesSummary(expectedDialog));
			return;
		}
		const foundDialog = found[i].dialogs;
		// get quick summary for quick comparison
		const foundSummary = messagesSummary(foundDialog);
		const expectedSummary = messagesSummary(expectedDialog);
		if (foundSummary !== expectedSummary) {
			// might be an overall ordering mismatch; set aside for now
			homelessFound[foundSummary] = homelessFound[foundSummary] || [];
			homelessExpected[expectedSummary] = homelessExpected[expectedSummary] || [];
			homelessFound[foundSummary].push(foundDialog);
			homelessExpected[expectedSummary].push(expectedDialog);
			return;
		}
		foundDialog.forEach((foundSingle, i) => {
			const expectedSingle = expectedDialog[i];
			const diffs = compareDialogs(expectedSingle, foundSingle);
			localErrors.push(
				...diffs.map((v, i) => {
					const message = '\t' + v;
					const header = `Dialog [${i}] from file "${fileName}" has the following issue(s):\n`;
					return i === 0 ? header + message : message;
				}),
			);
		});
		if (localErrors.length) {
			// STILL might be an overall ordering mismatch; set aside
			homelessFound[foundSummary] = homelessFound[foundSummary] || [];
			homelessExpected[expectedSummary] = homelessExpected[expectedSummary] || [];
			homelessFound[foundSummary].push(foundDialog);
			homelessExpected[expectedSummary].push(expectedDialog);
			return;
		}
	});
	// THE REST OF THE OWL
	const summaryIDs = new Set([...Object.keys(homelessFound), ...Object.keys(homelessExpected)]);
	[...summaryIDs].forEach((summaryID) => {
		const founds: Dialog[][] = homelessFound[summaryID];
		const expecteds: EncoderDialog[][] = homelessExpected[summaryID];
		if (!founds) {
			errors.push('found unexpected dialog(s) with fingerprint ' + summaryID);
			return;
		}
		if (!expecteds) {
			errors.push('missing dialog(s) with fingerprint ' + summaryID);
			return;
		}
		if (founds.length !== expecteds.length) {
			errors.push(
				`"${fileName}" ${summaryID}: found ${founds.length} dialogs, expected ${expecteds.length}`,
			);
			return;
		}
		if (founds.length === 1) {
			const diffs = compareBigDialog(
				expecteds[0],
				founds[0],
				'fileName',
				fileName,
				summaryID,
			);
			errors.push(...diffs);
			return;
		}
		const workingFounds = [...founds];
		const workingExpecteds = [...expecteds];
		const nonMatchedFounds: Dialog[][] = [];
		while (workingFounds.length) {
			const found = workingFounds.shift();
			if (found === undefined) throw new Error('TS seriously');
			let matched = false;
			for (let i = 0; i < workingExpecteds.length; i++) {
				const expected = workingExpecteds[i];
				const diffs = compareBigDialog(expected, found, 'fileName', fileName, summaryID);
				if (!diffs.length) {
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
			const diffs = compareBigDialog(
				remainingExpected,
				nonMatchedFound,
				'fileName',
				fileName,
				summaryID,
			);
			errors.push(...diffs);
		});
	});
	return errors;
};

export const dialogs: Record<string, EncoderDialog[]> = {
	'dialog-mage01_1': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				"I test the CHECK_ENTITY_NAME and\nSET_ENTITY_NAME actions.\nSet my name to 'Mage 00'\nand then talk to me again.",
			],
		},
	],
	'dialog-mage01_2': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				"Good work, you set my name to '%SELF%'!\nNow I should set my name back to 'Mage 01'\nwhen you close this dialog.",
			],
		},
	],
	'dialog-mage02_1': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test the CHECK_ENTITY_X and\nCHECK_ENTITY_Y actions. Set my\nX to 193 and my Y to 97\nand then talk to me again.',
			],
		},
	],
	'dialog-mage02_2': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'Good work, you set my X to 193 & my Y to 97!\nI should set X back to 192 and Y back to 96\nwhen you close this dialog.',
			],
		},
	],
	'dialog-mage03_1': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test the CHECK_ENTITY_INTERACT_SCRIPT and\nCHECK_ENTITY_TICK_SCRIPT actions. Set the\ntick or interact scripts for yourself to\nanything other than their current value.',
				'When you talk to me again, I should know\nif you changed them and will say\nsomething new.',
			],
		},
	],
	'dialog-mage03_2': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'Looks like you updated your own\nonTick Script or onInteract Script.\nThey should be reset to their original\nvalues when you close this dialog.',
			],
		},
	],
	'dialog-mage04_1': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test the CHECK_ENTITY_PRIMARY_ID,\nCHECK_ENTITY_SECONDARY_ID, and\nCHECK_ENTITY_PRIMARY_ID_TYPE actions.',
				'Set my primary ID to 12,\nmy secondary ID to 1,\n and my primary ID type to 3\nand then talk to me again.',
			],
		},
	],
	'dialog-mage04_2': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'Good work, you set my primary ID,\nsecondary ID, and primary ID type.\nThey should reset to their original values\n(13, 0, 2) when you close this dialog.',
			],
		},
	],
	'dialog-mage05_1': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test CHECK_ENTITY_CURRENT_ANIMATION\nand CHECK_ENTITY_CURRENT_FRAME.\nUse your action by pressing RJOY_LEFT,\nand I should update my message.',
			],
		},
	],
	'dialog-mage05_2': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'Good work, you used your action, and I\nwas able to verify that it happened.',
				'Now I will change my animation to test\nSET_ENTITY_CURRENT_ANIMATION and\nSET_ENTITY_CURRENT_FRAME. I should\nStart on the third frame.',
			],
		},
	],
	'dialog-mage06_1': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test CHECK_ENTITY_TYPE.\nSet your EntityType to `baby_goat`,\nand I should update my message.',
			],
		},
	],
	'dialog-mage06_2': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'Good work, you became `baby_goat`, and I\nwas able to verify that it happened.',
				'Now I will set your EntityType to `mage`\nvia SET_ENTITY_TYPE.',
			],
		},
	],
	'dialog-mage07': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test `SET_ENTITY_DIRECTION_TARGET_ENTITY`\nWalk around me, I should point at you,\nno matter your position!',
			],
		},
	],
	'dialog-mage08': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test `SET_ENTITY_DIRECTION_RELATIVE`\nWalk around me, I should point away from\nyou, no matter your position!',
			],
		},
	],
	'dialog-mage09': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test `COPY_SCRIPT`, using onTicks 07 & 08!\nWalk around me, I should point at you,\nPause half a second, then look away, \nno matter your position!',
			],
		},
	],
	'dialog-mage10-a': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test will `SET_SCREEN_SHAKE` 3 times:\n\t\t\t"frequency": 20,\n\t\t\t"amplitude": 3,\n\t\t\t"duration": 2000',
			],
		},
	],
	'dialog-mage10-b': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'Now:,\n\t\t\t"frequency": 1000,\n\t\t\t"amplitude": 32,\n\t\t\t"duration": 8000',
			],
		},
	],
	'dialog-mage10-c': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'Now:\n\t\t\t"frequency": 50,\n\t\t\t"amplitude": 5,\n\t\t\t"duration": 5000',
			],
		},
	],
	'dialog-mage11': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'Panning camera to 3 separate geometries,\nthen panning camera back to the player',
			],
		},
	],
	'dialog-mage12': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test SET_CAMERA_TO_FOLLOW_ENTITY &\nTELEPORT_CAMERA_TO_GEOMETRY!\n3 points first, then back to player!',
			],
		},
	],
	'dialog-mage13-success-n': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test CHECK_ENTITY_DIRECTION!\nTalk to me from each direction!\n\nYou are facing NORTH!',
			],
		},
	],
	'dialog-mage13-success-e': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test CHECK_ENTITY_DIRECTION!\nTalk to me from each direction!\n\nYou are facing EAST!',
			],
		},
	],
	'dialog-mage13-success-s': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test CHECK_ENTITY_DIRECTION!\nTalk to me from each direction!\n\nYou are facing SOUTH!',
			],
		},
	],
	'dialog-mage13-success-w': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test CHECK_ENTITY_DIRECTION!\nTalk to me from each direction!\n\nYou are facing WEST!',
			],
		},
	],
	'dialog-mage13-fail': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test CHECK_ENTITY_DIRECTION!\n...but something has gone wrong!\nI cannot detect your direction!\nThis action has FAILED!!!',
			],
		},
	],
	'dialog-mage14': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				"I test the 'VARIABLE' actions:\nMUTATE_VARIABLE, MUTATE_VARIABLES\nCHECK_VARIABLE, CHECK_VARIABLES",
			],
		},
	],
	'dialog-mage14-success': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I tested a goat load of simple maths\nusing the variable actions,\nand they all verified!\nRandom Number was: $goat_count$',
			],
		},
	],
	'dialog-mage14-fail-value-==': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ['...but something has gone wrong!\nThe value == comparison has FAILED!!!'],
		},
	],
	'dialog-mage14-fail-value->': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'...but something has gone wrong!\nThe value > comparison has FAILED!!!\nA: $goat_count$;',
			],
		},
	],
	'dialog-mage14-fail-variable-<': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'...but something has gone wrong!\nThe variable < comparison has FAILED!!!\nA: $goat_count$; B: $another_count$',
			],
		},
	],
	'dialog-mage14-fail-value-ADD': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'...but something has gone wrong!\nThe value ADD operation has FAILED!!!\nA: $goat_count$',
			],
		},
	],
	'dialog-mage14-fail-variable-ADD': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'...but something has gone wrong!\nThe variable ADD operation has FAILED!!!\nA: $goat_count$; B: $another_count$',
			],
		},
	],
	'dialog-mage14-fail-value-SUB': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'...but something has gone wrong!\nThe value SUB operation has FAILED!!!\nA: $goat_count$; B: $another_count$',
			],
		},
	],
	'dialog-mage14-fail-value-RNG': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'...but something has gone wrong!\nThe value RNG operation has FAILED!!!\nA: $goat_count$;',
			],
		},
	],
	'dialog-mage15': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				"I test the action COPY_VARIABLE.\nChange my 'path_id' to != 00,\nand I will transform into that type,\nand confirm that the copy is working!",
			],
		},
	],
	'dialog-mage15-success': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				"Hooray! 'path_id' had a value of\n$entity_type_id$, which is not 00,\nand I set my `primary_id` to that.\nChanging back now!",
			],
		},
	],
	'dialog-mage16-a': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test the action PLAY_ENTITY_ANIMATION.\nFirst, I will play my walk animation once.',
			],
		},
	],
	'dialog-mage16-b': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ["Now, my 'action' animation will play twice."],
		},
	],
	'dialog-mage16-c': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'Now, I will turn into Bender and play the\n"Shiny Metal Ass" \'action\' animation once,\nthen turn back into a mage.',
			],
		},
	],
	'dialog-mage17-a': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test the action SET_HEX_EDITOR_CONTROL.\nI have disabled your ability to hex edit.\nTalk to me again to re-enable hex editing.',
			],
		},
	],
	'dialog-mage17-b': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test the action SET_HEX_EDITOR_CONTROL.\nI have enabled your ability to hex edit.\nTalk to me again to disable hex editing.',
			],
		},
	],
	'dialog-mage18': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'You are in a desert.\nYou approached by a mysterious goat.',
				'How do you react to the mysterious goat?',
			],
			response_type: 'SELECT_FROM_SHORT_LIST',
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
			],
		},
	],
	'dialog-do_nothing': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'You do nothing about the mysterious goat.\nYou have lost the game.\n\nGAME OVER',
			],
		},
	],
	'dialog-pet_the_goat': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ['You have pet the mysterious goat.\n\nThe goat is pleased.'],
		},
	],
	'dialog-feed_the_goat': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'You give some bread to the mysterious goat,\n\nThe goat is pleased, and less hungry.',
			],
		},
	],
	'dialog-give_goat_sugar_cube': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'You give a Sugar Cube to mysterious goat.\nThe goat says this to you:\nThanks for the Sugar Cube[TM]!\nNow I can fly! BRB',
			],
		},
	],
	'dialog-mage19': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			border_tileset: 'codec',
			messages: [
				'You are in a desert.\nYou approached by a mysterious goat.\nIt is a good goat.',
			],
		},
	],
	'dialog-mage20': [
		{
			alignment: 'BOTTOM_RIGHT',
			portrait: 'codec-snek',
			name: 'Solid Snek',
			border_tileset: 'codec',
			messages: ['Kept you waiting, huh?'],
		},
		{
			alignment: 'BOTTOM_LEFT',
			portrait: 'codec-camel',
			name: 'Col. Camel',
			border_tileset: 'codec',
			messages: [
				'Terrorists kidnapped some dudes and are\nplanning a nuclear strike!\n\nSnek! Get in there!',
			],
		},
		{
			alignment: 'BOTTOM_RIGHT',
			portrait: 'codec-snek',
			name: 'Solid Snek',
			border_tileset: 'codec',
			messages: ['OKAY!'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: '%PLAYER%',
			messages: ['Umm.... How are you guys talking like that?'],
		},
		{
			alignment: 'BOTTOM_LEFT',
			portrait: 'codec-goose',
			name: 'Metal Goose',
			border_tileset: 'codec',
			messages: ['HONK!'],
		},
		{
			alignment: 'BOTTOM_RIGHT',
			portrait: 'codec-mage',
			name: '%PLAYER%',
			border_tileset: 'codec',
			messages: ['What just happened to me?', "Oh, I guess that's how you talk like this."],
		},
		{
			alignment: 'BOTTOM_LEFT',
			portrait: 'codec-camel',
			name: 'Col. Camel',
			border_tileset: 'codec',
			messages: ["No! It's Metal Goose! We must stop him!"],
		},
		{
			alignment: 'BOTTOM_RIGHT',
			portrait: 'codec-snek',
			name: 'Solid Snek',
			border_tileset: 'codec',
			messages: ['METAL GOOSE?!?!?'],
		},
		{
			alignment: 'BOTTOM_LEFT',
			portrait: 'codec-goose',
			name: 'Metal Goose',
			border_tileset: 'codec',
			messages: ['HONK HONK!', 'HONK HONK HONK HONK!'],
		},
		{
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'codec',
			messages: ['GAME OVER'],
		},
	],
	'dialog-mage21-a': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test SET_HEX_EDITOR_CONTROL_CLIPBOARD.\nI have disabled your ability to clipboard.\nTalk to me again to re-enable hex clipboard.',
			],
		},
	],
	'dialog-mage21-b': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test SET_HEX_EDITOR_CONTROL_CLIPBOARD.\nI have enabled your ability to clipboard.\nTalk to me again to disable hex clipboard.',
			],
		},
	],
	'dialog-mage22-a': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ['I test the FADE scripts!\nPREPARE FOR DARKNESS!!!'],
		},
	],
	'dialog-mage22-b': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ['Okay, now it is Darkness.\nLET THERE BE LIGHT!!!'],
		},
	],
	'dialog-mage23-choices': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test the `any key` features in actions\n`CHECK_FOR_BUTTON_(PRESS / STATE)`!\nWhat would you like to test?',
				'What would you like to test?',
			],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Wait for ANY_KEY activated',
					script: 'mage23-set_tick-press-any',
				},
				{
					label: 'Wait for PAGE activated',
					script: 'mage23-set_tick-press-page',
				},
				{
					label: 'Wait 2 sec & check ANY_KEY after exit',
					script: 'mage23-set_tick-state-any',
				},
				{
					label: 'Wait 2 sec & check PAGE after exit',
					script: 'mage23-set_tick-state-page',
				},
			],
		},
	],
	'dialog-mage23-not_pressed': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ['The button was not pressed.'],
		},
	],
	'dialog-mage23-was_pressed': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ['The button was pressed!'],
		},
	],
	'dialog-mage24-interact': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test `CHECK_ENTITY_PATH`!\nSet my `entity_path` starting byte one\nhigher and then talk with me again!',
			],
		},
	],
	'dialog-mage24-interact-success': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ['Great Jeaoarb!'],
		},
	],
	'dialog-mage26-interact': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				"Here is dialog part one!\nYou won't even be able to read it in time!\nHere's more words you can't read!",
			],
		},
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ['This is message you should not see'],
		},
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ["You WON'T see this if the bug got fixed", 'Do you see this text?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'mage26-reset',
				},
				{
					label: 'No',
					script: 'mage26-reset',
				},
			],
		},
	],
	'dialog-mage26-delay_interrupt': [
		{
			alignment: 'BOTTOM_LEFT',
			portrait: 'codec-goose',
			name: 'Metal Goose',
			border_tileset: 'codec',
			messages: ['HONK!'],
		},
	],
	'dialog-mage27-interact_closed': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test the action: CHECK_SERIAL_DIALOG_OPEN!\nThe serial console is currently NOT trapped.',
				'Would you like me to open a serial dialog?',
			],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'mage27-reset_with_dialog',
				},
				{
					label: 'No',
					script: 'mage27-reset',
				},
			],
		},
	],
	'dialog-mage27-interact_open': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test the action: CHECK_SERIAL_DIALOG_OPEN!\nThe serial console is currently trapped.',
				'Would you like me to close the serial dialog?',
			],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'close_serial_dialog',
				},
				{
					label: 'No',
					script: 'null_script',
				},
			],
		},
	],
	'dialog-mage28-interact': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: [
				'I test the actions:\nSET_LIGHTS_CONTROL\nSET_LIGHTS_STATE\nWatch the lights around the screen!',
			],
		},
	],
	'dialog-mage29-interact': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ["I test conditional local jumps!\nSet my name to 'Nage 29' to verify!"],
		},
	],
	'dialog-mage29-test': [
		{
			alignment: 'BOTTOM_LEFT',
			entity: '%SELF%',
			messages: ['Did it work? $mage29-skippydoodle$'],
		},
	],
	'mage30-interact-1': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['One...'],
		},
	],
	'mage30-interact-2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Two...'],
		},
	],
	'mage30-interact-3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Three...'],
		},
	],
	'mage30-interact-4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Four... wait, did I skip one?'],
		},
	],
	'mage31-interact': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh dang, you distracted me!\nI hope I don't lose my place\nin this circle...",
			],
		},
	],
	'ch1-bender.mgs:2:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hey, you did it! My ass is back!'],
		},
	],
	'ch1-bender.mgs:6:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['Hee hee hee!', "Hey, everyone! %Bender%'s ass is back!"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['....'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Well?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, what?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["You said you'd give me a reward!"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I did! You got a front row seat to me,\n%Bender%, showing off my shiny metal\nass!',
				"That's the greatest reward there is!",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I don't know why I assumed you'd be\nfriendly."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, you know what they say about\nassumptions.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['They make a shiny ass... and they give it\nto me, %Bender%.'],
		},
	],
	'ch1-bender.mgs:23:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Hey, my ass! It's back!"],
		},
	],
	'ch1-bender.mgs:27:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['Hee hee hee!', "Hey, everyone! %Bender%'s ass is back!"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'....',
				"Don't look so smug, kid. It had nothing to\ndo with you.",
				"I'm sure my ass came home on its own!",
			],
		},
	],
	'ch1-bender.mgs:119:7': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Hey, you! Bite my --\nAhhh!',
				'Aaaargh, this is terrible! My ass is even\nmore missing than before!',
				"First someone bit it off, and now it's an\nentirely different kind of ass!",
				'I feel like this is your fault somehow!',
				'Hurry up and fix it, kid!',
			],
		},
	],
	'ch1-bender.mgs:93:7': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh! You look friendly!'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Well, I'm not!"],
		},
	],
	'ch1-bender.mgs:98:7': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Aww, man... I forgot! Someone bit my shiny\nmetal ass!',
				'Why would someone do such a horrible thing\nto an innocent robot?!',
				"Life's not the same without my ass! How\nelse am I supposed to taunt everyone\nstupid-looking?",
			],
		},
	],
	'ch1-bender.mgs:109:8': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Hey, you, kid! You're the one with the\nmagic whatsit!"],
		},
	],
	'ch1-bender.mgs:105:8': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Hey, you, strangely-handsome-looking kid!\nYou're the one with the magic whatsit!",
			],
		},
	],
	'ch1-bender.mgs:114:7': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Can't you fix this with your whatever\npowers?",
				"I'll give you a great reward! Just get my\nass back!",
			],
		},
	],
	'ch1-bender.mgs:87:7': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Come on! That doesn't look anything like\nme, half-assed or full-assed."],
		},
	],
	'ch1-bender.mgs:81:7': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'...Oh, right. My ass. Someone bit it off.',
				"So what's the holdup? I know you can fix\nit!",
				"I'll reward you! Just hurry it up!",
			],
		},
	],
	'ch1-bender.mgs:58:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Yeah, yeah, you're a real comedian, kid.\nNow turn me back!"],
		},
	],
	'ch1-bender.mgs:53:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['Ooh, yeah!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["It's shiny. I'll give you that."],
		},
	],
	'ch1-bender.mgs:41:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"I speak binary fluently, kid! A little\ntrick like this won't slow me down!",
			],
		},
	],
	'ch1-bobsclub.mgs:21:2': [
		{
			name: '????',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, hello. You must be here for the annual\nBobs-Only Party, right?'],
		},
	],
	'ch1-bobsclub.mgs:29:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ["Well, I hate to tell you this, but it's\ncanceled this year."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What? Canceled?'],
		},
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Yeah. This time, for real.',
				"I mean, every year they SAY its canceled,\nbut this time it's actually genuinely\ncanceled.",
			],
		},
		{
			entity: 'Strong Bad',
			alignment: 'BOTTOM_LEFT',
			messages: ['Wait, canceled?!'],
		},
	],
	'ch1-bobsclub.mgs:49:2': [
		{
			entity: 'Strong Bad',
			alignment: 'TOP_LEFT',
			messages: ['But what about all the ladies?!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ["Ladies? I'm pretty sure Bob is a masculine\nname, traditionally."],
		},
		{
			entity: 'Strong Bad',
			alignment: 'TOP_LEFT',
			messages: [
				'Nuh-uh!',
				'What about Bob... rietta? Bob... velyn?',
				'Barbara? I mean, Bob-ara?',
				"They're still gonna come to the party,\naren't they?",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: [
				"Sorry, dude! Not if the party's canceled.",
				'...Also not if none of them are named Bob.',
			],
		},
		{
			entity: 'Strong Bad',
			alignment: 'TOP_LEFT',
			messages: ["Sure, they'll come! I just gotta wait a\nlittle more!"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['I think you came to the wrong party.'],
		},
	],
	'ch1-bobsclub.mgs:76:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, this place should be full of Bobs...\nnext year.'],
		},
	],
	'ch1-bobsclub.mgs:81:2': [
		{
			entity: 'Strong Bad',
			alignment: 'BOTTOM_LEFT',
			messages: ['Bob-alina!\nBob-cine!\nBob-quelyn!\nCome baaaack!'],
		},
	],
	'ch1-bobsclub.mgs:93:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['So I guess I can tell the baker to cancel\nthe donut order then, huh?'],
		},
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Guess so. Sorry about this.'],
		},
	],
	'ch1-bobsclub.mgs:191:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Mmmm, fresh bread!'],
		},
	],
	'ch1-bobsclub.mgs:234:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hear anything from the Bobs-Only Club yet?'],
		},
	],
	'ch1-bobsclub.mgs:220:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Hey, I'm pretty swamped. Can you run an\nerrand for me?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What do you need?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"The Bobs-Only Club placed a huge order for\nB-shaped donuts, due tonight, but I can't\nget anyone to confirm the order.",
				"They haven't paid yet, either.",
				"I went over there this morning, but they\nwouldn't let me in! And Bob wouldn't tell\nme anything!",
				"I just want to know whether or not they\nstill want these donuts. I'm running out\nof time to get everything ready by\ntonight.",
				'Can you find out for me? Get some answers\nfrom Bob? Any Bob?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Sure, I can swing past that way. See what\nI can find out.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Thanks.', 'Oh, and happy birthday.'],
		},
	],
	'ch1-bobsclub.mgs:196:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Qacwk, A kmvvwfdq usf'l kww kljsayzl. A\nymwkk A kzgmdv uml tsuc gf lzw usxxawfw.",
			],
		},
	],
	'ch1-bobsclub.mgs:215:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Say, you wouldn't want a B-shaped donut,\nwould you? On the house."],
		},
	],
	'ch1-bobsclub.mgs:200:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Canceled? The party at the Bobs-Only Club\nwas canceled? For real?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["That's what Bob said."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Bob? Stone Cold Bob Austin?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Uh... well, it was someone named Bob.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Great. Just great. Just as I was putting\neverything in the oven. Not gonna pay me\neither, are they?',
				'Well, thanks for finding out for me. Now I\nneed to find a way to move four dozen\nB-shaped donuts.',
			],
		},
	],
	'ch1-bobsclub.mgs:246:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Wall of Bobs: famous Bobs.',
				'Robert Parr, superhero.\nBob Kelso, physician.\nSpongeBob, fry cook.\nSideshow Bob, entertainer.',
				'There sure are a lot of Bobs in the world.',
			],
		},
	],
	'ch1-bobsclub.mgs:253:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Just a box of uninflated balloons.',
				'How many balloons does a party need,\nanyway?',
			],
		},
	],
	'ch1-bobsclub.mgs:260:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Wow. There's literally nothing but cans of\nCactus Cooler in here."],
		},
	],
	'ch1-bobsclub.mgs:310:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["So, what's your name then?"],
		},
	],
	'ch1-bobsclub.mgs:336:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Well, my name is Bob! Happy?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Cool. Great name.'],
		},
	],
	'ch1-bobsclub.mgs:330:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Why, what luck! My name happens to be Bob!'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Nice. Great name. I'll open it on up."],
		},
	],
	'ch1-bobsclub.mgs:347:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Head inside quick, now.'],
		},
	],
	show_dialog_bobrock_start_AGAIN: [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["We've been through all this before, you\nknow."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Doesn't matter. It's just the rules.\nBobs only."],
		},
	],
	'ch1-bobsclub.mgs:323:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['....', "Fine. I guess I'm not getting in, then."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Damn straight.'],
		},
	],
	'ch1-bobsclub.mgs:313:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Um....\nit's %PLAYER%."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Sorry, can't unlock the door for ya.\nBobs only."],
		},
	],
	'ch1-bobsclub.mgs:269:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Sqd'j meha byau jxyi."],
		},
	],
	'ch1-bobsclub.mgs:274:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Goin' back to work."],
		},
	],
	'ch1-bobsclub.mgs:281:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Name's Bob.",
				'Stone Cold %Bob Austin%.',
				'....',
				"Right, what's yours, then?",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["You don't know who I am? We've both lived\nhere for years!"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Don't know nobody. All I know is, gotta\nkeep everyone out.",
				'You know, unless their name is Bob.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Bob?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Bob. Camel case.\nNice and plain.\nTraditional.',
				"'Cause this club is Bobs-only. You know,\nthe Bobs-Only Club.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Why is it Bobs only?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Why?\nWhy is it Bobs only?',
				"Why, it wouldn't be the Bobs-Only Club if\nI just let anyone in!",
			],
		},
	],
	'ch1-bobsclub.mgs:297:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Well, the baker needs to know whether the\nclub still needs a bunch of B-shaped\ndonuts for tonight.',
				"Do you know if the Bobs still want them?\nThere's gonna be a party tonight, right?",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["That's for Bobs to know.", 'Only Bobs.', 'Bobs only.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I think the baker needs to know, too!'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Well, if his name was Bob, I would've let\nhim in!"],
		},
	],
	'ch1-bobsclub.mgs:364:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"They could've told me the party was\nactually canceled before I made the trip\nout here.",
				'And it was a long trip, too. I came all\nthe way from the net!',
				'*sigh*\nOh, well.',
			],
		},
	],
	'ch1-bobsclub.mgs:374:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Wait. Weren't there two Bob golems last\nyear?"],
		},
	],
	'ch1-bobsclub.mgs:362:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Gung'f n onq fvta."],
		},
	],
	'ch1-bobsclub.mgs:405:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Yessirree! Strong Bob's the name, and\npartyin's the game!"],
		},
	],
	'ch1-bobsclub.mgs:392:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Why, hello there, fellow Bob!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Your name is Bob?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Why, it sure is!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['You look an awful lot like Strong Bad to\nme.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Wha-what? STRONG BAD? Never heard of him.\nThough he sounds like quite the rugged and\nhandsome gentleman.',
				"The name's Strong BOB! Just lookee here at\nmy fake -- I mean real -- ID!",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'(This ID clearly belongs to "Bob Newhart,"\nbut the word Newhart is crossed out.)',
				"(I guess Bob out front doesn't have very\ngood eyes.)",
			],
		},
	],
	'ch1-bobsclub.mgs:387:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['fhqwhgadshgnsdhjsdbkhsdabkfabkveybvf'],
		},
	],
	'ch1-bobsclub.mgs:421:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, hello, there.'],
		},
	],
	'ch1-bobsclub.mgs:425:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I was just admiring the forest, with its\nhappy little trees....',
				"I've made so many squirrel friends,\nand....",
			],
		},
	],
	'ch1-bobsclub.mgs:431:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh!',
				"I didn't realize how late it was getting.\nI think I might be late for work.",
				"I'd better head out. Hope to see you\nagain.",
			],
		},
	],
	'ch1-bobsclub.mgs:456:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Sorry, I can't serve anyone until the\nparty starts.",
				'Help yourself to a Cactus Cooler, though.\nPlenty in the fridge.',
			],
		},
	],
	'ch1-bobsclub.mgs:463:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Well that's no good. I should really try\nto relax. Loosen up a bit...."],
		},
	],
	'ch1-bobsclub.mgs:471:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ahh, that feels nice.'],
		},
	],
	'ch1-bobsclub.mgs:490:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['How to Bob?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Skip Bob Austin conversation',
					script: 'debug_bob_skipconvo',
				},
				{
					label: 'Above + set name Bob',
					script: 'debug_bob_also_setnamebob',
				},
				{
					label: 'Skip cutscene and teleport',
					script: 'debug_bob_teleport',
				},
				{
					label: 'Never mind',
					script: 'debug_bob_no',
				},
			],
		},
	],
	'ch1-bobsclub.mgs:501:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Bob Austin has been spoken to.'],
		},
	],
	'ch1-bobsclub.mgs:509:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Bob Austin has been spoken to, and your\nname is Bob.'],
		},
	],
	'ch1-bobsclub.mgs:516:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Teleportation in progress.'],
		},
	],
	'ch1-debug.mgs:2:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'goldfish',
			messages: ['Go to debug map hub?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'debug_hub_go',
				},
				{
					label: 'No',
					script: 'debug_hub_no',
				},
			],
		},
	],
	'ch1-debug.mgs:20:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'goldfish',
			messages: ['Demo bonus debugging'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Set story flags true + ch1_finished true',
					script: 'debug_demobonus_pre_flags_true',
				},
				{
					label: 'Set story flags true + ch1_finished false',
					script: 'debug_demobonus_pre_flags_false',
				},
				{
					label: 'Set demo bonus event flags false',
					script: 'debug_demobonus_event_flags_false',
				},
				{
					label: 'Never mind',
					script: 'debug_demobonus_no',
				},
			],
		},
	],
	'ch1-debug.mgs:57:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Set what to FALSE?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Story flags and misc flags',
					script: 'debug_set_story_and_misc_flags_false',
				},
				{
					label: 'Backstory flags',
					script: 'debug_set_backstory_false',
				},
				{
					label: 'Unglitch flags',
					script: 'debug_set_glitch_flags_false',
				},
				{
					label: 'Never mind',
					script: 'debug_set_flags_false_no',
				},
			],
		},
	],
	'ch1-debug.mgs:68:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Set what to TRUE?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Everything (except winning)',
					script: 'debug_set_all_true',
				},
				{
					label: 'Backstory flags',
					script: 'debug_set_backstory_true',
				},
				{
					label: 'Unglitch flags',
					script: 'debug_set_glitch_flags_true',
				},
				{
					label: 'Never mind',
					script: 'debug_set_flags_true_no',
				},
			],
		},
	],
	'ch1-debug.mgs:82:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['All story and misc flags set to FALSE.'],
		},
	],
	'ch1-debug.mgs:90:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['All entities have forgotten their first\nconversations with you.'],
		},
	],
	'ch1-debug.mgs:98:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"All entities are inexplicably under the\nimpression that you've spoken to them\nbefore.",
			],
		},
	],
	'ch1-debug.mgs:130:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'All flags set to TRUE. You may have to\nreload the map to see some changes.',
			],
		},
	],
	'ch1-debug.mgs:137:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Nothing changed.'],
		},
	],
	'ch1-debug.mgs:144:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Nothing changed.'],
		},
	],
	'ch1-elders.mgs:7:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"There's a number of issues around town\nthat your ring should be able to fix.",
				"There are... now, let's just see....",
				'There are 11 tasks, according to my notes.',
				"I'll finish their paperwork as you go, so\nI'll be able to provide a running total.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['You have to do paperwork when I hack\nthings back to normal?'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"My dear child, when you grow up, you'll\nunderstand:",
				'There is paperwork for EVERYTHING!',
			],
		},
	],
	'ch1-elders.mgs:20:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"And if you have a question about what\nyou're doing, do feel free to ask me for\nadvice.",
				'Or consult Bert over there, who has good\nintuition for who could still use\nassistance.',
			],
		},
	],
	'ch1-elders.mgs:27:2': [
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes. I know who still needs help.'],
		},
	],
	'ch1-elders.mgs:30:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["Right! Go get 'em!"],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['Good luck.'],
		},
	],
	'ch1-elders.mgs:57:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....', 'Bczv um jiks.'],
		},
	],
	'ch1-elders.mgs:61:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Who needs help?'],
		},
	],
	'ch1-elders.mgs:155:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Perhaps the world.'],
		},
	],
	'ch1-elders.mgs:64:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['The shepherd.', 'He had one job.'],
		},
	],
	'ch1-elders.mgs:73:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Baker.', 'Baker is busy. He has trouble with\ncustomer.'],
		},
	],
	'ch1-elders.mgs:81:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Cousin of Stone Cold Bob Austin.', 'He is lost. Or is he hiding?'],
		},
	],
	'ch1-elders.mgs:88:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Old woman, Beatrice.', 'She has been sad a long time.'],
		},
	],
	'ch1-elders.mgs:96:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Robot?',
				'Some kind of robot.',
				'I do not know this robot.',
				'...I think he took my watch.',
			],
		},
	],
	'ch1-elders.mgs:106:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Max. Purple man.', 'Max wants his house to be built.'],
		},
	],
	'ch1-elders.mgs:114:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Trekkie.', 'Trekkie works on plants in the glass\nhouse.'],
		},
	],
	'ch1-elders.mgs:122:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Small child with big dream.', 'Child lives with father.'],
		},
	],
	'ch1-elders.mgs:130:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Old woman, Beatrice.', 'Does she know what she wants?'],
		},
	],
	'ch1-elders.mgs:138:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Goose is mad?', 'Goose is always mad.', 'What angers the goose this time?'],
		},
	],
	'ch1-elders.mgs:147:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['A goddess, mourning for lost souls.', 'She watches the goats.'],
		},
	],
	'ch1-elders.mgs:251:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Did you have a question about something?'],
		},
	],
	'ch1-elders.mgs:430:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Not at the moment.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Well, then, here's a general hint:",
				"If you've hacked things so badly you're\nnot sure how you could possibly straighten\nthings out again....",
				'Walk through a door. The world will right\nitself.',
			],
		},
	],
	'ch1-elders.mgs:255:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['How do I put the sheep back inside their\npen?'],
		},
	],
	dialog_jackob_hint_shepherd2: [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'That seems simple enough. All you must do\nis change their X and Y position until\nthey are inside the sheep pen.',
				'The hard part will be learning their\nnames.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Names?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"All sheep have names, but they don't share\nthem except in the direst of emergencies.",
				'But their names are still inherent in the\ndata of our world. Their names are not\nhidden from you.',
				'You can find their names -- and their data\n-- if you look long enough.',
				'....',
				'I wonder if there was another way of\nidentifying the entity you were facing....\nI feel like I might have once read\nsomething about that, but....',
				'Ah, well. These days my mind is like...\nsome kind of... thing you strain rice\nwith.',
			],
		},
	],
	'ch1-elders.mgs:270:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I guess the shepherd wants me to put the\nsheep back inside their pen.'],
		},
	],
	'ch1-elders.mgs:275:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"The baker's having trouble with a\ncustomer, apparently. But I don't know\nwhat I'm supposed to do about that.",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Hmmm. I think in this particular case --\nif what has happened is what I suspect has\nhappened --',
				'You might be the only one capable of\ngetting to the bottom of it.',
				'Sometimes blindly following a rule can\ncause problems for others, you see. Better\nto be flexible, not rigid and stone-\nstubborn.',
				'Better to understand that sometimes rules\nmust be broken.',
			],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'The piranha affair was an accident! How\nmany times do I need to apologize,\n%Jackob%?',
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["I wasn't talking to you."],
		},
	],
	'ch1-elders.mgs:285:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["How do I get into the Bob's Club?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"The bouncer, Stone Cold Bob Austin, is\nvery strict. If your name is not 'Bob'\nexactly, he will not budge.",
				'And just so you know, there are multiple\nvalues which will APPEAR to be a blank\nspace, but will not satisfy him.',
				"Fortunately, the correct value will\nterminate the string his logic is\nevaluating, so only the first byte after\n'Bob' will matter.",
			],
		},
	],
	'ch1-elders.mgs:292:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I heard that Bob Austin's cousin has\ngotten lost."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh, you mean Bob Moss. Yes, he disappears\nonce in a while.',
				"He's never far. But if you can't find him\nin town, you might have to look in places\none cannot ordinarily walk.",
			],
		},
	],
	'ch1-elders.mgs:298:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I heard there might be a second rockgolem.\nDo you know anything about that?',
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"If you're referring to Bob Moss, then I'm\nnot surprised he's absent. He disappears\nonce in a while.",
				"He's never far. But if you can't find him\nin town, you might have to look in places\none cannot ordinarily walk.",
			],
		},
	],
	'ch1-elders.mgs:304:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Is Beatrice sad about something?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"She misses her husband. The Big Bad hacked\nhim, don't you know.",
				'But I imagine you can fix him with Ring\nZero.',
			],
		},
	],
	'ch1-elders.mgs:310:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Beatrice wants her husband to become a\nmanagain.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'A simple entity type change.',
				"You'll know you have the right entity type\nwhen you get to an old man, balding,\nhunched over, and in overalls.",
			],
		},
	],
	'ch1-elders.mgs:316:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I gotta help this robot, apparently.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['What does this robot need?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Not sure.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Then you'd better talk to it and find out."],
		},
	],
	'ch1-elders.mgs:323:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['This robot named Bender wants his ass\nback, I guess.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Back? Has it gone somewhere?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Someone bit it off or something.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Well, our every state of being can be\ndefined by data.',
				'In his case, he once existed with a whole\nass, and therefore, there exists an entity\ntype where his ass is whole.',
				'Though unless you are looking directly at\nhis ass, it might be difficult to see if\nyou have succeeded.',
			],
		},
	],
	'ch1-elders.mgs:332:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Bert says the "purple man" wants his house\nto be built. What purple man?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh, Bert must mean the night elf tailor.\nHe's new. You might not have met him yet.",
				'Hmm. What was his name? Top Confidence?\nHigh Bluster?',
				"He'll be just outside his shop, I should\nthink. The interior is still unfinished,\nyou see.",
			],
		},
	],
	'ch1-elders.mgs:339:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['The cat crew needs their cat boss.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Well, if you can't give them their cat\nboss, you might try the next best thing:",
				'An impersonator!',
			],
		},
	],
	'ch1-elders.mgs:345:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Does Trekkie need help with something?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Trekkie tends the Ether Nettle in the\ngreenhouse. I imagine it's the Ether\nNettle, not Trekkie, that actually needs\nhelp.",
				"But you had better see in person. I don't\nknow much about why the internet is\nbroken.",
			],
		},
	],
	'ch1-elders.mgs:351:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Trekkie needs me to change the color of\nthe Ether Nettle flowers.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I see. That one might be tricky.',
				'If I understand plant genetics correctly,\nthen hypothetically.... Ether Nettle\ncolors are simply variations of a single\nentity type.',
				"You won't be able to change the flower\ncolor by changing the entity type, I'm\nafraid.",
				"All those flowers should have almost\nidentical values, I imagine. Try to change\na value they don't have in common.",
			],
		},
	],
	'ch1-elders.mgs:359:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['According to Bert, a small child needs\nhelp.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Not many kids around here -- apart from\nthe kids, of course, by which I mean the\ngoats.',
				"But Bert probably means the smith's son.\nOr... was Smith the man's name? Oh, dear.\nWas it his name AND his occupation?",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I've always called him Mr. Smith."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, that's right. He's your next-door\nneighbor, isn't he?"],
		},
	],
	'ch1-elders.mgs:367:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'This kid....',
				"He's just running around in circles,\nsaying he wants to grow up to be some kind\nof sports ball.",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["If that's what he wants, that's what he\nwants."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Yeah, but... that's not really fixing\nsomething that's broken, though, is it?",
				"He's a living person, but if I change him\ninto an inanimate object....",
				"Does he cease to be alive? Or a human\nbeing? What if he can't breathe anymore?",
				"What happens to his mind? His memories? If\nthe ball doesn't have a brain, does it all\ngo away if I change what he is?",
				'Even if he WANTS to become a ball....',
				'I mean, do I have that right? Does this\nstray too much into me playing God?',
				"Don't I have a moral responsibility to\navoid causing harm to those around me?",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['If you turn him into a ball, will that\nharm him?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I don't know. Will it?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Everything you see around you is pixels\nand data. All ones and zeroes.',
				'Are any of us really alive? If you change\nsomething, does that change what\nfundamentally lies underneath, or only how\nit appears?',
				'If life is a game, and you do something\nimmoral you can immediately revert if you\nwish, with no one the wiser, is it truly\nan immoral act?',
				"Wouldn't that simply be considered part of\nthe game you are playing? Why would such\nan act speak ill of your character?",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Wouldn't it?",
				"The way we behave when no one is\nlooking... doesn't that say more about our\ncharacter than anything else?",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"These are questions for philosophers and\ngamers. All we mortals can do is fulfill a\nchild's wish to become sports equipment.",
			],
		},
	],
	'ch1-elders.mgs:389:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Bert says I have to help Beatrice. But I\nalready solved her problem!'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Did you? Or did you only give her the\nopportunity to rememeber something she had\nforgotten about her husband?',
			],
		},
	],
	'ch1-elders.mgs:394:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Now Beatrice wants her husband to turn\nback into a sheep.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'She must have gotten sick of his yammering\nagain.',
				'Ah, well. You know what to do by now.',
			],
		},
	],
	'ch1-elders.mgs:400:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Apparently the goose is mad.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Is this news?',
				'In all seriousness, you might want to\ncheck whether the goose is mad at\nsomething specific or the world at large.',
			],
		},
	],
	'ch1-elders.mgs:406:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I think the goose wants me to move the\nrake.',
				'Perhaps... into the lake?',
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Likely. You'll need to change the rake's Y\ncoordinates.",
				"But just so you know, each coordinate\nactually spans two bytes, and if the\ndistance is great enough, you'll have to\nchange both.",
			],
		},
	],
	'ch1-elders.mgs:413:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I'm looking for a goat-watching goddess."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Ah, the winged Belldandy.',
				"Or... no, that wasn't it. It was Verd...\nVerth....",
				"...Um, regardless... it's true that she's\nfond of animals. She might very well be\nwatching the goats today.",
				'Though they might not look like goats at\nthe moment.',
			],
		},
	],
	'ch1-elders.mgs:421:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["How do I unscramble someone's pixels?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I think there was something in the Entity\nbooks about that, but I didn't quite\nunderstand.",
				'Something about changing a bit instead of\na byte, I think....',
				"But aren't all bytes made up of bits? How\nis changing a single bit different from\nchanging a whole byte?",
			],
		},
	],
	'ch1-elders.mgs:246:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Vg'f tbbq gung lbh'er cenpgvpvat, ohg\ncreuncf lbh fubhyq sbphf ba erfgbevat gur\ngbja?",
			],
		},
	],
	'ch1-elders.mgs:449:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Well... I found this book in the inner\nsanctum, and I had a question about it.',
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Of course. What do you want to know?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"You see, it's a book about the Big Bad,\nbut the words inside are all scrambled up.",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I see.',
				"Perhaps that's something the Big Bad did.\nIt would be logical for him to hide\ninformation about himself.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['But what can I do to get the book back to\nnormal?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'The Big Bad had powers beyond what you can\ndo with that ring alone, %PLAYER%.',
				"I suspect it's something even Ring Zero\ncannot fix.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Do you know what the book used to say, at\nleast?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['That book... I must have read it before,\nbut....'],
		},
	],
	'ch1-elders.mgs:465:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....'],
		},
	],
	'ch1-elders.mgs:468:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh, %PLAYER%, I'm sorry.",
				"I can't remember anything about what the\nbook said.",
			],
		},
	],
	'ch1-elders.mgs:477:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I suppose it doesn't matter, either way.\nThe Big Bad is gone, perhaps for good.",
			],
		},
	],
	'ch1-elders.mgs:473:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I doubt there was much in there that\nwould've helped you in a confrontation\nwith him, though.",
			],
		},
	],
	'ch1-elders.mgs:481:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"But the Big Bad's name used to be in that\nbook!",
				"It made me realize that I've never heard\nhis name before. Not once!",
				'Do you know what his name is?',
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'....',
				'I must have known it, once.',
				'But....',
				"I can't remember.",
				"I'm sorry, %PLAYER%.",
			],
		},
	],
	'ch1-elders.mgs:441:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['About that glitched-out book....'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["I'm sorry. I don't think there's anything\nyou can do to fix it."],
		},
	],
	'ch1-elders.mgs:505:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["You've completed $ch1_storyflags_tally$ out of 11 tasks."],
		},
	],
	'ch1-elders.mgs:507:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Uh....', 'Nowhere to go now but up!'],
		},
	],
	'ch1-elders.mgs:509:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["That's the spirit! What a great start!"],
		},
	],
	'ch1-elders.mgs:511:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["You're getting the hang of this!"],
		},
	],
	'ch1-elders.mgs:513:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, my! You're getting a lot of work done!\nMarvelous!"],
		},
	],
	'ch1-elders.mgs:515:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Wow! You're nearly done!"],
		},
	],
	'ch1-elders.mgs:517:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Incredible! You've done everything on my\nlist!"],
		},
	],
	'ch1-elders.mgs:500:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Cdl iwpi'h fjxit jcctrthhpgn!"],
		},
	],
	'ch1-elders.mgs:502:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Congratulations! You fixed the town!'],
		},
	],
	'ch1-enddemo.mgs:87:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Good heavens! What was that?'],
		},
	],
	'ch1-enddemo.mgs:98:2': [
		{
			name: 'Beatrice',
			alignment: 'TOP_RIGHT',
			portrait: 'old_lady',
			messages: ['Oh, no! This is just like last time!'],
		},
	],
	'ch1-enddemo.mgs:103:19': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Last time?'],
		},
	],
	'ch1-enddemo.mgs:110:2': [
		{
			name: 'Trekkie',
			alignment: 'TOP_LEFT',
			portrait: 'trekkie',
			messages: ['Last time Big Bad came!'],
		},
	],
	'ch1-enddemo.mgs:115:19': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Last time WHAT?'],
		},
	],
	'ch1-enddemo.mgs:130:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, dear. Oh, goodness gracious.', 'I was afraid of this.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Afraid of WHAT?'],
		},
	],
	'ch1-enddemo.mgs:136:19': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['I was afraid the Big Bad would notice what\nyou were doing.'],
		},
	],
	'ch1-enddemo.mgs:140:19': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'You think the Big Bad somehow knows that\nsomeone here has been using Ring Zero?',
			],
		},
	],
	'ch1-enddemo.mgs:144:2': [
		{
			entity: 'Marta',
			alignment: 'TOP_LEFT',
			messages: [
				"But it's been so long since the Big Bad\nwas seen at all! You think he might still\nbe out there, somewhere?",
			],
		},
	],
	'ch1-enddemo.mgs:149:2': [
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['Perhaps.'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['What else does this earthquake mean?'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, dear.... Oh, dear!'],
		},
	],
	'ch1-enddemo.mgs:156:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["But I can't fight the Big Bad! What am I\nsupposed to do?"],
		},
	],
	'ch1-enddemo.mgs:161:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['I suppose... I suppose we must\nconsider....'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['The other artifacts?'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Dangerous. Dangerous, but....'],
		},
	],
	'ch1-enddemo.mgs:169:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'*sigh*',
				'We have no choice.',
				'%PLAYER%, you must collect the\nartifacts of power.',
				'Just outside the town are several\nchallenges, and at the end of each there\nis one magical artifact.',
				'That ring will not be enough to defeat the\nBig Bad, but with those three\nartifacts....',
			],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes, %PLAYER%!', 'You must go and retrieve them!', 'Go!'],
		},
	],
	'ch1-enddemo.mgs:183:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Next year.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Next... huh?'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"This has been DC801's badge game for 2020!",
				"Thank you for playing, and we hope you'll\nplay the rest of the game next year!",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Buh?'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"As a reward for completing the demo, I'll\ntell you how to unlock debug mode.",
			],
		},
	],
	'ch1-enddemo.mgs:192:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Press XOR and MEM0 at the same time --\nthat's the top button on each side of the\nscreen -- and....",
			],
		},
	],
	'ch1-enddemo.mgs:197:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Voila!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['(Zuh)'],
		},
	],
	'ch1-enddemo.mgs:262:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'goldfish',
			messages: ['Show credits?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'roll_credits',
				},
				{
					label: 'No',
					script: 'debug_roll_credits_no',
				},
			],
		},
	],
	'ch1-family.mgs:43:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["I'm gonna be a Blitzball when I grow up!"],
		},
	],
	'ch1-family.mgs:35:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Stb N'r ns fstymjw inrjsxnts!"],
		},
	],
	dialog_kid_ball: [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["I'm the wind! Whoosh!"],
		},
	],
	'ch1-family.mgs:61:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"What's for dinner?",
				'Memory leek soup!',
				'....',
				"...Nah, just kidding. It's saag paneer.",
			],
		},
	],
	'ch1-family.mgs:59:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Real talk, don't eat memory leek soup.\nIt'll mess with your head."],
		},
	],
	'ch1-family.mgs:55:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Naa, ptl matm lttz itgxxk, hk lxz ytnem\nitgxxk?'],
		},
	],
	'ch1-family.mgs:76:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Smells good!'],
		},
	],
	'ch1-goats.mgs:57:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh! It looks like you would like a lesson\non glitched entities! Please allow me to\nexplain.',
			],
		},
	],
	'ch1-goats.mgs:63:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Would you like to hear the lesson again?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'show_dialog_verthandi_glitched_lesson',
				},
				{
					label: 'No',
					script: 'show_dialog_verthandi_glitched_s',
				},
			],
		},
	],
	'ch1-goats.mgs:70:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Ring Zero provides you access to our\nworld's superficial state, but there is\nalso a deeper state you cannot see, nor\ncontrol.",
				'Our physical appearance is only\nsuperficial, and our deeper soul remembers\nour true identities, even if our\nsuperficial apperance has changed.',
				'Given enough time, any superficial changes\nwill revert on their own --',
				'Unless you have severed the body and soul,\ntoo, like the Big Bad did when he was last\nhere.',
				'But once restored, the body and soul can\nreconnect again, and after that, not even\nRing Zero can glitch them for long!',
				"That's why I'm not worried about being\nglitched! I know that my body and soul are\nstill connected, and I will return to\nnormal soon!",
				'I hope this explanation was enlightening!',
			],
		},
	],
	'ch1-goats.mgs:83:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I might be glitched for now, but my soul\nis quite unharmed! My appearance will\nreturn to normal soon.',
			],
		},
	],
	'ch1-goats.mgs:153:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Some time ago, the Big Bad brought chaos\nto this place.',
				'To amuse himself, he scrambled the outward\nappearance of many of the people, animals,\nand objects around town.',
			],
		},
	],
	'ch1-goats.mgs:164:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'These dear baby goats are back to normal,\nbut I still hear cries for help elsewhere\nin town.',
				'There is more to unglitch! Please, will\nyou set things right?',
			],
		},
	],
	'ch1-goats.mgs:158:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'These dear baby goats were among his many\nvictims.',
				'They are so young, and so full of life....\nyet you cannot even hear their cheerful\nbleats!',
				'You have been blessed with the power to\nundo what had been done to them. Would you\nplease help them?',
			],
		},
	],
	'ch1-goats.mgs:117:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["You've restored everyone! Oh, how\nwonderful!", 'Oh, thank you, %PLAYER%!'],
		},
	],
	'ch1-goats.mgs:112:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh! It appears you've already restored\neveryone that was glitched!",
				"How wonderful! I can't thank you enough!",
			],
		},
	],
	'ch1-goats.mgs:145:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"You've restored the baby goats! Oh, thank\nyou!",
				'But I still hear cries for help elsewhere\nin town. Please, can you help?',
			],
		},
	],
	'ch1-goats.mgs:133:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['I can hear the cries of $total_glitches$ glitched\nsouls....'],
		},
	],
	'ch1-goats.mgs:131:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['I hear one more glitched soul that needs\nhelp!'],
		},
	],
	'ch1-goats.mgs:136:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Perhaps... somewhere in the library?'],
		},
	],
	'ch1-goats.mgs:138:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Perhaps... somewhere outdoors?'],
		},
	],
	'ch1-goats.mgs:140:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Perhaps... somewhere in your home?'],
		},
	],
	'ch1-goats.mgs:143:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, won't you help the baby goats?"],
		},
	],
	'ch1-goats.mgs:96:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Thank you for everything you've done!"],
		},
	],
	'ch1-goats.mgs:187:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Baaahhh!'],
		},
	],
	'ch1-goats.mgs:185:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['ba15456`-------++++++gf\n+++++-//==========/*8901ikg'],
		},
	],
	'ch1-goose.mgs:92:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Honk!'],
		},
	],
	'ch1-goose.mgs:96:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Honk!'],
		},
	],
	'ch1-goose.mgs:108:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Position rake in lake?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'debug_win_rake_yes',
				},
				{
					label: 'No',
					script: 'debug_win_rake_no',
				},
			],
		},
	],
	'ch1-greenhouse.mgs:26:2': [
		{
			entity: 'Trekkie',
			alignment: 'BOTTOM_LEFT',
			messages: ['Me sorry, but Ether Nettle cannot be\nuprooted, %PLAYER%!'],
		},
	],
	'ch1-greenhouse.mgs:53:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Now that's a neat-looking pile of cable."],
		},
	],
	'ch1-greenhouse.mgs:56:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Oof. I'd hate to have to untangle this!"],
		},
	],
	'ch1-greenhouse.mgs:59:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Oh, I thought this was flour, but it's\nactually mulch."],
		},
	],
	'ch1-greenhouse.mgs:62:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What does this thing do? Just light up?'],
		},
	],
	'ch1-greenhouse.mgs:65:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["What's in here? Water?"],
		},
	],
	'ch1-greenhouse.mgs:72:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hu bu. Qvq zr trg n ivehf?'],
		},
	],
	'ch1-greenhouse.mgs:101:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Me want to wish you a happy birthday,\n%PLAYER%.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Aww, gee, thanks, Farmer %Trekkie%!'],
		},
	],
	'ch1-greenhouse.mgs:113:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Me sorry, %PLAYER%... but the internet\nstill no working.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["It's the Ether Nettles, again?"],
		},
	],
	'ch1-greenhouse.mgs:120:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'It always the Ether Nettles. Modem need\nEther Nettles. Ever since the big bad\nhack, the Ether Nettles line up wrong.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["You can't move the flowers? Put them in\nthe right order?"],
		},
	],
	'ch1-greenhouse.mgs:125:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Can't just dig up Ether Nettles. Wired in\nsuper, super well.",
				'If you move flowers, you must move wires\nunderneath or everything breaks. Very\nslow, very difficult work.',
				'Once in a while, me move one, take all\nweek, but it no work.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Well, maybe I can help. What order are\nthey supposed to be in?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Ether Nettle spec on internet. But no\nEther Nettle, no internet, me no can\ncheck!',
				'Me remember orange stripey is first.',
				'But trial and error take so long, me want\nto give up.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Well, lemme have a go. I can change their\ncolors instantly.', 'Probably.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'%PLAYER% has new magic zeroed ring.\nMaybe %PLAYER% can change flower\ncolors!',
			],
		},
	],
	'ch1-greenhouse.mgs:145:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Me can't remember Ether Nettle color\norder. Me need internet to check!",
				'But me do remember orange stripey is\nfirst!',
			],
		},
	],
	'ch1-greenhouse.mgs:166:2': [
		{
			entity: '%SELF%',
			alignment: 'TOP_LEFT',
			messages: ['Oh! The lights!'],
		},
	],
	'ch1-greenhouse.mgs:193:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'%PLAYER% did it! Made Ether Nettle\ntalk to outside world again!',
				'Me can go on the internet! Can use so many\nfree AOL hours!',
				'Me has so, so many AOL CDs! Me excited!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Sounds great, %Trekkie%.'],
		},
	],
	'ch1-greenhouse.mgs:207:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["So, %Trekkie%.... What's the internet\nfor, anyway?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, me know what the internet is for. The\ninternet is for....', '....'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['...?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['How old is %PLAYER%, again?'],
		},
	],
	'ch1-greenhouse.mgs:219:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Restore Ether Nettle?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'ch1_debug_ethernettle',
				},
				{
					label: 'No',
					script: 'ch1_debug_ethernettle_no',
				},
			],
		},
	],
	'ch1-greenhouse.mgs:227:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Wanna do it the hard way, huh? Suit\nyourself.'],
		},
	],
	'ch1-greenhouse.mgs:234:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ether Nettle restored.'],
		},
	],
	'ch1-greenhouse.mgs:240:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['White-orange.'],
		},
	],
	'ch1-greenhouse.mgs:242:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Orange.'],
		},
	],
	'ch1-greenhouse.mgs:244:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['White-green.'],
		},
	],
	'ch1-greenhouse.mgs:246:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Blue.'],
		},
	],
	'ch1-greenhouse.mgs:248:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['White-blue.'],
		},
	],
	'ch1-greenhouse.mgs:250:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Green.'],
		},
	],
	'ch1-greenhouse.mgs:252:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['White-brown.'],
		},
	],
	'ch1-greenhouse.mgs:254:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Brown.'],
		},
	],
	'ch1-lodge.mgs:43:2': [
		{
			entity: 'Timmy',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hey! Hey! My book!'],
		},
	],
	'ch1-lodge.mgs:97:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Wait, I can't leave yet!"],
		},
	],
	'ch1-lodge.mgs:288:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Come on in, %PLAYER%!'],
		},
	],
	'ch1-lodge.mgs:298:2': [
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: ["We'll be right here."],
		},
	],
	'ch1-lodge.mgs:306:2': [
		{
			entity: 'Aunt Zippy',
			alignment: 'BOTTOM_LEFT',
			messages: ["Go ahead. You'll do great!"],
		},
	],
	'ch1-lodge.mgs:316:2': [
		{
			entity: 'Jackob',
			alignment: 'TOP_LEFT',
			messages: [
				'The day has come!',
				'You have come of age, and what a joyous\nday it is.',
				"You may have noticed some aches and pains,\nand hair growing in new places. It's also\npossible --",
			],
		},
	],
	'ch1-lodge.mgs:323:2': [
		{
			entity: 'Alfonso',
			alignment: 'TOP_LEFT',
			messages: ["Uh, that's the wrong speech! It's TUESDAY,\nnot puberty education!"],
		},
	],
	'ch1-lodge.mgs:327:2': [
		{
			entity: 'Bert',
			alignment: 'TOP_LEFT',
			messages: ['It Friday.'],
		},
	],
	'ch1-lodge.mgs:331:2': [
		{
			entity: 'Alfonso',
			alignment: 'TOP_LEFT',
			messages: [
				'No, not Tuesday, T.U.E.S.D.A.Y.! You know,\nTraditional and Unambiguous Event of\nSelection Directly Affecting You.',
			],
		},
	],
	'ch1-lodge.mgs:335:2': [
		{
			entity: 'Jackob',
			alignment: 'TOP_LEFT',
			messages: ['Ah, yes. Right you are.'],
		},
	],
	'ch1-lodge.mgs:344:2': [
		{
			entity: 'Alfonso',
			alignment: 'TOP_LEFT',
			messages: [
				'*Ahem*',
				'Each mage, upon the day of their 16th\nbirthday, will then be present for their\nTUESDAY.',
				'Upon the chosen TUESDAY, each mage is\nrecognized by forces beyond our\ncomprehension as ready to wield power\nbestowed upon them by a magical artifact.',
				'Mages do not choose their own artifacts,\nbut rather are subject to the moods and\ntemperaments of the artifacts.',
				'(And boy they are moody.)',
			],
		},
	],
	'ch1-lodge.mgs:353:2': [
		{
			entity: 'Alfonso',
			alignment: 'TOP_LEFT',
			messages: [
				'The mage must present themselves to the\nartifacts until one shows interest. Mage,\nstep forth.',
			],
		},
	],
	'ch1-lodge.mgs:358:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Okay. I can do this.'],
		},
	],
	'ch1-lodge.mgs:377:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Go ahead, dear!'],
		},
	],
	'ch1-lodge.mgs:375:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['We always knew you were destined for great\nthings!'],
		},
	],
	'ch1-lodge.mgs:385:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Take your time!'],
		},
	],
	'ch1-lodge.mgs:383:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["We're both so proud of you!"],
		},
	],
	'ch1-lodge.mgs:393:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, how exciting!'],
		},
	],
	'ch1-lodge.mgs:391:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, how exciting!'],
		},
	],
	'ch1-lodge.mgs:403:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Don't look at me! I don't know how any of\nthis stuff works!"],
		},
	],
	'ch1-lodge.mgs:401:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Sounds like that ring is a big deal.', 'Neat.'],
		},
	],
	'ch1-lodge.mgs:411:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Hmm. I've seen better artifacts."],
		},
	],
	'ch1-lodge.mgs:409:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Hmm. That ring looks a bit too plain to be\nthe real Ring Zero, doesn't it?",
			],
		},
	],
	'ch1-lodge.mgs:421:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['One of those artifacts seems a little\nfamiliar to me....'],
		},
	],
	'ch1-lodge.mgs:417:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Wow. Never seen a TUESDAY like this\nbefore!'],
		},
	],
	'ch1-lodge.mgs:419:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['I knew I recognized this broom!'],
		},
	],
	'ch1-lodge.mgs:429:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, me hope it's a good one!"],
		},
	],
	'ch1-lodge.mgs:427:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Amazing!'],
		},
	],
	'ch1-lodge.mgs:437:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Is that old junk really magic?'],
		},
	],
	'ch1-lodge.mgs:435:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Neat!'],
		},
	],
	'ch1-lodge.mgs:445:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Ooh! I bet it's gonna be the one on the\nleft! No, the right! No, the second one!",
			],
		},
	],
	'ch1-lodge.mgs:443:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['It looks so shiny!'],
		},
	],
	'ch1-lodge.mgs:453:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["It's been so long since we've had a new\nmage!"],
		},
	],
	'ch1-lodge.mgs:451:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh! I never thought I'd see this day! Oh,\nmy Delmar...!"],
		},
	],
	'ch1-lodge.mgs:461:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Um, I gotta get back to work, kid. You\nwanna hurry it up a little?'],
		},
	],
	'ch1-lodge.mgs:459:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Congratulations, %PLAYER%!'],
		},
	],
	'ch1-lodge.mgs:467:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['(Wait, was this everything?)'],
		},
	],
	'ch1-lodge.mgs:473:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'*ahem*',
				'The mage must present themselves to the\nartifacts until one shows interest.',
			],
		},
	],
	'ch1-lodge.mgs:478:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Touch each item, please.'],
		},
	],
	'ch1-lodge.mgs:485:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['A Power Bracelet?'],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['That is a croissant!', 'Is my lunch!'],
		},
	],
	'ch1-lodge.mgs:503:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'This?',
				"This is clearly a temporary asset that\nhasn't been replaced with anything yet.",
				'Though....',
				'(touch)',
				'Ahh, oh well.',
			],
		},
	],
	'ch1-lodge.mgs:514:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Ugh. Is that an eye on the cover?',
				"And I don't wanna know what kind of\nleather that is.",
				'....',
				"It's not reacting to me, though.",
			],
		},
	],
	'ch1-lodge.mgs:528:2': [
		{
			entity: 'Marta',
			alignment: 'TOP_LEFT',
			messages: ['Hey, that broom is mine! How did that end\nup there?'],
		},
	],
	'ch1-lodge.mgs:547:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Moon Prism Power....'],
		},
	],
	'ch1-lodge.mgs:554:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Make Up!'],
		},
	],
	'ch1-lodge.mgs:560:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Erm, maybe I had that a bit wrong.', 'Still, no response.'],
		},
	],
	'ch1-lodge.mgs:581:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Maybe a different artifact?', 'Wait. Was that the last one?'],
		},
	],
	'ch1-lodge.mgs:576:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Maybe a different artifact?'],
		},
	],
	'ch1-lodge.mgs:677:2': [
		{
			entity: 'Marta',
			alignment: 'TOP_RIGHT',
			messages: ['Did they do it wrong?'],
		},
	],
	'ch1-lodge.mgs:682:2': [
		{
			entity: 'Max Swagger',
			alignment: 'TOP_LEFT',
			messages: ["I'm pretty sure %PLAYER% touched all\nof them...."],
		},
	],
	'ch1-lodge.mgs:687:2': [
		{
			entity: 'Trekkie',
			alignment: 'TOP_RIGHT',
			messages: ['Maybe they missed one.'],
		},
	],
	'ch1-lodge.mgs:694:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Well, this is certainly... unexpected.\nWe've never had a dud quite like this one\nbefore.",
			],
		},
	],
	'ch1-lodge.mgs:699:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["Why don't we --"],
		},
	],
	'ch1-lodge.mgs:713:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh! Oh, good heavens! Is that --'],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['It is.'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ["It's Ring Zero!"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What?! What is that?'],
		},
	],
	'ch1-lodge.mgs:728:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['It just slipped itself onto my finger!'],
		},
	],
	'ch1-lodge.mgs:736:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Um, it's not coming off. Is that normal?"],
		},
	],
	'ch1-lodge.mgs:740:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Normal? Normal?!',
				'Nothing about that thing is normal!',
				'This is --\nThis is unprecedented.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Is it bad?! What's wrong with it?", 'Am I... am I gonna die?!'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ["The ring isn't bad, it's just... powerful."],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['No one has been chosen by this ring\nbefore.'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, but... but perhaps....'],
		},
	],
	'ch1-lodge.mgs:751:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh, but this is good news, isn't it?",
				'This means we can finally fix things!',
			],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['Fix the town.'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes....', 'Yes!'],
		},
	],
	'ch1-lodge.mgs:760:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes, you can fix things at last!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Fix the town?'],
		},
	],
	'ch1-lodge.mgs:765:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'But the town is all glitchy and hacked!\nHow am I supposed to fix it with this\nthing? Unless....',
			],
		},
	],
	'ch1-lodge.mgs:770:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Yes, exactly! That ring, Ring Zero --',
				'That ring gives you the power to hack the\nplanet!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Hack the planet? You mean... all the stuff\nthat's broken?"],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['You can fix what the Big Bad broke!'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Everything that the Big Bad hacked so many\nyears ago.... Everything that scoundrel\nruined....',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"This ring gives me the Big Bad's power?",
				"But I don't know how to hack! How am I\nsupposed to fix anything?",
			],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes, well, you see....'],
		},
	],
	'ch1-lodge.mgs:781:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Please come with us, %PLAYER%.'],
		},
	],
	'ch1-lodge.mgs:805:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Into the inner sanctum!'],
		},
	],
	'ch1-lodge.mgs:823:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['////////'],
		},
	],
	'ch1-lodge.mgs:831:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....'],
		},
	],
	'ch1-lodge.mgs:877:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh! I think I've heard of Clippy Bird! My\nuncle let me play it on his phone this one\ntime, ages ago.",
				'He said it was a really rare game.',
			],
		},
	],
	'ch1-lodge.mgs:854:3': [
		{
			entity: '%SELF%',
			alignment: 'TOP_LEFT',
			messages: ['Ner ubg qbtf n fnaqjvpu?'],
		},
	],
	'ch1-lodge.mgs:867:4': [
		{
			entity: '%SELF%',
			alignment: 'TOP_LEFT',
			messages: ["Oh, how lovely! It's much easier to read\nlike this!"],
		},
	],
	'ch1-lodge.mgs:861:4': [
		{
			entity: '%SELF%',
			alignment: 'TOP_LEFT',
			messages: [
				"I've been trying to find books about the\nolympics.",
				"Gosh, it'd be cool if I could get a gold\nmedal for the high jump!",
				'I can jump, like, SO high!',
			],
		},
	],
	'ch1-lodge.mgs:873:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["There's this weird extra page in my book!"],
		},
	],
	dialog_sportsbook: [
		{
			entity: '%SELF%',
			alignment: 'TOP_LEFT',
			portrait: 'journal',
			messages: ['Sports sports sports. This book is about\nsports!', 'Go, home team!'],
		},
	],
	'ch1-lodge.mgs:891:3': [
		{
			name: 'Hex Edits 2',
			alignment: 'TOP_LEFT',
			portrait: 'parchment',
			messages: [
				'-- allows us to copy and paste bytes using\nsomething called a "Clip Bird."',
				'Pressing the circle button will copy a\nsingle byte into the Clip Bird, but if you\nhold circle, left and right will change\nthe number of bytes to be copied.',
				'Pressing square will paste the contents of\nthe Clip Bird into the selected cell and\nthereafter.',
				'This has dramatically improved our\nproductivity!',
			],
		},
	],
	'ch1-lodge.mgs:922:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Disable TUESDAY?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Completely',
					script: 'debug_disable_tuesday_complete',
				},
				{
					label: 'Partially',
					script: 'debug_disable_tuesday_walkup',
				},
				{
					label: 'Un-disable',
					script: 'debug_undisable_tuesday',
				},
				{
					label: 'Never mind',
					script: 'debug_disable_tuesday_no',
				},
			],
		},
	],
	'ch1-lodge.mgs:931:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Nothing changed.'],
		},
	],
	'ch1-lodge.mgs:944:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['TUESDAY partially disabled.'],
		},
	],
	'ch1-lodge.mgs:952:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['TUESDAY completely disabled.'],
		},
	],
	'ch1-lodge.mgs:962:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['TUESDAY re-enabled.'],
		},
	],
	'ch1-lodge.mgs:969:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Bypass TUESDAY?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'debug_bypass_tuesday',
				},
				{
					label: 'Yes (but enable hintman cutscene)',
					script: 'debug_bypass_tuesday_but_enable_hintman',
				},
				{
					label: 'No',
					script: 'debug_bypass_tuesday_no',
				},
			],
		},
	],
	'ch1-lodge.mgs:979:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Tuesday bypassed.'],
		},
	],
	'ch1-lodge.mgs:987:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Tuesday bypassed. Prepare for hintman\ncutscene.'],
		},
	],
	'ch1-lodge.mgs:995:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Begin TUESDAY cutscene?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'debug_cutscene_tuesday',
				},
				{
					label: 'No',
					script: 'debug_cutscene_tuesday_no',
				},
			],
		},
	],
	'ch1-lodge.mgs:1010:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Do what to artifacts?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Touch all artifacts',
					script: 'debug_touch_artifacts',
				},
				{
					label: 'Finish lecture and lower bookcase',
					script: 'debug_touch_artifacts_and_aftermath',
				},
				{
					label: 'Teleport to secret room (with cutscene)',
					script: 'enter_secretroom_with_guaranteed_cutscene',
				},
				{
					label: 'No',
					script: 'debug_touch_artifacts_no',
				},
			],
		},
	],
	dialog_artifacts_touch: [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['All artifacts touched.'],
		},
	],
	dialog_debug_touch_artifacts: [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Artifacts touched.'],
		},
	],
	'ch1-magehouse.mgs:72:2': [
		{
			entity: 'Aunt Zippy',
			alignment: 'BOTTOM_LEFT',
			messages: ['Is that %PLAYER% I hear?'],
		},
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh good! They're awake!"],
		},
	],
	'ch1-magehouse.mgs:80:19': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh! Uncle Zappy! Aunt Zippy!'],
		},
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Good morning, %PLAYER%!',
				'We were beginning to think you were going\nto sleep through your big day!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Big day?'],
		},
	],
	'ch1-magehouse.mgs:87:19': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["(OH GOD IT'S TUESDAY!)"],
		},
	],
	'ch1-magehouse.mgs:91:19': [
		{
			entity: 'Aunt Zippy',
			alignment: 'BOTTOM_LEFT',
			messages: ["Don't worry! We weren't about to let you\nmiss it!"],
		},
	],
	'ch1-magehouse.mgs:95:19': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['(AAAAH!)'],
		},
	],
	'ch1-magehouse.mgs:100:2': [
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Your 16th birthday is a big day. But no\nmatter what happens, we're proud of you\nand the mage you've become.",
				'Remember that today, okay?',
			],
		},
	],
	'ch1-magehouse.mgs:105:19': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Okay.',
				"Yeah. I'll be okay.",
				"It's just the most important day in my\nlife, but I'll definitely be okay.",
			],
		},
	],
	'ch1-magehouse.mgs:110:19': [
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: ['Come along, now! The village elders are\nall waiting for you!'],
		},
	],
	'ch1-magehouse.mgs:187:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Did you remember to feed %Mr. Tickles%\ntoday?'],
		},
	],
	'ch1-magehouse.mgs:182:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Abj V srry rkgen mnccl!'],
		},
	],
	'ch1-magehouse.mgs:198:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["How's your day going, %PLAYER%?"],
		},
	],
	'ch1-magehouse.mgs:195:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Jbj, guvf srryf ernyyl jrveq! Vg erzvaqf\nzr bs guvf bar gvzr va pbyyrtr....',
			],
		},
	],
	'ch1-magehouse.mgs:203:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Good morning, %Mr. Tickles%!'],
		},
	],
	'ch1-magehouse.mgs:212:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'goldfish',
			messages: ['(srrq zr guerr unzf)'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Good ol' glitched-out fish."],
		},
	],
	'ch1-magehouse.mgs:207:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'goldfish',
			messages: ['(Glub, glub.)'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Looking good!'],
		},
	],
	'ch1-magehouse.mgs:225:2': [
		{
			entity: 'Mage Journal',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'Dear Diary,',
				"I'm turning 16 soon, and I keep wondering\nwhat my magic will turn out to be.",
				"Maybe I'll be able to turn invisible! Or\nfly!",
				'But really, my power will probably turn\nout to be something dumb.',
				"I just hope I don't make a mess of\nanything. The town is already messed up\nenough from the Big Bad's hacks.",
			],
		},
	],
	'ch1-magehouse.mgs:235:2': [
		{
			entity: 'Mage Facts',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'Mage Facts Magazine, issue 28.',
				'Did you know you can press X to run,\ncircle to interact with something, and\nsquare to perform a short animation?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Well, what about triangle?',
				'What say you about triangle, Mage Facts\nMagazine?',
			],
		},
	],
	'ch1-magehouse.mgs:244:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I can't even remember what's in that box.\nComics? Amiibos? Otomatones?"],
		},
	],
	'ch1-magehouse.mgs:249:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Whoops! I think this volcano bakemeat is a\nbit overdone.'],
		},
	],
	'ch1-magehouse.mgs:255:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Is that cake for me?'],
		},
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: ["It's for tonight! Happy birthday,\n%PLAYER%!"],
		},
	],
	'ch1-magehouse.mgs:261:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Is that my birthday cake?', 'Oh, it looks delicious!'],
		},
	],
	'ch1-magehouse.mgs:268:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Gotta keep my hands washed!'],
		},
	],
	'ch1-magehouse.mgs:277:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Go on a morning walk?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'debug_walk_to_lodge',
				},
				{
					label: 'No',
					script: 'debug_walk_to_lodge_no',
				},
			],
		},
	],
	'ch1-magehouse.mgs:294:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Start the beginning cutscene?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes (just the magehouse and exterior)',
					script: 'debug_goodmorning',
				},
				{
					label: 'Yes (also the lodge stuff)',
					script: 'debug_goodmorning_plus',
				},
				{
					label: 'No',
					script: 'debug_goodmorning_no',
				},
			],
		},
	],
	dialog_debug_goodmorning: [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Walk through the doorway to begin\ncutscene.'],
		},
	],
	'ch1-magehouse.mgs:328:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['DEBUG EVERYTHING'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Turn debug mode on',
					script: 'debug_everything_on',
				},
				{
					label: 'Go to debug map hub',
					script: 'debug_hub_go',
				},
				{
					label: 'Never mind',
					script: 'debug_everything_off',
				},
			],
		},
	],
	'ch1-magehouse.mgs:344:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Debug mode on.'],
		},
	],
	'ch1-magehouse.mgs:351:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Never mind.'],
		},
	],
	dialog_goodmorning_wake: [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Ahh, what a good night's sleep!"],
		},
	],
	'ch1-map_main.mgs:106:3': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'While you were gone, I saw an odd flash of\nlight coming from the library.',
				'You might want to investigate.',
			],
		},
	],
	'ch1-map_main.mgs:218:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["I found infinity! Take a butcher's!"],
		},
	],
	'ch1-map_main.mgs:230:2': [
		{
			name: 'Construction',
			alignment: 'BOTTOM_LEFT',
			messages: ['UNDER CONSTRUCTION'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Guess I'll come back later. Next year,\nperhaps."],
		},
	],
	'ch1-map_main.mgs:236:2': [
		{
			name: 'MessageBoard',
			alignment: 'BOTTOM_LEFT',
			portrait: 'parchment',
			messages: [
				"If you've been the victim of a hack, come\njoin us at our weekly hacked citizen\nsupport group, Friday nights at 6pm in the\nlibrary.",
			],
		},
	],
	'ch1-map_main.mgs:243:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Safety Skyler says:\n"Remember to wear eye protection!"'],
		},
	],
	'ch1-map_main.mgs:253:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'This fountain has been glitched as long as\nI can remember, but now I have the chance\nto fix it!',
				'I just need to figure out how....',
			],
		},
	],
	'ch1-map_main.mgs:249:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["This is fountain is awesome! I've always\nwanted to see it un-glitched!"],
		},
	],
	'ch1-map_main.mgs:289:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Cat',
			messages: ['Meowrrow.'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cleo',
			messages: ["Oh, you don't say!"],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cat',
			messages: ['Meow!'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cleo',
			messages: ["He didn't!"],
		},
	],
	'ch1-map_main.mgs:286:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Cleo',
			messages: ['Uzz, V srry n ovg shaal.'],
		},
	],
	'ch1-map_main.mgs:304:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Cat',
			messages: ['Meowwowow.'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cleo',
			messages: ["That's what I've been saying this whole\ntime!"],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cat',
			messages: ['Meowwrrrr!'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cleo',
			messages: ['Oh, I know!'],
		},
	],
	'ch1-map_main.mgs:301:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Cleo',
			messages: ['Uzz, V srry n ovg shaal.'],
		},
	],
	'ch1-map_main.mgs:350:3': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Hey there, cat!'],
		},
	],
	'ch1-map_main.mgs:355:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Cat',
			messages: ['....'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cleo',
			messages: ['Excuse me, but we were in the middle of a\nconversation.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Oh, sorry. Carry on.'],
		},
	],
	'ch1-map_main.mgs:316:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Cat',
			messages: ['....'],
		},
	],
	'ch1-map_main.mgs:318:3': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ["Excuse me. I'm looking for the cat boss.\nIs that you?"],
		},
	],
	'ch1-map_main.mgs:324:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Cat',
			messages: ['....'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cleo',
			messages: ['Cat boss?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Yeah. The construction crew needs a thumbs\nup.'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cleo',
			messages: ['Well, the cat boss is very busy right now.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['But the crew --'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cat',
			messages: ['Meowrrow!'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Cleo',
			messages: ['Yeah, get some other white cat to do the\nthumbs up!'],
		},
	],
	'ch1-map_main.mgs:340:4': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['But... where else am I gonna find a white\ncat?'],
		},
	],
	'ch1-map_main.mgs:334:4': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Some other white cat? Seriously?', 'You mean me?'],
		},
	],
	'ch1-map_main.mgs:382:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Ah, that's better.",
				'It was real rough wrangling angry pixies\nwith discombobulated pixel hands.',
			],
		},
	],
	'ch1-map_main.mgs:369:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Mxqj'i jxyi? Q mehbtmytu iybysed\nixehjqwu?!"],
		},
	],
	'ch1-map_main.mgs:376:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Did you know that all electronics are\npowered by angry pixies?',
				"The trick is to keep the pixies angry. If\nthe pixies aren't angry, then they start\nto get complacent, and that's when your\nbattery dies!",
			],
		},
	],
	'ch1-map_main.mgs:412:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Good luck.'],
		},
	],
	'ch1-map_main.mgs:394:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Jpd, hp rpe te! Jzf slnv!'],
		},
	],
	'ch1-map_main.mgs:398:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....', "That's cheating."],
		},
	],
	'ch1-map_main.mgs:402:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"It's true. I can fly. It's not a trick.",
				'I had my TUESDAY a few years ago, and this\nbroom chose me.',
				"I'm one of the last mages to gain an\nartifact in a while. It's kind of nice\nthere's finally another.",
				'Though your powers seem more useful than\nmine. All I can do is fly!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["That's still pretty cool!"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"It helps me deliver newspapers, I guess.\nCan't fix much else around here.",
			],
		},
	],
	dialog_timmy: [
		{
			entity: 'Timmy',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm practicing for my triathlon!",
				"Running is my weakest event, so I'm\nworking hard to improve my time!",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Don't you need legs to run?"],
		},
		{
			entity: 'Timmy',
			alignment: 'BOTTOM_LEFT',
			messages: ['...?', 'No?'],
		},
	],
	dialog_dsheep: [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['...?'],
		},
	],
	'ch1-max.mgs:80:2': [
		{
			entity: 'Max Swagger',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh! Approval from the cat boss himself!'],
		},
		{
			entity: 'Felix',
			alignment: 'BOTTOM_LEFT',
			messages: ["Yeah, all right. We're good to go.", "Let's get started!"],
		},
	],
	'ch1-max.mgs:95:2': [
		{
			entity: 'Max Swagger',
			alignment: 'BOTTOM_LEFT',
			messages: ['Brilliant! Now things can finally move\nforward!'],
		},
	],
	'ch1-max.mgs:110:2': [
		{
			entity: 'Max Swagger',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh! Approval from the boss!', 'But is the crew all here to see it...?'],
		},
	],
	'ch1-max.mgs:131:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Can't begin work until the boss approves\nthe plans."],
		},
	],
	'ch1-max.mgs:129:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Okay, boss. We good to go?'],
		},
	],
	'ch1-max.mgs:123:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Sxas. T'gp mppy hzcvtyr dz slco T'x\nslwwfntyletyr!"],
		},
	],
	'ch1-max.mgs:143:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['The boss is usually pretty busy. Not sure\nwhere he is right now.'],
		},
	],
	'ch1-max.mgs:141:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, good! You're here! Gonna give the\nthumbs up?"],
		},
	],
	'ch1-max.mgs:137:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Abj gung'f n gevc."],
		},
	],
	'ch1-max.mgs:154:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Meow.'],
		},
	],
	'ch1-max.mgs:149:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Qisa.'],
		},
	],
	'ch1-max.mgs:151:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Meow?'],
		},
	],
	'ch1-max.mgs:165:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"As much as I like to loaf around, I sure\nhope the boss'll get over here soon so we\ncan start!",
			],
		},
	],
	'ch1-max.mgs:163:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['So is it a yea or a nay? Go ahead, show us\nwhat you decided.'],
		},
	],
	'ch1-max.mgs:159:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ib, hi... C ehyq nbun wunhcj qum vux!'],
		},
	],
	'ch1-max.mgs:200:20': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ah, yes! I know you!', "You're the birthday mage!"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I guess you could say that.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Yes, yes!',
				"Well, you're invited to the grand opening\nof my new fashion shop!",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, neat!'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['...Next year!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["What? Next year? Your shop isn't ready\nyet?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh, good heavens, no! Not yet!',
				"There's much more to do... so much more!",
				'The interior must be wallpapered and\npainted, and the new carpet cut and\nlayed....',
				'The new furniture must be brought in from\nCopenhagen, and that could take weeks\nalone!',
				'But, of course, before any of that....',
			],
		},
	],
	'ch1-max.mgs:216:20': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['The CONSTRUCTION CREW must finish building\nthe interior!!'],
		},
	],
	'ch1-max.mgs:220:20': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["They have everything they need to begin\nand yet they won't do any work!"],
		},
	],
	'ch1-max.mgs:224:20': [
		{
			entity: 'Felix',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"No, we don't have everything.",
				'We need the boss to sign off on the plans,\nfirst.',
			],
		},
	],
	'ch1-max.mgs:230:20': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes, of course! Of course the boss must\napprove first!'],
		},
	],
	'ch1-max.mgs:234:20': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'But the boss is nowhere around!',
				'I gave him the plans days ago! What could\npossibly be taking so long?',
			],
		},
	],
	'ch1-max.mgs:172:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Azr. Vm jvbyzl aolyl'k il huvaoly\njvtwspjhapvu!"],
		},
	],
	'ch1-max.mgs:177:3': [
		{
			entity: 'Max Swagger',
			alignment: 'BOTTOM_LEFT',
			messages: ['Finally! Now work on my fashion shop can\nprogress!'],
		},
	],
	'ch1-max.mgs:183:3': [
		{
			entity: 'Max Swagger',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh! The cat boss, here at last!',
				'Come on, then! Press square to show us you\napprove of the plans!',
			],
		},
	],
	'ch1-max.mgs:192:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'All the crew needs to begin now is a\nthumbs up from their boss!',
				'Where is that cat?',
			],
		},
	],
	'ch1-oldcouplehouse.mgs:55:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Wha... huh?'],
		},
	],
	'ch1-oldcouplehouse.mgs:37:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Bu, qrne. V zhfg'ir fgbbq hc gbb snfg.\nSrry n ovg jbbml."],
		},
	],
	'ch1-oldcouplehouse.mgs:43:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'...I tied an onion to my belt, which was\nthe style at the time.',
				"Now, to take the ferry cost a nickel, and\nin those days, nickels had pictures of\nbumblebees on 'em.",
				'"Gimme five bees for a quarter," you\'d\nsay. Now where were we?',
				'Oh, yeah. The important thing was that I\nhad an onion on my belt, which was the\nstyle at the time.',
				"They didn't have any white onions, because\nof the war. The only thing you could get\nwas those big yellow ones....",
			],
		},
	],
	'ch1-oldcouplehouse.mgs:51:3': [
		{
			entity: 'Delmar',
			alignment: 'BOTTOM_LEFT',
			messages: ["Huh? What's goin' on? What'd I miss?"],
		},
	],
	'ch1-oldcouplehouse.mgs:67:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Ydy D ymjk ht bgvnnzn? Ocz rjmgy'n bjiz v\nwdo apuut."],
		},
	],
	'ch1-oldcouplehouse.mgs:171:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, %Delmar%, you're... uh...."],
		},
	],
	'ch1-oldcouplehouse.mgs:163:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Thank you, %PLAYER%!'],
		},
	],
	'ch1-oldcouplehouse.mgs:165:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh! That's a nasty trick, %PLAYER%!",
				'How could you?',
				"Although... I sort of get the feeling\nhe'll be back to normal in a few minutes.",
			],
		},
	],
	'ch1-oldcouplehouse.mgs:156:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, %Delmar%... we'll fix you up real\nsoon!"],
		},
	],
	'ch1-oldcouplehouse.mgs:134:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, %Delmar%! You're... oh...."],
		},
	],
	'ch1-oldcouplehouse.mgs:136:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh, goodness. Well, this isn't my\n%Delmar%, but I suppose it's nice he's\nnot a sheep anymore, at least.",
				"He's been a sheep for so long... well, I\nsuppose it's been forty years.",
			],
		},
	],
	'ch1-oldcouplehouse.mgs:122:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Forty years ago, things were sure\ndifferent.',
				'I was a lot younger then, and my husband,\n%Delmar%....',
			],
		},
	],
	'ch1-oldcouplehouse.mgs:128:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['My husband was a real man! Not a farm\nanimal!'],
		},
	],
	'ch1-oldcouplehouse.mgs:141:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'That ghastly hacker ruffian hacked him\ninto a sheep on a whim!',
				"%Delmar% didn't even do anything to\nhim!",
				'...Other than insult his character, and\nthat of his mother.',
				'...And eat his lunch.',
				'...And cut his brake line.',
				"The point is, child, that %Delmar%'s\nbeen stuck as a sheep ever since!",
				'But you, now that you have Ring Zero....',
				"You can make things right again, can't\nyou?",
				'I miss my %Delmar%!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Make things right? Well, I can change what\nhe looks like, anyway.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['That works for me!'],
		},
	],
	'ch1-oldcouplehouse.mgs:107:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, %Delmar%, it's you! You're a man\nagain! At last!"],
		},
		{
			entity: 'Delmar',
			alignment: 'BOTTOM_LEFT',
			messages: ['Whazzat, %Beatrice%? Something seems\ndifferent.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, it's my %Delmar%! Thank you,\n%PLAYER%!"],
		},
	],
	'ch1-oldcouplehouse.mgs:244:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, I suppose we could give this a try\ninstead....'],
		},
	],
	'ch1-oldcouplehouse.mgs:236:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Peace at last!'],
		},
	],
	'ch1-oldcouplehouse.mgs:240:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....', 'I suddenly have the strangest feeling of\ndeja vu.'],
		},
	],
	'ch1-oldcouplehouse.mgs:225:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, um....', 'Actually, I was hoping he could become a\nsheep again.'],
		},
	],
	'ch1-oldcouplehouse.mgs:219:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm sure he won't mind being a sheep\nagain. In fact, I'm not sure he'll notice.",
				"But I sure will! I won't have peace\notherwise!",
			],
		},
	],
	'ch1-oldcouplehouse.mgs:206:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....', 'You know, I appreciate what you did,\n%PLAYER%. I really do.'],
		},
	],
	'ch1-oldcouplehouse.mgs:209:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....'],
		},
	],
	'ch1-oldcouplehouse.mgs:211:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'But now I find myself longing for quiet.',
				'It was so peaceful, before. %Delmar%\nand I used to get along so well.',
				"And it's so difficult to fall asleep\nrecently.",
				'I hate to ask it, child, but....',
				"I can't hear myself think! Please change\nhim back!",
			],
		},
	],
	'ch1-oldcouplehouse.mgs:191:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Thank you, child!',
				'...And, erm, we need not mention this to\nanyone! You understand?',
			],
		},
	],
	'ch1-oldcouplehouse.mgs:185:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh! And I was just thinking how I wanted\nhim to become a sheep again!',
				'So gentle... and so quiet!',
				'Thank you, %PLAYER%!',
			],
		},
	],
	'ch1-oldcouplehouse.mgs:273:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Set sequel branch?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes (plus man)',
					script: 'debug_bea_sequel_man',
				},
				{
					label: 'Yes',
					script: 'debug_bea_sequel_noman',
				},
				{
					label: 'No',
					script: 'debug_bea_sequel_no',
				},
			],
		},
	],
	'ch1-oldcouplehouse.mgs:287:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Sequel branch activated, and Delmar is a\nman.'],
		},
	],
	'ch1-oldcouplehouse.mgs:295:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Sequel branch activated, and Delmar left\nalone.'],
		},
	],
	'ch1-oldcouplehouse.mgs:299:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Nothing changed.'],
		},
	],
	dialog_bea_mandud_s: [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, %Delmar%! We'll make you your\nnormal self soon!"],
		},
	],
	'ch1-secretroom.mgs:25:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'This is the inner sanctum, home to all the\nknowledge we have collected about the\nunderpinnings of our reality.',
				"In truth, we don't have any personal\nexperience with Ring Zero itself, or how\nhacking actually works.",
				'But, perhaps....',
			],
		},
	],
	'ch1-secretroom.mgs:33:19': [
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Perhaps....',
				'If you need help, come here, read these\nbooks.',
				'Perhaps you will learn what you need.',
			],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"You're the only one who can fix what's\nbeen broken.",
				'We will assist you if we can, but the real\nwork will be up to you.',
			],
		},
	],
	'ch1-secretroom.mgs:41:19': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I am the town's bookkeeper and chief\nscholar, and can track your progress.",
			],
		},
	],
	'ch1-secretroom.mgs:45:19': [
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['I know the town. The people. I know who\nneeds help.'],
		},
	],
	'ch1-secretroom.mgs:49:19': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['And I....'],
		},
	],
	'ch1-secretroom.mgs:55:19': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, dear. What was it again?'],
		},
	],
	'ch1-secretroom.mgs:59:19': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["You're our bookworm!"],
		},
	],
	'ch1-secretroom.mgs:63:19': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Ah yes!',
				"Yes, I've read every book about hacking\never to exist, not just what you can find\nin this room!",
				"I think. I can't quite remember.",
			],
		},
	],
	'ch1-secretroom.mgs:70:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Well, he knows more about Ring Zero than\nanyone else.',
				"Likely he'll be able to help you use the\ndevice itself if you get stuck.",
			],
		},
	],
	'ch1-secretroom.mgs:76:19': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Um... maybe.'],
		},
	],
	'ch1-secretroom.mgs:81:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['*AHEM*'],
		},
	],
	'ch1-secretroom.mgs:84:2': [
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['Good luck.'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Yes, good luck, %PLAYER%.',
				"Please talk to us if there's anything we\ncan do to help you.",
				"We're counting on you!",
			],
		},
	],
	'ch1-secretroom.mgs:110:20': [
		{
			entity: 'Jackob',
			alignment: 'TOP_LEFT',
			messages: ['Oh, one more thing.'],
		},
	],
	'ch1-secretroom.mgs:115:19': [
		{
			entity: 'Jackob',
			alignment: 'TOP_LEFT',
			messages: ['To enter the hex editor, simply touch your\nhat with a finger.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['What? My hat?', 'But I thought it was the ring that was\nmagic.'],
		},
		{
			entity: 'Jackob',
			alignment: 'TOP_LEFT',
			messages: ['No, not that hat.', 'The one on the PCB!'],
		},
	],
	'ch1-secretroom.mgs:173:3': [
		{
			entity: 'Town History',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'The Big Bad, who goes by the name%#29SC^7\n}ho was found in #A423#Bfjr$bf afte@t\n$#cY B.  Ex',
				'@t Y#C9 B. @t $Y#9 B.  exception EOF',
			],
		},
	],
	'ch1-secretroom.mgs:196:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Creepy.'],
		},
	],
	dialog_hackbook_creepy_hint: [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I should really ask Jackob about this\nbook.'],
		},
	],
	'ch1-secretroom.mgs:181:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Um... okay, then.',
				'....',
				'No... no, wait a minute....',
				"The Big Bad's name?",
			],
		},
	],
	'ch1-secretroom.mgs:188:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"I don't think I've actually ever heard his\nname before. He must have had a real name!",
				"But everyone just calls him the Big Bad.\nWhy doesn't anyone use his name?",
				'....',
				"I'm gonna have to see what else I can find\nout about this book.",
			],
		},
	],
	'ch1-secretroom.mgs:168:3': [
		{
			entity: 'Town History',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: ['ERQ UREEVAT'],
		},
	],
	'ch1-secretroom.mgs:211:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'After many years of research, we have\ndiscovered the data structure of all\nliving beings, as well as miscellaneous\ninanimate objects.',
				"In all cases, hackable beings and objects\n-- or 'entities' -- are driven by 32 bytes\nof data, appearing as two rows of 16\nbytes.",
				'[X X X X X X X X X X X X . . . .]\nThe first twelve bytes on the first row\nare the entity\'s true name, given in\nsomething called "Ass Key."',
				"[. . . . . . . . . . . . X X X X]\nAfter the name, the next four bytes are\nthe entity's position in the world, two\nbytes for X and two bytes for Y.",
				'The position of each byte within each pair\nis backwards relative to what seems to us\nto be logical -- and from what we\nunderstand, a Mr. N. Dian is to blame.',
			],
		},
	],
	'ch1-secretroom.mgs:221:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'The second row of entity data is far more\ncomplicated.',
				'[X X o o . . . . . . . . . . . .]\nThe first pair of bytes seems to affect\nwhat the entity does when interacted with.\nChanging these values is frequently\ncounterproductive.',
				'[o o X X . . . . . . . . . . . .]\nHowever, changing the second pair of bytes\ncauses unspeakable chaos. We have learned\nto leave these bytes undisturbed.',
				'[. . . . o o o o o . . . . . . .]\nThe next five bytes apparently concern how\nan entity appears,',
				'[. . . . o o o o X . . . . . . .]\nbut the last byte affects the others in\nways we are still trying to understand.',
				'[. . . . X X o o o . . . . . . .]\nThe first pair is more useful, seeming to\nchange the entity type, or which among its\ncategory the entity appears to be.',
				"[. . . . o o X X o . . . . . . .]\nThe second pair appears to do nothing the\nvast majority of the time, but\noccasionally it changes the entity's\nappearance in odd ways --",
				"[. . . . o o X X o . . . . . . .]\nit's almost as if certain entities exist\nin a series along a parallel dimension,\nand we can simply choose which dimension\nis realized.",
				'Again, all two-byte pairs are backwards in\ntheir manifestation. We are preparing a\nstrongly-worded letter to Mr. N. Dian.',
			],
		},
	],
	'ch1-secretroom.mgs:235:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'[. . . . . . . . . o o o . . . .]\nThe next three bytes on the second row\napparently describe how the entity is\nbehaving.',
				'[. . . . . . . . . X o o . . . .]\nThe first byte describes the action the\nentity is currently performing,',
				'[. . . . . . . . . o X o . . . .]\nwhile the next describes how far along\ninto the action the entity has progressed.',
				'[. . . . . . . . . X X o . . . .]\nAlas, not all entities are capable of all\nactions, though some appear delightfully\nanimated.',
				'[. . . . . . . . . o o X . . . .]\nThe next byte first appeared only to\nrepresent the cardinal direction the\nentity is facing, but we have discovered a\nsecret:',
				'[. . . . . . . . . o o X . . . .]\nIf this byte is considered not as a unit\nbut instead as a series of 8 bits, then\nthe largest bit toggles a bizarre\ndisruption in appearance,',
				'[. . . . . . . . . o o X . . . .]\nwhich we have found useful to cause great\nalarm and panic among our less-enlightened\nneighbors.',
			],
		},
	],
	'ch1-secretroom.mgs:247:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'[. . . . . . . . . . . . X X X X]\nThe final four bytes are quite abstract.',
				'[. . . . . . . . . . . . X X o o]\nThe first pair seems to us to bond the\nentity to a physical place -- a beloved\npath, a favorite chair, etc.',
				'[. . . . . . . . . . . . o o X X]\nThe function of the final pair escapes us,\nat least for the moment.',
				'There may yet be undiscovered secrets, and\nthe world may yet change around us,\nrendering invalid the structure we have\nalready mapped.',
				'But we will endeavor to continue our\nresearch.',
			],
		},
	],
	'ch1-secretroom.mgs:257:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'A bit is a one or a zero. But combine\neight of them, and you can describe\nnumbers up to 255 -- a byte.',
				'For simplicity, it is best to think of a\nbyte as a pair of numbers between 0 and 15\n-- or 0 and F.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Hmmm. I think I had this textbook in\nschool. I don't really wanna go over it\nagain.",
			],
		},
	],
	'ch1-secretroom.mgs:265:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				"Triangle, a button thought by most\nscholars to do nothing, apparently\nprovides a shortcut to an entity's first\nrow of data.",
				'Once inside the hex editor, however, this\nbutton instead increments the currently-\nselected byte by one.',
				'Its companion, the X button, decrements\nthe currently-selected byte.',
				'Both triangle and X thus provide\nconvenient ways of altering data, but when\noutside the hex editor, we must rely on\nthe standard methods:',
				'Pressing the bit buttons while the correct\noperator (XOR, ADD, SUB) is selected.',
			],
		},
	],
	'ch1-secretroom.mgs:275:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'Some advanced tricks we have discovered:',
				'Holding PAGE and pressing a MEM button\nreassigns the MEM shortcut to the\ncurrently-selected hex cell.',
				'Conveniently, MEM references are relative\nto the entity the cursor is positioned\nwithin.',
				"Though we've found little reason to change\nthe mapping more than a handful of times.\nOur favorite bytes continue to be the same\nfour.",
				'In addition, the use of --',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['...?', "Huh? That's weird.", "It looks like there's a page missing."],
		},
	],
	'ch1-secretroom.mgs:288:2': [
		{
			entity: 'Math',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'You know what ADDing and SUBtracting does,\nbut XOR is less intuitive -- unless you\nare looking at the bits making up each\nbyte.',
				'In which case, think of XOR as a toggle on\na single bit.',
				"It's like each byte is actually eight\nboolean switches! Amazing!",
			],
		},
	],
	'ch1-secretroom.mgs:296:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'Mage Facts Magazine, issue 37.',
				'What happens when a mage presses the\ntriangle button? Experts agree the answer\nis "nothing."',
				'"Why would I waste my time pressing a\nbutton that doesn\'t do anything?" says\nfamous mage, Gorgonzola the Moist. "I have\nbetter things to do with my life!"',
				'94% of all mages we interviewed this week\nadmit they have never pressed the triangle\nbutton even once their whole lives.',
				'"My sensei\'s never used it, so I never\nfelt a need to try it," says one young\nmage, 19, now a student at Underwand\nInstitute of Technology.',
			],
		},
	],
	'ch1-secretroom.mgs:306:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'Weird Facts Magazine, super omnibus\nanniversary edition volume 3 (reprint):\nDEJA VU!',
				"You've heard of deja vu, but did you know\nyou can trigger it deliberately?",
				'Simply press XOR and MEM3 at the same\ntime, and the room around you will seem to\nCHANGE!',
				"SPOOKY! It's like walking into the same\nroom, all over again! It's like going back\nin time!",
				"Seeing something weird? Wondering if it's\nyour mind playing tricks? Want it to go\naway? Try XOR and MEM3!",
				'Unless you want to embrace the WEIRDNESS,\nof course!',
			],
		},
	],
	'ch1-secretroom.mgs:317:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'parchment',
			messages: [
				"Meeting minutes: Smarch 32nd, year 1337\nSubject: who wrote the 'Entity' and 'Hex\nEdits' books?",
				'Alfonso: "Whoever wrote those books must\nhave had access to the real Ring Zero."',
				'Bert: "The Big Bad?"',
				'Jackob: "But the Big Bad had no\naccomplices, and there were clearly\nmultiple people doing this research."',
				'Alfonso: "Then perhaps the Big Bad was not\nthe first mage to have Ring Zero. Perhaps\nhe will not be the last."',
				'Bert: "Or is there more than one ring?"',
			],
		},
	],
	'ch1-secretroom.mgs:328:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'parchment',
			messages: [
				'Meeting minutes: Smarch 16th, year 1337\nSubject: a rubbing taken from a\ndilapidated granite plaque found deep in\nthe Fortran Forest:',
				'"RED LETTERS MARK THE HACKER."',
				'Alfonso: "Obviously this is a reference to\na calendar. Perhaps the power to hack is\ngranted to mages on specific days --\n\'red-letter\' days!"',
				'Jackob: "You mean mages can only become\nhackers on national holidays? Certainly\nnot!"',
				'Alfonso: "What else might it mean by \'red\nletters,\' then? Perhaps... when a mage\nbecomes a hacker, it IS a red-letter day!"',
				'Jackob: "Or perhaps the phrase \'red\nletters\' is a red herring!"',
			],
		},
	],
	'ch1-shepherd.mgs:44:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh, wow, are the sheep actually back\ninside the pen? I could've sworn they....",
				'Hey, did you do that? Did you put them\nback?',
				"Wow, thanks a lot! I could've gotten into\ndeep trouble!",
			],
		},
	],
	'ch1-shepherd.mgs:39:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Thanks a million! I owe you one!'],
		},
	],
	'ch1-shepherd.mgs:4:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Jubn, jung'f tbvat ba?!"],
		},
	],
	'ch1-shepherd.mgs:6:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Thanks a million! I owe you one!'],
		},
	],
	'ch1-shepherd.mgs:26:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Can you help a dude out? Put all four\nsheep back inside the fence?'],
		},
	],
	'ch1-shepherd.mgs:22:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Awesome! Don't stop, now!"],
		},
	],
	'ch1-shepherd.mgs:62:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....', 'I messed up.'],
		},
	],
	'ch1-shepherd.mgs:67:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I was supposed to be watching the sheep,\nbut I took a quick nap, and the next thing\nI know... they were all over the place.',
			],
		},
	],
	'ch1-shepherd.mgs:71:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['How did they get out? The fence looks\nfine.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I don't even know. Maybe they were, you\nknow, hacked out. By the Big Bad.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"But the Big Bad hasn't been around for\nyears. Just how long was this nap?",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'It was the shortest nap. Super quick. It\nwas a long blink, really.',
				'A super, tiny, microscopic nap.',
				'....',
				'I really need this job, man. My last trip\nto Pigeon-Con, I spent all my rent money\non merch.',
				'Can you just help me out? Get them back\ninside somehow?',
			],
		},
	],
	dialog_sheep: [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			name: 'Sheep',
			messages: ['....'],
		},
	],
	'ch1-shepherd.mgs:144:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Return sheep to pen?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes (all)',
					script: 'debug_sheep_all',
				},
				{
					label: 'Yes (three out of four)',
					script: 'debug_sheep_most',
				},
				{
					label: 'No',
					script: 'debug_sheep_no',
				},
			],
		},
	],
	'ch1-shepherd.mgs:153:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['All sheep returned.'],
		},
	],
	'ch1-shepherd.mgs:160:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Helga remains.'],
		},
	],
	'ch1-shepherd.mgs:164:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Nothing changed.'],
		},
	],
	mainframe_working: [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(Nothing left to install. The computer is\nhumming and buzzing along, and Aurelius\nseems to be doing okay.)',
			],
		},
	],
	'ch2-admin.mgs:53:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Um, how do I get the hex editor to come up\nagain?'],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: ["Don't look at me. I don't use touch\nscreens."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Touch screens?'],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Capacitive buttons. Same diff. My little\npaws don't trigger them right.",
				"But there must be some kind of shiny\ncopper surface on your whatsit, right? Try\ntouching it with your finger. That's\nprobably how it's done.",
			],
		},
	],
	'ch2-admin.mgs:68:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What is this hunk of junk?'],
		},
	],
	'ch2-admin.mgs:79:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(Now installing... the heat sink!)',
				"(Or you would, but you can't install it\nuntil the CPU is in place. You set it\naside for now.)",
			],
		},
	],
	'ch2-admin.mgs:89:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(Now installing... the power supply!)',
				'(2 kW may be overkill, but better safe\nthan sorry.)',
			],
		},
	],
	'ch2-admin.mgs:99:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(Now installing... the monitor!)',
				"(...Or rather, it's now plugged into the\nback. That one was easy!)",
			],
		},
	],
	'ch2-admin.mgs:110:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(Now installing... the hard drive!)',
				"(What's the read head going to be? Will\nthis work?!)",
			],
		},
	],
	'ch2-admin.mgs:120:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(Now installing... the keyboard!)',
				"(Good thing the keytar can connect over\nUSB, or this wouldn't have worked.)",
			],
		},
	],
	'ch2-admin.mgs:130:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(Now installing... the mouse!)',
				'(...Or at least, installing the dongle.)',
			],
		},
	],
	'ch2-admin.mgs:141:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(Now installing... the RAM chips!)',
				'(The RAM chips went in with a terrifying\nSNAP, but they seem snug now. You better\nwash your hands, though.)',
			],
		},
	],
	'ch2-admin.mgs:151:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(Now installing... the grandfather clock!)',
				'(Somehow, that enormous, analog relic\nworks great for a system clock.)',
			],
		},
	],
	'ch2-admin.mgs:161:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(Now installing... the CPU!)',
				'(Now the mainframe can compute! And...\nblow bubbles?)',
			],
		},
	],
	'ch2-admin.mgs:176:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["That's all for now."],
		},
	],
	'ch2-admin.mgs:171:3': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ["(You don't have any new components to\ninstall.)"],
		},
	],
	'ch2-admin.mgs:201:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['...? Did I just hear some kind of digital\nsound effect?'],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'That was the bell on the terminal.\nWhats-his-face is paging you. Better talk\nto him.',
			],
		},
	],
	'ch2-admin.mgs:215:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['So, um, do you know if Bert has come back?'],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Bert? The big hairy guy?',
				"Nope. Since he left, no one's been in and\nout here but you.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Well, has he phoned or anything?'],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: ['Do you see a phone in here?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'....',
				"I'm getting worried about him. What is he\ndoing? Why is it taking so long?",
			],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: ['Beats me.'],
		},
	],
	'ch2-admin.mgs:234:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["...? Oh, that's the terminal bell. I guess\nLambda is calling me."],
		},
	],
	'ch2-admin.mgs:252:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'...! Oh, the terminal bell. That scared\nme.',
				"I guess it's time to talk to Lambda again.",
			],
		},
	],
	'ch2-bakery.mgs:75:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Sorry, can't talk now.", 'But good luck conquering the serial\ncastle.'],
		},
	],
	'ch2-bakery.mgs:71:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Good job building that computer. That's\nreally impressive."],
		},
	],
	'ch2-bakery.mgs:85:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm just taking a little shopping break.\nSometimes you just really want some fresh\nbread, you know?",
				'Mmmm, fresh bread!',
			],
		},
	],
	'ch2-birthday.mgs:27:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'transparent',
			messages: [
				'Happy birthday to you!\nHappy birthday to you!',
				'Happy birthday, dear %PLAYER%!\nHappy birthday to you!',
			],
		},
	],
	'ch2-birthday.mgs:39:2': [
		{
			entity: 'Aunt Zippy',
			alignment: 'BOTTOM_LEFT',
			messages: ["Now you're an official mage, %PLAYER%!"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Blowing out the candle didn't make me a\nmage, %Aunt Zippy%!"],
		},
		{
			entity: 'Aunt Zippy',
			alignment: 'BOTTOM_LEFT',
			messages: ["Well, you're officially sixteen now!"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I'm pretty sure I officially turned\nsixteen at midnight last night."],
		},
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: ["Well, you're officially our favorite\nbirthday mage!"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Aw, thanks, %Uncle Zappy%!'],
		},
		{
			entity: 'Aunt Zippy',
			alignment: 'BOTTOM_LEFT',
			messages: ['All right, everyone! Dig in!'],
		},
	],
	'ch2-birthday.mgs:50:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['*munch munch munch*'],
		},
	],
	'ch2-birthday.mgs:56:2': [
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: ['How was your day, %PLAYER%? Are you\ngetting used to Ring Zero?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Yeah, today was pretty wild. I went around\ntown and fixed a lot of the stuff the Big\nBad had ruined.',
				'I changed the color of some ether nettle\nblossoms, teleported some sheep, and\nimpersonated a cat!',
				'Oh, and I changed my name to Bob and drank\nsome Cactus Cooler with a stone golem.',
			],
		},
		{
			entity: 'Aunt Zippy',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I love that the water feature in the\ncenter of town is unglitched again. It\nreally feels like old times.',
			],
		},
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: ['But then that earthquake hit. That was\nlike old times, too.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Yeah, that was scary.',
				"I guess it's a sign that the Big Bad might\nbe coming back.",
			],
		},
	],
	'ch2-birthday.mgs:75:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"First thing tomorrow, I'm supposed to meet\nthe village elders and visit the castle.",
			],
		},
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: ["They're really sending you to get the\nartifacts, then?"],
		},
	],
	'ch2-birthday.mgs:80:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I guess so. The village elders say the\nartifacts are the only thing that can stop\nthe Big Bad for good.',
			],
		},
		{
			entity: 'Aunt Zippy',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"It's a lot to ask a sixteen year old, but\nif Ring Zero chose you....",
				"Well, perhaps you're exactly the right\nmage for the job.",
			],
		},
		{
			entity: 'Uncle Zappy',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"In which case we'd best get to bed soon.\nYou'll need a good night's rest.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah.', 'Good night, %Aunt Zippy%, %Uncle Zappy%.'],
		},
	],
	'ch2-birthday.mgs:159:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, um....'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['The time has come to tackle the first\nchallenge, %PLAYER%.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah.'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ready to go?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah. I mean, no. I mean....'],
		},
	],
	'ch2-birthday.mgs:169:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Wait, weren't you supposed to bring me a\nbook this morning? A book about the cereal\ncastle?",
			],
		},
	],
	'ch2-birthday.mgs:174:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'The serial castle, yes. We did have a book\nabout that.',
				"But... it's gone.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Gone? You lost the book?'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["No, not lost! It's just missing!"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["But you're in charge of the library! How\ndid you lose a whole book?"],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'We will keep looking for it. But first you\ngo.',
				'More important for you to get started\nright away.',
			],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"You have demonstrated incredible\ncompetence with what you've already done\nwith Ring Zero, so we are confident you\ncan work your way through the castle on\nyour own.",
			],
		},
	],
	'ch2-birthday.mgs:192:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["On my own? You aren't coming inside with\nme?"],
		},
	],
	'ch2-birthday.mgs:197:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['We are not hackers and cannot pass the\ngate.'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ring Zero should grant you access....'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['"Should?"'],
		},
	],
	'ch2-birthday.mgs:205:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['If I remember correctly....'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["You don't know? What kind of wise old men\nare you?"],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ["We'll certainly see, won't we?"],
		},
	],
	'ch2-birthday.mgs:211:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['That book... what did it say? Can you give\nme a summary at least?'],
		},
	],
	'ch2-birthday.mgs:218:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['I must have read it once....'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["Wasn't it something about...?"],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ["I don't know."],
		},
	],
	'ch2-birthday.mgs:233:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ["I can't remember."],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Something about rooms... and magic\nwords....'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Ho boy.'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'We had hoped that book would give you a\nleg up, but ultimately, I doubt it was\nthat important, %PLAYER%.',
				'Instead you will need to rely on XA, who\nwill be able to provide you with a great\ndeal of information.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Exay?'],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['XA sits just inside. Is robot.'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['It literally has insider information about\nthe place.'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I realize it's disappointing that we\ncannot help you very much in this chapter\nof your journey as a mage.",
				'But we promise you, %PLAYER%, that you\nwill not be entirely on your own.',
				"Trust us. You'll be just fine.",
			],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['You will not be in danger at any point!'],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['Unless Big Bad comes back.'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes! And that is why you must hurry!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["All right. Let's not waste any more time."],
		},
	],
	'ch2-birthday.mgs:278:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['All right. Take a deep breath.\nYou can do it, %PLAYER%.'],
		},
	],
	'ch2-bobsclub-basement.mgs:214:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Huh. Well, I found the source of the\nnoise....'],
		},
	],
	'ch2-bobsclub-basement.mgs:219:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ["Hey! You're not allowed in here!"],
		},
	],
	'ch2-bobsclub-basement.mgs:224:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, wait. I remember you. Your name was\nBob, wasn't it?"],
		},
	],
	'ch2-bobsclub-basement.mgs:232:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Um, technically, it WAS Bob....', '(At one point....)'],
		},
	],
	'ch2-bobsclub-basement.mgs:228:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, I guess it is.'],
		},
	],
	'ch2-bobsclub-basement.mgs:237:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, well. Too late regardless.'],
		},
	],
	'ch2-bobsclub-basement.mgs:241:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ["Welcome to the annual Bob's Club party."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I thought the party was canceled this\nyear.'],
		},
	],
	'ch2-bobsclub-basement.mgs:247:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ['It was, but we seem to be experiencing a\ntime anomaly.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What? A time anomaly?'],
		},
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Yeah. The flow of time is being\nsimultaneously compressed and expanded.',
				"The Bob's Club party was canceled this\nyear, but simultaneously, this is a year\nwhere it WASN'T canceled.",
				'Your 16th birthday, for another example.\nWhen did you get chosen by Ring Zero?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yesterday.'],
		},
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Was it yesterday? Or was it actually a few\nyears ago?'],
		},
	],
	'ch2-bobsclub-basement.mgs:263:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Wait. What?'],
		},
	],
	'ch2-bobsclub-basement.mgs:267:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"That's what makes this an anomaly. It\nwasn't yesterday, and it wasn't a few\nyears ago. It was BOTH.",
			],
		},
	],
	'ch2-bobsclub-basement.mgs:271:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["That's... impossible.", 'What does that even mean?'],
		},
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ['It means someone is messing with reality.'],
		},
	],
	'ch2-bobsclub-basement.mgs:277:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['The Big Bad?'],
		},
	],
	'ch2-bobsclub-basement.mgs:281:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Probably.'],
		},
	],
	'ch2-bobsclub-basement.mgs:287:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['This is freaking me out. How do we stop\nit?'],
		},
	],
	'ch2-bobsclub-basement.mgs:293:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Depends on the exact cause. I've been\nkeeping my eye on it with my keytool,\nGlitch. Trying to investigate from several\nangles.",
				"But I don't have a lot of power in here.",
			],
		},
	],
	'ch2-bobsclub-basement.mgs:298:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Honestly, Bob, the sooner you can stop the\nBig Bad, the better.',
				'No pressure!',
			],
		},
	],
	'ch2-bobsclub-basement.mgs:305:2': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Anyway, I'll keep watch here.",
				"Help yourself to the food. There's plenty.",
			],
		},
	],
	'ch2-bobsclub-basement.mgs:310:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, do you have any Cactus Cooler?'],
		},
	],
	'ch2-bobsclub-basement.mgs:314:3': [
		{
			entity: 'Guardian Bob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Sure. We've got a lifetime supply in the\nice chest back there. Help yourself.",
			],
		},
	],
	'ch2-bobsclub-basement.mgs:347:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'So why is the party in the basement? I\nthought it was going to be upstairs. There\nwere decorations half set up and\neverything.',
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Well, we WERE going to have the party\nupstairs, but someone broke in and\npretended to be named Bob. After that we\nupped our security.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['...Oh yeah?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Yeah, this guy Strong Bad. The photo on\nhis fake ID looked nothing like him, but\nBob Austin let him in anyway.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['No kidding.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I've been manually teleporting Bobs down\nhere ever since, just to be sure. My\nteleport program is very strict. It won't\nlet non-Bobs through at all.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Good to know.'],
		},
	],
	'ch2-bobsclub-basement.mgs:361:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm the MC for Bob Jeopardy this year.",
				"Of course, I'm the MC for Bob Jeopardy\nevery year.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["What's Bob Jeopardy like?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Like Jeopardy, but with drinking.', 'And Bobs.'],
		},
	],
	'ch2-bobsclub-basement.mgs:373:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Hey there, friend. Have a drink, on the\nhouse.',
				'Plenty of Cactus Cooler to go around.',
			],
		},
	],
	'ch2-bobsclub-basement.mgs:381:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["It's always red plastic cups, isn't it?"],
		},
	],
	'ch2-bobsclub-basement.mgs:388:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Mmmm, fresh pizza!'],
		},
	],
	'ch2-bobsclub-basement.mgs:420:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Frog blast the vent core!', "That's the name of my favorite drink."],
		},
	],
	'ch2-bobsclub-basement.mgs:402:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["They're everywhere!", "Us Bobs, that is. We're everywhere!"],
		},
	],
	'ch2-bobsclub-basement.mgs:404:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ah! Watch it!', 'You stepped on my foot!'],
		},
	],
	'ch2-bobsclub-basement.mgs:406:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Follow me!', "Let's start a conga line!"],
		},
	],
	'ch2-bobsclub-basement.mgs:408:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['AAHHHH!', 'I bit my tongue!'],
		},
	],
	'ch2-bobsclub-basement.mgs:410:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Get me outta here.', 'This dubstep is too much.'],
		},
	],
	'ch2-bobsclub-basement.mgs:412:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Hey! He's shooting at us!",
				'That DSLR looks nice. Wonder where he got\nit.',
			],
		},
	],
	'ch2-bobsclub-basement.mgs:414:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Perimeter secured.', 'No non-Bobs here!'],
		},
	],
	'ch2-bobsclub-basement.mgs:416:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['All right!', "This is the best Bob's Club party yet!"],
		},
	],
	'ch2-bobsclub-basement.mgs:418:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Thank god it's you!", 'Another Bob!'],
		},
	],
	'ch2-bobsclub-basement.mgs:451:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Bingo! Cactus Cooler!'],
		},
	],
	'ch2-bobsclub-basement.mgs:449:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"This really is a lot of Cactus Cooler.\nGuess I'll grab a can for the road.",
			],
		},
	],
	'ch2-bobsclub-basement.mgs:453:3': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You pick up the can of Cactus Cooler!)'],
		},
	],
	'ch2-bobsclub-basement.mgs:438:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Got my can of Cactus Cooler. Time to bring\nit to Rocco at the castle power plant.',
			],
		},
	],
	'ch2-bobsclub-basement.mgs:433:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"I won't need more Cactus Cooler than this.\nI'll leave the rest for everyone else.",
			],
		},
	],
	'ch2-bobsclub-basement.mgs:444:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Rocco already has his Cactus Cooler. I'll\nleave the rest of these cans for everyone\nelse at the party.",
			],
		},
	],
	'ch2-bobsclub.mgs:214:6': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Oh, right. They had drinks and stuff at\nthe party. I wonder if they'll have a rare\nsoda like Cactus Cooler?",
			],
		},
	],
	'ch2-bobsclub.mgs:209:6': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Oh, yeah. I found Cactus Cooler in the\nfridge here yesterday. I should grab some\nwhile I'm here.",
			],
		},
	],
	'ch2-bobsclub.mgs:173:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Huh. Still empty... apart from that\nmuffled thumping noise.'],
		},
	],
	'ch2-bobsclub.mgs:167:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Huh? That's weird. Where did everyone go?",
				"And what's that muffled thumping noise?",
			],
		},
	],
	'ch2-bobsclub.mgs:192:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Maybe I should take a look around.'],
		},
	],
	'ch2-bobsclub.mgs:186:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'There might be Cactus Cooler around\nsomewhere, though. This place has drinks\nand stuff, right?',
			],
		},
	],
	'ch2-bobsclub.mgs:181:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"At least I can grab some Cactus Cooler\nwhile I'm here. I know I saw some in the\nfridge yesterday.",
			],
		},
	],
	'ch2-bobsclub.mgs:253:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I guess they didn't need this box of\nballoons downstairs."],
		},
	],
	'ch2-bobsclub.mgs:248:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"It's a box of unfilled balloons. There\nused to be a ton more of them though.",
			],
		},
	],
	'ch2-bobsclub.mgs:265:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"They just left this stool by itself, huh?\nGuess there wasn't room downstairs.",
			],
		},
	],
	'ch2-bobsclub.mgs:260:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Only one stool for the whole bar? Where's\nthe rest?"],
		},
	],
	'ch2-bobsclub.mgs:271:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['A beer keg maybe?'],
		},
	],
	'ch2-bobsclub.mgs:277:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I KNOW there used to be bottles by the\nsink! Where did everything go?'],
		},
	],
	'ch2-bobsclub.mgs:293:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yup, still glasses and tumblers in there.'],
		},
	],
	'ch2-bobsclub.mgs:287:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Those are some hardy-looking glasses and\ntumblers.'],
		},
	],
	'ch2-bobsclub.mgs:300:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['These glasses look super fancy.'],
		},
	],
	'ch2-bobsclub.mgs:319:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"I could have sworn there was Cactus Cooler\nin here yesterday, but it's gone now.",
			],
		},
	],
	'ch2-bobsclub.mgs:314:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"I would have thought there'd be some soda\nin here, but nothing. Not even a box of\nbaking soda.",
			],
		},
	],
	'ch2-bobsclub.mgs:310:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Nothing in here.'],
		},
	],
	'ch2-bobsclub.mgs:383:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'...But enough distractions. I should use\nthe LOOK command in the serial console to\ndiscover any secret doors.',
			],
		},
	],
	'ch2-bobsclub.mgs:337:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'...Jeez, that weird thumping is actually\nrattling the shelves! Is that... music?\nLoud music?',
			],
		},
	],
	'ch2-bobsclub.mgs:341:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Where the heck is it coming from? This is\nthe only room in the building!',
				'...Right?',
			],
		},
	],
	'ch2-bobsclub.mgs:347:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'...Okay, that thumping is DEFINITELY\nmusic. I think the bass just dropped.',
			],
		},
	],
	'ch2-bobsclub.mgs:350:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'It sounds like the speaker is nearby, like\njust beyond a wall. But the only exit to\nthis room is the main entrance.',
			],
		},
	],
	'ch2-bobsclub.mgs:355:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"...Wow, I think what I'm hearing is\nactually dubstep. It's muffled, but it's\nso loud it must be practically next door.",
			],
		},
	],
	'ch2-bobsclub.mgs:359:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Is it under the floor or something? I\nkeeping looking but there aren't any\nstairs!",
			],
		},
	],
	'ch2-bobsclub.mgs:365:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['...Okay, that music is starting to get on\nmy nerves. But where...'],
		},
	],
	'ch2-bobsclub.mgs:369:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"...Oh, that's right! The artifact can\nidentify the exits for each room!",
				'I wonder if it could show me the way to a\nsecret room.',
				'...With secret dubstep.',
			],
		},
	],
	'ch2-bobsclub.mgs:377:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"...Ah, that's right, I remember now. I can\nuse the artifact to LOOK around the room.\nMaybe I can find the source of the music\nthat way.",
			],
		},
	],
	'ch2-castle-1-bert.mgs:12:2': [
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['%PLAYER%, wait.'],
		},
	],
	'ch2-castle-1-bert.mgs:25:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Bert? But how did you get in? I thought\nnone of you could cross the threshold.',
			],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['I remembered back door. But....'],
		},
	],
	'ch2-castle-1-bert.mgs:31:2': [
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['No. I can go no further. I could, once.\nPerhaps.'],
		},
	],
	'ch2-castle-1-bert.mgs:36:2': [
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'%PLAYER%, I must not stay long. But I\nmust tell you this.',
				'Something is wrong.',
				'That book we wanted to give you... it was\nnot gone yesterday. It was on shelf, in\nlibrary.',
				'It is only gone today. This morning.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['The book only went missing this morning?'],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Yes. I am sure of it.',
				'%PLAYER%, something wants to stop you.\nOr delay you.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Are we too late, then? Is the Big Bad\nhere?'],
		},
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: ['No. We would know. Big Bad would not hide.'],
		},
	],
	'ch2-castle-1-bert.mgs:48:2': [
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'But perhaps he can still reach into our\nvillage. Small hacks. Subtle things.',
				'Perhaps he left traps. Protocols. Magic\nthat waits for his signal before working.',
				'I once knew more. But I am old, and....',
				'....',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['...?'],
		},
	],
	'ch2-castle-1-bert.mgs:56:2': [
		{
			entity: 'Bert',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I must go. There is something I must\nlearn. Quickly. But I will return.',
				'Do not wait for me. Go and fix artifact.',
				'If I find answer, I will leave message\nwith trash panda Wizard.',
				'Good luck.',
			],
		},
	],
	'ch2-castle-1.mgs:253:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What, over there?'],
		},
	],
	'ch2-castle-1.mgs:291:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Huh. Almost looks like one of those old,\nfancy calculators.'],
		},
	],
	'ch2-castle-1.mgs:360:6': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Weird. I can't get Ring Zero to work."],
		},
	],
	'ch2-castle-1.mgs:342:6': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Oh, yeah. Ring Zero won't work in in the\ncastle until I fix the mainframe.",
			],
		},
	],
	'ch2-castle-1.mgs:348:6': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Why doesn't Ring Zero work?"],
		},
	],
	'ch2-castle-1.mgs:354:6': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Weird. I can't get Ring Zero to work,\neither."],
		},
	],
	'ch2-castle-1.mgs:468:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I should go talk to the spider robot over\nthere.'],
		},
	],
	'ch2-castle-1.mgs:456:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'How am I supposed to get around the castle\nif the doors are all caved in?',
			],
		},
	],
	'ch2-castle-1.mgs:460:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Hmm. Maybe there's something else in this\nroom I can investigate."],
		},
	],
	'ch2-castle-1.mgs:464:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"That's kind of a funny orange spider,\nisn't it? I wonder if it can help me.",
			],
		},
	],
	'ch2-castle-1.mgs:438:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Oh, yeah. With the debris blocking the\ndoors, I'll need the serial console to\nmove between rooms.",
			],
		},
	],
	'ch2-castle-1.mgs:448:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['The castle doors are blocked? This is\ngoing to be a short quest.'],
		},
	],
	'ch2-castle-1.mgs:444:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['And the castle doors are blocked? This is\ngoing to be a short quest.'],
		},
	],
	'ch2-castle-1.mgs:523:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Bye.'],
		},
	],
	'ch2-castle-1.mgs:585:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Finished it already?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Not exactly.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Yeah, didn't think so.", 'Later, gator.'],
		},
	],
	'ch2-castle-1.mgs:575:6': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hey.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hi.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Finished building that computer yet?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Not yet.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Cool, cool. So anyway, let me know when\nthe hardware is done and I can help\ninstall the OS and stuff. I'm great with\nsoftware.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Okay. Thanks.'],
		},
	],
	'ch2-castle-1.mgs:569:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"So mysterious-voice-man wants to put that\nthing back together, huh? I don't really\nget it, but okie-dokie.",
				"Let me know when the hardware is done and\nI can help install the OS and stuff. I'm\ngreat with software.",
			],
		},
	],
	'ch2-castle-1.mgs:553:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hey.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hi.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Heard you talking to whats-his-name.\nBuilding a computer?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Yeah, we're going to fix the castle\nmainframe."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Cool, cool.',
				"So you should know... I'm an installation\nwizard. I'm pretty great with computers.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, yeah? Could you help me install\ncomputer parts into the mainframe?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Nah, I'm a software guy, actually."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"But once it's built, I can help install\nthe OS or whatever programs you might need\nto do whatever. Always happy to help.",
			],
		},
	],
	'ch2-castle-1.mgs:530:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hi.'],
		},
	],
	'ch2-castle-1.mgs:535:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Um, how do I get the hex editor to come up\nagain?'],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: ["Don't look at me. I don't use touch\nscreens."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Touch screens?'],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Capacitive buttons. Same diff. My paw pads\nwon't trigger them right.",
				"But there must be some kind of shiny\ncopper surface on your whatsit, right? Try\ntouching it with your finger. That's\nprobably how it's done.",
			],
		},
	],
	'ch2-castle-1.mgs:544:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Looks like whats-his-name is paging you.\nBetter answer him on the terminal.',
			],
		},
	],
	'ch2-castle-1.mgs:615:2': [
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh! Oh! You have software for the new\ncomputer?',
				'Can I help install it? Please?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I wouldn't have it any other way."],
		},
	],
	'ch2-castle-1.mgs:622:2': [
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: ['Awesome!', "First off, what's it on? A thumb drive?\nFloppy?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Well, it's like a flat disk thing, all\nrainbowy on one side...."],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: ['A CD or DVD or something? Cool, cool.'],
		},
	],
	'ch2-castle-1.mgs:629:2': [
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Press the button on that slot there and\nthe disc tray will open. Then set the disc\non the tray, rainbow side down, and press\nthe button again to close it.',
			],
		},
	],
	'ch2-castle-1.mgs:643:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Okay, now what?'],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hit the power button.'],
		},
	],
	'ch2-castle-1.mgs:648:2': [
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"The machine will try to boot from the hard\ndrive first. If there's nothing there, it\nshould try the optical drive next.",
				"Not sure if that disc will give us a full\ninstaller with a bunch of settings, or if\nit'll just start up on its own.",
			],
		},
	],
	'ch2-castle-1.mgs:659:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['!!'],
		},
	],
	'ch2-castle-1.mgs:663:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Look! It's working!"],
		},
	],
	'ch2-castle-1.mgs:674:2': [
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: ['Aw, come on! Straight to boot? No startup\nsettings at least?'],
		},
	],
	'ch2-castle-1.mgs:678:2': [
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh well. Guess that's how things are gonna\nplay out. Not much fun for me though.\nGuess I still helped, technically.",
			],
		},
	],
	'ch2-castle-1.mgs:687:2': [
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hey hey! There you go!'],
		},
	],
	'ch2-castle-1.mgs:700:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Whoa! What was that?'],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: ['Your hand was glowing. Or maybe a ring?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Ring Zero?', "Oh! It's warm! I wonder if it'll work now?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What was it again? "Touch the hat on the\nPCB" -- right?'],
		},
	],
	'ch2-castle-1.mgs:732:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hey! It works!'],
		},
		{
			entity: 'Wizard',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Looks like the castle's core services are\ngonna come back online on their own. I\nguess that'll make it a breeze to clean\neverything up, eh?",
			],
		},
	],
	'ch2-castle-1.mgs:753:2': [
		{
			entity: 'Frankie',
			alignment: 'TOP_LEFT',
			messages: ['...Oh!', "I'm in! I've got full access again! Let's\ngooo!"],
		},
	],
	'ch2-castle-1.mgs:771:2': [
		{
			entity: 'C. K. Watt',
			alignment: 'TOP_RIGHT',
			messages: ['Aha, we got core services coming back up.\nFinally.'],
		},
	],
	'ch2-castle-1.mgs:786:2': [
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ['Did you hear that? Something changed.'],
		},
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Ah, yessss! The mana boosters have spun\nup!',
				"Step aside, Your Majesty. I'll handle\nthis.",
			],
		},
	],
	'ch2-castle-1.mgs:813:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Awesome! I'll go tell the village elders\nI've got the artifact fully working.",
				"We're one step closer to facing the Big\nBad!",
			],
		},
	],
	'ch2-castle-1.mgs:834:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'(Hang on. First I should check whether\nRing Zero is working in here. What was it\nagain? "Touch the hat on the PCB"?)',
			],
		},
	],
	'ch2-castle-1.mgs:1274:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['I love the smell of software in the\nmorning.', "...What? That's a thing."],
		},
	],
	'ch2-castle-1.mgs:1362:4': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ["Let's get the artifact set up. I can help\nwalk you through it."],
		},
	],
	'ch2-castle-1.mgs:1286:4': [
		{
			name: '???',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'codec',
			messages: [
				'...',
				'...huh?',
				'Oh! Ohhh, is the light on? Hello?',
				'Oh my goodness. Is there actually someone\nthere? Hello? Can you hear me?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I can hear you.'],
		},
		{
			name: '???',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'codec',
			messages: ["Oh! It's a person! Yes, hello! My name\nis...."],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Lambda! Yeah, call me Lambda!',
				"I'm speaking to you through XA, the Exa!\nIt's this old intercom I set up ages ago.\nLooks like you're in the castle entrance.\nI'm surprised XA was still...",
				'Wait. Who are you? How did you even get\nin?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"I'm %PLAYER%. The village elders sent\nme here to collect the castle artifact so\nI could defeat the Big Bad.",
				"And I'm not a hacker, I just...\n...you know...\n...hack things. With Ring Zero.",
			],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"No, no, that can't be right.",
				'The village elders are the ones who told\nme to PROTECT the artifact! I have to keep\nit away from everyone at all costs!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Well we're going to need it soon. I don't\nknow if you felt that earthquake last\nnight, but the Big Bad is returning and I\nneed it to defeat him.",
			],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'The Big Bad, returning? Yes, I see. He\nmight still have the power to trigger an\nearthquake, even after....',
				"I, um, don't know why the village elders\nwould have changed their minds about this,\nbut....",
				"Well, you're welcome to the castle\nartifact. It's over there, just to your\nleft, inside the pillar.",
			],
		},
	],
	'ch2-castle-1.mgs:1316:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'That was easy. I thought there would be a\nquest or something. Puzzles, at least.',
			],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ["Well, it doesn't exactly work right now,\nso...."],
		},
	],
	'ch2-castle-1.mgs:1321:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Wait. What?'],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"That little thing can't do much on its\nown. The real powerful stuff was handled\nby the castle mainframe. They were linked\nwirelessly.",
				'But the mainframe was crippled.',
			],
		},
	],
	'ch2-castle-1.mgs:1327:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Crippled? What happened?'],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, ahh, I crippled it.'],
		},
	],
	'ch2-castle-1.mgs:1332:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What? Why?!'],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I couldn't let the Big Bad have access to\nit again.",
				"And we weren't using it for much\notherwise.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['But now no one can use it!'],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Small price to pay for keeping that power\nout of the Big Bad's hands. Although....",
				"That was easier to say before the\nearthquake. With the mainframe down we\ncan't fix anything.",
				"It's why you might as well have the\nportable interface. You could help out\naround here while I vet your story.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Vet my story? You don't believe the\nvillage elders sent me?"],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Well, um... this is all very complicated.\nI need to be sure that this isn't a trap.",
				"If it helps, I don't think you're the Big\nBad. He would have caused more mischief in\nthat room, even with Ring Zero disabled.",
			],
		},
	],
	'ch2-castle-1.mgs:1349:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Ring Zero is disabled? Since when?'],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ['Since you crossed the threshold.'],
		},
	],
	'ch2-castle-1.mgs:1345:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Yeah, about that... why won't Ring Zero\nwork in here?"],
		},
	],
	'ch2-castle-1.mgs:1354:4': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"The castle walls are lined with aluminum.\nActs as a Faraday cage. And Ring Zero's\nhex editor relies on some wireless\nservices.",
				"Normally, XA bridges the town's network\nwith....",
				"You know what? There's a lot to explain,\nand it might be easier to chat with the\nartifact. Let's set it up.",
			],
		},
	],
	'ch2-castle-1.mgs:1366:3': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ['Er, that is, do you want help?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes, please!',
					script: 'ch2_terminal_setup_start',
				},
				{
					label: 'No, thanks.',
					script: 'ch2_terminal_setup_nevermind',
				},
			],
		},
	],
	'ch2-castle-1.mgs:1385:3': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ['Need help getting the terminal working?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'ch2_terminal_setup_start',
				},
				{
					label: 'No',
					script: 'ch2_terminal_setup_nevermind',
				},
			],
		},
	],
	'ch2-castle-1.mgs:1377:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['How do I work Ring Zero again?'],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ["Hmm? What's that? Did you say something?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I want to see if Ring Zero is working now\nthat the mainframe is back online.',
			],
		},
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh, yes, I see.',
				"To open the hex editor, touch the hat at\nthe top of the PCB you're holding. Should\nbe just above the screen -- a shiny\ngold-colored area.",
			],
		},
	],
	'ch2-castle-1.mgs:1413:3': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Ah, okay. Carry on!\n\nAlso, remember you can speak to me in the\nconsole with the command "MAN".',
			],
		},
	],
	'ch2-castle-1.mgs:1395:3': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Ah, okay! Um, if you change your mind,\nspeak to XA again and I'll walk you\nthrough everything.",
			],
		},
	],
	'ch2-castle-1.mgs:1401:3': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ['To finish our conversation, type "MAN"\ninto the console.'],
		},
	],
	'ch2-castle-1.mgs:1422:2': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"First, plug the artifact into your\ncomputer. (Or, if it's plugged in but not\nworking, try flipping the cable the other\ndirection, or try another USB port.)",
			],
		},
	],
	'ch2-castle-1.mgs:1429:2': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ['Is the artifact plugged in now?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'ch2_terminal_plugged_yes',
				},
				{
					label: 'No',
					script: 'ch2_terminal_plugged_no',
				},
				{
					label: "I'm on the web",
					script: 'ch2_terminal_plugged_web',
				},
				{
					label: 'Never mind',
					script: 'ch2_terminal_setup_nevermind',
				},
			],
		},
	],
	'ch2-castle-1.mgs:1439:2': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Well, this won't exactly work wirelessly.\nYou're going to have to find a USB-C cable\nsomewhere, so, um....",
			],
		},
	],
	'ch2-castle-1.mgs:1446:2': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh, then you're all set already! Your\nconsole will be to the right (or directly\nbelow) the game screen, in your browser\nwindow.",
				'Click "Toggle Console" if you don\'t see a\nconsole at all.',
				'Note that you may have to click between\nthe game screen and the console depending\non what you want to be doing. Clicking\ngives focus to what you clicked on.',
			],
		},
	],
	'ch2-castle-1.mgs:1456:2': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ['Excellent! Well, from here we have two\nchoices.'],
		},
	],
	'ch2-castle-1.mgs:1462:2': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'You could connect the old fashioned way,\nvia a terminal program. The exact program\nwill vary by system: PuTTY, picocom, etc.\nJust set the baud to 115200.',
				'But for a super-easy one-size-fits-all\nmethod, visit the following website in a\nChrome-based browser:\n\ngooglechromelabs.github.io/serial-terminal',
				'Click "Connect" and choose your device\nfrom the list. (Try switching API modes if\nyou\'re having trouble getting a list to\nappear.)',
				"This might not work well on a phone, by\nthe way, and it definitely won't work on\niOS.",
				'Um, do you need to hear all that again?',
			],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes, say that all again',
					script: 'ch2_terminal_plugged_yes2',
				},
				{
					label: "No, I'm good",
					script: 'ch2_terminal_message_test',
				},
			],
		},
	],
	'ch2-castle-1.mgs:1502:2': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ["Let's test the serial connection."],
		},
	],
	'ch2-castle-1.mgs:1509:2': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ['Did you see my serial message?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'ch2_terminal_message_test_success',
				},
				{
					label: 'No',
					script: 'ch2_terminal_message_test_fail',
				},
			],
		},
	],
	'ch2-castle-1.mgs:1517:2': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ["Hmm. Well, um, let's go over the steps\nagain."],
		},
	],
	'ch2-castle-1.mgs:1539:3': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: ["Excellent! You're all set!"],
		},
	],
	'ch2-castle-1.mgs:1528:3': [
		{
			name: 'Lambda',
			portrait: 'lambda-codec',
			emote: 1,
			border_tileset: 'codec',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Excellent! Let\'s continue our conversation\nusing the terminal. Type "MAN" into the\nconsole to get things started.',
			],
		},
	],
	'ch2-castle-11.mgs:85:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, cool, I got past the blockage.', 'This artifact is handy.'],
		},
	],
	'ch2-castle-11.mgs:90:2': [
		{
			name: '???',
			alignment: 'BOTTOM_LEFT',
			messages: ['Intruder! Intruder!'],
		},
	],
	'ch2-castle-11.mgs:99:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, hi there, little bird.'],
		},
	],
	'ch2-castle-11.mgs:103:2': [
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: ['Little bird? Little bird?!'],
		},
	],
	'ch2-castle-11.mgs:107:2': [
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: ["I'm the ruddy harbringer of death!"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Oh, of course. I'm sorry."],
		},
	],
	'ch2-castle-11.mgs:112:2': [
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: ['Omigod omigod omigod!'],
		},
	],
	'ch2-castle-11.mgs:119:2': [
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: ["You gotta get me out of here! I'm going\ncrazy, stuck in here!"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Oh, sure. I guess birds don't like to be\nin enclosed spaces."],
		},
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: ["Enclosed spaces? Nah, I'm just bored to\ndeath!"],
		},
	],
	'ch2-castle-11.mgs:125:2': [
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: ['But you got in here! Does that mean you\ncan get me out?'],
		},
	],
	'ch2-castle-11.mgs:129:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"I don't think I can use the artifact to\nbring other people through the doors. Just\nme.",
				"But I'll try to get the doors cleared and\nworking again.",
			],
		},
	],
	'ch2-castle-11.mgs:134:2': [
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: ['OH THANK GOD!'],
		},
	],
	'ch2-castle-11.mgs:138:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'So I need a monitor. Lambda said there was\none in here I could use. I think he\nmeant...',
			],
		},
	],
	'ch2-castle-11.mgs:144:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['...this one, right? Is this one free for\nme to take?'],
		},
	],
	'ch2-castle-11.mgs:149:2': [
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: ['Beats me.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Is it... supposed to be showing that\nstuff?'],
		},
	],
	'ch2-castle-11.mgs:154:2': [
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Nuh-uh. This thing used to show a dumb\n"Welcome to King Gibson\'s castle"\nslideshow.',
				'Guess the computer it was plugged into got\ndamaged in the quake.',
				"Not that we're getting tourists -- apart\nfrom you.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['So I can take it?'],
		},
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: ["Dunno. I guess? I don't think anyone would\nmiss it."],
		},
	],
	'ch2-castle-11.mgs:238:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Is the computer sad? It keeps making\nfrowny faces.'],
		},
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Computer's basically dead. And I know a\ndead thing when I see one. Monitor's fine,\nthough.",
			],
		},
	],
	'ch2-castle-11.mgs:242:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(Pick up the monitor?)'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'ch2_touch_monitor_yes',
				},
				{
					label: 'No',
					script: 'ch2_touch_monitor_no',
				},
			],
		},
	],
	'ch2-castle-11.mgs:249:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Um, how do I take it?'],
		},
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Just unplug all the cables from the\ncomputer case. One power cable, one data\ncable.',
			],
		},
	],
	'ch2-castle-11.mgs:255:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You pick up the monitor!)'],
		},
	],
	'ch2-castle-11.mgs:262:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Maybe later, then.'],
		},
	],
	'ch2-castle-11.mgs:270:2': [
		{
			entity: 'Kuro',
			alignment: 'BOTTOM_LEFT',
			messages: ['So, um, you can get me out of here, right?'],
		},
	],
	'ch2-castle-11.mgs:274:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Working on it.'],
		},
	],
	'ch2-castle-12.mgs:96:3': [
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: ['Welcome!'],
		},
	],
	'ch2-castle-12.mgs:165:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["There's my name, logged for the ages."],
		},
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Thank you for signing the guest book! I\nhope you enjoy the remainder of your stay!',
			],
		},
	],
	'ch2-castle-12.mgs:153:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Huh? It's just a book with a bunch of\npeople's names."],
		},
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, yes! Do sign our guest book before you\ngo!'],
		},
	],
	'ch2-castle-12.mgs:159:3': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(Sign the guest book?)'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'interact_ch2_guestbook_signyes',
				},
				{
					label: 'No',
					script: 'interact_ch2_guestbook_signno',
				},
			],
		},
	],
	'ch2-castle-12.mgs:172:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['All right, here I go.'],
		},
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(scribble scribble scribble)'],
		},
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: ['Thank you for signing!'],
		},
	],
	'ch2-castle-12.mgs:181:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Maybe later.'],
		},
	],
	ch2_stereo_fix_proposal: [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Um, about that phonograph. I actually need\nto borrow the needle for something.',
			],
		},
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hmm? Whatever for?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["It'll help me fix the castle. Trust me."],
		},
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I could not in good conscience leave this\nroom bereft of welcome music. But,\nperhaps....',
				'You say you are going to fix the castle,\ntherefore you must be the fixing type.',
				'Might you be able to fix that stereo\nbehind me, perhaps? Were it repaired, I\nwould have no need of this phonograph or\nits needle.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Fix the stereo? I can take a look.'],
		},
	],
	'ch2-castle-12.mgs:250:4': [
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Go on, now. I'll let you have the needle\noff this phonograph is you get the stereo\nworking again. It's the black thing behind\nme.",
			],
		},
	],
	'ch2-castle-12.mgs:209:4': [
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: ["Welcome to King Gibson's castle. I do hope\nyou enjoy your visit!"],
		},
	],
	'ch2-castle-12.mgs:204:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Welcome?'],
		},
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: ["Yes, welcome to King Gibson's castle. I do\nhope you enjoy your visit!"],
		},
	],
	'ch2-castle-12.mgs:213:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Um, thanks. Listen, I know things are\nmessed up right now....'],
		},
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Fear not! I am confident everyone is\nworking to clear the doors and restore the\nintercom system.',
				'You, at least, seem to have overcome the\ndoor problem on your own, and should be\napplauded for your resourcefulness.',
				'You have my full support -- though alas,\nthe best I can do to help is keep this\nphonograph turning.',
				"You'll have moral support music, if\nnothing else!",
			],
		},
	],
	ch2_trying_times: [
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'In trying times, we may find ourselves\nwith limited resources or a constrictive\nenvironment.',
				"How admirable it is to acquire and\nleverage one's limited resources and\nperform great work anyway! I'll be\ncheering you on from here. Good luck!",
			],
		},
	],
	'ch2-castle-12.mgs:257:2': [
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"King Gibson's castle is now under (mostly)\nnormal operation! Please enjoy your stay!",
			],
		},
	],
	'ch2-castle-12.mgs:269:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Too bad the record won't work as a plate\nfor the hard drive. It's the perfect size.",
			],
		},
	],
	'ch2-castle-12.mgs:283:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Definitely an old-timey look, isn't it?"],
		},
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: ["If you like this, you should see King\nGibson's bedroom."],
		},
	],
	'ch2-castle-12.mgs:276:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["That's a funny looking trumpet."],
		},
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'It mechanically amplifies the vibrations\ncaptured by the needle upon the vinyl\nrecord.',
				"I dusted it off after the earthquake\ndamaged the intercom system and the\nstereo. I couldn't bear how quiet it was\nin here.",
			],
		},
	],
	'ch2-castle-12.mgs:302:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'(I can have the needle off the phonograph\nonce I fix the stereo. I better get on\nthat.)',
			],
		},
	],
	'ch2-castle-12.mgs:298:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'(Will the concierge get mad at me if I\ntake the needle from this record player? I\nguess I should ask.)',
			],
		},
	],
	'ch2-castle-12.mgs:291:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(Pick up the phonograph needle?)'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'ch2_touch_needle_yes',
				},
				{
					label: 'No',
					script: 'ch2_touch_needle_no',
				},
			],
		},
	],
	'ch2-castle-12.mgs:311:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You pick up the needle!)'],
		},
	],
	'ch2-castle-12.mgs:320:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Maybe later, then.'],
		},
	],
	'ch2-castle-12.mgs:396:2': [
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh! Oh! I can hear it! The old, reliable\nstereo is back in business!'],
		},
	],
	ch2_needle_prompt: [
		{
			entity: 'Concierge',
			portrait: 'concierge',
			alignment: 'BOTTOM_LEFT',
			messages: ['Go ahead and take the needle off that\nphonograph. Many thanks!'],
		},
	],
	'ch2-castle-12.mgs:418:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['All right, plugging in the artifact again.'],
		},
	],
	'ch2-castle-12.mgs:410:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['A CD player or something? Looks half\ndamaged.'],
		},
	],
	'ch2-castle-12.mgs:412:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['?', "Oh, there's a place where the artifact can\nplug into it."],
		},
	],
	'ch2-castle-13.mgs:162:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ['...and I say we forget him!'],
		},
	],
	'ch2-castle-13.mgs:166:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['...?'],
		},
	],
	'ch2-castle-13.mgs:174:2': [
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh... oh dear.'],
		},
	],
	'ch2-castle-13.mgs:178:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"How many hours has it been? It's clear to\nme he's not coming back.",
				"As usual, he's left us to clean up his\nmesses for him.",
			],
		},
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"But what if he's injured? He could be\nstuck in there, bleeding out. Maybe he\ncan't reach the intercom. Maybe he's\nwaiting for us to --",
			],
		},
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ['He won\'t be "bleeding out" after a tiny\nshake like that.'],
		},
	],
	'ch2-castle-13.mgs:186:2': [
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ['But what if a piece of debris hit him on\nthe head, and --'],
		},
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ['He has the constitution of an ox!'],
		},
	],
	'ch2-castle-13.mgs:192:2': [
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ["Actually, he's a gnu."],
		},
	],
	'ch2-castle-13.mgs:197:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Enough!',
				'In either case, we must take action before\nanything worse happens.',
			],
		},
	],
	'ch2-castle-13.mgs:202:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ['We must take administrative control of the\ncastle. We must --'],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ['Sebastian, wait. Someone is here.'],
		},
	],
	'ch2-castle-13.mgs:207:2': [
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ['!!'],
		},
	],
	'ch2-castle-13.mgs:216:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Sorry. I didn't mean to interrupt\nanything."],
		},
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ['And who do you think you are?'],
		},
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh! How did you get in? Does this mean the\ndoor's been unblocked?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'No, the doors are still broken. But I have\nthis portable terminal, and --',
			],
		},
	],
	'ch2-castle-13.mgs:228:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ['You have the artifact?', 'Give that to me. That belongs to --'],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ['Stop, %Sebastian%. It does not belong to\nyou. Nor to any of us.'],
		},
	],
	'ch2-castle-13.mgs:234:2': [
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ["It's up to the king who gets to wield it!"],
		},
	],
	'ch2-castle-13.mgs:239:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ["But the king isn't here, is he? It's up to\nUS --"],
		},
	],
	'ch2-castle-13.mgs:243:2': [
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'It is up to me, if it is up to anyone. I\nam regent.',
				'You, stranger. What is your name?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["It's %PLAYER%."],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ['How is the rest of the castle?'],
		},
	],
	'ch2-castle-13.mgs:264:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Um, the rooms are in bad shape, but I can\nreport that everyone is okay.'],
		},
	],
	'ch2-castle-13.mgs:260:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Um, the rooms are in bad shape, but\neveryone seems okay. The people I've met\nso far, anyway.",
			],
		},
	],
	'ch2-castle-13.mgs:268:2': [
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Very good. And that device -- I was under\nthe impression it was inoperative.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Mostly. I'm trying to fix the castle\nmainframe, which should get it working a\nlot better.",
			],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Then I'll let you have at it. But first,\nif I might ask something of you,\n%PLAYER%....",
				'We have not seen or heard from King Gibson\nsince last night. You see, prior to that,\nthere was --',
			],
		},
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ['We all had an argument.'],
		},
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ['Balderdash. He was overreacting, and I\nonly --'],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Nevertheless, I fear he is trapped in his\nbedroom, just to the north of us. He's not\nanswering the intercom.",
			],
		},
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ['He could be hurt!'],
		},
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Bah! He's ignoring us. He could've\nanswered us if he wanted to talk to us. Or\nhe'd've unlocked the door and come out.",
			],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ['If you would be so kind as to check up on\nhim, please?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Sure.'],
		},
	],
	'ch2-castle-13.mgs:300:2': [
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ['Your majesty!'],
		},
	],
	'ch2-castle-13.mgs:302:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ['!!'],
		},
	],
	'ch2-castle-13.mgs:303:2': [
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ['You are well!'],
		},
	],
	'ch2-castle-13.mgs:307:2': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Of course. You see, the intercom and\ndoorlocks were broken, and the door failed\nshut.',
				'I regret....',
			],
		},
	],
	'ch2-castle-13.mgs:312:2': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 3,
			messages: [
				'I regret the things I said yesterday.\nAnd... I regret I assumed you had locked\nme in there. I should have trusted you\nbetter.',
			],
		},
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, Your Majesty! I'm just glad you --"],
		},
	],
	'ch2-castle-13.mgs:318:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Never mind any of that! This is an\nemergency!',
				'Can we finally begin some damn rescue\noperations, or do we need to form a\ncommittee to draft a proposal and bring it\nto the populace to a vote?',
			],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['What have you tried so far?'],
		},
	],
	'ch2-castle-13.mgs:324:2': [
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Neither Templeton nor I have the leverage\nto lift the debris. And Sebastian's\ntelekinesis spell doesn't have enough\npower on its own.",
			],
		},
	],
	'ch2-castle-13.mgs:328:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I won't burn out my mana trying over and\nover again. It's obvious it won't work.",
			],
		},
	],
	'ch2-castle-13.mgs:332:2': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, maybe I can shift it.'],
		},
	],
	'ch2-castle-13.mgs:344:2': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['I can bench press three hundred pounds. I\nmight be able to move this.'],
		},
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"At the speed my mana was draining, it's\nheavier than that. You'll wear yourself\nout for no reason.",
				"But at least we're focused on the real\nproblem now. Finally!",
			],
		},
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"This debris wasn't going anywhere, and the\nking might have been lying in a pool of\nhis own blood, gasping for air, with his\nevery bone broken!",
			],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Fortunately, the king is all right, and\nwhat's done is done. Focus.",
				'Neither the king nor Sebastian can move\nthe debris alone, but what about together?',
			],
		},
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, yes! But what if you lighten the load\nwith telekinesis, Sebastian?'],
		},
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ['Perhaps, but....'],
		},
	],
	'ch2-castle-13.mgs:355:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ['You there, stranger. The rest of the\ncastle is damaged?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yes. Most doors are crumpled exactly like\nthis.'],
		},
	],
	'ch2-castle-13.mgs:359:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Then I must pace myself. The mana required\nis the square of the weight being\nmanipulated.... Ah, but if I don't have to\nintroduce lateral motion myself --",
			],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes, a gravitation spell.'],
		},
	],
	'ch2-castle-13.mgs:364:2': [
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"That's much cheaper. But... blast, I need\nto check a few numbers in my physics\nspellbook. Templeton, please tell me\nyou've eaten a copy?",
			],
		},
	],
	'ch2-castle-13.mgs:368:2': [
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ["I-I think so. Let me check. I've got it\nfiled in here somewhere."],
		},
	],
	'ch2-castle-13.mgs:372:2': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ["Now we're getting somewhere."],
		},
	],
	'ch2-castle-13.mgs:376:2': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I can at least see if there are any pieces\nof this I can extract on my own.',
			],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"%PLAYER%, we're making sufficient\nprogress here. Don't let us keep you.",
				'Once the mainframe is repaired, we will be\nmuch better equipped to clear all the\ndebris at once.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Right, of course.'],
		},
	],
	'ch2-castle-13.mgs:384:2': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['Good luck. And thank you. Truly.'],
		},
	],
	'ch2-castle-13.mgs:456:3': [
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Once the mainframe is repaired, we will be\nmuch better equipped to clear all the\ndebris at once. Don't let us keep you.",
			],
		},
	],
	'ch2-castle-13.mgs:460:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Actually, I could use your help to fix it.'],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ['Of course. Anything.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I sort of need to borrow... you.',
				'We\'re short a CPU. And I need a volunteer\nto act as the "thinking" part --',
			],
		},
	],
	'ch2-castle-13.mgs:469:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ["What's this? What are you talking about?"],
		},
	],
	'ch2-castle-13.mgs:473:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"It'd be temporary. After the mainframe is\nfixed, we can mail order a real CPU, and\nwe can put you back to normal when it\narrives. But for this short little while\n--",
			],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ["I'll do it."],
		},
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ['%Aurelius%!'],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ["The king has returned, so I'm of little\nuse now."],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ["Don't say that."],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"This is an emergency, and I can offer no\nphysical assistance. You've valued me for\nmy mind, haven't you? I've been your\nadvisor. Ambassador.",
			],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['And friend!'],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"It's only temporary. And it sounds like an\ninteresting adventure. A new\nperspective... a novel experience.\nWouldn't you say?",
			],
		},
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: ["And what if it's not temporary? This\ndoesn't sound safe!"],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ["I've read a monograph on this very\nsubject. It's safe."],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 3,
			messages: ['....', "If this is really what you want, I won't\nstop you."],
		},
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ['It will empower the rest of you.'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ["Very well. We'll continue to do our best\nhere."],
		},
	],
	'ch2-castle-13.mgs:491:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You acquired a goldfish!)'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ["I'm counting on you both. Good luck."],
		},
	],
	'ch2-castle-13.mgs:444:3': [
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Do please check on King Gibson, would you?\nHe's in his bedroom, just to the north of\nus.",
			],
		},
	],
	'ch2-castle-13.mgs:450:4': [
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ['Godspeed.'],
		},
	],
	'ch2-castle-13.mgs:506:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"The king is okay, but he's trapped in\nthere. Both the intercom and the keypad\nlock to his door seem to be broken.",
			],
		},
	],
	'ch2-castle-13.mgs:510:3': [
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, thank goodness! He's all right!"],
		},
	],
	'ch2-castle-13.mgs:514:3': [
		{
			entity: 'Aurelius',
			portrait: 'goldfish',
			alignment: 'BOTTOM_LEFT',
			messages: ['I see. Thank you.'],
		},
	],
	'ch2-castle-13.mgs:518:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I'll get the king out of there. Don't\nworry."],
		},
	],
	'ch2-castle-13.mgs:538:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'%Templeton%, I promise not to yell at you\nfor eating my spellbooks again if you can\nproduce the right page in the next five\nminutes.',
			],
		},
	],
	'ch2-castle-13.mgs:544:3': [
		{
			entity: 'Templeton',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Darn it, you made me forget the filing\nnumber! Now I'll have to go through the\ncard catalog all over again!",
			],
		},
	],
	'ch2-castle-13.mgs:526:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Mark my words: he's ignoring us. He's all\nbut abdicated."],
		},
	],
	'ch2-castle-13.mgs:532:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Forget the king. He's on his own."],
		},
	],
	'ch2-castle-13.mgs:567:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Thank you for rescuing the king. We were\nall very worried about him.'],
		},
		{
			entity: 'Sebastian',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"%Templeton%, please don't forget that\nyou're trying to find my physics\nspellbook. The gravitation spell, please?",
			],
		},
	],
	'ch2-castle-13.mgs:572:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes, yes, of course.'],
		},
	],
	'ch2-castle-13.mgs:554:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I know King Gibson doesn't always get\nalong with us, but this silence is unlike\nhim. I'm worried.",
			],
		},
	],
	'ch2-castle-13.mgs:560:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, goodness! Thank you, thank you!'],
		},
	],
	'ch2-castle-13.mgs:684:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['My staff and I are reunited. You have my\nthanks.'],
		},
	],
	'ch2-castle-13.mgs:679:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['Take good care of Aurelius for me.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I will.'],
		},
	],
	'ch2-castle-13.mgs:657:3': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['My staff and I are reunited, thanks to\nyou.', 'I am in your debt.'],
		},
	],
	'ch2-castle-13.mgs:662:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['So, Your Majesty, about the clock in your\nbedroom....'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ["What? What's this about my heirloom\ngrandfather clock?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I sort of want to borrow it to --'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['Fine then. Have it, if you want it.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Really? Just like that?'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"It's just an object. A thing. Replaceable.",
				"You reunited me with my advisors. My\nfriends. That's worth far more to me than\na piece of furniture.",
				'Take it, if you feel you can make good use\nof it.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Thank you very much!'],
		},
	],
	'ch2-castle-13.mgs:693:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['*whew* All the doors are cleared now, so\ntime for a break.'],
		},
	],
	'ch2-castle-13.mgs:696:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Jeez Louise. I hope nothing else goes\nwrong today.'],
		},
	],
	'ch2-castle-13.mgs:700:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Do let me know when we can get Aurelius\nback.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Of course.'],
		},
	],
	'ch2-castle-13.mgs:707:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Neat detail work in the beard. I wonder\nwhat kind of stone this is.'],
		},
	],
	'ch2-castle-14.mgs:89:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['?'],
		},
	],
	'ch2-castle-14.mgs:94:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 2,
			messages: ['!!!', "Intruder! Someone's in my bedroom!"],
		},
	],
	'ch2-castle-14.mgs:99:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 2,
			messages: ['Help! Guards!'],
		},
	],
	'ch2-castle-14.mgs:105:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ["But no, of course. I'm alone."],
		},
	],
	'ch2-castle-14.mgs:112:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 3,
			messages: ['They locked me in here to rot. Why would\nthey bother with me now?'],
		},
	],
	'ch2-castle-14.mgs:116:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 3,
			messages: ['Well, assassin, do your worst. Get it over\nwith.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Whoa, whoa, whoa! Calm down, sir! Er, Your\nMajesty! I'm not an assassin!"],
		},
	],
	'ch2-castle-14.mgs:121:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ["Then you've come to mock me."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"No, of course not. I'm here to check up on\nyou. Your -- um, advisors? -- are very\nworried about you.",
			],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I doubt that. They've disabled the locking\nmechanism on the door, and they won't\nanswer the intercom. I've tried to reach\nthem dozens of times.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Intercom?'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes. That panel by the door, next to the\nkeypad.'],
		},
	],
	'ch2-castle-14.mgs:129:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 3,
			messages: ["Hmph. I'm sure Sebastian is halfway\nthrough a coup d'etat by now."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"But they said they've tried calling you.",
				'Could it be... perhaps the intercom is\nbroken, too?',
			],
		},
	],
	'ch2-castle-14.mgs:135:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['Broken?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Well, there was an earthquake. Maybe\nthat's what busted the lock.",
				"They said they've tried to call you, but\nhaven't heard anything back. In fact, they\nthink YOU'RE ignoring THEM.",
			],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ignoring them? No, I would never....'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['They said you had an argument last night.'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes but --'],
		},
	],
	'ch2-castle-14.mgs:144:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			emote: 3,
			messages: [
				'*sigh*',
				'I thought... I thought maybe I had gone\ntoo far this time. That they had finally\nwritten me off.',
			],
		},
	],
	'ch2-castle-14.mgs:149:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'They really tried to call me?',
				"This whole time, it was only a broken line\nof communication? They don't hate me?",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'The big, blue one is worried you might be\nhurt from the earthquake.',
				'It was the goldfish who asked me to check\nup on you.',
			],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['I am relieved to hear that.'],
		},
	],
	'ch2-castle-14.mgs:157:4': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'If you were able to enter this room, you\nmust have the serial artifact working. Is\nthat correct?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah.'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'If the intercom -- and the door locks --\nwere broken in the earthquake, then you\nshould be able to plug the artifact into\nthe keypad and do some diagnostics.',
				'If you would?',
			],
		},
	],
	'ch2-castle-14.mgs:228:4': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(Pick up the clock?)'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'ch2_touch_clock_yes',
				},
				{
					label: 'No',
					script: 'ch2_touch_clock_no',
				},
			],
		},
	],
	'ch2-castle-14.mgs:219:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Um, excuse me, Your Majesty. I sort of\nneed this clock --'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Clock? What are you on about? Stay\nfocused, please! Get this door working,\nand then we can discuss whatever else you\nwant.',
			],
		},
	],
	'ch2-castle-14.mgs:224:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Can I just take this, though? Maybe I\nshould ask the king first.'],
		},
	],
	'ch2-castle-14.mgs:213:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What a robust ticking ambience.'],
		},
	],
	'ch2-castle-14.mgs:208:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Wow, this thing looks like it's a million\nyears old."],
		},
	],
	'ch2-castle-14.mgs:237:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You pick up the clock!)'],
		},
	],
	'ch2-castle-14.mgs:245:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Maybe later, then.'],
		},
	],
	'ch2-castle-14.mgs:272:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Remind me how to derive the default keypad\npassword again?'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Well, I only wanted someone who could get\ninto every room -- which is to say,\nsomeone with the king's authority -- to be\nable to recover every letter in the\npassword.",
				'But I don\'t know how the architect ended\nup implementing the idea, beyond the edict\nof "one letter hidden per room."',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'The architect? That means....',
				"These letters won't be incorporated into\nfurniture, or paint, or the banners, or\nsomething that could be replaced or\nswitched around by someone who didn't know\nit was supposed to be a hint.",
				'That leaves the infrastructure itself: the\nwalls, floors, ceiling. Something like\nthat?',
			],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['Exactly.'],
		},
	],
	'ch2-castle-14.mgs:253:3': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'If you would, please use the artifact to\ninterface with the keypad by the door. You\ncan probably run some diagnostics or\nsomething.',
				'Get me out of here.',
			],
		},
	],
	'ch2-castle-14.mgs:258:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Your Majesty, do you happen to know what\nthe default keypad password is?'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I did help set that thing up, but I don't\nremember....",
				'Oh, actually, there was some trick to it,\nyes.',
				"I wanted the architect to incorporate the\npassword into the building itself, such\nthat it wasn't written down in an obvious\nway, but we could still derive the\npassword again if we had to.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['You incorporated the password into the\nbuilding?'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Yes, all over the castle. Only someone who\ncould get into every room -- which is to\nsay, someone with the king's authority --\nshould be able to acquire the whole\npassword. That was my intention.",
				'At the present moment, I suppose that\nmeans you and you alone.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Written where exactly?'],
		},
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"One letter per room, but I don't know how\nthe architect ended up implementing the\nidea, I'm afraid.",
				'Just... one letter per room.',
			],
		},
	],
	'ch2-castle-14.mgs:288:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Oh, there's something written on the\nbottom of the keypad."],
		},
		{
			name: '(keypad)',
			alignment: 'BOTTOM_LEFT',
			messages: ["The default admin password can be found\nthroughout the castle's --"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Dang, the text after that is rubbed off. I\ncan't read it.",
				"The admin password is found throughout the\ncastle's what?",
			],
		},
	],
	'ch2-castle-14.mgs:340:2': [
		{
			entity: 'King Gibson',
			alignment: 'BOTTOM_LEFT',
			messages: ['!!', "Aha! You've done it! At last, I'm free!"],
		},
	],
	'ch2-castle-21.mgs:129:3': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ["Whoa! WHOA! Someone's here!"],
		},
	],
	'ch2-castle-21.mgs:138:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ['You can move between rooms? How are you\ndoing that?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I have this handheld artifact thingy,\nwhich lets me type --'],
		},
	],
	'ch2-castle-21.mgs:143:3': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: [
				'You have a portable terminal with you?',
				"Oh, wow. We'd appreciate any help you can\nlend us. Maybe we can get on top of things\nnow!",
			],
		},
	],
	'ch2-castle-21.mgs:199:4': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ["What's this? One of those kids toys from a\ndentist office?"],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ["It's an old counting device called an\nabacus."],
		},
	],
	'ch2-castle-21.mgs:205:3': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['It looks fun to clack those beads up and\ndown.'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ['It is! It makes a great sound.'],
		},
	],
	'ch2-castle-21.mgs:213:3': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(Pick up the abacus?)'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'ch2_touch_abacus_yes',
				},
				{
					label: 'No',
					script: 'ch2_touch_abacus_no',
				},
			],
		},
	],
	'ch2-castle-21.mgs:243:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"(I'll need to deliver the calculator\nmanual to Frankie before I'm allowed to\ntake this.)",
			],
		},
	],
	'ch2-castle-21.mgs:221:3': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Hey, does this abacus belong to anyone?'],
		},
	],
	'ch2-castle-21.mgs:226:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ["It's mine. Why?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Oh, um, I was hoping I could use it for\nsomething.'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ["I'd let you borrow it, but I'm actually\nusing it right now."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Really?'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: [
				"Yeah. No joke, I'm using it to store the\nvalue of a couple numbers.",
				'But tell you what -- you can move around\nbetween rooms freely, right?',
				'I left the manual for my HP35s -- my\nscientific calculator -- back in the town\nlibrary a few days ago. If you fetched it\nfor me, I can get past this weird spot in\nmy program.',
				"I won't need the abacus after that.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Cool, so all I need to do is grab that\nmanual?'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ["If you would. It's black with a blue\nstripe on the top. Thanks."],
		},
	],
	'ch2-castle-21.mgs:255:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You pick up the abacus!)'],
		},
	],
	'ch2-castle-21.mgs:263:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Maybe later, then.'],
		},
	],
	'ch2-castle-21.mgs:272:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Huh. A raspberry pie.'],
		},
	],
	'ch2-castle-21.mgs:275:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I have no idea how this thing works.'],
		},
	],
	'ch2-castle-21.mgs:278:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'"Brother"? Is this printer someone\'s\nbrother, then? Or does this printer belong\nto someone\'s brother?',
			],
		},
	],
	'ch2-castle-21.mgs:281:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["This doesn't look like a cannon to me.\nWhere's the barrel? The fuse?"],
		},
	],
	'ch2-castle-21.mgs:284:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Just some boxes full of cables.'],
		},
	],
	'ch2-castle-21.mgs:287:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['A toy boat and sphinx. Plastic figurines?'],
		},
	],
	'ch2-castle-21.mgs:293:3': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: [
				"The rubble is too much for us to move on\nour own, so instead we've been doing\ndamage assessment for the castle's digital\nsystems.",
			],
		},
	],
	'ch2-castle-21.mgs:300:3': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ['Good luck building your computer.'],
		},
	],
	'ch2-castle-21.mgs:307:3': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ['Sea Moss is an odd duck.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ["Wait, he's a duck?"],
		},
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: [
				"Erm, no, he's a stone golem, but let's\njust say he's a creative character.",
			],
		},
	],
	'ch2-castle-21.mgs:321:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: [
				'If we can get the intercom system working,\nwe can coordinate with people trapped in\nother rooms.',
				"We've been able to reestablish contact\nwith the room north of us, but that's it.\nThere's a lot of work left for us to do.",
			],
		},
	],
	'ch2-castle-21.mgs:330:3': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Hey, I brought your calculator manual.'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: [
				'Oh, thanks!',
				"Perfect! Now I can figure out why my\nprogram isn't working correctly.",
				"Go ahead and take the abacus. I won't need\nit anymore.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Thank you!'],
		},
	],
	'ch2-castle-21.mgs:346:4': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Where did you say the manual was again?'],
		},
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: [
				"The manual for my HP35s? It's in the\nlibrary, in town. Black with a blue stripe\nat the top.",
				"I'll let you have my abacus if you bring\nit to me.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: ['Okay. Be right back.'],
		},
	],
	'ch2-castle-21.mgs:360:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: [
				"Hey, if you ever need something soldered,\njust let us know. We'd be happy to walk\nyou though it.",
			],
		},
	],
	'ch2-castle-21.mgs:370:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ['Sea Moss sure loves his snacks.', 'Because... you know.'],
		},
	],
	'ch2-castle-21.mgs:383:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"So I'm rebuilding the castle mainframe,\nand I heard you guys might be able to help\nme get some RAM. Lambda couldn't find any\nto spare.",
			],
		},
	],
	'ch2-castle-21.mgs:387:2': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ["Lambda? Who's that?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["He's someone helping me."],
		},
	],
	'ch2-castle-21.mgs:392:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Though... I thought you might know him. He\nseems like a pretty important person\naround here.',
			],
		},
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ['What does he look like?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"I don't know. I've heard his voice before,\nbut mostly we talk over text chat.",
			],
		},
	],
	'ch2-castle-21.mgs:398:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ['Sounds fishy to me.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['....'],
		},
	],
	'ch2-castle-21.mgs:403:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Anyway, if you don't have any RAM I can\nuse, do you have any ideas for a\nsubstitute? It's okay if it's abstract.",
			],
		},
	],
	'ch2-castle-21.mgs:407:2': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ['"Abstract?"'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah, so like what even is RAM?'],
		},
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: [
				"It's a computer's working memory. Any\nprograms that are running, or images or\ntext that is loaded, or anything at\nall....",
				"All that data needs somewhere to sit while\nit's being worked on.",
			],
		},
	],
	'ch2-castle-21.mgs:414:2': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ['Or shown on a screen.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Right, so for an "abstract" computer, what\ncould work instead? A notebook? A jelly\nbean jar?',
			],
		},
	],
	'ch2-castle-21.mgs:419:2': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ['How abstract are we talking?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Well, so far I've made a hard drive from a\ndinner plate and a phonograph needle.",
			],
		},
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ['...Yikes.'],
		},
	],
	'ch2-castle-21.mgs:425:2': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ["Well, the guy who can help most isn't here\nright now."],
		},
	],
	'ch2-castle-21.mgs:429:2': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ["He's a bit distractable."],
		},
	],
	'ch2-castle-21.mgs:433:2': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ['A bit?!'],
		},
	],
	'ch2-castle-21.mgs:437:2': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: [
				"Yeah, maybe that was an understatement.\nBut he was away when the earthquake hit.\nDon't know where he is, but wherever he\nis, he's stuck in that room.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Well, who is he? What does he look like?'],
		},
	],
	'ch2-castle-21.mgs:442:2': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ["His name is Sea Moss, and he's a giant\nstone golem. Can't miss him."],
		},
	],
	'ch2-castle-21.mgs:459:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: [
				"He's almost certainly near the kitchen.\nEast wing. That's the first place I'd\nlook.",
			],
		},
	],
	'ch2-castle-21.mgs:446:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Wait, I think I saw that guy. He was in\nthe castle kitchen.'],
		},
	],
	'ch2-castle-21.mgs:450:3': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ['No surprise there!'],
		},
	],
	'ch2-castle-21.mgs:454:3': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ["Yep, that's him."],
		},
	],
	'ch2-castle-21.mgs:464:2': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ['He\'ll definitely be able to find you an\n"abstract" solution.'],
		},
	],
	'ch2-castle-21.mgs:468:2': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: ['Good luck, kid.'],
		},
	],
	'ch2-castle-21.mgs:494:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['So, I may have forgotten where I can find\nSea Moss.'],
		},
	],
	'ch2-castle-21.mgs:498:2': [
		{
			alignment: 'TOP_RIGHT',
			entity: 'Jean-Paul',
			messages: [
				'Best place to look is in the grand hall,\nor near the kitchen, or somewhere like\nthat. All those rooms are in the east\nwing.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["And he'll be able to find me a substitute\nfor RAM?"],
		},
	],
	'ch2-castle-21.mgs:503:2': [
		{
			alignment: 'TOP_LEFT',
			entity: 'Frankie',
			messages: ['If anyone can, he can. He\'s good at being\n"abstract."'],
		},
	],
	'ch2-castle-21.mgs:510:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Wow, it's so much easier to fix everything\nwith the castle connected. I was tearing\nmy hair out!",
			],
		},
	],
	'ch2-castle-21.mgs:515:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Almost done patching things up. Then it's\noff to see the band!"],
		},
	],
	'ch2-castle-21.mgs:532:3': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(You feel compelled to present the rake to\nthe goose like a treasure to Caesar.)',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Um, here you go.'],
		},
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You give the rake to the goose!)'],
		},
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(The goose seems to fluff its feathers and\nalmost glow with an RGB shimmer. Somehow\nit seems stronger, and it honks with a\nmischievious smile in eyes.)',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['We seem to be an... accomplice? Or perhaps\nthis is a new partnership?'],
		},
	],
	'ch2-castle-21.mgs:520:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I guess the goose likes me.'],
		},
		{
			entity: 'Goose',
			alignment: 'BOTTOM_LEFT',
			messages: ['Honk!'],
		},
	],
	'ch2-castle-21.mgs:525:6': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'(An image of the goose honking atop a\nmountain of rakes floods your mind.)',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Did the goose just...'],
		},
		{
			entity: 'Goose',
			alignment: 'BOTTOM_LEFT',
			messages: ['HONK! (with a desire for rakes?)'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Must have been my imagination.'],
		},
	],
	'ch2-castle-22.mgs:113:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'In a metaphorical sense, the castle a\ncomputer.',
				'Each room has its specialized function,\nand resources and information may flow\nbetween rooms when they are connected.',
				'In isolation each room -- and each of us\n-- are capable of little. But when we can\nconnect people to each other, we can\ncollaborate and build amazing things.',
			],
		},
	],
	'ch2-castle-22.mgs:121:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['I mean, the castle is also a computer in a\nLITERAL sense, too....'],
		},
	],
	'ch2-castle-22.mgs:108:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"The quake caused a lot of infrastructure\ndamage around here. We're trying to\nreroute things and compensate with\nsoftware.",
			],
		},
	],
	'ch2-castle-22.mgs:142:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'When you upgrade computers regularly, you\ntend to accumulate extra stuff. After a\nwhile, it can start to take up a lot of\nspace.',
				'Glad that old power supply will see some\nuse.',
			],
		},
	],
	'ch2-castle-22.mgs:131:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Huh? You need a power supply?', 'Go ahead and take this one.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["You're sure?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Sure. My new rig needed something more\nbeefy than this, so I bought a better one\na while back. This one is extra.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Neat. Thank you!'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['No prob.'],
		},
	],
	'ch2-castle-22.mgs:151:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I wanna get down to the great hall, but\nwe're not quite done yet. Don't wanna be\nsloppy.",
			],
		},
	],
	'ch2-castle-22.mgs:156:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm glad the king and his staff were able\nto clear the debris blocking the doors.\nNot that we can leave yet -- still more to\ndo.",
			],
		},
	],
	'ch2-castle-22.mgs:169:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'This has a power cable coming out of it,\nso it must be the power supply.',
				'But it probably belongs to someone. I\nbetter ask permission before taking it.',
			],
		},
	],
	'ch2-castle-22.mgs:176:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['All right, power supply!'],
		},
	],
	'ch2-castle-22.mgs:182:3': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(Pick up the power supply?)'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'ch2_touch_powersupply_yes',
				},
				{
					label: 'No',
					script: 'ch2_touch_powersupply_no',
				},
			],
		},
	],
	'ch2-castle-22.mgs:191:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You pick up the power supply!)'],
		},
	],
	'ch2-castle-22.mgs:199:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Maybe later, then.'],
		},
	],
	'ch2-castle-23.mgs:113:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"It doesn't look like anything serious was\ndamaged in this equipment. Still, we'd\nbest be vigilant for a while.",
			],
		},
	],
	'ch2-castle-23.mgs:121:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'At this power plant, we capture heat from\ndeep below the earth and use it to turn\nwater into steam, which we send through\nturbines to generate electricity.',
				"But this isn't just the power plant\ncontrol room. It also contains a lot of\nintrastructure for the geothermal heating\nthroughout the castle.",
				"Our entire work revolves around moving\nheat from one place to another. It's often\nmore efficient to move heat than it is to\ncreate it.",
			],
		},
	],
	'ch2-castle-23.mgs:287:3': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: [
				'Remember, I need a can of Cactus Cooler\nbefore I can make your heat sink.',
			],
		},
	],
	'ch2-castle-23.mgs:183:3': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ["There's a lot to fix around here. I'll\nkeep at it."],
		},
	],
	'ch2-castle-23.mgs:190:3': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ['I was told you could help me find a heat\nsink.'],
		},
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ["A heat sink? What's the use case?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ['A computer. Like a normal-looking kind of\nboxy computer.'],
		},
	],
	'ch2-castle-23.mgs:196:3': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: [
				"We don't have any extra, but I could rig\nyou one after we fixed up all the\nearthquake damage. Maybe in a month or so.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: [
				'A month? But I need it right away. Lambda\nand I are trying to put the castle\nmainframe back together, and....',
			],
		},
	],
	'ch2-castle-23.mgs:202:3': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ['Lambda? Lambda who?'],
		},
	],
	'ch2-castle-23.mgs:211:4': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: [
				"Lambda. You... really don't know who he\nis, do you? You actually forgot who he\nwas?",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ['Forget? What are you talking about?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ['Wow. Lambda was right. He said none of you\nwould remember him.'],
		},
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ["No, I think I would've remembered someone\nwith the name Lambda."],
		},
	],
	'ch2-castle-23.mgs:206:4': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ["Lambda. He's -- you don't know who he is?"],
		},
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ['Why would I? Is he famous or something?'],
		},
	],
	'ch2-castle-23.mgs:219:3': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ['Lambda.... It sounds like an alias. Is he\na hacker?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ["Actually, I don't know. It's possible."],
		},
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: [
				'....',
				"How strange. A place like this normally\nhas an IT guy, or someone who's a hacker\nor software tinkerer at least, but I can't\nthink of who ours was.",
				"We must have had someone like that. I'm\nthe one who usually fixes the computers,\nbut why can't I remember who fixes the\nsoftware?",
				'Hmm.',
			],
		},
	],
	'ch2-castle-23.mgs:229:3': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: [
				"Regardless, fixing the Gibson mainframe\nwill simplify a lot of my work, so I'll\nhelp you out.",
				"It would need a heavy-duty heat sink,\nthough, and I don't have all the right\nsupplies here. This isn't exactly my\nnormal workstation.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ['What else would you need? I could fetch\nyou something.'],
		},
	],
	'ch2-castle-23.mgs:236:3': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ["Well, given what I've got here...."],
		},
	],
	'ch2-castle-23.mgs:241:3': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: [
				"All I'd really need is liquid coolant. And\nthe only thing around town that would work\nis Cactus Cooler.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ['Cactus Cooler?'],
		},
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: [
				"It's this rare brand of soda. It's got\n\"cooler\" in the name, so it's guaranteed\nto be a good heat conductor.",
			],
		},
	],
	'ch2-castle-23.mgs:247:3': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: [
				'That settles it! Get me a can of Cactus\nCooler, and I can build you a heat sink.',
			],
		},
	],
	'ch2-castle-23.mgs:266:4': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ['Sure. Get you Cactus Cooler. Rare soda.\nGot it.'],
		},
	],
	'ch2-castle-23.mgs:255:4': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ['Well, I actually have a can of Cactus\nCooler right here.'],
		},
	],
	'ch2-castle-23.mgs:260:4': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ['Oh, really? In which case....'],
		},
	],
	'ch2-castle-23.mgs:280:4': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ['Change your mind? Ready to give me your\ncan of Cactus Cooler?'],
		},
	],
	'ch2-castle-23.mgs:275:4': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: [
				"Looks like you found a can of Cactus\nCooler! Give it here, and I'll build your\nheat sink.",
			],
		},
	],
	'ch2-castle-23.mgs:295:2': [
		{
			name: '',
			alignment: 'TOP_RIGHT',
			messages: ['(Give %Rocco% the Cactus Cooler)?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'interact_ch2_rocco_give',
				},
				{
					label: 'No',
					script: 'interact_ch2_rocco_nogive',
				},
			],
		},
	],
	'ch2-castle-23.mgs:303:2': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ['Awesome!'],
		},
		{
			name: '',
			alignment: 'TOP_RIGHT',
			messages: ['(Gave %Rocco% the can of Cactus\nCooler!)'],
		},
	],
	'ch2-castle-23.mgs:308:2': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ['Okay, give me a few minutes.'],
		},
	],
	'ch2-castle-23.mgs:317:2': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ['There we are.'],
		},
		{
			name: '',
			alignment: 'TOP_RIGHT',
			messages: ['(You received the heat sink!)'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ['Thanks!'],
		},
	],
	'ch2-castle-23.mgs:323:2': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ["You're welcome. Good luck fixing the\nmainframe."],
		},
	],
	'ch2-castle-23.mgs:332:2': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: [
				"Well, uh, I can't make the heat sink\nwithout Cactus Cooler, so do be sure to\ngive it to me soon.",
			],
		},
	],
	'ch2-castle-23.mgs:344:2': [
		{
			entity: '%SELF%',
			alignment: 'TOP_RIGHT',
			messages: ["I'm gonna keep on keepin' on."],
		},
	],
	'ch2-castle-23.mgs:348:2': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: ["Yowch, that's hot!"],
		},
	],
	'ch2-castle-31-simon.mgs:52:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['How about it? Want a low battle?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Definitely. Low battle all the way!',
					script: 'simon_game_start',
				},
				{
					label: "No, let's do a high battle.",
					script: 'simon_game_start_q_swap',
				},
				{
					label: "What's the difference?",
					script: 'simon_game_start_difference',
				},
				{
					label: 'Actually, never mind.',
					script: 'simon_game_start_nevermind',
				},
			],
		},
	],
	'ch2-castle-31-simon.mgs:44:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['How about it? Want a high battle?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Absolutely. A high battle it is!',
					script: 'simon_game_start',
				},
				{
					label: "No, let's do a low battle",
					script: 'simon_game_start_q_swap',
				},
				{
					label: "What's the difference?",
					script: 'simon_game_start_difference',
				},
				{
					label: 'Actually, never mind.',
					script: 'simon_game_start_nevermind',
				},
			],
		},
	],
	'ch2-castle-31-simon.mgs:74:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ["I see, so you'd like a high battle?"],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Absolutely. A high battle it is!',
					script: 'simon_game_start',
				},
				{
					label: "No, let's do a low battle.",
					script: 'simon_game_start_q_swap',
				},
				{
					label: "What's the difference?",
					script: 'simon_game_start_difference',
				},
				{
					label: 'Actually, never mind.',
					script: 'simon_game_start_nevermind',
				},
			],
		},
	],
	'ch2-castle-31-simon.mgs:64:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ["Oho, so you'd like a low battle?"],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Definitely. Low battle all the way!',
					script: 'simon_game_start',
				},
				{
					label: "No, let's do a high battle.",
					script: 'simon_game_start_q_swap',
				},
				{
					label: "What's the difference?",
					script: 'simon_game_start_difference',
				},
				{
					label: 'Actually, never mind.',
					script: 'simon_game_start_nevermind',
				},
			],
		},
	],
	'ch2-castle-31-simon.mgs:88:2': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'A HIGH battle is all about a full, square\nsound. Easier on the eyes but harder on\nthe thumbs, if you get my meaning.',
			],
		},
	],
	'ch2-castle-31-simon.mgs:92:2': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			messages: ["I'm talkin' about these lights up here, of\ncourse!"],
		},
	],
	'ch2-castle-31-simon.mgs:97:2': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"A LOW battle is more about quick fingers.\nIt's better for those who prefer to hold\ntheir destiny in their own two hands.",
			],
		},
	],
	'ch2-castle-31-simon.mgs:101:2': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			messages: ['That means these lights down here,\nnaturally!'],
		},
	],
	'ch2-castle-31-simon.mgs:117:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['Well then, feel free to ask again anytime.'],
		},
	],
	'ch2-castle-31-simon.mgs:112:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Humph. Well, then I'm not trusting you\nwith Rosetta! Come back when you can prove\nyou deserve to have a keytar as gorgeous\nas this!",
			],
		},
	],
	'ch2-castle-31-simon.mgs:205:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ["Keep your eyes down low and copy my moves!\nLET'S GOOOO!"],
		},
	],
	'ch2-castle-31-simon.mgs:198:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				'Here we go! Keep your eyes down low!',
				"It's the bottom of the screen that counts\nnow! Keep your thumbs frisky!",
				"Follow my lead! LET'S GOOOO!",
			],
		},
	],
	'ch2-castle-31-simon.mgs:191:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ["Keep your eyes up top and copy my moves!\nLET'S GOOOO!"],
		},
	],
	'ch2-castle-31-simon.mgs:184:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				'Here we go! Keep your eyes up top!',
				'Pay attention to those four corners around\nthe screen!',
				"Follow my lead! LET'S GOOOO!",
			],
		},
	],
	'ch2-castle-31-simon.mgs:539:2': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 3,
			messages: ['Too bad! Better luck next time!'],
		},
	],
	'ch2-castle-31-simon.mgs:565:2': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 3,
			messages: ['GREAT JOB! Way to go, kid!'],
		},
	],
	'ch2-castle-31-simon.mgs:572:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				'HAHAH! That was a blast!',
				'THIS! This is what I was missing, the most\nimportant part about music!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What part?'],
		},
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"It's the MUSIC!",
				'Not the crowd, not the gigs, not the merch\n-- but the raw vibrations and rhythm!',
				"It's seizing something from the depths of\nyour soul and shoving it into your hands,\nyour breath, your fingertips --",
				"-- and making something LIVING, something\nthat couldn't exist without you there to\nshape it!",
				"It's jamming with another human being, and\nbuilding our sounds up together into\nsomething incredible!",
				'Who cares if no one was watching? What we\ndid was ART!',
			],
		},
	],
	'ch2-castle-31-simon.mgs:584:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 3,
			messages: ['Fantastic!'],
		},
	],
	'ch2-castle-31-simon.mgs:588:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"Don't worry, I'll keep my end of the\nbargain. Rosetta is yours now. You deserve\nit.",
			],
		},
	],
	'ch2-castle-31-simon.mgs:592:3': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You pick up the keyboard!)'],
		},
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['Keep it, and keep making awesome music!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Music, yeah. That is definitely what I was\ngoing to use it for. Yup.'],
		},
	],
	'ch2-castle-31-simon.mgs:621:2': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['Well? Wanna have another go?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Sure.',
					script: 'simon_game_go_again_yes',
				},
				{
					label: 'No, thanks.',
					script: 'simon_game_start_q_wrapup',
				},
			],
		},
	],
	'ch2-castle-31-simon.mgs:643:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['Want another low battle?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Definitely!',
					script: 'simon_game_start',
				},
				{
					label: "No, let's do a high battle.",
					script: 'simon_game_start_q_swap',
				},
				{
					label: "What's the difference?",
					script: 'simon_game_start_difference',
				},
				{
					label: 'Actually, never mind.',
					script: 'simon_game_start_nevermind',
				},
			],
		},
	],
	'ch2-castle-31-simon.mgs:634:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['Want another high battle?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Absolutely!',
					script: 'simon_game_start',
				},
				{
					label: "No, let's do a low battle.",
					script: 'simon_game_start_q_swap',
				},
				{
					label: "What's the difference?",
					script: 'simon_game_start_difference',
				},
				{
					label: 'Actually, never mind.',
					script: 'simon_game_start_nevermind',
				},
			],
		},
	],
	'ch2-castle-31.mgs:181:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'theodore',
			messages: ["Sorry, I ain't impressed. Anyone can play\na keyboard one note at a time."],
		},
	],
	'ch2-castle-31.mgs:176:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'theodore',
			messages: [
				'Bored bored bored BORED BORED!',
				'Come on! How long is it gonna be before we\ncan play?',
			],
		},
	],
	'ch2-castle-31.mgs:193:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'alvin',
			messages: [
				'You think you bestowed upon Simon some\nprofound paradigm shift just now? Hate to\nbreak it to you, but he comes to this\nexact realization, like, twice a month.',
				'"Music is about the music!" and "Make art\nfor yourself, not an audience!" Heard it\nall before.',
				"Next week, Simon'll be all about how music\nis a conversation between musicians and\ntheir audience, or society at large, or\nwhatever.",
				'"The meaning of art is in the eye of the\nbeholder, otherwise it\'s a tree falling in\nthe woods without anyone hearing!"',
				'Still, good job keeping up with him.',
			],
		},
	],
	'ch2-castle-31.mgs:188:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'alvin',
			messages: [
				"We've been stuck in here, like, forever.",
				'I guess our would-be audience is stuck\nwherever they are, too.',
			],
		},
	],
	'ch2-castle-31.mgs:204:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Your band is called "1023 MB"?'],
		},
		{
			entity: 'Alvin',
			alignment: 'BOTTOM_LEFT',
			portrait: 'alvin',
			messages: ["It's 'cause we can't get a real gig."],
		},
	],
	'ch2-castle-31.mgs:210:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'These tables -- and chairs -- look way too\ntall and narrow to be comfortable.',
			],
		},
	],
	'ch2-castle-31.mgs:215:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Just a bunch of fancy drinks.'],
		},
	],
	'ch2-castle-31.mgs:272:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['Hey, keytar wizard! My soul is thirsting\nfor another keytar battle!'],
		},
	],
	'ch2-castle-31.mgs:265:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"Hey hey hey, look who it is! It's the\nkeytar wizard!",
				"Aw, man! I haven't had that much fun in\nages! I'm all pumped up, just thinking\nabout it!",
				"I'm dying for another keytar battle!",
			],
		},
	],
	'ch2-castle-31.mgs:283:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["So, uh, I don't exactly have Rosetta with\nme right now."],
		},
	],
	'ch2-castle-31.mgs:287:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"Not a problem, not a problem! Here, you\ncan borrow Brunhilda, just for now. But\ndon't walk away with it, you hear?",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['How many keytars do you have with you,\nexactly?'],
		},
	],
	'ch2-castle-31.mgs:292:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			messages: ['Only my favorite four or five.'],
		},
	],
	'ch2-castle-31.mgs:220:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"There's no audience! I can't play in these\nconditions! COME ON! What's the holdup?\nWhere is everybody?",
			],
		},
	],
	'ch2-castle-31.mgs:248:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"Change your mind about a keytar battle?\nI'll let you keep the keyboard if you win.\nCome on, I'm bored to tears!",
			],
		},
	],
	'ch2-castle-31.mgs:226:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['So, about your keyboard -- erm, "keytar?"', 'I sort of need one for --'],
		},
	],
	'ch2-castle-31.mgs:232:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 2,
			messages: [
				"WHOA WHOA WHOA hey, hands off! I'm not\njust going to give you my precious\nRosetta!",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['(Rosetta?)'],
		},
	],
	'ch2-castle-31.mgs:238:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"But hey, you know what? I'll give you the\nchance to prove you deserve this beauty.",
			],
		},
	],
	'ch2-castle-31.mgs:242:4': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"I'm bored to death, so how about a keytar\nbattle? If you win, I'll let you keep\nRosetta, and I'll use my backup keytar for\nthe show instead.",
			],
		},
	],
	'ch2-castle-31.mgs:256:3': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"Ah, man! I'm still sweatin' after that\nlast one!",
				"But I'm not out for the count yet! Want\nanother go?",
			],
		},
	],
	'ch2-castle-31.mgs:301:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'theodore',
			messages: ['Wake me when we get an actual audience.'],
		},
	],
	'ch2-castle-31.mgs:304:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"It's finally starting! The audience is\ntrickling in! Soon we'll have a hundred --\nno, a thousand people waiting to hear us!",
			],
		},
	],
	'ch2-castle-31.mgs:307:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'alvin',
			messages: [
				"I hope we'll get a larger audience than\nthis. Let's give it a few more minutes,\nmaybe?",
			],
		},
	],
	'ch2-castle-31.mgs:310:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I\'ve been following this group since they\nwere "64 Bits"! I hope they play "Scary\nPointer Math" tonight! Or maybe "The\nOff-By-One Blues"!',
			],
		},
	],
	'ch2-castle-31.mgs:314:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm not sure if this is the same band that\nwas on the flyer. Oh, well. I'll give them\na shot.",
			],
		},
	],
	'ch2-castle-31.mgs:318:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Mommy, can I have a guitar?'],
		},
		{
			entity: 'Gloria',
			alignment: 'BOTTOM_LEFT',
			messages: ['Maybe for your next birthday, sweetie.'],
		},
	],
	'ch2-castle-31.mgs:325:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Guess the refreshments are self serve this\ntime. That's a bit on the cheap side....",
			],
		},
	],
	'ch2-castle-31.mgs:330:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Awesome! Dinner and a show!'],
		},
	],
	'ch2-castle-31.mgs:342:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"It's a keyboard, but in the shape of a\nguitar.",
				'A... "keytar," perhaps?',
			],
		},
	],
	'ch2-castle-31.mgs:348:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["It's like the spork of band instruments."],
		},
	],
	'ch2-castle-31.mgs:352:2': [
		{
			entity: 'Simon',
			alignment: 'BOTTOM_LEFT',
			emote: 2,
			messages: ["Hey! Hey! Don't you insult Rosetta like\nthat!"],
		},
	],
	'ch2-castle-31.mgs:357:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["(I can't just take this without asking.\nBetter talk to %Simon%.)"],
		},
	],
	'ch2-castle-32.mgs:221:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Onions, nice! Guess there's a delicious\nmeal in someone's future."],
		},
	],
	'ch2-castle-32.mgs:227:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'This glasstop stove looks brand new. Or\nsomeone keeps it very clean, anyway.',
			],
		},
	],
	'ch2-castle-32.mgs:246:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Are you here to rescue us? Please, Samson\nis so upset.'],
		},
	],
	'ch2-castle-32.mgs:239:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh, dear. What terrible timing. It was\n"take your child to work" day yesterday,\nand....',
				"What a quake! Poor Samson was scared out\nof his wits. And now we're trapped in\nhere.",
			],
		},
	],
	'ch2-castle-32.mgs:260:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Someone was kicking the castle yesterday!'],
		},
	],
	'ch2-castle-32.mgs:264:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['It woke up the big stone man!'],
		},
	],
	'ch2-castle-32.mgs:268:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Mommy used her wings and flew around in\nthe big room and then the kicking stopped!',
			],
		},
	],
	'ch2-castle-32.mgs:272:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Chips fell out of the box, and I got to\neat all of them!'],
		},
	],
	'ch2-castle-32.mgs:283:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Mmmm, fresh coffee!'],
		},
	],
	'ch2-castle-32.mgs:352:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, right. No soda in here.'],
		},
	],
	'ch2-castle-32.mgs:356:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hey, you -- you said that Bob Austin likes\nCactus Cooler?'],
		},
	],
	'ch2-castle-32.mgs:360:3': [
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, sure. He's always got loads."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"(Well then, I should go back to the Bob's\nClub in town and ask him for some.)",
			],
		},
	],
	'ch2-castle-32.mgs:321:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I wonder if they make "cool ranch" RAM\nchips.'],
		},
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: ['You betcha.'],
		},
	],
	'ch2-castle-32.mgs:292:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Oh! There's actually chips in here! Are\nthose RAM chips?"],
		},
	],
	'ch2-castle-32.mgs:296:4': [
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, for sure.'],
		},
	],
	'ch2-castle-32.mgs:300:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'But why are they being stocked in a\nvending machine? Do people like to eat\nRAM?',
			],
		},
	],
	'ch2-castle-32.mgs:304:4': [
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: ['Silicon folk love silicon snacks.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I... what? Really? Silicon folk\nmeaning....'],
		},
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: ['Silicon folk like me!'],
		},
	],
	'ch2-castle-32.mgs:310:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I don't see a code for it on the panel\nthough."],
		},
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, I'll help you out. Come here."],
		},
	],
	vending_pocket_change: [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["There's sure a lot of snacks in there. Too\nbad I'm out of pocket change."],
		},
	],
	'ch2-castle-32.mgs:335:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Hmm. I thought there might be Cactus\nCooler in here, but it's just chips and\nstuff. No soda.",
			],
		},
	],
	'ch2-castle-32.mgs:339:3': [
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh, you're looking for Cactus Cooler? My\ncousin Bob Austin loves that stuff.",
			],
		},
	],
	'ch2-castle-32.mgs:343:3': [
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: ['Every time he throws a party, he brings\nloads and loads....'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Stone Cold Bob Austin brings Cactus Cooler\nto his parties?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"(But there's no Bob's Club party this\nyear. Maybe I could go back to town and\nask him if he has any extra from last\nyear?)",
			],
		},
	],
	'ch2-castle-32.mgs:400:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I do declare... chips are the greatest\ninvention on the planet.',
				'Bar none.',
			],
		},
	],
	'ch2-castle-32.mgs:394:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hey, Sea Moss. I heard you knew something\nabout computer memory.'],
		},
	],
	'ch2-castle-32.mgs:387:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Say, are you Sea Moss?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Yup, that's me. How did you know?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Lucky guess. Anyway, I heard you knew\nsomething about computer memory.'],
		},
	],
	'ch2-castle-32.mgs:379:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I've been stuck in here for a while now.",
				"I don't mind much, though, since this is\nwhere the vending machine is.",
			],
		},
	],
	'ch2-castle-32.mgs:372:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['You know, you remind me of Bob Moss.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh sure. Bob Moss is my cousin. I'm Sea\nMoss.", 'Nice to meetcha.'],
		},
	],
	'ch2-castle-32.mgs:427:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, sure. I remember all sorts of stuff\nabout that.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Well, I need some RAM to build a computer,\nbut Lambda can't think of anything around\nhere that would work.",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['RAM, like RAM chips? You could try the\nvending machine over yonder.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['...Because it dispenses chips?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'You gotta keep your mind open for this\nstuff, man. Feel like a computer. Breathe\nlike one. Understand what a computer\nwants.',
				'It wants to contain the whole universe\nwithin itself, to build and share its\nstories with each and every one of us at a\nkeyboard or network port.',
				'For a computer to live, it must remember\nitself and allow itself to exist from\nmoment to moment.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Uh....'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"And if you need RAM chips, the sky's the\nlimit, my dude. Anything is possible.\nChips is chips!",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I really don't think that's true."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["It'll be fine. Come here, I'll show you."],
		},
	],
	'ch2-castle-32.mgs:453:2': [
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I know a secret code for the ultimate\ncache of cache. Just need some cash....',
			],
		},
	],
	'ch2-castle-32.mgs:465:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh my god.'],
		},
	],
	'ch2-castle-32.mgs:469:2': [
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: ['There you are, friend! Some spicy nacho\nDDR5 RAM chips, on the house.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Thanks....'],
		},
		{
			entity: 'Sea Moss',
			alignment: 'BOTTOM_LEFT',
			messages: ['Any time.'],
		},
	],
	'ch2-castle-32.mgs:501:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["That's an obscene amount of chips."],
		},
	],
	'ch2-castle-32.mgs:495:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"That's the biggest bag of chips I've ever\nseen in my life.",
				"...And it's probably only a quarter full.",
			],
		},
	],
	'ch2-castle-32.mgs:505:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(Pick up the RAM chips?)'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'ch2_touch_ramchips_yes',
				},
				{
					label: 'No',
					script: 'ch2_touch_ramchips_no',
				},
			],
		},
	],
	'ch2-castle-32.mgs:512:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You pick up the RAM chips!)'],
		},
	],
	'ch2-castle-32.mgs:521:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Maybe later, then.'],
		},
	],
	'ch2-castle-33.mgs:67:4': [
		{
			entity: 'Gregory',
			alignment: 'TOP_RIGHT',
			messages: ['Oh!'],
		},
	],
	'ch2-castle-33.mgs:71:4': [
		{
			entity: 'Gregory',
			alignment: 'TOP_RIGHT',
			messages: ["Well, that's a new face, isn't it?"],
		},
	],
	'ch2-castle-33.mgs:58:4': [
		{
			entity: 'Gregory',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh!'],
		},
	],
	'ch2-castle-33.mgs:62:4': [
		{
			entity: 'Gregory',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Well, that's a new face, isn't it?"],
		},
	],
	'ch2-castle-33.mgs:87:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Wait, I shouldn't leave before giving back\nthis mouse detector."],
		},
	],
	'ch2-castle-33.mgs:137:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["I'll take the mouse proximity detector\nback then, then."],
		},
	],
	'ch2-castle-33.mgs:142:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Let me know when you want to have another\ngo.'],
		},
	],
	'ch2-castle-33.mgs:148:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Good luck.'],
		},
	],
	'ch2-castle-33.mgs:166:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Did you want to take a break?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes, I want to take a break.',
					script: 'interact_ch2_gregory_breakyes',
				},
				{
					label: 'No, I want to keep trying.',
					script: 'interact_ch2_gregory_breakno',
				},
			],
		},
	],
	'ch2-castle-33.mgs:158:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'That bluetooth proximity detector will\ntell you how close you are to the mouse.\nThe closer you are to it, the more lights\nwill light up.',
				'Or did you want to take a break?',
			],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes, I want to take a break.',
					script: 'interact_ch2_gregory_breakyes',
				},
				{
					label: 'No, I want to keep trying.',
					script: 'interact_ch2_gregory_breakno',
				},
			],
		},
	],
	'ch2-castle-33.mgs:299:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"You still need that bluetooth mouse? I've\nstill got that bluetooth proximity\ndetector right here.",
			],
		},
	],
	'ch2-castle-33.mgs:303:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Want to try to catch the mouse?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'interact_ch2_gregory_gameyes',
				},
				{
					label: 'No',
					script: 'interact_ch2_gregory_gameno',
				},
			],
		},
	],
	'ch2-castle-33.mgs:232:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I like my mouse to be physically connected\nto my computer.',
				'Hmm, is that too on the nose?',
			],
		},
	],
	'ch2-castle-33.mgs:237:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'This is kind of random, but I need a mouse\nfor something, and was wondering --',
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['A mouse? A rodent, or a computer mouse?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['A computer mouse.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["A bit cliche to ask a cat about this,\ndon't you think?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["It wasn't my idea."],
		},
	],
	'ch2-castle-33.mgs:247:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, you can have my old bluetooth mouse\nif you can catch it.'],
		},
	],
	'ch2-castle-33.mgs:245:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Well, you're in luck. I have a spare\nbluetooth mouse I'm not using anymore.\nYou're welcome to it if you can catch it.",
			],
		},
	],
	'ch2-castle-33.mgs:249:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Catch it?'],
		},
	],
	'ch2-castle-33.mgs:253:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"It's loose in this room somewhere, but I'm\nnot as fast as I used to be, and can't\nquite get ahold of it.",
			],
		},
	],
	'ch2-castle-33.mgs:258:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["It's hiding in one of the hydroponics\nbins, I should think."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I'm sorry... your bluetooth mouse is\nhiding in the vegetables?"],
		},
	],
	'ch2-castle-33.mgs:265:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Well, it's not fond of cats."],
		},
	],
	'ch2-castle-33.mgs:263:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Well, it's not fond of cats. And I'm not\nfond of it, to be honest."],
		},
	],
	'ch2-castle-33.mgs:267:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['We ARE talking about a computer mouse,\nright?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['We are indeed.'],
		},
	],
	'ch2-castle-33.mgs:277:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Here, this is a bluetooth proximity\ndetector. It's got eight lights that will\nturn on depending on how close you are to\nthe mouse.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Eight lights?'],
		},
	],
	'ch2-castle-33.mgs:284:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yes, these eight lights in a line, here\nalong the bottom. You see?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Um....'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'The more lights come on, the closer you\nare to finding it. Walk around a bit and\nsee for yourself.',
			],
		},
	],
	'ch2-castle-33.mgs:291:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, let me know when you want to have a\ngo, anyway.'],
		},
	],
	'ch2-castle-33.mgs:217:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm slowing down in my old age, but even\nso, I don't want my habits ingrained to\nthe point that I'm sabotaging myself. I\ntry to keep my mind spry.",
				"So when new tech comes out, I make an\neffort to give it a fair shot, and I learn\nhow to use it properly, even if there's a\ntradeoff.",
				"I can't use my favorite wok on my new\nstovetop, but all my other pans heat more\nquickly and evenly with induction. For me,\nthat's a good trade.",
				'As for my new bluetooth mouse....',
				"Bad trade. For me, it'll be wired mice\nforever!",
				"But hey, at least I know I don't hate\nbluetooth mice because I'm old and\nstubborn.",
			],
		},
	],
	'ch2-castle-33.mgs:175:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Not sure how you got in, but...',
				'Oh! Unless the blockage is gone at last?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['No, the door by the vending machine is\nstill blocked.'],
		},
	],
	'ch2-castle-33.mgs:181:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"But why isn't the door to this room\ncrushed, damaged, or blocked like the\nrest?",
			],
		},
	],
	'ch2-castle-33.mgs:186:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'This wing was recently redone to install a\nbunch of fancy tech.',
				'These hydroponics trays, the induction\nstovetops in the next room... that kind of\nthing.',
			],
		},
	],
	'ch2-castle-33.mgs:192:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"They did some structural reinforcement,\ntoo, but don't remember specifics.",
				'At the time, the only thing I cared about\nwas my new stovetop.',
			],
		},
	],
	'ch2-castle-33.mgs:202:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Gotcha. So, um....'],
		},
	],
	ch2_gregory_cactus_help: [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I was looking for this soda called Cactus\nCooler. Do you know if the castle has any\nstocked?',
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Hmm, doubt it, but I don't know for\ncertain. I haven't been in charge of\nvending machine stocking for -- goodness,\ntwo or three decades.",
				'You might check the vending machine\nitself, though.',
			],
		},
	],
	'ch2-castle-33.mgs:318:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh. Well, let me know when you want to\ngive it a shot.'],
		},
	],
	'ch2-castle-33.mgs:333:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You found the mouse!)'],
		},
	],
	'ch2-castle-33.mgs:339:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, I found it!'],
		},
	],
	'ch2-castle-33.mgs:343:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['!!', "Shoot! It got away from me. Where'd it go?"],
		},
		{
			entity: 'Gregory',
			alignment: 'BOTTOM_LEFT',
			messages: ["Mice are quick; you'd better be quicker.\nTry again."],
		},
	],
	'ch2-castle-33.mgs:350:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Aha! Got it again!'],
		},
	],
	'ch2-castle-33.mgs:354:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['And -- aw, come on! I was so close to\ngrabbing it that time!'],
		},
		{
			entity: 'Gregory',
			alignment: 'BOTTOM_LEFT',
			messages: ["It'll tire eventually. Keep going."],
		},
	],
	'ch2-castle-33.mgs:360:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['There we go! Got it in my hands!'],
		},
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You pick up the mouse!)'],
		},
		{
			entity: 'Gregory',
			alignment: 'BOTTOM_LEFT',
			messages: ["Good job. Hope that mouse'll do the trick\nfor you."],
		},
	],
	'ch2-castle-33.mgs:374:3': [
		{
			entity: 'Gregory',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Don't forget this -- the USB dongle. Now\nyou can use that mouse with computers that\ndon't have bluetooth hardware built in.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"This thingy plugs into a USB port? What if\nthe mainframe doesn't have one of those?",
			],
		},
		{
			entity: 'Gregory',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Then....',
				'....',
				"Well, we'll cross that bridge when we get\nto it. You should be fine, unless the\nenclosure is more than 25 years old or so.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I don't know how old it is."],
		},
		{
			entity: 'Gregory',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, what does it look like?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I guess it's sort of beige...."],
		},
		{
			entity: 'Gregory',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh dear.', 'Well, you might be fine anyway. Good luck\nwith everything.'],
		},
	],
	'ch2-castle-33.mgs:512:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(SQUEAK!)'],
		},
	],
	'ch2-castle-34.mgs:111:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Snake, is that you?'],
		},
		{
			name: 'Solid Snek',
			alignment: 'BOTTOM_LEFT',
			portrait: 'codec-snek',
			border_tileset: 'codec',
			messages: ["There's no snake here. Check a different\nbox. Just not this one."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['But this is the only talking box here.'],
		},
	],
	'ch2-castle-34.mgs:129:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Meats and fruits and vegetables... but no\nCactus Cooler.'],
		},
	],
	'ch2-castle-34.mgs:125:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Meats and fruits and vegetables... oh my.'],
		},
	],
	'ch2-castle-34.mgs:144:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Looks like a lot of dry and canned goods.\nNo soda, though.'],
		},
	],
	'ch2-castle-34.mgs:140:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Looks like a lot of dry and canned goods.'],
		},
	],
	'ch2-castle-34.mgs:153:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah, so I need a plate with high iron\ncontent. For reasons.'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I mean... I guess there's the fancy orange\nones from Hanoi. Oranges, browns, and reds\nare almost always an iron oxide glaze.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Orange plates from Hanoi. Okay. Where are\nthey?'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Well, you're not gonna like this, but...\nyou see that jukebox in the corner?",
			],
		},
	],
	'ch2-castle-34.mgs:160:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah.'],
		},
	],
	'ch2-castle-34.mgs:169:3': [
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, that thing is a PlateMover 9000. The\nplates are in there.'],
		},
	],
	'ch2-castle-34.mgs:164:3': [
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['Well, the plates are in there.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['The PlateMover 9000?'],
		},
	],
	'ch2-castle-34.mgs:175:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['...Why?'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Don\'t ask me. It\'s part of this "automated\ncatering" party gimmick my boss has been\ndeveloping.',
				"Problem is, he's out of town for a few\ndays, and I don't know where he keeps the\ntokens for that thing.",
				"If you're lucky, there's a token inserted\nalready, waiting for you to choose which\nplate you want it to dispense. But without\nmore tokens, it'll only dispense one.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I only need one. But I need it to have\nhigh iron content, and I need it to match\nthis phonograph needle....',
			],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['You need the plate to match the size of a\n12" vinyl record?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I hadn't thought about that, but probably,\nyeah."],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh, no.',
				'Well, the good news: we do have a plate\nlarge enough. The #6. The bad news....',
				"...the #6 is at the bottom of the stack.\nYou'll have to rearrange the plates to\nuncover it.",
				"...Aaaaand the plates are fragile enough\nthat you can't stack heavier ones on top\nof lighter ones.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, no.'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yeah, so... go on up to the PlateMover\n9000 and... uh, good luck.'],
		},
	],
	'ch2-castle-34.mgs:202:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hmm. How do I tell which plates have high\niron content?'],
		},
	],
	'ch2-castle-34.mgs:207:3': [
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['You need to tell what now?'],
		},
	],
	'ch2-castle-34.mgs:198:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Plates, cups, and tablecloths. How many\nplace settings is this?'],
		},
	],
	'ch2-castle-34.mgs:214:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Is this just bottles of wine? It all looks\nvery fancy.'],
		},
	],
	'ch2-castle-34.mgs:229:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Holy crap -- a new person!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Yup, that's me."],
		},
	],
	ch2_clara_soda: [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"So... I'm looking for some Cactus Cooler.\nIt's this rare kind of soda....",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Rare is right. Never heard of it, so I\ndoubt we have any stocked. Sorry about\nthat.',
			],
		},
	],
	'ch2-castle-34.mgs:243:5': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm new around here. I gotta say, this has\nbeen an interesting first week of work.",
			],
		},
	],
	'ch2-castle-34.mgs:254:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Jeez, technology sometimes, you know?',
				'We could have kept those plates on some\nnormal shelf, but my boss wanted\n"technological novelty" for his project.',
				'Technology should empower us, not make\nnormal things harder to do!',
				"...Sorry for rambling. It's a pet peeve\nfor me, is all.",
			],
		},
	],
	'ch2-castle-34.mgs:325:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Well, let's try to get that #6 plate out\nof there."],
		},
	],
	'ch2-castle-34.mgs:271:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['This thing is a PlateMover 90?'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh, it's actually a PlateMover 9000. It's\nso old, the last few numbers have worn\noff.",
				'But it was supposed to be this high tech\nplate storage and organization machine.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['It looks like a jukebox.'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['It acts like a jukebox.'],
		},
	],
	'ch2-castle-34.mgs:281:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'There are plates in here, but... how do I\nknow which ones have high iron content?',
			],
		},
	],
	'ch2-castle-34.mgs:287:3': [
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['High iron content?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah, so I need a plate with high iron\ncontent. For reasons.'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Well, those are the fancy orange plates\nfrom Hanoi. Oranges, browns, and reds are\nalmost always an iron oxide glaze.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Cool. So, how do I get the plates out?'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Well, you insert a token, and the\nPlateMover 9000 will let you move the\ngrabber arm to select a plate for it to\ndispense.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["That's very convoluted."],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Sorry.',
				"So... I don't know where the tokens are\nkept, and my boss is out of town. So\nunless there's a token in there\nalready....",
			],
		},
	],
	'ch2-castle-34.mgs:298:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Looks like there is.'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh, good. So it can dispense one plate,\nbut only one. You needed a plate with high\niron content?',
			],
		},
	],
	'ch2-castle-34.mgs:303:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Yeah. I need to combine it with a\nphonograph needle to approximate a hard\ndrive.',
			],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['You need a plate that\'ll match the size of\na 12" vinyl record?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I hadn't thought about that, but probably,\nyeah."],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh, no.',
				'Well, the good news: we do have a plate\nlarge enough. The #6. The bad news....',
				"...the #6 is at the bottom of the stack.\nYou'll have to rearrange the plates to\nuncover it.",
				"...Aaaaand the plates are fragile enough\nthat you can't stack heavier ones on top\nof lighter ones.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, no.'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['Yeah, so... uh, good luck with that.'],
		},
	],
	'ch2-castle-34.mgs:320:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['A jukebox seems like a really bad way to\nmanage dishes.'],
		},
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['You can say that again.'],
		},
	],
	'ch2-castle-34.mgs:333:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Aha! I got plate #6!'],
		},
	],
	'ch2-castle-34.mgs:345:3': [
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['Sweet.'],
		},
	],
	'ch2-castle-34.mgs:337:3': [
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['Sweet. And it looks like you did it super\nefficiently, too. Nice!'],
		},
	],
	'ch2-castle-34.mgs:341:3': [
		{
			entity: 'Clara',
			alignment: 'BOTTOM_LEFT',
			messages: ['Nice.'],
		},
	],
	'ch2-castle-99.mgs:203:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ["So... welcome, %PLAYER%. I'm Lambda."],
		},
	],
	'ch2-castle-99.mgs:209:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 4,
			messages: ['Oh, I guess you already knew that.', 'Sorry, I....'],
		},
	],
	'ch2-castle-99.mgs:215:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ["Anyway, what you probably didn't know is\nthat I'm...."],
		},
	],
	'ch2-castle-99.mgs:219:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 2,
			messages: ["...I'm one of the village elders."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['!!', 'What? How? Since when?'],
		},
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 2,
			messages: ['Since always.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["But I know Jackob, Alfonso, and Bert. I\ndon't know you."],
		},
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 2,
			messages: ['That was by design.'],
		},
	],
	'ch2-castle-99.mgs:228:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 2,
			messages: [
				'I made everyone else forget me so I could\nstay here, behind the scenes, and protect\nthis artifact from the Big Bad.',
				'But....',
			],
		},
	],
	'ch2-castle-99.mgs:236:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Being disconnected from everything, like\nthis... it's hard. I'm surprised how\nlittle time it took for things to become\nhard.",
			],
		},
	],
	'ch2-castle-99.mgs:240:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ['I did what I thought had to be done,\nbut....'],
		},
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: [
				'Watching you meeting everyone, doing\nthings with everyone....',
				'BUILDING things with everyone....',
			],
		},
	],
	'ch2-castle-99.mgs:246:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: [
				"I wiped their memories of me, but I didn't\nthink I would lose my own memories of\nthem, too!",
			],
		},
	],
	'ch2-castle-99.mgs:251:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 4,
			messages: [
				'How could I forget what how fun it was to\ntry to build wacky projects with my\nfriends? Teaching, learning, getting to\nknow someone better....',
				"Even the individual people! I'd forgotten\nhow funny -- and insightful -- Sea Moss\nis.",
				'I forgot how resourceful and inventive\nRocco is, and how cool it is that he can\nmake something awesome and functional out\nof scrap.',
				'Gregory, Mr. Watt, Jean-Paul, even the\nking... all these people I used to spend\ntime with....',
			],
		},
	],
	'ch2-castle-99.mgs:259:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: [
				"These problems everyone has been having\nlately -- if I hadn't cut everyone off\nfrom the castle mainframe, and if I hadn't\ncut myself off from them....",
				"Most of those problems wouldn't have\nhappened. Hell, maybe none of them would\nhave happened.",
			],
		},
	],
	'ch2-castle-99.mgs:264:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: [
				"I've been suffering. But I've been\nselfish, too, thinking that by closing\ndoors and letting my friends live their\nlives without me, I was protecting them.",
				'I was holding onto my pain like it was\nconcrete proof I was doing the right\nthing.',
			],
		},
	],
	'ch2-castle-99.mgs:268:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ["But I was wrong, wasn't I?"],
		},
	],
	'ch2-castle-99.mgs:273:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 2,
			messages: [
				"It's better to be connected to people.\nHowever dangerous things might become,\nit's better to face those dangers\ntogether.",
				"Don't you think?",
			],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yeah, better to face danger together.',
					script: 'ch2_cutscene_castle99_dangeryes',
				},
				{
					label: "I don't know....",
					script: 'ch2_cutscene_castle99_dangeridk',
				},
			],
		},
	],
	'ch2-castle-99.mgs:282:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah, better to face danger together.'],
		},
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 3,
			messages: ['Yeah!'],
		},
	],
	'ch2-castle-99.mgs:287:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: ['So, um, to that end -- here, take this.'],
		},
	],
	'ch2-castle-99.mgs:293:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["I don't know."],
		},
	],
	'ch2-castle-99.mgs:297:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ["Yeah, I guess things are pretty\ncomplicated, aren't they?"],
		},
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ['So, um, anyway -- here, take this.'],
		},
	],
	'ch2-castle-99.mgs:326:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You received the mainframe OS!)'],
		},
	],
	'ch2-castle-99.mgs:337:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Put that in the mainframe's optical drive,\nand we can get the new OS installed.",
				'Head on back to the castle entrance. The\nWizard can help you set it all up.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["You're not going to come with me?"],
		},
	],
	'ch2-castle-99.mgs:346:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: ["No, I'm staying here."],
		},
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 4,
			messages: [
				"I'm not quite ready to face everyone else\nyet. There's no way to recover their\nmemories, so we'll have to start our\nfriendships over, and....",
			],
		},
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: ["I'll just need a little time first. Sorry."],
		},
	],
	'ch2-castle-99.mgs:360:2': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ["Go ahead, and I'll help out like before."],
		},
	],
	'ch2-castle-99.mgs:385:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'(Wow, it looks just like the spider robot\nin the first room of the castle.)',
			],
		},
	],
	'ch2-castle-99.mgs:390:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["(It's full of cables. But how many years\nof tangle is this?)"],
		},
	],
	'ch2-castle-99.mgs:395:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['(That looks a lot like the mainframe in\nthe castle entrance.)'],
		},
	],
	'ch2-castle-99.mgs:400:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["(It's a meal, ready to eat.)"],
		},
	],
	'ch2-castle-99.mgs:405:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["(It's just a box....)"],
		},
	],
	'ch2-castle-99.mgs:410:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['(Policenauts? Must be an anime.)'],
		},
	],
	'ch2-castle-99.mgs:415:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"(Why do these books all have weird\nblack-and-white pictures of animals on\ntheir covers when they're about\nprogrammming?)",
				'(Oh, this one has a cool dragon on the\ncover, but... no, I guess this one is\nabout programming, too.)',
			],
		},
	],
	'ch2-castle-99.mgs:437:3': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ['Hey, good to see you %PLAYER%.'],
		},
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: ["Don't worry about me -- I'll leave my cave\nnow and then."],
		},
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"But there's still a lot of research I need\nto do here at this station, so I'm not\nentirely free of this place yet.",
			],
		},
	],
	'ch2-castle-99.mgs:433:3': [
		{
			entity: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ["Go ahead, and I'll watch over things from\nhere."],
		},
	],
	'ch2-castle-99.mgs:447:2': [
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: [
				'(Lambda seems to have been using this rake\nto help keep his laundry together.)',
				"(I hope he doesn't mind me borrowing it.)",
			],
		},
	],
	'ch2-castle-99.mgs:453:2': [
		{
			name: '',
			alignment: 'TOP_LEFT',
			messages: ['(You picked up the mini rake!)'],
		},
	],
	'ch2-castle-outside.mgs:98:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ["King Gibson's castle"],
		},
	],
	'ch2-castle-outside.mgs:116:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Go on in! You'll do fine!"],
		},
	],
	'ch2-castle-outside.mgs:111:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Keep going! We need that artifact working!'],
		},
	],
	'ch2-castle-outside.mgs:106:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Word on the street is that you're almost\ndone repairing the artifact.",
				'Very well done so far, but keep going!',
			],
		},
	],
	'ch2-castle-outside.mgs:123:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Only hackers may cross door into castle.'],
		},
	],
	'ch2-castle-outside.mgs:140:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['XA will be able to help you on the inside.\nGood luck.'],
		},
	],
	'ch2-castle-outside.mgs:131:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["There's a buzz around town that you're\nnearly finished. Very impressive."],
		},
	],
	'ch2-castle-outside.mgs:136:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Don't stop now. Get that software\ninstalled quick!"],
		},
	],
	'ch2-castle-outside.mgs:147:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'What a strange symbol. Like a trident, but\nwith different shapes on the tips of the\ntines: a square, triangle, and circle.',
				'But what does it mean?',
			],
		},
	],
	'ch2-castle-outside.mgs:154:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What do these things do?'],
		},
	],
	'ch2-ending.mgs:132:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ['%PLAYER%, wait!'],
		},
	],
	'ch2-ending.mgs:139:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I heard over the intercom that you were\ngoing to give a status report to the\nvillage elders. I... I want to come with\nyou.',
			],
		},
	],
	'ch2-ending.mgs:143:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: [
				"I'm a village elder, too, dammit. I should\nact like one, even if it's hard.",
			],
		},
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 0,
			messages: [
				'I-I want to apologize to the other village\nelders for all the problems I caused in\nthe castle. Apologize for my cowardice,\nand --',
			],
		},
	],
	'ch2-ending.mgs:148:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ['?!'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_RIGHT',
			messages: ['%PLAYER%! %PLAYER%!'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_RIGHT',
			messages: ["%PLAYER%! We've discovered something!"],
		},
	],
	'ch2-ending.mgs:158:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: ['Wait a minute! I --'],
		},
	],
	'ch2-ending.mgs:162:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["What's wrong? You wanted to talk to them."],
		},
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: ['Yes, but not quite so fast! I-I need to\nwork myself up to it! I gotta --'],
		},
	],
	'ch2-ending.mgs:169:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: ['HIDE!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hey!'],
		},
	],
	'ch2-ending.mgs:180:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["There you are, %PLAYER%. We've learned\nsomething terribly important."],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"%PLAYER%, I know my eyes aren't what\nthey used to be, but was there someone\nelse here with you just now?",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Well, you see --'],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["Never mind, never mind! It's the Big Bad!"],
		},
	],
	'ch2-ending.mgs:191:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['The Big Bad, he --'],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"He can make you forget things. Implant\nmemories, too, perhaps. I can't really\nremember.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What?'],
		},
	],
	'ch2-ending.mgs:200:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I can almost remember how this all works.\nAlmost. It's getting easier the more time\npasses, but....",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'He can make people forget things? But...\nLambda can do that, too!',
				'Who actually is the Big Bad? Could it\nbe... Lambda?',
			],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ["Lambda? Who's that?"],
		},
	],
	'ch2-ending.mgs:208:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Well?'],
		},
	],
	'ch2-ending.mgs:216:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: ["I-I'll come out. I'm sorry."],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ['!!'],
		},
	],
	'ch2-ending.mgs:232:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Your robes! Those colors!'],
		},
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 4,
			messages: [
				"Y-yes. I'm sorry.",
				"I'm one of the village elders, but I made\neveryone forget that. Made them forget\nabout me altogether. But w-we were close\nfriends once.",
			],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["You're Lambda?"],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ["Were there four of us? Maybe. Can't\nremember. Can't be sure."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Why do you and the Big Bad both have the\npower to make people forget things,\nLambda?',
			],
		},
	],
	'ch2-ending.mgs:243:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: ['The Big Bad? Oh, dear. Oh, no.'],
		},
	],
	'ch2-ending.mgs:248:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 0,
			messages: ["You're sure, Alfonso? The Big Bad can make\npeople forget things, too?"],
		},
	],
	'ch2-ending.mgs:251:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"It's something I recently remembered. Or\nalmost remembered.",
				'But I needed to tell you, %PLAYER%, in\ncase I forgot again. I think... I must\nhave forgotten it several times.',
			],
		},
	],
	'ch2-ending.mgs:256:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I admit it's the only thing that makes\nsense. It could explain why I don't know\nthe Big Bad's name, though I must have\nknown it once.",
				"Why I can't remember his face, either,\neven though we've had several direct\nconfrontations.",
				"There's so much I can't remember. So much\nthat it's suspicious.",
			],
		},
	],
	'ch2-ending.mgs:262:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 0,
			messages: [
				"It's true I can't remember the Big Bad\nclearly, but I thought that was a side\neffect of what I'd done to myself.",
				"That is, after I'd made everyone else\nforget me, I had trouble remembering\neveryone else in turn. But this....",
			],
		},
	],
	'ch2-ending.mgs:267:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 0,
			messages: [
				"It's also true that I found the memory\nmanipulation program in a space I already\nhad access to. Could... I actually be the\nBig Bad without knowing it?",
			],
		},
	],
	'ch2-ending.mgs:271:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Might I have erased my own memories to\nprotect myself somehow? A Yagami gambit?',
			],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'No, the Big Bad knows who he is, because\nhe is still acting against us. He\ntriggered that earthquake.',
			],
		},
	],
	'ch2-ending.mgs:276:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"And the Big Bad hid the serial book AFTER\nwe went to bed last night, but BEFORE we\nall met this morning. At least that's what\nBert told me before he rushed off.",
			],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Where even is Bert? Where has he gone?'],
		},
	],
	'ch2-ending.mgs:281:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["He must have discovered something the Big\nBad didn't want us to know."],
		},
	],
	'ch2-ending.mgs:285:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: ["Bert's been kidnapped?!"],
		},
	],
	'ch2-ending.mgs:290:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, dear. Oh, dear.'],
		},
	],
	'ch2-ending.mgs:295:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["This is getting dangerous, isn't it?"],
		},
	],
	'ch2-ending.mgs:301:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"If only Bert had mentioned to us what he\nwas researching! We're working in the\ndark! And I can't remember hardly anything\nabout any of this!",
			],
		},
	],
	'ch2-ending.mgs:305:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Ah, Jackob, you're onto something!",
				'If the Big Bad was wiping all our minds,\nhe must have been especially thorough with\nyou!',
			],
		},
	],
	'ch2-ending.mgs:310:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'You must have known something absolutely\nvital. You MUST try to remember whatever\nit is you knew! It could be the key to\neverything!',
			],
		},
	],
	'ch2-ending.mgs:314:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ["But how do I remember what I don't know I\ndon't remember?"],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I don't know. We'll have you meditate. Do\nsome free association. Think of songs or\nsmells from your past or something.",
			],
		},
	],
	'ch2-ending.mgs:322:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["I don't know if I can trust you, Lambda."],
		},
	],
	'ch2-ending.mgs:326:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 4,
			messages: ["I-I know. It's part of having skills like\nmine, I think."],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"No, it's because you literally manipulated\nour minds.",
				"We're supposed to just believe that you're\none of us? Or trust you after you've done\nsomething like that?",
			],
		},
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 4,
			messages: ['....'],
		},
	],
	'ch2-ending.mgs:333:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 5,
			messages: ["If it means anything, I've been trying to\nmake things right."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["It's true. He helped me fix the serial\nartifact."],
		},
	],
	'ch2-ending.mgs:338:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: ["It's fixed? That's good news."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["And he's been helping me clean up the\ncastle."],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Hmph. Even the Big Bad wouldn't bother\nwith that, not even as an attempt at\nsocial engineering. Not unless he's\nlearned to play a long game.",
			],
		},
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'And I can still help you.',
				'If the memory manipulation program was\nwritten by the Big Bad, then I might find\nfiles or other programs that could give us\nmore information about his identity.',
			],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Well, I wish you luck with that. Let us\nknow what you find. But otherwise... stay\nout of our way.',
			],
		},
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 4,
			messages: ['Y-yes. I understand.'],
		},
	],
	'ch2-ending.mgs:349:2': [
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Take this time to rest, %PLAYER%. I'm\nafraid there's one more challenge for you\nto face in the morning. A third artifact\nyou must acquire.",
				"I can't quite remember what it is, but\nwhen it's time, it'll be out east, on the\nother side of town.",
			],
		},
	],
	'ch2-ending.mgs:358:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["Never mind that! You must remember what\nyou've forgotten, Jackob! Hurry!"],
		},
		{
			name: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			portrait: 'village_elder',
			messages: ["Don't rush me! You're making it worse!"],
		},
	],
	'ch2-ending.mgs:368:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 4,
			messages: [
				"They'll never really trust me again. Maybe\nI was better off where I was, in hiding.",
				'....',
			],
		},
	],
	'ch2-ending.mgs:374:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 2,
			messages: [
				"No. That line of thinking is unproductive.\nWe can't go back to how things were, but\nthat doesn't mean we can't move forward.",
				"I want to stop hiding. I want to be\nbetter. I'll prove my trustworthiness by\nhow I act from here, even if it's slow.",
			],
		},
	],
	'ch2-ending.mgs:381:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ['Thank you, %PLAYER%.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What for?'],
		},
	],
	'ch2-ending.mgs:386:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			emote: 1,
			messages: [
				"For fixing the mainframe with me. For\nmaking me feel like I can make a\ndifference again. I have more hope now\nthan I've had for a while.",
			],
		},
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'We can always forge new connections, even\nafter old ones are permanently broken. I\nwill remember that.',
			],
		},
	],
	'ch2-ending.mgs:391:2': [
		{
			entity: 'Bert',
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			messages: ['Good luck with everything, %PLAYER%.'],
		},
	],
	'ch2-greenhouse.mgs:218:3': [
		{
			entity: 'Trekkie',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh, no you don't! Not after all that work,\n%PLAYER%! Put Ether Nettle back!",
			],
		},
	],
	'ch2-greenhouse.mgs:295:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Me heard %PLAYER% got the serial\nartifact.',
				'Me knew you could do it! Good job!',
			],
		},
	],
	'ch2-greenhouse.mgs:276:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh, %PLAYER%! Me heard you were going\nto the serial castle in the mountain!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah, I guess.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Me want to wish you the best of luck!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Thanks, %SELF%.'],
		},
	],
	'ch2-greenhouse.mgs:283:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['How are things going, %PLAYER%?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["They're going okay, %SELF%. What\nabout you?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Me thinking of replacing the Ether Nettles\nwith a faster spec. Gigabit Ether Nettles!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['(Giga what?)'],
		},
	],
	'ch2-greenhouse.mgs:290:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Say, %SELF%, have you seen Bert\naround here recently?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Me have not seen Bert for a long time. Me\nsorry, %PLAYER%.'],
		},
	],
	'ch2-greenhouse.mgs:304:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, good. Looks like the internet is still\nworking.'],
		},
	],
	'ch2-greenhouse.mgs:309:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I swear, this thing gets more tangled\nevery time I see it.'],
		},
	],
	'ch2-greenhouse.mgs:314:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Looks like this one is new out of the box.\nNot a kink or pretzel in the whole thing.',
			],
		},
	],
	'ch2-greenhouse.mgs:319:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I bet this mulch is really heavy.'],
		},
	],
	'ch2-greenhouse.mgs:324:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I wonder if this is rainwater.'],
		},
	],
	'ch2-lodge-rtfm.mgs:108:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Bert said he was going to check something,\nbut whatever he's doing, he's sure taking\nhis time.",
				"I confess I'm getting worried,\n%PLAYER%. Something isn't right about\nall of this.",
			],
		},
	],
	'ch2-lodge-rtfm.mgs:120:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"We're doing just fine here, %PLAYER%,\nbut don't you dawdle too long. Time is\nslipping away from us.",
				"There's so little we can do to help you\nright now, yet all I feel is this\nincreasing urgency, like a vise tightening\naround my chest.",
				'Doom is coming, and only you can head it\noff. Please hurry.',
			],
		},
	],
	'ch2-lodge-rtfm.mgs:133:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'This morning we could not find the book\nyou need, but I want to find it still.',
				'Still I am looking. I will bring it if I\nfind it.',
			],
		},
	],
	'ch2-lodge.mgs:136:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, this must be the calculator manual\nFrankie wanted.'],
		},
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You pick up the calculator manual!)'],
		},
	],
	'ch2-lodge.mgs:132:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Looks like a book about a calculator.'],
		},
	],
	'ch2-lodge.mgs:173:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'So you see... I think... bees are kind of\nscary.',
				"I wasn't stung before, but I don't want\nthem to sting me!",
				'Bees and bugs -- but especially bees --\nreally freak me out.',
			],
		},
	],
	'ch2-lodge.mgs:152:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I love the library! There's so many books\nhere it would take a hundred years to read\nthem all!",
			],
		},
	],
	'ch2-lodge.mgs:156:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'If you had a race car, what color would\nyou want?',
				'I think red cars are faster than blue\ncars, usually.',
			],
		},
	],
	'ch2-lodge.mgs:161:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hey, %SELF%, do you know if Bert\ncame in here recently?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Bert? Who's that?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Well, he's one of the village elders. He's\nthe big one, the one who --"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh yeah, Bert is the one that looks like a\nbear, right?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Bear?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Yeah, bear-Bert!',
				"But you see, I actually don't know if I\nsaw him or not.",
				'I was reading.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Oh, I see, you were busy reading. Yeah, I\nguess that makes sense. Thanks anyway.',
			],
		},
	],
	'ch2-lodge.mgs:182:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['...'],
		},
	],
	'ch2-lodge.mgs:188:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I hate geese. Especially that one.',
				"It keeps staring at me. I can't\nconcentrate on what I'm doing.",
			],
		},
	],
	'ch2-lodge.mgs:212:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh, look at that. "Rendezvous with Rama,"\nbut what a stunning cover! I don\'t\nrecognize this edition. Who publizhed this\none? Gollancz?',
			],
		},
	],
	'ch2-lodge.mgs:200:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oh, goodness! It\'s "The Importance of\nBeing Earnest." I remember this play.\nTwenty years ago, Jackob and I did a\nreading of it with --',
			],
		},
	],
	'ch2-lodge.mgs:204:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Aha, "A Brief History of Time!" You know,\nI\'ve always wanted learn about time and\nspace and the universe and all that. And\nit isn\'t very long.',
			],
		},
	],
	'ch2-lodge.mgs:208:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Oho, "The Complete Plays of Gilbert and\nSullivan." I think I memorized one of\ntheir patter songs once. But was it from\nPinafore or Penzance?',
			],
		},
	],
	'ch2-lodge.mgs:217:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Yes, yes, I'm getting work done! What does\nit look like I'm doing?"],
		},
	],
	'ch2-lodge.mgs:238:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Enjoy your free goose facts!'],
		},
	],
	'ch2-lodge.mgs:232:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['HONK! You are now subscribed to goose\nfacts!'],
		},
	],
	'ch2-lodge.mgs:225:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Honk!'],
		},
	],
	'ch2-magehouse.mgs:148:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Hey, %PLAYER%! I heard the good news!\nGreat job getting the artifact working!',
			],
		},
	],
	'ch2-magehouse.mgs:122:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Good morning, %PLAYER%! Off to the\ncastle this morning?'],
		},
	],
	'ch2-magehouse.mgs:126:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I heard from Alfonso that you'll need to\ngrapple with some insects in the castle. I\nhad no idea.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Insects?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I think he mentioned bees? Bees that were\nsheep? Or was it the other way around?\nSheep that were bees?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['(Bees? Sheep?)'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Qu\'avait-il dit? "Ewe est bee"?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['....', 'Are you kidding me?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Ha! Yes, sorry! I was trying to think of a\n"dad joke" about this all morning, but\nthat was the best I could do.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Thanks, %SELF%. I appreciate the\neffort.'],
		},
	],
	'ch2-magehouse.mgs:137:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Hey, %SELF%, I'm looking for Bert. I\ndon't suppose you've seen him today?",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Sorry, I haven't been paying much\nattention to library patrons. I've been\nglued to these Spanish textbooks.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Spanish?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Well, if I couldn\'t work out a "dad joke"\nfor USB in French, I thought I might try\nSpanish.',
				'I could use "es" for the "S", you see? But\nI\'m stuck on the nuance between "ser" and\n"estar", so....',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Is it a dad joke if you need to know a\nsecond language to get it?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Sure. Anything works as long as it makes\nyou roll your eyes in exasperation.',
			],
		},
	],
	'ch2-magehouse.mgs:172:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Good job, %PLAYER%! Congratulations on\nconquering that castle!'],
		},
	],
	'ch2-magehouse.mgs:156:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"If you need a break from the castle out\nwest, don't forget to come back home for a\nvisit.",
			],
		},
	],
	'ch2-magehouse.mgs:160:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm so proud of you, %PLAYER%, for all\nthe things you've learned. You've grown a\nlot this year, and I want you to know\nthat.",
			],
		},
	],
	'ch2-magehouse.mgs:164:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Why, hello, %PLAYER%. I was just doing\nthis week's shopping. How does French\ntoast sound for breakfast tomorrow?",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'That would be awesome. But, um, I was\nwondering....',
				"Have you seen Bert around today? I can't\nseem to find him.",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Sorry, %PLAYER%. Haven't seen him\ntoday."],
		},
	],
	'ch2-magehouse.mgs:178:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"There's a little frosting left. I wonder\nif Aunt Zappy would let me lick the plate\nclean?",
			],
		},
	],
	'ch2-magehouse.mgs:183:2': [
		{
			entity: 'Mage Journal',
			alignment: 'BOTTOM_LEFT',
			portrait: 'journal',
			messages: [
				'Dear Diary,',
				'I just turned 16, and apparently, Ring\nZero chose me! It was a little scary, but\neveryone is being very supportive.',
				'It looks like computers are super\ncomplicated.',
			],
		},
	],
	'ch2-magehouse.mgs:191:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Yeah, I should probably unpack. It's been\nyears."],
		},
	],
	'ch2-oldcouplehouse.mgs:93:2': [
		{
			entity: 'Beatrice',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, Delmar, you're back!"],
		},
		{
			entity: 'Delmar',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Ah, that's better!",
				'I do forgive you, Triss. And I promise to\ntake a breath once in a while.',
			],
		},
		{
			entity: 'Beatrice',
			alignment: 'BOTTOM_LEFT',
			messages: ['Once in a while is just fine, Del!'],
		},
	],
	'ch2-oldcouplehouse.mgs:101:2': [
		{
			entity: 'Beatrice',
			alignment: 'BOTTOM_LEFT',
			messages: ['Thank you, %PLAYER%!'],
		},
	],
	'ch2-oldcouplehouse.mgs:136:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....'],
		},
	],
	'ch2-oldcouplehouse.mgs:130:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["I've got my eye on you, sonny...."],
		},
	],
	'ch2-oldcouplehouse.mgs:128:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....'],
		},
	],
	'ch2-oldcouplehouse.mgs:133:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Thanks a lot, lad. I'll try to be a little\nmore attentive from here on, eh?",
			],
		},
	],
	'ch2-oldcouplehouse.mgs:143:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Oh, where's Delmar?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"He's mad at me. I can't say I blame him.",
				'I... need to think through some things.',
			],
		},
	],
	'ch2-oldcouplehouse.mgs:151:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm sorry, %PLAYER%, but please leave\nme alone for the next little while.",
			],
		},
	],
	'ch2-oldcouplehouse.mgs:155:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Thank you, %PLAYER%. Delmar and I have\na lot of talking to do.',
				"We'll finally be able to reconnect --\nremember why we got married in the first\nplace.",
				"You've made an old woman very happy!",
			],
		},
	],
	'ch2-oldcouplehouse.mgs:162:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I've decided.",
				'Would you please have the shepherd bring\nmy Delmar to me?',
				'I need to apologize. I need to try. Life\nis too short.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Sure thing, %Beatrice%.'],
		},
	],
	'ch2-oldcouplehouse.mgs:185:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Delmar, I....'],
		},
	],
	'ch2-oldcouplehouse.mgs:190:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I was looking through our old albums. Like\nthe one from that camping trip we had up\nin Yosemite, remember?',
			],
		},
	],
	'ch2-oldcouplehouse.mgs:194:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'd dropped our suitcase down a cliff, but\nyou trekked down through the brambles to\nfetch it for me.",
				'That was the night we saw that shooting\nstar. Remember, that bright green one?',
			],
		},
	],
	'ch2-oldcouplehouse.mgs:201:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'When did we drift apart? Is that just\nsomething that happened slowly, without us\nrealizing it?',
				'I used to love hearing your stories. Yes,\nafter you were turned back into a man you\nran your mouth nonstop....',
			],
		},
	],
	'ch2-oldcouplehouse.mgs:206:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'But I missed you dreadfully when you left.\nI miss you now.',
				"I'm very sorry for treating you the way I\ndid. For having you turned back into a\nsheep, I mean.",
				'I love you. I miss you. Can you ever\nforgive me?',
			],
		},
	],
	'ch2-oldcouplehouse.mgs:219:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, Delmar, thank you!'],
		},
	],
	ch2_beatrice_plea: [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'%PLAYER%, would you be so kind as to\nreturn Delmar to his original state?',
			],
		},
	],
	'ch2-parts-admin.mgs:354:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Got the plate and the needle. All right,\nlet's solder!"],
		},
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You created a hard drive!)'],
		},
	],
	'ch2-parts-admin.mgs:361:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Got the goldfish and the abacus. All\nright, let's solder!"],
		},
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['(You created a cpu!)'],
		},
	],
	'ch2-parts-admin.mgs:369:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"It's a metal pen resting inside a metal\ncoil. But why is the pen plugged in? What\ndoes it do?",
			],
		},
	],
	'ch2-parts-admin.mgs:375:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['So this is a solder station.'],
		},
	],
	'ch2-parts-admin.mgs:442:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Guess I'm all done soldering."],
		},
	],
	'ch2-parts-admin.mgs:408:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['All done soldering for now.'],
		},
	],
	'ch2-parts-admin.mgs:403:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['When I have the plate and the needle, I\ncan solder them together here.'],
		},
	],
	'ch2-parts-admin.mgs:388:6': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I have the plate. Now I just need the\nneedle, and then I can solder them\ntogether here.',
			],
		},
	],
	'ch2-parts-admin.mgs:396:6': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I have the needle. Now I just need the\nplate, and then I can solder them together\nhere.',
			],
		},
	],
	'ch2-parts-admin.mgs:439:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['All done soldering for now.'],
		},
	],
	'ch2-parts-admin.mgs:434:5': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'When I have the goldfish and the abacus, I\ncan solder them together here.',
			],
		},
	],
	'ch2-parts-admin.mgs:419:6': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I have the goldfish. Now I just need the\nabacus, and then I can solder them\ntogether here.',
			],
		},
	],
	'ch2-parts-admin.mgs:427:6': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'I have the abacus. Now I just need the\ngoldfish, and then I can solder them\ntogether here.',
			],
		},
	],
	'ch2-smithfamily.mgs:78:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hey, I heard you did the thing! Way to go!'],
		},
	],
	'ch2-smithfamily.mgs:58:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Hey, neighbor. Good luck in the castle out\nwest.',
				"Knock 'em dead! Or... break their legs!\nOr... whatever it is you need to do. Go\nget 'em!",
			],
		},
	],
	'ch2-smithfamily.mgs:63:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'So I just looked it up, and apparently USB\nstands for universal serial bus.',
				"I guess it's like... you plug something\nin, and it's like there's a bus that\ndrives along the cable, back and forth.\nRight?",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Sure.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['So what is it that makes it universal?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I guess you can plug it in and it sort of\njust works, universally.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Mmm, mmm. So if the plug fits, you're good\nto go. Right? So the data gets on the bus,\nand is driven to the other side?",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I... sure. Yeah, why not?'],
		},
	],
	'ch2-smithfamily.mgs:73:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hey, do you know if Bert went anywhere?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Sorry. Don't know anything about the\nmyserious comings and goings of the\nmysterious village elders.",
			],
		},
	],
	'ch2-smithfamily.mgs:85:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['WHEEEEEE!'],
		},
	],
	'ch2-town.mgs:267:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'"To King Gibson\'s castle." Oh, but it\nlooks like it used to say "To King\nGibson\'s palace." I wonder why they\nchanged it.',
			],
		},
	],
	'ch2-town.mgs:272:2': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['LINQ PARKING'],
		},
	],
	'ch2-town.mgs:281:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oi, I'm bummed out! The circle of infinity\nis broken!",
				"Used to be you could go west and come back\nout east, and vice versa. But now the west\nroad goes to King Gibson's castle.\nBizzare.",
			],
		},
	],
	'ch2-town.mgs:319:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"You've got two artifacts under your belt\nnow. Save some for the rest of us, eh?",
				'In all seriousness, way to go,\n%PLAYER%!',
			],
		},
	],
	'ch2-town.mgs:290:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh! You're heading out west, to the castle\nin the mountain?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Yeah, the serial castle.'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'That old castle always freaked me out a\nlittle bit.',
				"It's so ancient, and full of such strange\nhumming and clicking noises. I never\nreally want to stay over there for long.",
				'....',
				"Oh, I mean... I'm sure it's perfectly\nsafe. Seriously, I hear King Gibson is\nactually really nice, and --",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"It's okay, I'll face a spooky old castle\nto protect the town, even if it is a\nlittle creepy.",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["You'll do great. Good luck."],
		},
	],
	'ch2-town.mgs:301:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["How's it going over there? Learning\nanything about computers?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"I guess so. I'm starting to build one,\nanyway.",
				"I've been getting a lot of help, though.",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"That's okay. I'm glad you found a mentor\nto help you learn and do these things.\nIt's a great jump start to learning a new\nskill.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I suppose so.'],
		},
	],
	'ch2-town.mgs:309:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Hey, %SELF%, I'm looking for Bert.\nHave you seen him?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Here and there, but not for a while. Do\nyou need him for something?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"No. Yeah. I don't know.",
				'He just said he was going to investigate\nsomething, then come right back and tell\nme what he found out.',
				"But I haven't heard anything yet. I'm\ngetting worried.",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Well, he can't have gotten far. He'll turn\nup eventually, I'm sure.",
				"I'll keep an eye out, though.",
			],
		},
	],
	'ch2-town.mgs:355:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Hey, I heard you built a computer or\nsomething. That's so cool! Way to go!",
			],
		},
	],
	'ch2-town.mgs:330:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"So, um, I don't really know what's so\nspecial about cereal.",
				'Like, is the artifact a prize from inside\na cereal box?',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Apparently it\'s "serial," not "cereal."'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['???', "That's what I said, isn't it? Cereal.\nLike, granola?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"No, it's \"serial,\" like... well, I don't\nknow what it's like, but it's not\nbreakfast.",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Huh, well, I don't really get it, but good\nluck in the castle."],
		},
	],
	'ch2-town.mgs:339:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"You know, it's the weirdest thing, but I\ncould've sworn there were only four sheep\nbefore.",
			],
		},
	],
	'ch2-town.mgs:344:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hey, have you seen Bert recently?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['I saw him coming in and out of the library\na few times.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['When was that?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Let's see.... Not for kind of a while, I\nguess.",
				'He sure looked like he was in a hurry\nthough. Especially that last time.',
				'He came racing out of the library like\nsomething was on fire.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'(Oh my goodness. Was that when he came to\nsee me in the castle?)',
				'(But what happened after that?)',
			],
		},
	],
	'ch2-town.mgs:364:2': [
		{
			entity: '%SELF%',
			alignment: 'TOP_LEFT',
			messages: ['....'],
		},
	],
	'ch2-town.mgs:399:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, how wonderful, %PLAYER%! I knew\nyou could do it! Well done!'],
		},
	],
	'ch2-town.mgs:370:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh! You're doing the castle today, aren't\nyou?",
				'I believe in you, %PLAYER%!',
			],
		},
	],
	'ch2-town.mgs:375:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Hello, %PLAYER%. I hope you're making\nfriends and learning all sorts of\nwonderful things.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Thank you. I'm doing my best."],
		},
	],
	'ch2-town.mgs:380:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Excuse me, Miss %Verthandi%, but have you\nseen Bert recently?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["No, I haven't, I'm afraid. Though... oh."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What is it?'],
		},
	],
	'ch2-town.mgs:389:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['How odd. I thought for a moment I sensed\nhim in distress, far, far away.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['You can sense where he is?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Not with any precision, nor any certainty.\nI do apologize, %PLAYER%.',
				"I'll let him know you're looking for him\nif I see him today.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Thank you.'],
		},
	],
	'ch2-town.mgs:409:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'You know, miss Verthandi here is very\nknowledgeable about the nature of reality\nand our relationship to our digital\nenvironment.',
			],
		},
	],
	'ch2-town.mgs:413:2': [
		{
			entity: 'Verthandi',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh, you're too kind! I am only a hobbyist\nwhen it comes to such topics. There is\nalways more to learn.",
			],
		},
	],
	'ch2-town.mgs:417:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'In any case, we are brainstorming things\nwe might do to help you on your quest.',
			],
		},
		{
			entity: 'Verthandi',
			alignment: 'BOTTOM_LEFT',
			messages: ['We will at least wish you luck!'],
		},
	],
	'ch2-town.mgs:430:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ah, %PLAYER%, good work today.'],
		},
	],
	'ch2-town.mgs:435:4': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"But you know, it seems like you still\nhaven't finished chapter 1 in this save\nfile.",
				"I'm not angry. Just disappointed.",
				"Just kidding! If the game didn't want you\nto beat chapter 2 before chapter 1, it\nshould have tried harder to stop you.",
				'In all seriousness, do feel free to give\nchapter 1 a go.',
			],
		},
	],
	'ch2-town.mgs:444:2': [
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: ["Stop getting distracted! You must remember\nwhat you've forgotten!"],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I can\'t remember any more "old songs",\n%Alfonso%. This isn\'t working, and I\nneed a break.',
			],
		},
		{
			entity: 'Alfonso',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'We don\'t have time for breaks! Sing "Danny\nBoy" again, and this time, try to really\n-- really -- remember where you learned\nit.',
			],
		},
		{
			entity: 'Jackob',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'The more I sing "Danny Boy," the more I\nremember the last time I sang it -- which\nis right here, right now.',
			],
		},
	],
	'ch2-town.mgs:457:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'I never congratulated you on acquiring the\nartifact and repairing its fundamental\nfunctions, %PLAYER%. Good job.',
				"The next challenge will test you further,\nbut you should still try to remember\neverything you've learned so far.",
				"Remember... yes, remember everything\nyou've learned. We all must remember....",
			],
		},
	],
	ch2_catpuddle: [
		{
			entity: 'Cleo',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Hey there, %PLAYER%.',
				"Sorry, can't chat now. The cat had a\nreally bad day.",
			],
		},
		{
			entity: 'Cat',
			alignment: 'BOTTOM_LEFT',
			messages: ['Meow.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What happened?'],
		},
		{
			entity: 'Cleo',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'He accidentally rolled over into a puddle\nof water. Threw off his whole groove.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Aw, I'm so sorry. That's rough."],
		},
		{
			entity: 'Cat',
			alignment: 'BOTTOM_LEFT',
			messages: ['Meow!'],
		},
	],
	'ch2-town.mgs:489:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ohhh... the wheel is still spinning, but\nthe hamster is dead.'],
		},
	],
	'ch2-town.mgs:494:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['I demand more asbestos!'],
		},
	],
	'ch2-town.mgs:499:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Fungible.'],
		},
	],
	'command-man.mgs:46:3': [
		{
			name: 'Lambda',
			alignment: 'BOTTOM_LEFT',
			portrait: 'lambda',
			messages: [
				"Sorry, it's a little awkward to text chat\nwith you when you're looking over my\nshoulder.",
			],
		},
	],
	'demo.mgs:8:3': [
		{
			name: '',
			alignment: 'BOTTOM_LEFT',
			messages: ['....', 'Am I asleep?'],
		},
	],
	'demo.mgs:13:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Huh? Is this the village?',
				'No, this is the village of the past. But\nI still have Ring Zero....',
				'This has got to be a dream.',
			],
		},
	],
	'demo.mgs:49:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["So, what's your name then?"],
		},
	],
	'demo.mgs:53:4': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Um.... it's not Bob."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Sorry, can't unlock the door for ya. Bobs\nonly."],
		},
	],
	'demo.mgs:59:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Why, what luck!\nMy name happens to be Bob!'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Nice. Great name.\nI'll unlock the door."],
		},
	],
	'demo.mgs:67:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["There you go. It's open."],
		},
	],
	'demo.mgs:74:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Hey, what gives?\nI still can't get in."],
		},
	],
	'demo.mgs:78:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, it's unlocked."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Then why won't it open?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh. The door's not implemented yet."],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['....', "You could've said that from the start!"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Not my job. My only job is to keep\neveryone out who's not named Bob."],
		},
	],
	'demo.mgs:27:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Name's Bob.", 'Stone Cold Bob Austin.', "Right, what's yours, then?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["You don't know who I am? We've both lived\nhere for years!"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Don't know nobody. All I know is, gotta\nkeep everyone out.",
				'You know, unless their name is Bob.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Bob?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Bob. Camel case.\nNice and plain.\nTraditional.',
				"'Cause this club is Bobs-only. You know,\nthe Bobs-Only Club.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Why is it Bobs only?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Why?\nWhy is it Bobs only?',
				"Why, it wouldn't be the Bobs-Only Club if\nI just let anyone in!",
			],
		},
	],
	'demo.mgs:43:3': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["So, what's your name, then?"],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["The door doesn't work! What does it matter\nwhat my name is?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Not my job. My only job is to keep\neveryone out who's not named Bob."],
		},
	],
	'demo.mgs:92:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['....'],
		},
	],
	'demo.mgs:95:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['...?'],
		},
	],
	'demo.mgs:100:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ah, a citizen!', 'I wondered if you could help me!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['What do you need?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"My name's Swagger! Max Swagger!",
				'I was doing a bit of reconnoissance,\nlooking for a place where I can open my\nnew fashion shop.',
				"The board here says there's space\navailable, but I can't seem to find the\nbuilding it's talking about.",
				'The only thing actually here is the\nBobs-Only Club!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Well, the town isn't fully implemented\nyet, so... you might have to wait a few\nmore weeks for the rest of the buildings\nto return.",
			],
		},
	],
	'demo.mgs:117:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Not fully implemented?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Sorry.',
				'But I can personally guarantee you can\nhave a building all to yourself when the\ntime comes.',
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"Oh! That's good news! All to myself?",
				"I'm picturing two stories... no, three!",
				'Lush woven carpets... vaulted ceilings...\nbeautiful oak doors... hand-carved\ndecorative moulding....',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Um, well.... You'll definitely get a\nbuilding."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Excellent! Then I shall return when the\ntime comes!',
				'Until that glorious day, farewell!',
			],
		},
	],
	'demo.mgs:134:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I'm practicing for my triathlon!",
				"Running is my weakest event, so I'm\nworking hard to improve my time!",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ["Don't you need legs to run?"],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['...?', 'No?'],
		},
	],
	'demo.mgs:146:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["I'm gonna be a Blitzball when I grow up!"],
		},
	],
	'demo.mgs:153:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Honk!'],
		},
	],
	'demo.mgs:161:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'Back when he was a young man, my husband\nDelmar hand-carved all the statues on the\nfountains around town.',
				"Such a shame that this one isn't working.\nI wonder if something is clogging the\npump.",
			],
		},
	],
	'demo.mgs:170:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Between you and me.... I think the goose\nhas something to do with it.'],
		},
	],
	'demo.mgs:179:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Me heard you will soon have a birthday!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"That's right! I'll be turning 16, and I'll\nget to be an official village mage!",
			],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Me hope you have happy birthday!'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Thanks very much, %Trekkie%!'],
		},
	],
	'demo.mgs:189:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ["I'm so glad the goats made up and are\nfriends again!"],
		},
	],
	'demo.mgs:196:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Baaahhh!'],
		},
	],
	'demo.mgs:200:2': [
		{
			entity: 'Cat',
			alignment: 'BOTTOM_LEFT',
			messages: ['Meowrrow.'],
		},
		{
			entity: 'Cleo',
			alignment: 'BOTTOM_LEFT',
			messages: ["Oh, you don't say!"],
		},
		{
			entity: 'Cat',
			alignment: 'BOTTOM_LEFT',
			messages: ['Meow!'],
		},
		{
			entity: 'Cleo',
			alignment: 'BOTTOM_LEFT',
			messages: ["He didn't!"],
		},
	],
	'demo.mgs:210:2': [
		{
			entity: 'Cat',
			alignment: 'BOTTOM_LEFT',
			messages: ['Meowwowow.'],
		},
		{
			entity: 'Cleo',
			alignment: 'BOTTOM_LEFT',
			messages: ["That's what I've been saying this whole\ntime!"],
		},
		{
			entity: 'Cat',
			alignment: 'BOTTOM_LEFT',
			messages: ['Meowwrrrr!'],
		},
		{
			entity: 'Cleo',
			alignment: 'BOTTOM_LEFT',
			messages: ['Oh, I know!'],
		},
	],
	'demo.mgs:220:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Hey there, cat!'],
		},
		{
			entity: 'Cat',
			alignment: 'BOTTOM_LEFT',
			messages: ['....'],
		},
		{
			entity: 'Cleo',
			alignment: 'BOTTOM_LEFT',
			messages: ['Excuse me, but we were in the middle of a\nconversation.'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Oh, sorry. Carry on.'],
		},
	],
	'demo.mgs:230:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				"I came here on a blacksmithing\nscholarship, but there's not much\nblacksmithing to do at the moment.",
				"I think I'll stick around anyway. See what\nhappens.",
			],
		},
	],
	'demo.mgs:286:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'goldfish',
			messages: ['End this dream?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes (save and quit)',
					script: 'demo_end_dream_yes_save',
				},
				{
					label: 'Yes (quit without saving)',
					script: 'demo_end_dream_yes',
				},
				{
					label: 'No (continue dream)',
					script: 'demo_end_dream_no',
				},
			],
		},
	],
	dialog_max3_demo_map: [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"Not much of a market for fashion here, I\nwould've thought.",
				'Best of luck, Max Swagger!',
			],
		},
	],
	'main_menu.mgs:165:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['CHOOSE YOUR FATE'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Play Game',
					script: 'menu_play_game',
				},
				{
					label: 'Play Demo',
					script: 'load_map_demo_map',
				},
				{
					label: 'Bling Mode',
					script: 'menu_bling_mode',
				},
				{
					label: 'Credits',
					script: 'menu_credits_choice',
				},
			],
		},
	],
	'main_menu.mgs:179:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['CREDITS'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Chapter 1 credits',
					script: 'menu_credits',
				},
				{
					label: 'Chapter 2 credits',
					script: 'menu_credits2',
				},
				{
					label: 'Back',
					script: 'main_menu',
				},
			],
		},
	],
	'main_menu.mgs:201:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['SAVE YOUR SCREEN'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'DC801 showcase',
					script: 'menu_bling_dc801_showcase',
				},
				{
					label: 'Flying "Toasters"',
					script: 'start_bling_flying_toasters',
				},
				{
					label: 'QR Codes',
					script: 'start_bling_qr',
				},
				{
					label: 'Back',
					script: 'main_menu',
				},
			],
		},
	],
	'main_menu.mgs:213:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['DC801 SHOWCASE'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Auto mode',
					script: 'start_bling_rotate_auto',
				},
				{
					label: 'Manual mode',
					script: 'start_bling_rotate_manual',
				},
				{
					label: 'Back',
					script: 'menu_bling_mode',
				},
			],
		},
	],
	'main_menu.mgs:227:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['PLAY GAME'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Load Game',
					script: 'menu_load_game',
				},
				{
					label: 'New Game',
					script: 'menu_new_game',
				},
				{
					label: 'Erase Save',
					script: 'menu_erase_save',
				},
				{
					label: 'Back',
					script: 'main_menu',
				},
			],
		},
	],
	'main_menu.mgs:241:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['BOOM TIME!'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Erase slot 0',
					script: 'menu_erase_save_0',
				},
				{
					label: 'Erase slot 1',
					script: 'menu_erase_save_1',
				},
				{
					label: 'Erase slot 2',
					script: 'menu_erase_save_2',
				},
				{
					label: 'Back',
					script: 'menu_play_game',
				},
			],
		},
	],
	'main_menu.mgs:268:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['LOAD GAME'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Slot 0',
					script: 'menu_load_game_0',
				},
				{
					label: 'Slot 1',
					script: 'menu_load_game_1',
				},
				{
					label: 'Slot 2',
					script: 'menu_load_game_2',
				},
				{
					label: 'Back',
					script: 'menu_play_game',
				},
			],
		},
	],
	'main_menu.mgs:297:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['NEW GAME'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Slot 0',
					script: 'menu_new_game_0',
				},
				{
					label: 'Slot 1',
					script: 'menu_new_game_1',
				},
				{
					label: 'Slot 2',
					script: 'menu_new_game_2',
				},
				{
					label: 'Back',
					script: 'menu_play_game',
				},
			],
		},
	],
	'main_menu.mgs:333:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['NEW GAME: Pick your name.'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Red',
					script: 'menu_player_name_preset1',
				},
				{
					label: 'Bubbles',
					script: 'menu_player_name_preset2',
				},
				{
					label: 'Black Mage',
					script: 'menu_player_name_preset3',
				},
				{
					label: 'Gimme something random',
					script: 'menu_player_name_random',
				},
			],
		},
	],
	'main_menu.mgs:357:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['Your name is %PLAYER%?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'start_new_game_with_name',
				},
				{
					label: 'No',
					script: 'menu_player_name_reset',
				},
			],
		},
	],
	'main_menu.mgs:412:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['Your name is %PLAYER%?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Reroll random name',
					script: 'menu_player_name_random',
				},
				{
					label: 'Yes',
					script: 'start_new_game_with_name',
				},
				{
					label: 'No',
					script: 'menu_player_name_reset',
				},
			],
		},
	],
	'main_menu.mgs:438:2': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['PLAY (slot $slot_number$: "%PLAYER%")'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Chapter 1 ($ch1_storyflags_tally$/11)',
					script: 'menu_chapter_select_1',
				},
				{
					label: 'Chapter 2 ($ch2_storyflags_tally$/10)',
					script: 'menu_chapter_select_2_check',
				},
				{
					label: 'Back',
					script: 'menu_play_game',
				},
			],
		},
	],
	'main_menu.mgs:459:3': [
		{
			name: ' ',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'menu',
			messages: ['Chapter 1 is unfinished!'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Play chapter 2 anyway',
					script: 'menu_chapter_select_2',
				},
				{
					label: 'Never mind',
					script: 'menu_chapter_select_q',
				},
			],
		},
	],
	'main_menu.mgs:485:2': [
		{
			name: 'Save Game',
			alignment: 'BOTTOM_LEFT',
			border_tileset: 'codec',
			portrait: 'floppy',
			messages: ['Would you like to save your progress?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'Yes',
					script: 'menu_save_game_yes',
				},
				{
					label: 'No',
					script: 'menu_save_game_no',
				},
				{
					label: 'Return to Main Menu',
					script: 'menu_save_game_main_menu',
				},
			],
		},
	],
	'test_map.mgs:8:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Ah, hello little %PLAYER%.\nHave you come to me seeking wisdom?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_RIGHT',
			messages: [':: goat noises ::'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'If you are the smartest person in the\nroom,\nthen you are in the wrong room',
				'You cannot cross the sea merely by\nstanding\nand staring at the water.',
				"Your assumptions are your windows on the\nworld. Scrub them off every once in a\nwhile, or the light won't come in.",
				"Before you criticize someone,\nyou should walk a mile in their shoes.\nThat way, when you criticize them, you're\na mile away and you have their shoes.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [':: goat noises intensify ::'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			messages: [
				'...',
				'Ah, I see that you are seeking only\nmy strongest wisdom.',
				'When you see a variable prefixed with an\nampersand, think:\n"that is the `And`ress (address)"\nof the data in question.',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'TOP_LEFT',
			messages: [':: happy goat noises ::'],
		},
	],
	'test_map.mgs:35:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				"I was told that Fhqwhgads would be here.\nHave you seen him?\nI don't know who it is,\nbut it probably is Fhqwhgads.",
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_LEFT',
			messages: ["Sounds kinda sketchy.\nAnd I'm into it.\nI'll keep an eye out."],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Yeah, you BETTER keep an eye out.',
				"You don't wanna know what could happen...\nto someone who doesn't keep an eye out.",
			],
		},
	],
	'test_map.mgs:46:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Hey, robot, could you make me a smoothie?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['PFFFFT NO, make your own smoothie!\nWho do I look like to you?'],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_LEFT',
			messages: ["I don't know, I thought your name was\nlike... Blender or something?"],
		},
		{
			entity: 'Strong Bad',
			alignment: 'TOP_RIGHT',
			messages: ['BWAHAHAHA!'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'HEY, CAN IT BOXING-MASK FOR FACE!',
				"For your information, PLAYER,\nmy name is BENDER! Don't wear it out!",
			],
		},
	],
	'test_map.mgs:61:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Oh no! All me AOL free trial hours have\nexpired! Me need to get back on INTERNET!',
			],
		},
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_LEFT',
			messages: ['Wait, what?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Me being left behind in Yahoo Chat Rooms!'],
		},
	],
	'test_map.mgs:71:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'You know, %Strong Bad% and %Bender%\nare having a feud. It would be more\nawesome if they teamed up - %Bender%\nis some kinda robot.',
			],
		},
	],
	'test_map.mgs:102:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'%Bob%, AKA "Stone Cold %Bob%\nAustin"\nis cold. Would you please warm him up?',
			],
		},
	],
	'test_map.mgs:108:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'Thank for warming %Bob% up?\nI mean, there were other ways to do it,\nbut that works I guess...',
			],
		},
	],
	'test_map.mgs:117:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I AM %SELF%!\nI HAVE SET %Bob% ON FIRE!!'],
		},
		{
			entity: 'Bob',
			alignment: 'TOP_RIGHT',
			messages: ['Oh yeah! I am so hot right now!'],
		},
	],
	'test_map.mgs:126:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['I AM MERCIFUL %SELF%!\nI HAVE SET %Bob% OFF FIRE!!'],
		},
		{
			entity: 'Bob',
			alignment: 'TOP_RIGHT',
			messages: ['Aww man, I was just getting toasty!'],
		},
	],
	'test_map.mgs:145:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'How long can the text go? ################\nHow long can the text go? ################\nHow long can the text go? ################\nHow long can the text go? ################\nHow long can the text go? ################',
			],
		},
	],
	'woprhouse.mgs:18:3': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: ['Whoa! It looks like I found some kind of\nback door.'],
		},
	],
	'woprhouse.mgs:60:2': [
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'wopr',
			messages: ['SHALL WE PLAY A GAME?'],
		},
		{
			entity: '%SELF%',
			alignment: 'BOTTOM_LEFT',
			portrait: 'wopr',
			messages: ['PLAY?'],
			response_type: 'SELECT_FROM_SHORT_LIST',
			options: [
				{
					label: 'DO NOT PLAY',
					script: 'restart_wopr',
				},
			],
		},
	],
	'woprhouse.mgs:74:2': [
		{
			entity: '%PLAYER%',
			alignment: 'BOTTOM_RIGHT',
			messages: [
				'These shelves are full of Vogon poetry!\nWhat an odd sort of thing for a computer\nto collect.',
			],
		},
	],
};
