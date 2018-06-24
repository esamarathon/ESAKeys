// Set up xKeys.
const XKeys = require('xkeys');
const myXKeysPanel = new XKeys();

// Turn off all lights.
myXKeysPanel.setAllBacklights(false, false);
myXKeysPanel.setAllBacklights(false, true);

// Set intensity to full.
myXKeysPanel.setBacklightIntensity(255);

module.exports = myXKeysPanel;