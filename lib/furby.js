const EventEmitter = require('events');

const GPIO = require('onoff').Gpio;
const pify = require('pify');
const _ = require('lodash');

const conf = { include: [ 'write' ] };

const timeout = pify((timeout, cb) => setTimeout(cb, timeout));

class FurbyMotion extends EventEmitter {
	constructor() {
		super();

		this.__hbridge = {
			inA: pify(new GPIO(5, 'low'), conf),
			inB: pify(new GPIO(6, 'low'), conf),
		};

		this.__home = pify(new GPIO(16, 'in', 'rising'));

		this.__decoder = {
			channelA: new GPIO(20, 'in', 'both'),
			channelB: new GPIO(21, 'in', 'both'),
		};

		this.__home.watch(() => this.emit('home'), 50);

		this.__position = 0;

		this.on('home', () => {
			this.__position = 0;
		});

		this._chain = [];

		this._home()._run();
	}

	_sleep(milliseconds = 10) {
		this._chain.push(() => timeout(milliseconds));
		return this;
	}

	_move(count = 0) {
		this._reset();

		this._chain.push(() =>
			new Promise(resolve => {
				let move = (count > 0 ? this.__hbridge.inA : this.__hbridge.inB).write(1);

				let steps = 0;

				let step = () => {
					if (++steps >= count) {
						this._brake()._run().then(resolve);
						this.__decoder.channelA.unwatch(step);
					}
				};

				this.__decoder.channelA.watch(step);
			})
		);

		return this;
	}

	_reset() {
		this._chain.push(() => Promise.all([
			this.__hbridge.inA.write(0),
			this.__hbridge.inB.write(0),
		]));

		return this;
	}

	_forward(count = 0) {
		if (count >= 0) {
			return this._move(count);
		}

		this._reset();
		this._chain.push(() => this.__hbridge.inA.write(1));

		return this;
	}


	_reverse(count = 0) {
		if (count >= 0) {
			return this._move(-count);
		}

		this._reset();
		this._chain.push(() => this.__hbridge.inB.write(1));

		return this;
	}

	_brake() {
		this._chain.push(() =>
			Promise
				.all([
					this.__hbridge.inA.write(1),
					this.__hbridge.inB.write(1),
				])

				.then(() => this._sleep(100)._reset()._run())
		);

		return this;
	}

	_home(direction = 'forward') {
		this._chain.push(() =>
			this.__home.read().then(value => {
				// Return if already at the home position
				if (value == 1) {
					return Promise.resolve();
				}

				return new Promise(resolve => {
					this.once('home', () => 
						this._brake()
							._home(direction === 'forward' ? 'reverse' : 'forward')
							._run()
							.then(resolve)
					);

					if (direction === 'forward') {
						return this._forward()._run();
					} else {
						return this._reverse()._run();
					}
				});
			})
		);

		return this;
	}

	_run() {
		let last = Promise.resolve();

		this._chain.forEach(item => last = last.then(item));

		this._chain = [];

		return last;
	}
}

module.exports = class Furby extends FurbyMotion {
	constructor() {
		super();

		this._tail = pify(new GPIO(12, 'in', 'rising'));
		this._tail.watch(_.debounce(() => this.emit('tail'), 50));

		this.blink();
	}

	closeEyes() {
		return this._home()._forward(330)._run();
	}

	blink() {
		return this.closeEyes()
			.then(() => this._home('reverse')._run());
	}

	sleep() {
		return this.closeEyes();
	}

	talk() {
		return this._home()
			._forward(30)._reverse(70)
			._forward(70)._reverse(70)
			._forward(70)._reverse(70)
			._run()
			.then(() => this.blink());
	}
};
