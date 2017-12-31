const GPIO = require('onoff').Gpio;

const senseWhite = new GPIO(20, 'in', 'both');
const senseBlue = new GPIO(21, 'in', 'both');
const senseHome = new GPIO(16, 'in', 'both');

var whiteLast = 0;
var blueLast = 0;

var count = 0;

senseWhite.watch((err, value) => {
	count++;
});

senseBlue.watch((err, value) => {
});

senseHome.watch((err, value) => {
	console.log('COUNT:', count);
	count = 0;
});
