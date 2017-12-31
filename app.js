const GPIO = require('onoff').Gpio;

const senseWhite = new GPIO(20, 'in', 'both');
const senseBlue = new GPIO(21, 'in', 'both');
const senseHome = new GPIO(16, 'in', 'both');

senseWhite.watch((err, value) => {
	console.log('WHITE:', value);
});

senseBlue.watch((err, value) => {
	console.log('BLUE:', value);
});

senseHome.watch((err, value) => {
	console.log('HOME:', value);
});
