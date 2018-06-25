const xkeys = require('./xkeys');
const obs = require('./obs');
const global = require('./global-vars');

const config = require('config');
var emergencyDoubleCheck = false;
var emergencyTimeout;

// Listen to pressed keys.
xkeys.on('downKey', keyIndex => {
	// Disable everything if emergency mode is on.
	if (global.emergencyMode)
		return;

	// Keys are sent as strings.
	keyIndex = parseInt(keyIndex);

	// Emergency button.
	// Big key at the bottom left is both 7 and 15; only need to use one.
	// Emergency mode is currently permanant, maybe need a way to clear the setting?
	if (keyIndex === 7) {
		// We don't want the button to be active straight away, so it needs to be pressed twice.
		if (!emergencyDoubleCheck) {
			emergencyDoubleCheck = true;

			// Make the lights blink red.
			xkeys.setBacklight(7, true, true, true);
			xkeys.setBacklight(15, true, true, true);

			// Set timeout so we stop waiting after 10 seconds.
			emergencyTimeout = setTimeout(() => {
				emergencyDoubleCheck = false;
				xkeys.setBacklight(7, false, true);
				xkeys.setBacklight(15, false, true);
			}, 10000);
		}

		else {
			console.log('EMERGENCY MODE ACTIVATED, SWITCHING SCENE AND MUTING AUDIO!');
			global.emergencyMode = true;
			clearTimeout(emergencyTimeout);

			// Make the lights solid red.
			xkeys.setBacklight(7, true, true);
			xkeys.setBacklight(15, true, true);

			// Mute the audio source set in the config.
			obs.send('SetMute', {source: config.get('emergencyMode.audioSource'), mute: true});
			// Switch to the scene set in the config.
			obs.send('SetCurrentScene', {'scene-name': config.get('emergencyMode.scene')});
		}
	}
});