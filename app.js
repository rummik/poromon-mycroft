const GPIO = require('onoff').Gpio;

const senseWhite = new GPIO(20, 'in', 'both');
const senseBlue = new GPIO(21, 'in', 'both');

senseWhite.watch((err, value) => {
	console.log('WHITE:', value);
});

senseBlue.watch((err, value) => {
	console.log('BLUE:', value);
});
