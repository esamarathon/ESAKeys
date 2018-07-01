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
connect();
function connect() {
	obs.connect(settings).then(() => {
		console.log('OBS connection successful.');
	}).catch((err) => {});
}

// We need to try and reconnect if the connection is closed.
// This also fires if we can't successfully connect in the first place.
obs.on('ConnectionClosed', data => {
	console.log('OBS connection lost, retrying in 5 seconds.');
	setTimeout(connect, 5000);
});

// Error catching.
obs.on('error', err => {
	console.log('OBS connection error:', err);
	// I don't know if we need to reconnect here?
	// I don't think so, an error doesn't always mean a disconnect.
});

module.exports = obs;