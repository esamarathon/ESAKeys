// Libs
const config = require('config');
const OBSWebSocket = require('obs-websocket-js');

// Default connection settings.
var settings = {
	address: config.get('obsConnection.address')
}

// If there is a password in the config, use it.
if (config.has('obsConnection.password') && config.get('obsConnection.password') !== '')
	settings.password = config.get('obsConnection.password');

// Do the startup stuff.
console.log('Started up.');
const obs = new OBSWebSocket();
obs.connect(settings).then(() => {
	console.log('Connected to OBS.');
}).catch((err) => console.log('OBS connection issue.'));

// Error catching.
obs.on('error', err => {
	console.log('OBS connection error:', err);
});

module.exports = obs;