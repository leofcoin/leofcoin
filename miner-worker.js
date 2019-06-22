/* leofcoin-core version 0.2.5 */
'use strict';

const ENVIRONMENT = {version: '0.2.5', production: true};

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = require('path');
var os = require('os');
require('bs58');
var cryptoIoFs = require('crypto-io-fs');
require('leofcoin-hash');
var dapnets = _interopDefault(require('@leofcoin/dapnets'));
require('multi-wallet');
var EventEmitter = _interopDefault(require('events'));
var chalk = _interopDefault(require('chalk'));
var CID = _interopDefault(require('cids'));
require('multicodec');
var ipldLfc = require('ipld-lfc');

const argv = process.argv;

const networks = {
	'leofcoin': path.join(os.homedir(), '.leofcoin'),
	'olivia': path.join(os.homedir(), '.leofcoin/olivia')
};

const network = (() => {
  const index = argv.indexOf('--network');
  return process.env.NETWORK || (index > -1) ? argv[index + 1] : 'olivia';
})();

const genesis = (() => {
	if (argv.indexOf('genesis') !== -1) return true;
	if (argv.indexOf('init') !== -1) return true;
  return false;
})();

const verbose = argv.indexOf('--verbose') !==  -1;

if (verbose) {
  process.env.DEBUG = true;
}

const olivia = process.argv.includes('olivia') || process.argv.includes('testnet');
const AppData = path.join(os.homedir(), 'AppData', 'Roaming', olivia ? 'Leofcoin/olivia' : 'Leofcoin');
const APPDATAPATH = (() => {
  switch (process.platform) {
    case 'win32':
      return path.join(os.homedir(), 'AppData', 'Roaming', 'Leofcoin', olivia ? 'olivia' : '')
      break;
    case 'linux':
      return path.join(os.homedir(), '.leofcoin', olivia ? 'olivia' : '')
      break;
    case 'darwin':
      // TODO: implement darwin path
      break;
    case 'android':
      // TODO: implement android path
      // experimental
      break;
  }
})();


const netPrefix = (async () => await dapnets('leofcoin').netPrefix)();

const walletPath = path.join(APPDATAPATH, 'wallet.dat');
const networkPath = networks[network];
const networkConfigPath = path.join(networkPath, 'config');
const netKeyPath = path.join(networkPath, 'swarm.key');
const localCurrent = path.join(networkPath, 'db', 'current');
const localIndex = path.join(networkPath, 'db', 'index');
const localDAGAddress = path.join(networkPath, 'db', 'dag.multiaddress');
const configPath = path.join(AppData, 'core.config');

class Emitter extends EventEmitter {
	constructor() {
		super();
	}
  on(event, func) {
    // EventEmitter returns heavy object that we don't want to
    // send over the wire.
    super.on(event, func);
  }

  emit(event, value) {
    // EventEmitter returns heavy object that we don't want to
    // send over the wire.
    super.emit(event, value);
  }
}

new Emitter();

const hashFromMultihash = multihash => {
  let hash = multihash.replace('/ipfs/', '');
  const cid = new CID(hash);
  const prefix = cid.prefix;
  return cid.multihash.slice(prefix.length - 3).toString('hex');
};

if (process.platform === 'win32') {
  const readLine = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readLine.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}
const debug = (text) => {
	if (process.env.DEBUG || process.argv.indexOf('--verbose') !== -1) {
    const stack = new Error().stack;
    const caller = stack.split('\n')[2].trim();
    console.groupCollapsed(chalk.blue(text));
    console.log(caller);
    console.groupEnd();
  }};

const defaultConfig = async () => {
  // const wallet = generateWallet();
  // TODO: prompt for password
  // bus.on('initial-setup', message => {
    // console.log(message);
  // bus.emit('initial', wallet.mnemonic);
  // })
  // await writeWallet(wallet.save());
  // const account = wallet.derive('m/0\'/0/0');
	return {
  	miner: {
  		// address: account.address,
  		intensity: 1
  	}
  }
};

// TODO: also check for configfile in the directory where core is run from @AndrewVanardennen
// search for the config file & create new one when needed
const getUserConfig = new Promise(resolve => {
	cryptoIoFs.read(configPath, 'json')
    .then(config => resolve(config))
		.catch(async error => {
			if (error.code !== 'ENOENT') {
				console.error(error);
			}
			resolve(await defaultConfig());
			debug('new config file created');
		});
});

var calculateHash = async block => {
  block = await new ipldLfc.LFCNode(block);
  const cid = await ipldLfc.util.cid(block.serialize());
  return hashFromMultihash(cid.toBaseEncodedString());
}

/**
 * Get hash difficulty
 *
 * @param hash
 * @return {Number}
 */
var getDifficulty$1 = hash => {
	return parseInt(hash.substring(0, 8), 16);
};

const hashes$1 = nonce => {
	const hashrates = [10000];
	for (let i = hashrates.length; --i > 0;) {
		if (nonce % hashrates[i - 1] === 0) return hashrates[i - 1];
	}
	return hashrates.filter(hashrate => {
		if (nonce % hashrate === 0) return hashrate;
	});
};

var minerWorker = (() => {
	process.on('message', async ({block, difficulty}) => {
  	let hashCount = 0;
		block.hash = await calculateHash(block);
  	while (getDifficulty$1(block.hash) >= difficulty) {
  		block.nonce++;
  		block.hash = await calculateHash(block);
  		hashCount = hashCount + Number(hashes$1(block.nonce));
  	}
  	process.send({ block, hashCount });
	});

})();

module.exports = minerWorker;
/* follow Leofcoin on Twitter! @leofcoin */
