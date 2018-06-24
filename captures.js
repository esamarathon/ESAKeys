// TODO: Clean this shit up.
// Add a timeout for the game capture selection so they don't blink annoyingly forever

const xkeys = require('./xkeys');
const obs = require('./obs');
const global = require('./global-vars');

const config = require('config');
const clone = require('clone');

// Default cropping values.
var cropZero = {
	'top': 0,
	'left': 0,
	'bottom': 0,
	'right': 0
};

// Initial cropping values for all captures.
var cropCache = {
	'capture1': clone(cropZero),
	'capture2': clone(cropZero),
	'capture3': clone(cropZero),
	'capture4': clone(cropZero)
};

var capture = -1; // 0 -> ?
var cropSide = -1; //0 top, 1 right, 2 bottom, 3 left
var rack = {
	0: 0,
	1: 1,
	2: 2,
	3: 3
}

var gameCaptureKey = {
	0: config.get('obsScenes.capture1'),
	1: config.get('obsScenes.capture2'),
	2: config.get('obsScenes.capture3'),
	3: config.get('obsScenes.capture4')
};

var rackKey = {
	0: config.get('obsSources.rack1'),
	1: config.get('obsSources.rack2'),
	2: config.get('obsSources.rack3'),
	3: config.get('obsSources.rack4')
};

// Fired when the OBS WebSocket actually connects.
// We already check this in obs.js but we need to do more on connection here.
obs.on('ConnectionOpened', () => {
	// Gets current cropping settings on startup from the 4 "Game Capture" scenes.
	for (var i = 1; i < 5; i++) {
		checkCropping(i);
	}

	// Runs a rack visibility check using the function below.
	for (var i = 0; i < 4; i++) {
		for (var j = 0; j < 4; j++) {
			checkRackVisibility(i, j);
		}
	}
});

function checkCropping(i) {
	obs.send('GetSceneItemProperties', {
		'scene-name': config.get('obsScenes.capture'+i),
		'item': config.get('obsSources.rack1'),
	}, (err, data) => {
		if (!err) {
			cropCache['capture'+i] = data.crop;
			console.log(data.crop, i);
		}
	});
}

// A bit of a sloppy/lazy way to get current rack visibility on startup from OBS.
function checkRackVisibility(i, j) {
	obs.send('GetSceneItemProperties', {
		'scene-name': config.get('obsScenes.capture'+(i+1)),
		'item': config.get('obsSources.rack'+(j+1)),
	}, (err, data) => {
		if (!err) {
			if (data.visible) {
				rack[i] = j;
				console.log('capture %s has rack %s visible', i, j);
			}
		}
	});
}

// Listen to pressed keys.
xkeys.on('down', keyIndex => {
	// Keys are sent as strings.
	keyIndex = parseInt(keyIndex);
	//console.log(keyIndex);

	// All 4 of the "Game Capture" selection keys.
	if (keyIndex === 60 || keyIndex === 61 || keyIndex === 62 || keyIndex === 63) {
		var oldCapture = capture;
		capture = keyIndex-60;
		xkeys.setBacklight(keyIndex, true, true); // New key, On, Red
		
		// If an old source was active but it's different from this one, turn the old key off.
		if (oldCapture >= 0 && oldCapture !== capture)
			xkeys.setBacklight(oldCapture+60, false, true); // Old key, Off, Red

		// If this source is the same as the old one, turn it all off.
		else if (oldCapture === capture) {
			capture = -1;
			cropSide = -1;
			xkeys.setBacklight(keyIndex, false, true); // New key, Off, Red
			turnOffRackKeys();
			turnOffCroppingKeys();
		}
		
		// If the above options caused a source to be active, blink the rack/cropping keys.
		if (capture >= 0) {
			cropSide = -1;
			blinkRackKeys();
			blinkCroppingKeys();

			// Set the current rack value light to be constantly on.
			xkeys.setBacklight(68+rack[capture], true); // New key, On(, Blue)
		}
	}

	// If a source is selected, we can use the keys to choose the current rack.
	if (capture >= 0 && (keyIndex === 68 || keyIndex === 69 || keyIndex === 70 || keyIndex === 71)) {
		var oldRack = rack[capture];
		rack[capture] = keyIndex-68;
		xkeys.setBacklight(keyIndex, true); // New key, On(, Blue)
		changeRack();
		
		// If there was an old rack and it's not the same as the current one, make the old one blink.
		if (oldRack >= 0 && oldRack !== rack[capture])
			xkeys.setBacklight(68+oldRack, true, false, true); // Old key, On, Blue, Blinking
	}

	// If a source is selected, we can use the keys to choose the cropping side.
	if (capture >= 0 && (keyIndex === 76 || keyIndex === 77 || keyIndex === 78 || keyIndex === 79)) {
		var oldCropSide = cropSide;
		cropSide = keyIndex-76;
		xkeys.setBacklight(keyIndex, true); // New key, On(, Blue)
		
		// If there was an old side and it's not the same as the current one, make the old one blink.
		if (oldCropSide >= 0 && oldCropSide !== cropSide)
			xkeys.setBacklight(76+oldCropSide, true, false, true); // Old key, On, Blue, Blinking

		// If the old side is the same as the current, make it blink.
		else if (oldCropSide === cropSide) {
			cropSide = -1;
			xkeys.setBacklight(keyIndex, true, false, true); // New key, On, Blue, Blinking
		}
	}
});

// Listen for keys to be lifted.
xkeys.on('up', keyIndex => {
	// Keys are sent as strings.
	keyIndex = parseInt(keyIndex);
});

// START OF UNTIDY CODE THAT NEEDS CHECKING

// Inside wheel, -1 left, 1 right, don't do anything on 0 of course.
xkeys.on('jog', deltaPos => {
	//console.log('Jog position has changed: '+deltaPos);
	
	if (cropSide >= 0 && deltaPos !== 0) {
		switch (cropSide) {
			case 0:
				cropCache['capture'+(capture+1)].top = changeCrop(cropCache['capture'+(capture+1)].top, deltaPos);
				break;
			case 1:
				cropCache['capture'+(capture+1)].right =changeCrop(cropCache['capture'+(capture+1)].right, deltaPos);
				break;
			case 2:
				cropCache['capture'+(capture+1)].bottom = changeCrop(cropCache['capture'+(capture+1)].bottom, deltaPos);
				break;
			case 3:
				cropCache['capture'+(capture+1)].left = changeCrop(cropCache['capture'+(capture+1)].left, deltaPos);
				break;
		}

		applyCropping(cropCache['capture'+(capture+1)]);
	}
});

// Outside wheel, -7 > 0 > 7
var oldShuttlePos = 0;
var shuttleTO;
xkeys.on('shuttle', shuttlePos => {
	if (shuttlePos === 0) {
		console.log('clearing interval')
		clearInterval(shuttleTO);
	}
	else if (oldShuttlePos === 0 && shuttlePos !== 0) {
		shuttleTO = setInterval(shuttleCrop, 100);
		console.log('starting interval');
	}
	
	oldShuttlePos = shuttlePos;
});

function changeCrop(side, deltaPos) {
	var amount = side + deltaPos;
	if (amount < 0) amount = 0;
	return amount;
}

function shuttleCrop() {
	console.log('shuttle cropping')

	if (cropSide >= 0 && oldShuttlePos !== 0) {
		switch (cropSide) {
			case 0:
				cropCache['capture'+(capture+1)].top = changeCrop(cropCache['capture'+(capture+1)].top, oldShuttlePos);
				break;
			case 1:
				cropCache['capture'+(capture+1)].right =changeCrop(cropCache['capture'+(capture+1)].right, oldShuttlePos);
				break;
			case 2:
				cropCache['capture'+(capture+1)].bottom = changeCrop(cropCache['capture'+(capture+1)].bottom, oldShuttlePos);
				break;
			case 3:
				cropCache['capture'+(capture+1)].left = changeCrop(cropCache['capture'+(capture+1)].left, oldShuttlePos);
				break;
		}

		applyCropping(cropCache['capture'+(capture+1)]);
	}	
}

// END

// Turns on all the cropping key blue LEDs and makes them blink.
function blinkCroppingKeys() {
	for (var i = 76; i < 80; i++) {
		xkeys.setBacklight(i, true, false, true);
	}
}

// Turns off all the cropping key blue LEDs.
function turnOffCroppingKeys() {
	for (var i = 76; i < 80; i++) {
		xkeys.setBacklight(i, false, false);
	}
}

// Turns on all the rack key blue LEDs and makes them blink.
function blinkRackKeys() {
	for (var i = 68; i < 72; i++) {
		xkeys.setBacklight(i, true, false, true);
	}
}

// Turns off all the rack key blue LEDs.
function turnOffRackKeys() {
	for (var i = 68; i < 72; i++) {
		xkeys.setBacklight(i, false, false);
	}
}

function applyCropping(cropValues) {
	for (var i = 0; i < 4; i++) {
		// Setup options for this rack.
		var options = {
			'scene-name': gameCaptureKey[capture],
			'item': rackKey[i],
			'crop': cropValues
		};

		// Send settings to OBS.
		obs.send('SetSceneItemProperties', options);
	}
}

// Used to change what rack is visible on the current game capture.
// We have to loop through all the racks to be able to turn off the other ones.
function changeRack() {
	for (var i = 0; i < 4; i++) {
		// Setup options for this rack.
		var options = {
			'scene-name': gameCaptureKey[capture],
			'item': rackKey[i],
			'visible': false
		};

		// If this rack is the one we want visible, make it so.
		if (i === rack[capture])
			options.visible = true;

		// Send settings to OBS.
		obs.send('SetSceneItemProperties', options);
	}
}