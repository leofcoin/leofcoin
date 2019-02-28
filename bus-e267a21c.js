'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var EventEmitter = _interopDefault(require('events'));
var rpc = require('carlo/rpc');

class Emitter extends EventEmitter {
	constructor() {
		super();
	}
  on(event, func) {
    super.on(event, func);
  }
}
var bus = new Emitter();

rpc.rpc_process.init(() => rpc.rpc.handle(bus));

exports.bus = bus;
