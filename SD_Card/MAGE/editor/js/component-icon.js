// Icons are from "Open Iconic" (https://useiconic.com/open/)

var iconMap = {
	'NULL_ACTION': 'ban',
	'CHECK_ENTITY_NAME': 'fork',
	'CHECK_ENTITY_X': 'fork',
	'CHECK_ENTITY_Y': 'fork',
	'CHECK_ENTITY_INTERACT_SCRIPT': 'fork',
	'CHECK_ENTITY_TICK_SCRIPT': 'fork',
	'CHECK_ENTITY_TYPE': 'fork',
	'CHECK_ENTITY_PRIMARY_ID': 'fork',
	'CHECK_ENTITY_SECONDARY_ID': 'fork',
	'CHECK_ENTITY_PRIMARY_ID_TYPE': 'fork',
	'CHECK_ENTITY_CURRENT_ANIMATION': 'fork',
	'CHECK_ENTITY_CURRENT_FRAME': 'fork',
	'CHECK_ENTITY_DIRECTION': 'fork',
	'CHECK_ENTITY_GLITCHED': 'fork',
	'CHECK_ENTITY_HACKABLE_STATE_A': 'fork',
	'CHECK_ENTITY_HACKABLE_STATE_B': 'fork',
	'CHECK_ENTITY_HACKABLE_STATE_C': 'fork',
	'CHECK_ENTITY_HACKABLE_STATE_D': 'fork',
	'CHECK_ENTITY_HACKABLE_STATE_A_U2': 'fork',
	'CHECK_ENTITY_HACKABLE_STATE_C_U2': 'fork',
	'CHECK_ENTITY_HACKABLE_STATE_A_U4': 'fork',
	'CHECK_ENTITY_PATH': 'fork',
	'CHECK_SAVE_FLAG': 'fork',
	'CHECK_IF_ENTITY_IS_IN_GEOMETRY': 'fork',
	'CHECK_FOR_BUTTON_PRESS': 'fork',
	'CHECK_FOR_BUTTON_STATE': 'fork',
	'CHECK_WARP_STATE': 'fork',
	'RUN_SCRIPT': 'document',
	'BLOCKING_DELAY': 'media-pause',
	'NON_BLOCKING_DELAY': 'media-pause',
	'SET_ENTITY_NAME': 'pencil',
	'SET_ENTITY_X': 'resize-width',
	'SET_ENTITY_Y': 'resize-height',
	'SET_ENTITY_INTERACT_SCRIPT': 'script',
	'SET_ENTITY_TICK_SCRIPT': 'script',
	'SET_ENTITY_TYPE': 'pencil',
	'SET_ENTITY_PRIMARY_ID': 'pencil',
	'SET_ENTITY_SECONDARY_ID': 'pencil',
	'SET_ENTITY_PRIMARY_ID_TYPE': 'pencil',
	'SET_ENTITY_CURRENT_ANIMATION': 'media-play',
	'SET_ENTITY_CURRENT_FRAME': 'pencil',
	'SET_ENTITY_DIRECTION': 'compass',
	'SET_ENTITY_DIRECTION_RELATIVE': 'compass',
	'SET_ENTITY_DIRECTION_TARGET_ENTITY': 'compass',
	'SET_ENTITY_DIRECTION_TARGET_GEOMETRY': 'compass',
	'SET_ENTITY_GLITCHED': 'layers',
	'SET_ENTITY_HACKABLE_STATE_A': 'pencil',
	'SET_ENTITY_HACKABLE_STATE_B': 'pencil',
	'SET_ENTITY_HACKABLE_STATE_C': 'pencil',
	'SET_ENTITY_HACKABLE_STATE_D': 'pencil',
	'SET_ENTITY_HACKABLE_STATE_A_U2': 'pencil',
	'SET_ENTITY_HACKABLE_STATE_C_U2': 'pencil',
	'SET_ENTITY_HACKABLE_STATE_A_U4': 'pencil',
	'SET_ENTITY_PATH': 'flash',
	'SET_SAVE_FLAG': 'flag',
	'SET_PLAYER_CONTROL': 'dashboard',
	'SET_MAP_TICK_SCRIPT': 'script',
	'SET_HEX_CURSOR_LOCATION': 'grid-three-up',
	'SET_WARP_STATE': 'tag',
	'SET_HEX_EDITOR_STATE': 'grid-three-up',
	'SET_HEX_EDITOR_DIALOG_MODE': 'grid-three-up',
	'SET_HEX_EDITOR_CONTROL': 'grid-three-up',
	'SET_HEX_EDITOR_CONTROL_CLIPBOARD': 'grid-three-up',
	'LOAD_MAP': 'map',
	'SHOW_DIALOG': 'double-quote-serif-left',
	'PLAY_ENTITY_ANIMATION': 'media-play',
	'TELEPORT_ENTITY_TO_GEOMETRY': 'flash',
	'WALK_ENTITY_TO_GEOMETRY': 'flash',
	'WALK_ENTITY_ALONG_GEOMETRY': 'flash',
	'LOOP_ENTITY_ALONG_GEOMETRY': 'flash',
	'SET_CAMERA_TO_FOLLOW_ENTITY': 'video',
	'TELEPORT_CAMERA_TO_GEOMETRY': 'video',
	'PAN_CAMERA_TO_ENTITY': 'video',
	'PAN_CAMERA_TO_GEOMETRY': 'video',
	'PAN_CAMERA_ALONG_GEOMETRY': 'video',
	'LOOP_CAMERA_ALONG_GEOMETRY': 'video',
	'SET_SCREEN_SHAKE': 'pulse',
	'SCREEN_FADE_OUT': 'contrast',
	'SCREEN_FADE_IN': 'contrast',
	'MUTATE_VARIABLE': 'info',
	'MUTATE_VARIABLES': 'info',
	'COPY_VARIABLE': 'info',
	'CHECK_VARIABLE': 'info',
	'CHECK_VARIABLES': 'info',
	'SLOT_SAVE': 'data-transfer-download',
	'SLOT_LOAD': 'data-transfer-upload',
	'SLOT_ERASE': 'delete',
	'SET_CONNECT_SERIAL_DIALOG': 'terminal',
	'SHOW_SERIAL_DIALOG': 'terminal',
	'INVENTORY_GET': '',
	'INVENTORY_DROP': '',
	'CHECK_INVENTORY': 'fork',
	'SET_MAP_LOOK_SCRIPT': 'eye',
	'SET_ENTITY_LOOK_SCRIPT': 'eye',
	'SET_TELEPORT_ENABLED': '',
	'CHECK_MAP': 'fork',
	'SET_BLE_FLAG': 'bluetooth',
	'CHECK_BLE_FLAG': 'fork',
	// manually added:
	'COPY_SCRIPT': 'document',
	'edit': 'pencil',
};

var iconData = {
	ban:'<path d="M4 0c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 1c.66 0 1.26.21 1.75.56l-4.19 4.19c-.35-.49-.56-1.09-.56-1.75 0-1.66 1.34-3 3-3zm2.44 1.25c.35.49.56 1.09.56 1.75 0 1.66-1.34 3-3 3-.66 0-1.26-.21-1.75-.56l4.19-4.19z"/>',
	bluetooth:'<path d="M1.5 0v2.5l-.75-.75-.75.75 1.5 1.5-1.5 1.5.75.75.75-.75v2.5h.5l3.5-2.5-2.25-1.53 2.25-1.47-3.5-2.5h-.5zm1 1.5l1.5 1-1.5 1v-2zm0 3l1.5 1-1.5 1v-2z" transform="translate(1)"/>',
	brush:'<path d="M7.44.03c-.03 0-.04.02-.06.03l-3.75 2.66c-.04.03-.1.11-.13.16l-.13.25c.72.23 1.27.78 1.5 1.5l.25-.13c.05-.03.12-.08.16-.13l2.66-3.75c.03-.05.04-.09 0-.13l-.44-.44c-.02-.02-.04-.03-.06-.03zm-4.78 3.97c-.74 0-1.31.61-1.31 1.34 0 .99-.55 1.85-1.34 2.31.39.22.86.34 1.34.34 1.47 0 2.66-1.18 2.66-2.66 0-.74-.61-1.34-1.34-1.34z"/>',
	clock:'<path d="M4 0c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 1c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm-.5 1v2.22l.16.13.5.5.34.38.72-.72-.38-.34-.34-.34v-1.81h-1z"/>',
	'comment-square':'<path d="M.09 0c-.06 0-.09.04-.09.09v5.81c0 .05.04.09.09.09h5.91l2 2v-7.91c0-.06-.04-.09-.09-.09h-7.81z"/>',
	compass:'<path d="M4 0c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 1c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm2 1l-3 1-1 3 3-1 1-3zm-2 1.5c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5z"/>',
	contrast:'<path d="M4 0c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 1c1.66 0 3 1.34 3 3s-1.34 3-3 3v-6z"/>',
	dashboard:'<path d="M4 0c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 1c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 1c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zm-1.66 1a.5.5 0 0 0-.19.84l.91.91c-.02.08-.06.16-.06.25 0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1c-.09 0-.17.04-.25.06l-.91-.91a.5.5 0 0 0-.44-.16.5.5 0 0 0-.06 0zm3.16 0c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5z"/>',
	'data-transfer-download':'<path d="M3 0v3h-2l3 3 3-3h-2v-3h-2zm-3 7v1h8v-1h-8z"/>',
	delete:'<path d="M2 0l-2 3 2 3h6v-6h-6zm1.5.78l1.5 1.5 1.5-1.5.72.72-1.5 1.5 1.5 1.5-.72.72-1.5-1.5-1.5 1.5-.72-.72 1.5-1.5-1.5-1.5.72-.72z" transform="translate(0 1)"/>',
	document:'<path d="M0 0v8h7v-4h-4v-4h-3zm4 0v3h3l-3-3zm-3 2h1v1h-1v-1zm0 2h1v1h-1v-1zm0 2h4v1h-4v-1z"/>',
	'double-quote-serif-left':'<path d="M3 0c-1.65 0-3 1.35-3 3v3h3v-3h-2c0-1.11.89-2 2-2v-1zm5 0c-1.65 0-3 1.35-3 3v3h3v-3h-2c0-1.11.89-2 2-2v-1z" transform="translate(0 1)"/>',
	eye:'<path d="M4.03 0c-2.53 0-4.03 3-4.03 3s1.5 3 4.03 3c2.47 0 3.97-3 3.97-3s-1.5-3-3.97-3zm-.03 1c1.11 0 2 .9 2 2 0 1.11-.89 2-2 2-1.1 0-2-.89-2-2 0-1.1.9-2 2-2zm0 1c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1c0-.1-.04-.19-.06-.28-.08.16-.24.28-.44.28-.28 0-.5-.22-.5-.5 0-.2.12-.36.28-.44-.09-.03-.18-.06-.28-.06z" transform="translate(0 1)"/>',
	flag:'<path d="M0 0v8h1v-8h-1zm2 0v4h2v1h4l-2-1.97 2-2.03h-3v-1h-3z"/>',
	flash:'<path d="M1.5 0l-1.5 3h2l-.66 2h-1.34l1 3 3-3h-1.5l1.5-3h-2l1-2h-1.5z" transform="translate(2)"/>',
	fork:'<path d="M1.5 0c-.83 0-1.5.67-1.5 1.5 0 .66.41 1.2 1 1.41v2.19c-.59.2-1 .75-1 1.41 0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5c0-.6-.34-1.1-.84-1.34.09-.09.21-.16.34-.16h2c.82 0 1.5-.68 1.5-1.5v-.59c.59-.2 1-.75 1-1.41 0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5c0 .66.41 1.2 1 1.41v.59c0 .28-.22.5-.5.5h-2c-.17 0-.35.04-.5.09v-1.19c.59-.2 1-.75 1-1.41 0-.83-.67-1.5-1.5-1.5z"/>',
	'grid-three-up':'<path d="M0 0v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm-6 3v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zm-6 3v2h2v-2h-2zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2z"/>',
	info:'<path d="M3 0c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-1.5 2.5c-.83 0-1.5.67-1.5 1.5h1c0-.28.22-.5.5-.5s.5.22.5.5-1 1.64-1 2.5c0 .86.67 1.5 1.5 1.5s1.5-.67 1.5-1.5h-1c0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-.36 1-1.84 1-2.5 0-.81-.67-1.5-1.5-1.5z" transform="translate(2)"/>',
	layers:'<path d="M0 0v4h4v-4h-4zm5 2v3h-3v1h4v-4h-1zm2 2v3h-3v1h4v-4h-1z"/>',
	'lock-locked':'<path d="M3 0c-1.1 0-2 .9-2 2v1h-1v4h6v-4h-1v-1c0-1.1-.9-2-2-2zm0 1c.56 0 1 .44 1 1v1h-2v-1c0-.56.44-1 1-1z" transform="translate(1)"/>',
	'lock-unlocked':'<path d="M3 0c-1.1 0-2 .9-2 2h1c0-.56.44-1 1-1s1 .44 1 1v2h-4v4h6v-4h-1v-2c0-1.1-.9-2-2-2z" transform="translate(1)"/>',
	'loop-circular':'<path d="M4 0c-1.65 0-3 1.35-3 3h-1l1.5 2 1.5-2h-1c0-1.11.89-2 2-2v-1zm2.5 1l-1.5 2h1c0 1.11-.89 2-2 2v1c1.65 0 3-1.35 3-3h1l-1.5-2z" transform="translate(0 1)"/>',
	'magnifying-glass':'<path d="M3.5 0c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5c.59 0 1.17-.14 1.66-.41a1 1 0 0 0 .13.13l1 1a1.02 1.02 0 1 0 1.44-1.44l-1-1a1 1 0 0 0-.16-.13c.27-.49.44-1.06.44-1.66 0-1.93-1.57-3.5-3.5-3.5zm0 1c1.39 0 2.5 1.11 2.5 2.5 0 .66-.24 1.27-.66 1.72-.01.01-.02.02-.03.03a1 1 0 0 0-.13.13c-.44.4-1.04.63-1.69.63-1.39 0-2.5-1.11-2.5-2.5s1.11-2.5 2.5-2.5z"/>',
	'map-marker':'<path d="M3 0c-1.66 0-3 1.34-3 3 0 2 3 5 3 5s3-3 3-5c0-1.66-1.34-3-3-3zm0 1c1.11 0 2 .9 2 2 0 1.11-.89 2-2 2-1.1 0-2-.89-2-2 0-1.1.9-2 2-2z" transform="translate(1)"/>',
	map:'<path d="M0 0v8h8v-2.38a.5.5 0 0 0 0-.22v-5.41h-8zm1 1h6v4h-1.5a.5.5 0 0 0-.09 0 .5.5 0 1 0 .09 1h1.5v1h-6v-6zm2.5 1c-.83 0-1.5.67-1.5 1.5 0 1 1.5 2.5 1.5 2.5s1.5-1.5 1.5-2.5c0-.83-.67-1.5-1.5-1.5zm0 1c.28 0 .5.22.5.5s-.22.5-.5.5-.5-.22-.5-.5.22-.5.5-.5z"/>',
	'media-pause':'<path d="M0 0v6h2v-6h-2zm4 0v6h2v-6h-2z" transform="translate(1 1)"/>',
	'media-play':'<path d="M0 0v6l6-3-6-3z" transform="translate(1 1)"/>',
	move:'<path d="M3.5 0l-1.5 1.5h1v1.5h-1.5v-1l-1.5 1.5 1.5 1.5v-1h1.5v1.5h-1l1.5 1.5 1.5-1.5h-1v-1.5h1.5v1l1.5-1.5-1.5-1.5v1h-1.5v-1.5h1l-1.5-1.5z"/>',
	pencil:'<path d="M6 0l-1 1 2 2 1-1-2-2zm-2 2l-4 4v2h2l4-4-2-2z"/>',
	person:'<path d="M4 0c-1.1 0-2 1.12-2 2.5s.9 2.5 2 2.5 2-1.12 2-2.5-.9-2.5-2-2.5zm-2.09 5c-1.06.05-1.91.92-1.91 2v1h8v-1c0-1.08-.84-1.95-1.91-2-.54.61-1.28 1-2.09 1-.81 0-1.55-.39-2.09-1z"/>',
	pulse:'<path d="M3.25 0l-.47 1.53-.78 2.56-.03-.06-.09-.34h-1.88v1h1.1600000000000001l.38 1.16.47 1.47.47-1.5.78-2.5.78 2.5.41 1.34.53-1.28.59-1.47.13.28h2.31v-1h-1.69l-.38-.75-.5-.97-.41 1.03-.47 1.19-.84-2.66-.47-1.53z"/>',
	'resize-height':'<path d="M2.5 0l-2.5 3h2v2h-2l2.5 3 2.5-3h-2v-2h2l-2.5-3z" transform="translate(1)"/>',
	'resize-width':'<path d="M3 0l-3 2.5 3 2.5v-2h2v2l3-2.5-3-2.5v2h-2v-2z" transform="translate(0 1)"/>',
	script:'<path d="M3 0c-.55 0-1 .45-1 1v5.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-1.5h-1v2c0 .55.45 1 1 1h5c.55 0 1-.45 1-1v-3h-4v-2.5c0-.28.22-.5.5-.5s.5.22.5.5v1.5h4v-2c0-.55-.45-1-1-1h-4z"/>',
	tag:'<path d="M0 0v3l5 5 3-3-5-5h-3zm2 1c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>',
	terminal:'<path d="M.09 0c-.06 0-.09.04-.09.09v7.81c0 .05.04.09.09.09h7.81c.05 0 .09-.04.09-.09v-7.81c0-.06-.04-.09-.09-.09h-7.81zm1.41.78l1.72 1.72-1.72 1.72-.72-.72 1-1-1-1 .72-.72zm2.5 2.22h3v1h-3v-1z"/>',
	timer:'<path d="M2 0v1h1v.03c-1.7.24-3 1.71-3 3.47 0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5c0-.45-.1-.87-.25-1.25l-.91.38c.11.29.16.57.16.88 0 1.39-1.11 2.5-2.5 2.5s-2.5-1.11-2.5-2.5 1.11-2.5 2.5-2.5c.3 0 .59.05.88.16l.34-.94c-.23-.08-.47-.12-.72-.16v-.06h1v-1h-3zm5 1.16s-3.65 2.81-3.84 3c-.19.2-.19.49 0 .69.19.2.49.2.69 0 .2-.2 3.16-3.69 3.16-3.69z"/>',
	video:'<path d="M.5 0c-.28 0-.5.23-.5.5v4c0 .28.23.5.5.5h5c.28 0 .5-.22.5-.5v-1.5l1 1h1v-3h-1l-1 1v-1.5c0-.28-.22-.5-.5-.5h-5z" transform="translate(0 1)"/>',
}

Vue.component(
	'component-icon',
	{
		name: 'component-icon',
		props: {
			color: {
				type: String,
				required: false
			},
			size: {
				type: Number,
				required: true
			},
			subject: {
				type: String,
				required: true
			}
		},
		computed: {
			colorHex: function () {
				// TODO: for real
				return '#ffffff'; // white
			},
			whichIcon: function () {
				return iconMap[this.subject] || 'brush';
			},
			iconData: function () {
				return iconData[this.whichIcon];
			}
		},
		template: /*html*/`
<span
	class="p-2"
>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"
		:width="size"
		:height="size"
	>
		<g
			:fill="colorHex"
			v-html="iconData"
		></g>
	</svg>
</span>
`}
);
