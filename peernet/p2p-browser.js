(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.p2p = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var getPort = _interopDefault(require('get-port'));
var ip = require('public-ip');
var ip__default = _interopDefault(ip);

class AddressBook {
  constructor(peerId, transports, protocols = ['peernet']) {
    this.addresses = [];
    return this._build(peerId, transports, protocols = ['peernet'])
  }
  
  async _build(peerId, transports, protocols = ['peernet']) {
    try {
      this.ip = await ip__default.v6();
    } catch (e) {
      this.ip = await ip__default.v4();
    }
    if (!globalThis.navigator) {
      for (const transport of transports) {
        for (var protocol of protocols) {
          if (transport.name && !globalThis.navigator) {
            transport.port = await getPort(transport.port);
            this.addresses.push(`/${transport.name}/${transport.port}/${this.ip}/${protocol}/${peerId}`);
          } else {
            this.addresses.push(`/${transport}/${this.ip}/${protocol}/${peerId}`);
          }
        }  
      }    
    } else {
      this.addresses.push(`/peernet/${peerId}/disco-swarm`);
    }
    return this
  }
  
}

exports.AddressBook = AddressBook;

},{"get-port":5,"public-ip":10}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
'use strict';

function withIs(Class, { className, symbolName }) {
    const symbol = Symbol.for(symbolName);

    const ClassIsWrapper = {
        // The code below assigns the class wrapper to an object to trick
        // JavaScript engines to show the name of the extended class when
        // logging an instances.
        // We are assigning an anonymous class (class wrapper) to the object
        // with key `className` to keep the correct name.
        // If this is not supported it falls back to logging `ClassIsWrapper`.
        [className]: class extends Class {
            constructor(...args) {
                super(...args);
                Object.defineProperty(this, symbol, { value: true });
            }

            get [Symbol.toStringTag]() {
                return className;
            }
        },
    }[className];

    ClassIsWrapper[`is${className}`] = (obj) => !!(obj && obj[symbol]);

    return ClassIsWrapper;
}

function withIsProto(Class, { className, symbolName, withoutNew }) {
    const symbol = Symbol.for(symbolName);

    /* eslint-disable object-shorthand */
    const ClassIsWrapper = {
        [className]: function (...args) {
            if (withoutNew && !(this instanceof ClassIsWrapper)) {
                return new ClassIsWrapper(...args);
            }

            const _this = Class.call(this, ...args) || this;

            if (_this && !_this[symbol]) {
                Object.defineProperty(_this, symbol, { value: true });
            }

            return _this;
        },
    }[className];
    /* eslint-enable object-shorthand */

    ClassIsWrapper.prototype = Object.create(Class.prototype);
    ClassIsWrapper.prototype.constructor = ClassIsWrapper;

    Object.defineProperty(ClassIsWrapper.prototype, Symbol.toStringTag, {
        get() {
            return className;
        },
    });

    ClassIsWrapper[`is${className}`] = (obj) => !!(obj && obj[symbol]);

    return ClassIsWrapper;
}

module.exports = withIs;
module.exports.proto = withIsProto;

},{}],4:[function(require,module,exports){
var naiveFallback = function () {
	if (typeof self === "object" && self) return self;
	if (typeof window === "object" && window) return window;
	throw new Error("Unable to resolve global `this`");
};

module.exports = (function () {
	if (this) return this;

	// Unexpected strict mode (may happen if e.g. bundled into ESM module)

	// Fallback to standard globalThis if available
	if (typeof globalThis === "object" && globalThis) return globalThis;

	// Thanks @mathiasbynens -> https://mathiasbynens.be/notes/globalthis
	// In all ES5+ engines global object inherits from Object.prototype
	// (if you approached one that doesn't please report)
	try {
		Object.defineProperty(Object.prototype, "__global__", {
			get: function () { return this; },
			configurable: true
		});
	} catch (error) {
		// Unfortunate case of updates to Object.prototype being restricted
		// via preventExtensions, seal or freeze
		return naiveFallback();
	}
	try {
		// Safari case (window.__global__ works, but __global__ does not)
		if (!__global__) return naiveFallback();
		return __global__;
	} finally {
		delete Object.prototype.__global__;
	}
})();

},{}],5:[function(require,module,exports){
'use strict';
const net = require('net');

class Locked extends Error {
	constructor(port) {
		super(`${port} is locked`);
	}
}

const lockedPorts = {
	old: new Set(),
	young: new Set()
};

// On this interval, the old locked ports are discarded,
// the young locked ports are moved to old locked ports,
// and a new young set for locked ports are created.
const releaseOldLockedPortsIntervalMs = 1000 * 15;

// Lazily create interval on first use
let interval;

const getAvailablePort = options => new Promise((resolve, reject) => {
	const server = net.createServer();
	server.unref();
	server.on('error', reject);
	server.listen(options, () => {
		const {port} = server.address();
		server.close(() => {
			resolve(port);
		});
	});
});

const portCheckSequence = function * (ports) {
	if (ports) {
		yield * ports;
	}

	yield 0; // Fall back to 0 if anything else failed
};

module.exports = async options => {
	let ports;

	if (options) {
		ports = typeof options.port === 'number' ? [options.port] : options.port;
	}

	if (interval === undefined) {
		interval = setInterval(() => {
			lockedPorts.old = lockedPorts.young;
			lockedPorts.young = new Set();
		}, releaseOldLockedPortsIntervalMs);

		// Does not exist in some environments (Electron, Jest jsdom env, browser, etc).
		if (interval.unref) {
			interval.unref();
		}
	}

	for (const port of portCheckSequence(ports)) {
		try {
			let availablePort = await getAvailablePort({...options, port}); // eslint-disable-line no-await-in-loop
			while (lockedPorts.old.has(availablePort) || lockedPorts.young.has(availablePort)) {
				if (port !== 0) {
					throw new Locked(port);
				}

				availablePort = await getAvailablePort({...options, port}); // eslint-disable-line no-await-in-loop
			}

			lockedPorts.young.add(availablePort);
			return availablePort;
		} catch (error) {
			if (!['EADDRINUSE', 'EACCES'].includes(error.code) && !(error instanceof Locked)) {
				throw error;
			}
		}
	}

	throw new Error('No available ports found');
};

module.exports.makeRange = (from, to) => {
	if (!Number.isInteger(from) || !Number.isInteger(to)) {
		throw new TypeError('`from` and `to` must be integer numbers');
	}

	if (from < 1024 || from > 65535) {
		throw new RangeError('`from` must be between 1024 and 65535');
	}

	if (to < 1024 || to > 65536) {
		throw new RangeError('`to` must be between 1024 and 65536');
	}

	if (to < from) {
		throw new RangeError('`to` must be greater than or equal to `from`');
	}

	const generator = function * (from, to) {
		for (let port = from; port <= to; port++) {
			yield port;
		}
	};

	return generator(from, to);
};

},{"net":2}],6:[function(require,module,exports){
'use strict';

const word = '[a-fA-F\\d:]';
const b = options => options && options.includeBoundaries ?
	`(?:(?<=\\s|^)(?=${word})|(?<=${word})(?=\\s|$))` :
	'';

const v4 = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}';

const v6seg = '[a-fA-F\\d]{1,4}';
const v6 = `
(
(?:${v6seg}:){7}(?:${v6seg}|:)|                                // 1:2:3:4:5:6:7::  1:2:3:4:5:6:7:8
(?:${v6seg}:){6}(?:${v4}|:${v6seg}|:)|                         // 1:2:3:4:5:6::    1:2:3:4:5:6::8   1:2:3:4:5:6::8  1:2:3:4:5:6::1.2.3.4
(?:${v6seg}:){5}(?::${v4}|(:${v6seg}){1,2}|:)|                 // 1:2:3:4:5::      1:2:3:4:5::7:8   1:2:3:4:5::8    1:2:3:4:5::7:1.2.3.4
(?:${v6seg}:){4}(?:(:${v6seg}){0,1}:${v4}|(:${v6seg}){1,3}|:)| // 1:2:3:4::        1:2:3:4::6:7:8   1:2:3:4::8      1:2:3:4::6:7:1.2.3.4
(?:${v6seg}:){3}(?:(:${v6seg}){0,2}:${v4}|(:${v6seg}){1,4}|:)| // 1:2:3::          1:2:3::5:6:7:8   1:2:3::8        1:2:3::5:6:7:1.2.3.4
(?:${v6seg}:){2}(?:(:${v6seg}){0,3}:${v4}|(:${v6seg}){1,5}|:)| // 1:2::            1:2::4:5:6:7:8   1:2::8          1:2::4:5:6:7:1.2.3.4
(?:${v6seg}:){1}(?:(:${v6seg}){0,4}:${v4}|(:${v6seg}){1,6}|:)| // 1::              1::3:4:5:6:7:8   1::8            1::3:4:5:6:7:1.2.3.4
(?::((?::${v6seg}){0,5}:${v4}|(?::${v6seg}){1,7}|:))           // ::2:3:4:5:6:7:8  ::2:3:4:5:6:7:8  ::8             ::1.2.3.4
)(%[0-9a-zA-Z]{1,})?                                           // %eth0            %1
`.replace(/\s*\/\/.*$/gm, '').replace(/\n/g, '').trim();

const ip = options => options && options.exact ?
	new RegExp(`(?:^${v4}$)|(?:^${v6}$)`) :
	new RegExp(`(?:${b(options)}${v4}${b(options)})|(?:${b(options)}${v6}${b(options)})`, 'g');

ip.v4 = options => options && options.exact ? new RegExp(`^${v4}$`) : new RegExp(`${b(options)}${v4}${b(options)}`, 'g');
ip.v6 = options => options && options.exact ? new RegExp(`^${v6}$`) : new RegExp(`${b(options)}${v6}${b(options)}`, 'g');

module.exports = ip;

},{}],7:[function(require,module,exports){
'use strict';
const ipRegex = require('ip-regex');

const isIp = string => ipRegex({exact: true}).test(string);
isIp.v4 = string => ipRegex.v4({exact: true}).test(string);
isIp.v6 = string => ipRegex.v6({exact: true}).test(string);
isIp.version = string => isIp(string) ? (isIp.v4(string) ? 4 : 6) : undefined;

module.exports = isIp;

},{"ip-regex":6}],8:[function(require,module,exports){
/* little-pubsub version 1.0.2 */
'use strict';

const ENVIRONMENT = {version: '1.0.2', production: true};

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var classIs = _interopDefault(require('class-is'));

var index = classIs(class LittlePubSub {

  /**
   * Creates handlers
   */
  constructor(verbose = true) {
    this.subscribers = {};
    this.verbose = verbose;
  }

  /**
   * @param {String} event
   * @param {Method} handler
   * @param {HTMLElement} context
   */
  subscribe(event, handler, context) {
    if (typeof context === 'undefined') {
      context = handler;
    }
    this.subscribers[event] = this.subscribers[event] || { handlers: [], value: null};
    this.subscribers[event].handlers.push(handler.bind(context));
  }

  /**
   * @param {String} event
   * @param {Method} handler
   * @param {HTMLElement} context
   */
  unsubscribe(event, handler, context) {
    if (typeof context === 'undefined') {
      context = handler;
    }
    if (this.subscribers[event]) {
      const index = this.subscribers[event].handlers.indexOf(handler.bind(context));
      this.subscribers[event].handlers.splice(index);
      if (this.subscribers[event].handlers.length === 0) delete this.subscribers[event];  
    }
    
  }

  /**
   * @param {String} event
   * @param {String|Number|Boolean|Object|Array} change
   */
  publish(event, change) {
    if (this.subscribers[event]) {
      if (this.verbose || this.subscribers[event].value !== change) {
        this.subscribers[event].handlers.forEach(handler => {
          handler(change, this.subscribers[event].value);
        });
        this.subscribers[event].value = change;
      }
    }
  }
}, {
  className: 'LittlePubSub',
  symbolName: 'little-pubsub/index'
})

module.exports = index;

},{"class-is":3}],9:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],10:[function(require,module,exports){
'use strict';
const isIp = require('is-ip');

const defaults = {
	timeout: 5000
};

const urls = {
	v4: [
		'https://ipv4.icanhazip.com/',
		'https://api.ipify.org/'
	],
	v6: [
		'https://ipv6.icanhazip.com/',
		'https://api6.ipify.org/'
	]
};

let xhr;

const sendXhr = async (url, options, version) => {
	return new Promise((resolve, reject) => {
		xhr = new XMLHttpRequest();
		xhr.addEventListener('error', reject, {once: true});
		xhr.addEventListener('timeout', reject, {once: true});

		xhr.addEventListener('load', () => {
			const ip = xhr.responseText.trim();

			if (!ip || !isIp[version](ip)) {
				reject();
				return;
			}

			resolve(ip);
		}, {once: true});

		xhr.open('GET', url);
		xhr.timeout = options.timeout;
		xhr.send();
	});
};

const queryHttps = async (version, options) => {
	let ip;
	const urls_ = [].concat.apply(urls[version], options.fallbackUrls || []);
	for (const url of urls_) {
		try {
			// eslint-disable-next-line no-await-in-loop
			ip = await sendXhr(url, options, version);
			return ip;
		} catch (_) {}
	}

	throw new Error('Couldn\'t find your IP');
};

queryHttps.cancel = () => {
	xhr.abort();
};

module.exports.v4 = options => queryHttps('v4', {...defaults, ...options});

module.exports.v6 = options => queryHttps('v6', {...defaults, ...options});

},{"is-ip":7}],11:[function(require,module,exports){
(function (process){
/* socket-request-client version 1.4.2 */
'use strict';

const ENVIRONMENT = {version: '1.4.2', production: true};

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var PubSub = _interopDefault(require('little-pubsub'));

var clientApi = _pubsub => {
  const subscribe = (topic, cb) => {
    _pubsub.subscribe(topic, cb);
  };
  const unsubscribe = (topic, cb) => {
    _pubsub.unsubscribe(topic, cb);
  };
  const publish = (topic, value) => {
    _pubsub.publish(topic, value);
  };
  const _connectionState = (state) => {
    switch (state) {
      case 0:
        return 'connecting'
        break;
      case 1:
        return 'open'
        break;
      case 2:
        return 'closing'
        break;
      case 3:
        return 'closed'
        break;
    }
  };
  const request = (client, request) => {
    return new Promise((resolve, reject) => {
      const state = _connectionState(client.readyState);
      if (state !== 'open') return reject(`coudn't send request to ${client.id}, no open connection found.`)
      request.id = Math.random().toString(36).slice(-12);
      const handler = result => {
        if (result && result.error) return reject(result.error)
        resolve({result, id: request.id, handler});
      };
      subscribe(request.id, handler);
      send(client, request);
    });
  };
  const send = async (client, request) => {
    return client.send(JSON.stringify(request))
  };
  const pubsub = client => {
    return {
      publish: (topic = 'pubsub', value) => {
        publish(topic, value);
        return send(client, {url: 'pubsub', params: { topic, value }})
      },
      subscribe: (topic = 'pubsub', cb) => {
        subscribe(topic, cb);
        return send(client, {url: 'pubsub', params: { topic, subscribe: true }})
      },
      unsubscribe: (topic = 'pubsub', cb) => {
        unsubscribe(topic, cb);
        return send(client, {url: 'pubsub', params: { topic, unsubscribe: true }})
      },
      subscribers: _pubsub.subscribers
    }
  };
  const server = (client) => {
    return {
      uptime: async () => {
        try {
          const { result, id, handler } = await request(client, {url: 'uptime'});
          unsubscribe(id, handler);
          return result
        } catch (e) {
          throw e
        }
      },
      ping: async () => {
        try {
          const now = new Date().getTime();
          const { result, id, handler } = await request(client, {url: 'ping'});
          unsubscribe(id, handler);
          return (Number(result) - now)
        } catch (e) {
          throw e
        }
      }
    }
  };
  const peernet = (client) => {
    return {
      join: async (params) => {
        try {
          params.join = true;
          const requested = { url: 'peernet', params };
          const { result, id, handler } = await request(client, requested);
          unsubscribe(id, handler);
          return result
        } catch (e) {
          throw e
        }
      },
      leave: async (params) => {
        try {
          params.join = false;
          const requested = { url: 'peernet', params };
          const { result, id, handler } = await request(client, requested);
          unsubscribe(id, handler);
          return result
        } catch (e) {
          throw e
        }
      }
    }
  };
  return { send, request, pubsub, server, subscribe, unsubscribe, publish, peernet }
};

const socketRequestClient = (url, protocols = 'echo-protocol', options = { retry: false, pubsub: false }) => {
  let { pubsub, retry } = options;
  if (!pubsub) pubsub = new PubSub();
  const api = clientApi(pubsub);
  let tries = 0;
  const onerror = error => {
    if (pubsub.subscribers['error']) {
      pubsub.publish('error', error);
    } else {
      console.error(error);
    }
  };
  const onmessage = message => {
    const {value, url, status, id} = JSON.parse(message.data.toString());
    const publisher = id ? id : url;
    if (status === 200) {
      pubsub.publish(publisher, value);
    } else {
      pubsub.publish(publisher, {error: value});
    }
  };
  const clientConnection = client => {
    const startTime = new Date().getTime();
    return {
      client,
      request: async req => {
        const { result, id, handler } = await api.request(client, req);
        pubsub.unsubscribe(id, handler);
        return result
      },
      send: req => api.send(client, req),
      subscribe: api.subscribe,
      unsubscribe: api.unsubscribe,
      subscribers: api.subscribers,
      publish: api.publish,
      pubsub: api.pubsub(client),
      uptime: () => {
        const now = new Date().getTime();
        return (now - startTime)
      },
      peernet: api.peernet(client),
      server: api.server(client),
      close: exit => {
        client.onclose = message => {
          if (exit) process.exit();
        };
        client.close();
      }
    }
  };
  return new Promise((resolve, reject) => {
    const init = () => {
      let ws;
      if (typeof process === 'object') {
        ws = require('websocket').w3cwebsocket;
      } else {
        ws = WebSocket;
      }
      const client = new ws(url, protocols);
      client.onmessage = onmessage;
      client.onerror = onerror;
      client.onopen = () => {
        tries = 0;
        resolve(clientConnection(client));
      };
      client.onclose = message => {
        tries++;
        if (!retry) return reject(options)
        if (tries > 5) {
          console.log(`${protocols} Client Closed`);
          console.error(`could not connect to - ${url}/`);
          return resolve(clientConnection(client))
        }
        if (message.code === 1006) {
          console.log('Retrying in 10 seconds');
          setTimeout(() => {
            return init();
          }, retry);
        }
      };
    };
    return init();
  });
};

module.exports = socketRequestClient;

}).call(this,require('_process'))
},{"_process":9,"little-pubsub":8,"websocket":12}],12:[function(require,module,exports){
var _globalThis;
try {
	_globalThis = require('es5-ext/global');
} catch (error) {
} finally {
	if (!_globalThis && typeof window !== 'undefined') { _globalThis = window; }
	if (!_globalThis) { throw new Error('Could not determine global this'); }
}

var NativeWebSocket = _globalThis.WebSocket || _globalThis.MozWebSocket;
var websocket_version = require('./version');


/**
 * Expose a W3C WebSocket class with just one or two arguments.
 */
function W3CWebSocket(uri, protocols) {
	var native_instance;

	if (protocols) {
		native_instance = new NativeWebSocket(uri, protocols);
	}
	else {
		native_instance = new NativeWebSocket(uri);
	}

	/**
	 * 'native_instance' is an instance of nativeWebSocket (the browser's WebSocket
	 * class). Since it is an Object it will be returned as it is when creating an
	 * instance of W3CWebSocket via 'new W3CWebSocket()'.
	 *
	 * ECMAScript 5: http://bclary.com/2004/11/07/#a-13.2.2
	 */
	return native_instance;
}
if (NativeWebSocket) {
	['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function(prop) {
		Object.defineProperty(W3CWebSocket, prop, {
			get: function() { return NativeWebSocket[prop]; }
		});
	});
}

/**
 * Module exports.
 */
module.exports = {
    'w3cwebsocket' : NativeWebSocket ? W3CWebSocket : null,
    'version'      : websocket_version
};

},{"./version":13,"es5-ext/global":4}],13:[function(require,module,exports){
module.exports = require('../package.json').version;

},{"../package.json":14}],14:[function(require,module,exports){
module.exports={
  "_from": "websocket@^1.0.31",
  "_id": "websocket@1.0.31",
  "_inBundle": false,
  "_integrity": "sha512-VAouplvGKPiKFDTeCCO65vYHsyay8DqoBSlzIO3fayrfOgU94lQN5a1uWVnFrMLceTJw/+fQXR5PGbUVRaHshQ==",
  "_location": "/websocket",
  "_phantomChildren": {},
  "_requested": {
    "type": "range",
    "registry": true,
    "raw": "websocket@^1.0.31",
    "name": "websocket",
    "escapedName": "websocket",
    "rawSpec": "^1.0.31",
    "saveSpec": null,
    "fetchSpec": "^1.0.31"
  },
  "_requiredBy": [
    "/socket-request-client",
    "/socket-request-server"
  ],
  "_resolved": "https://registry.npmjs.org/websocket/-/websocket-1.0.31.tgz",
  "_shasum": "e5d0f16c3340ed87670e489ecae6144c79358730",
  "_spec": "websocket@^1.0.31",
  "_where": "D:\\Workspace-laptop\\leofcoin\\leofcoin\\peernet\\node_modules\\socket-request-client",
  "author": {
    "name": "Brian McKelvey",
    "email": "theturtle32@gmail.com",
    "url": "https://github.com/theturtle32"
  },
  "browser": "lib/browser.js",
  "bugs": {
    "url": "https://github.com/theturtle32/WebSocket-Node/issues"
  },
  "bundleDependencies": false,
  "config": {
    "verbose": false
  },
  "contributors": [
    {
      "name": "Iñaki Baz Castillo",
      "email": "ibc@aliax.net",
      "url": "http://dev.sipdoc.net"
    }
  ],
  "dependencies": {
    "debug": "^2.2.0",
    "es5-ext": "^0.10.50",
    "nan": "^2.14.0",
    "typedarray-to-buffer": "^3.1.5",
    "yaeti": "^0.0.6"
  },
  "deprecated": false,
  "description": "Websocket Client & Server Library implementing the WebSocket protocol as specified in RFC 6455.",
  "devDependencies": {
    "buffer-equal": "^1.0.0",
    "faucet": "^0.0.1",
    "gulp": "^4.0.2",
    "gulp-jshint": "^2.0.4",
    "jshint": "^2.0.0",
    "jshint-stylish": "^2.2.1",
    "tape": "^4.9.1"
  },
  "directories": {
    "lib": "./lib"
  },
  "engines": {
    "node": ">=0.10.0"
  },
  "homepage": "https://github.com/theturtle32/WebSocket-Node",
  "keywords": [
    "websocket",
    "websockets",
    "socket",
    "networking",
    "comet",
    "push",
    "RFC-6455",
    "realtime",
    "server",
    "client"
  ],
  "license": "Apache-2.0",
  "main": "index",
  "name": "websocket",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/theturtle32/WebSocket-Node.git"
  },
  "scripts": {
    "gulp": "gulp",
    "install": "(node-gyp rebuild 2> builderror.log) || (exit 0)",
    "test": "faucet test/unit"
  },
  "version": "1.0.31"
}

},{}],15:[function(require,module,exports){
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('get-port');
var socket = _interopDefault(require('socket-request-client'));
require('public-ip');
var addressBook = require('./address-book-f08255b2.js');

class WebRTCTransport {
    constructor(peerId) {
      this.connections = new Map();
      globalThis.peer = new peerjs.Peer(peerId);
      peer.on('connection', (conn) => {
        this.connections.set(conn.id, conn);
        conn.on('open', (id) => {
          console.log(id);
          conn.send('hello!');
        });
        conn.on('data', (data) => {
          // Will print 'hi!'
          console.log(data);
        });
      });
    }
  }

class WsTransport {
  constructor(peerId, addresses) {
    this.connections = new Map();
    this.listen(peerId, addresses);
    
    globalThis.addEventListener('beforeunload', async event => {
      const entries = this.connections.entries();
      for (const [address, _connection] of entries) {
        const { connection } = _connection;
        console.log(address);
        try {
          await connection.peernet.leave(peerId); 
          console.log('left');
        } catch (e) {
          console.warn(e);
        }
      }
    }); 
  }
  
  async dial(address) {
    try {
      const connection = await socket(address, 'disco');
      connection.pubsub.subscribe('peernet:message', (msg) => {
        console.log({msg});
      });
      
      this.connections.set(address, {connection, latency: 0});
      return
    } catch (e) {
      console.warn(e);
    }
  }
  
  async listen(peerId, addresses, port = 4040, garbageCleanupTimeout = 10000) {
    await this.dial('wss://star.leofcoin.org/disco');
    
    setTimeout(async () => {
      for (const {connection} of this.connections.values()) {
        const peers = await connection.peernet.join({peerId, address: addresses});  
        console.log(peers);
        for (const peer of peers) {
          if (peer !== `ws://localhost:${port}`) await peernet.dial(peer);
        }
        connection.pubsub.publish('peernet:message', `hi from ${peerId}`);
        connection.pubsub.publish('peernet:join', peerId);
        connection.pubsub.subscribe('peernet:join', async peer => {
          console.log(peer + ' joined');
          // const peerInfo = await new PeerInfo(peer)
          // peerInfo.multiaddrs.add('/p2p/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs/p2p-circuit')
          // peerInfo.protocols.add('/ipfs/kad/1.0.0')
          // this.ipfs.libp2p.emit('peer:discover', peerInfo)
          // if (peerInfo.id !== this.peerId) await this.ipfs.swarm.connect(`/p2p/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs/p2p-circuit/p2p/${peerInfo.id}`)
        });
      }
    }, 5000);
    
    this.cleanup = () => setTimeout(async () => {
      try {
        if (this.connections.size === 0) await this.dial('wss://star.leofcoin.org/disco');
        const entries = this.connections.entries();
        for (const [address, _connection] of entries) {
          const { connection } = _connection;
          console.log(address);
          try {
            const ping = await connection.server.ping();  
            this.connections.set(address, { connection, latency: ping });
            console.log({ping});
          } catch (e) {
            this.connections.delete(address);
            console.warn(e);
            return this.cleanup()
          }
        }
      } catch (e) {
        return this.cleanup()  
      }
      return this.cleanup()
    }, garbageCleanupTimeout);
    
    this.cleanup();
    
    
  }
}

class Peernet {
  get connections() {
    for (const [name, value] of this.transports.entries()) {
      console.log(value.connections);
    }
  }
  
  constructor(id) {
    this.dial = this.dial.bind(this);
    globalThis.peernet = {};
    globalThis.peernet.dial = this.dial;
    this.transports = new Map();
    this._init(id);
  }
  
  async _init(id) {    
    this.addressBook = await new addressBook.AddressBook(id, ['webRTC', 'ws']);
    this.transports.set(WebRTCTransport.name, new WebRTCTransport(id, this.addressBook.addresses));
    this.transports.set(WsTransport.name, new WsTransport(id, this.addressBook.addresses));
  }
  
  async _dial(address) {
    console.log(address);
    if (address.includes('/ws/'))
      try {
        const transport = this.transports.get(WsTransport.name);
        address = address.split('/');
        await transport.dial(`${address[1]}://${address[3].replace(/:/g, '-')}.sslip.io:${address[2]}`);
        // const connection = await socket(`wss://${address[2]}:${address[1]}`, 'disco')
        // connection.pubsub.subscribe('peernet:message', (msg) => {
        //   console.log({msg});
        // })
        // this.transports[WsTransport.name].connections.set(address[address.length - 1], {connection, latency: 0})
        return
      } catch (e) {
        console.warn(e);
      }
    else if (address.includes('/disco-swarm')) {
      return
    }
  }
  
  async dial(address) {
    if (Array.isArray(address)) {
      for (const addr of address) {
        await this._dial(addr);
      }
    } else {
      return this._dial(address)
    }
  }
}

module.exports = Peernet;

},{"./address-book-f08255b2.js":1,"get-port":5,"public-ip":10,"socket-request-client":11}]},{},[15])(15)
});
