const GPIO = require('onoff').Gpio;
const pify = require('pify');

const timeout = pify(setTimeout);

const home = new GPIO(16, 'in', 'both');

const decoder = {
	channelA: new GPIO(19, 'in', 'both'),
	channelB: new GPIO(21, 'in', 'both'),
};

const motor = new class Motor {
	constructor() {
		this.hbridge = {
			switch1: pify(new GPIO(6, 'out')),
			switch2: pify(new GPIO(13, 'out')),
			switch3: pify(new GPIO(19, 'out')),
			switch4: pify(new GPIO(26, 'out')),
		};

		this.reset();
	}

	reset() {
		return Promise.all([
			this.hbridge.switch1.write(0),
			this.hbridge.switch2.write(0),
			this.hbridge.switch3.write(0),
			this.hbridge.switch4.write(0),
		]);
	}

	forward() {
		return this.reset().then(() => Promise.all([
			this.hbridge.switch1.write(1),
			this.hbridge.switch4.write(1),
		]));
	}

	reverse() {
		return this.reset().then(() => Promise.all([
			this.hbridge.switch2.write(1),
			this.hbridge.switch3.write(1),
		]));
	}

	brake() {
		return this.reset().then(() => Promise.all([
			this.hbridge.switch1.write(1),
			this.hbridge.switch3.write(1),
		]));
	}
};

var count = 0;

decoder.channelA.watch((err, value) => {
	count++;
});

home.watch((err, value) => {
	console.log('COUNT:', count);
	count = 0;
});

motor.forward()
	.then(() => timeout(1000))
	.then(() => motor.break());
