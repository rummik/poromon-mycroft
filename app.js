const GPIO = require('onoff').Gpio;
const pify = require('pify');

const conf = { include: [ 'write' ] };

const timeout = pify((timeout, cb) => setTimeout(cb, timeout));

const home = new GPIO(16, 'in', 'both');

const decoder = {
	channelA: new GPIO(19, 'in', 'both'),
	channelB: new GPIO(21, 'in', 'both'),
};

const motor = new class Motor {
	constructor() {
		this.hbridge = {
			inA: pify(new GPIO(6, 'out'), conf),
			inB: pify(new GPIO(26, 'out'), conf),
		};

		this.reset();
	}

	reset() {
		return Promise.all([
			this.hbridge.inA.write(0),
			this.hbridge.inB.write(0),
		]);
	}

	forward() {
		return this.reset().then(() => {
			return this.hbridge.inA.write(1);
		});
	}

	reverse() {
		return this.reset().then(() => {
			return this.hbridge.inB.write(1);
		});
	}

	brake() {
		return Promise.all([
			this.hbridge.inA.write(1),
			this.hbridge.inB.write(1),
		]);
	}
};

var count = 0;

decoder.channelA.watch((err, value) => {
	count++;
});

home.watch((err, value) => {
	console.log('COUNT:', count);
	count = 0;

	motor.brake()
		.then(() => timeout(100))
		.then(() => motor.reset())
		.then(() => timeout(3000))
		.then(() => motor.forward());
});

motor.forward();
