// Set up xKeys.
const XKeys = require('xkeys');
const myXKeysPanel = new XKeys();

// Turn off all lights.
myXKeysPanel.setAllBacklights(false, false);
myXKeysPanel.setAllBacklights(false, true);

// Set intensity to full.
myXKeysPanel.setBacklightIntensity(255);

// Set flashing frequency.
myXKeysPanel.setFrequency(50);

// Error catching.
myXKeysPanel.on('error', err => {
	console.log('X-keys error:', err);
});

// Help function for dev.
myXKeysPanel.on('downKey', keyIndex => {
	//console.log(keyIndex);
});

module.exports = myXKeysPanel;