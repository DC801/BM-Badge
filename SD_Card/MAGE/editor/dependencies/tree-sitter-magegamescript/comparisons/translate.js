import { writeFileSync } from 'node:fs';
import { printScript } from '../parser-to-json.ts';
import { composites } from './exfiltrated_composites.js';

const exfiltrate = {};

// script list goes here
[
	'show_dialog_timewarp',
	'show_dialog_bob_first_demo_map',
	'show_dialog_sheep_demo_map',
	'show_dialog_dsheep_demo_map',
	'show_dialog_max_demo_map',
	'show_dialog_timmy_demo_map',
	'show_dialog_kid_demo_map',
	'show_dialog_goose_demo_map',
	'show_dialog_beatrice_demo_map',
	'show_dialog_trekkie_demo_map',
	'show_dialog_verthandi_demo_map',
	'show_dialog_goat_demo_map',
	'show_dialog_cleo1_demo_map',
	// 'show_dialog_cleo2_demo_map',
	'show_dialog_cat_demo_map',
	'show_dialog_smith_demo_map',
	'check_if_player_is_goat_high_demo_map',
	'check_if_player_is_goat_low_demo_map',
	'move_goat1_to_low_demo_map',
	'move_goat2_to_low_demo_map',
	'move_goat1_to_high_demo_map',
	'move_goat2_to_high_demo_map',
	'loop_on_path_30s_demo_map',
	'loop_on_path_10s_demo_map',
	'loop_on_path_3s_demo_map',
	'show_dialog_demo_end_dream_q',
	'demo_end_dream_yes',
	'demo_end_dream_yes_save',
	'demo_end_dream_no',
].forEach((scriptName) => {
	const fromOtherThing = composites[scriptName];
	exfiltrate[scriptName] = fromOtherThing;
});

const printedMap = {};
Object.entries(exfiltrate).forEach(([k, v]) => {
	const printed = printScript(k, v);
	printedMap[k] = printed;
});
const copyFromThis = Object.values(printedMap).join('\n\n');

writeFileSync('./comparisons/export.mgs', copyFromThis);
