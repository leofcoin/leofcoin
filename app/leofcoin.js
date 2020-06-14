'use strict';

let LeofcoinStorage;
let QRCode;
let Ipfs;

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var carlo = require('carlo');
require('leofcoin-hash');
var dapnets = _interopDefault(require('@leofcoin/dapnets'));
var coinTicker = _interopDefault(require('coin-ticker'));
var chalk = _interopDefault(require('chalk'));
var __chunk_1 = require('./chunk-8c482a3a.js');
require('multicodec');
var joi = _interopDefault(require('joi'));
var cryptoJs = _interopDefault(require('crypto-js'));
var CID = _interopDefault(require('cids'));
var bs58 = require('bs58');
var bs58__default = _interopDefault(bs58);
var cryptoStore = require('crypto-store');
var child_process = require('child_process');
var MultiWallet = _interopDefault(require('multi-wallet'));
var crypto = require('crypto');
var ipldLfcTx = require('ipld-lfc-tx');
var ipldLfcTx__default = _interopDefault(ipldLfcTx);
var ipldLfc = require('ipld-lfc');
var ipldLfc__default = _interopDefault(ipldLfc);
var SocketClient = _interopDefault(require('socket-request-client'));
var LfcApi = _interopDefault(require('lfc-api'));
var path = require('path');
var cryptoIoFs = require('crypto-io-fs');
var os = require('os');
var cores = _interopDefault(require('physical-cpu-count'));
var EventEmitter = _interopDefault(require('events'));
var rpc = require('carlo/rpc');

const writeWallet = async multiWIF => await cryptoIoFs.write(walletPath, JSON.stringify(multiWIF));
const readWallet = async () => await cryptoIoFs.read(walletPath, 'json');
const generateWallet = async () => {
	console.log(`Generating wallet for network ${network}`);
  const config$$1 = await cryptoIoFs.read(networkConfigPath, 'json');
	let wallet = new MultiWallet(network === 'olivia' ? 'leofcoin:olivia' : 'leofcoin');
	const mnemonic = wallet.generate();
  const account = wallet.account(0);
  wallet = {
    mnemonic,
    multiWIF: wallet.export(),
    accounts: ['main account', account.external(0).address]
  };
  await writeWallet(wallet);
	return wallet;
};
const _discoverAccounts = async (account, depth = 0) => {
  const accounts = [];
  const discover = async (account, depth) => {
    const external = account.external(depth);
    const internal = account.internal(depth);
    const tx = [];
    accounts.push(account);
    for (const { transactions } of global.chain) {
      if (accounts[external.address] || accounts[internal.address]) return;
			for (let transaction of transactions) {
				const {multihash} = transaction;
				if (multihash) {
					transaction = await leofcoin.transaction.get(multihash);
				}
				if (tx[internal.address] || tx[external.address]) return;
				if (transaction.inputs) transaction.inputs.forEach((i) => {
					if (i.address === internal.address) return tx.push(internal.address);
					if (i.address === external.address) return tx.push(external.address);
				});
				if (transaction.outputs) transaction.outputs.forEach((o) => {
					if (o.address === internal.address) return tx.push(internal.address);
					if (o.address === external.address) return tx.push(external.address);
				});
			}
    }
    if (tx.length > 0) return discover(account, depth + 1);
    return accounts;
  };
  return discover(account, 0);
};
const discoverAccounts = async (root) => {
  let accounts = [];
  const discover = async depth => {
			debug('discovering accounts');
    const account = root.account(depth);
    const _accounts = await _discoverAccounts(account);
    accounts = [...accounts, _accounts];
		debug('done discovering accounts');
		if (_accounts.length > 1) return discover(depth + 1);
    return accounts;
  };
  return discover(0);
};
const loadWallet = async () => {
	debug('loading wallet');
  try {
    const saved = await readWallet();
    const root = new MultiWallet(network === 'olivia' ? 'leofcoin:olivia' : 'leofcoin');
    root.import(saved.multiWIF);
		debug('done loading wallet');
    return root;
  } catch (e) {
    throw e;
  }
};

globalThis.bus = globalThis.bus || __chunk_1.bus;
const hashFromMultihash = multihash => {
  let hash = multihash.replace('/ipfs/', '');
  const cid = new CID(hash);
  const prefix = cid.prefix;
  return cid.multihash.slice(prefix.length - 3).toString('hex');
};
const multihashFromHash = hash => {
  const cid = new CID(1, 'leofcoin-block', Buffer.from(`1d40${hash}`, 'hex'), 'base58btc');
  return cid.toBaseEncodedString();
};
if (process.platform === 'win32') {
  const readLine = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  readLine.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}const debug = (text) => {
	if (process.env.DEBUG || process.argv.indexOf('--verbose') !== -1) {
    const stack = new Error().stack;
    const caller = stack.split('\n')[2].trim();
    console.groupCollapsed(chalk.blue(text));
    console.log(caller);
    console.groupEnd();
  }};
const log = text => {
  console.log(chalk.cyan(text));
};
const succes = text => {
  console.log(chalk.green(text));
};
const fail = text => {
  console.log(chalk.red(text));
};
const groupCollapsed = (text, cb) => {
  console.groupCollapsed(chalk.gray.bold(text));
  cb();
  console.groupEnd();
};
const getDifficulty = hash => {
	return parseInt(hash.substring(0, 8), 16);
};
const median = array => {
  array.sort( function(a,b) {return a - b;} );
  var half = Math.floor(array.length/2);
  if(array.length % 2)
    return array[half];
  else
    return (array[half-1] + array[half]) / 2.0;
};
const config = {
	server: {
		port: 3030,
		host: 'localhost',
	},
	p2p: {
		port: 6001,
		peers: [],
	},
	reward: 150,
	peers: []
};
const defaultConfig = async () => {
	return {
  	miner: {
  		intensity: 1
  	}
  }
};
const getUserConfig = () => new Promise(resolve => {
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

const hour = hour => hour * 3.6e+6;

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
      break;
    case 'android':
      break;
  }
})();
const netPrefix = (async () => await dapnets('leofcoin').netPrefix)();
const walletPath = path.join(APPDATAPATH, 'wallet.dat');
const signalServers = (() => {
  if (network === 'olivia') return [
		'/dns4/star.leofcoin.org/tcp/4003/wss/ipfs/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs',
		'/p2p-circuit/dns4/star.leofcoin.org/tcp/4002/ipfs/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs'
    ]
  else return [
		'/dns4/star.leofcoin.org/tcp/4003/wss/ipfs/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs',
    '/p2p-circuit/dns4/star.leofcoin.org/tcp/4002/ipfs/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs'
    ]
})();
const networkPath = networks[network];
const networkConfigPath = path.join(networkPath, 'config');
const netKeyPath = path.join(networkPath, 'swarm.key');
const localCurrent = path.join(networkPath, 'db', 'current');
const localIndex = path.join(networkPath, 'db', 'index');
const localDAGAddress = path.join(networkPath, 'db', 'dag.multiaddress');
const configPath = path.join(AppData, 'core.config');
const reward = 150;
const consensusSubsidyInterval = 52500;
const genesisCID = 'zsNS6wZiHUW66J9M1iZ6wnsWS7z52acyZTTWUFgoZPaWaAevd7EQg7u91zRKkoNBHsgH33XY6xPDSbcZJp4Rtfst5K863z';
const GENESISBLOCK = {
	index: 0,
  prevHash: Buffer.alloc(47).toString('hex'),
  time: 1581375185,
  transactions: [],
  nonce: 33336
};
const localDAGMultiaddress = async () => {
	let address;
  try {
    address = await cryptoIoFs.read(localCurrent, 'string');
  } catch (e) {
		if (e.code === 'ENOENT') {
			await cryptoIoFs.write(localCurrent, genesisCID);
			await cryptoIoFs.write(localIndex, 0);
			address = localDAGMultiaddress();
		} else {
			console.warn(`initial run::${e}`);
			return;
		}
  }
	return address;
};
const exchanges = coinTicker();
globalThis.priceMap = new Map();
const getPairValue = async (pairs) => {
		const prices = {};
	for (const exchange of exchanges) {
		try {
			for (const pair of pairs) {
				const result = await coinTicker(exchange, pair);
				prices[pair] = [];
				if (result && result.last) {
				  prices[pair].push(1 / Number(result.last));
				} else {
					exchanges.splice(exchanges.indexOf(exchange));
				}
			}
		} catch (e) {
		 exchanges.splice(exchanges.indexOf(exchange));
		}
	}
	for (const key of Object.keys(prices)) {
		priceMap.set(key, median(prices[key]));
	}
	console.log(priceMap.entries());
};
{
	(async () => await getPairValue(['BTC_EUR', 'LTC_EUR', 'ETH_EUR']))();
	setInterval(async () => {
		const values = await getPairValue(['BTC_EUR', 'LTC_EUR', 'ETH_EUR']);
	}, hour(1));
}

const {object, number, array, string, boolean } = joi;
const block = object().keys({
	index: number(),
	prevHash: string().length(94),
	time: number(),
	transactions: array().items(object().keys({
		multihash: string(),
		size: number()
	})),
	nonce: number(),
	hash: string().length(128)
});
const transaction = object().keys({
	id: string().hex().length(64),
	time: number(),
	reward: boolean(),
	inputs: array().items(object().keys({
		tx: string().hex().length(64),
		index: number(),
		amount: number(),
		address: string(),
		signature: string().base64(),
	})),
	outputs: array().items(object().keys({
		index: number(),
		amount: number(),
		address: string(),
	})),
});
const schemas = {
	block,
	transaction,
};
const validate = (schema, data) =>  joi.validate(data, schemas[schema], {presence: 'required'});
const isValid = (schema, data) => Boolean(validate(schema, data).error === null);

const invalid = (name, text) => new Error(`Invalid ${name}: ${text}`);
const BlockError = text => invalid('block', text);
const TransactionError = text =>	invalid('transaction', text);

const {SHA256} = cryptoJs;
const _SHA256 = (object) => {
	return SHA256(JSON.stringify(object)).toString();
};
const transactionHash = async transaction => {
	const tx = new ipldLfcTx__default.LFCTx(transaction);
	const cid = await ipldLfcTx__default.util.cid(tx.serialize());
	return cid.toBaseEncodedString()
};
const transactionInputHash = (transactionInput) => {
	const {tx, index, amount, address} = transactionInput;
	return _SHA256({tx, index, amount, address});
};

const { LFCNode, util } = ipldLfc__default;
var calculateHash = async block => {
  console.log(block);
  block = await new LFCNode(block);
  const cid = await util.cid(block.serialize());
  return hashFromMultihash(cid.toBaseEncodedString());
};

class DAGBlock {
	constructor(ipfs, options) {
    if (!ipfs) return console.warn('options and ipfs expected');
		this.ipfs = ipfs;
	}
	async newBlock({transactions = [], previousBlock, address}) {
		const index = previousBlock.index + 1;
		const minedTx = await createRewardTransaction(address, index);
		transactions.push(minedTx);
		this.data = {
			index,
			prevHash: previousBlock.hash,
			time: Math.floor(new Date().getTime() / 1000),
			transactions,
			nonce: 0
		};
		this.data.hash = await calculateHash(this.data);
		return this.data;
	}
	transformBlock({data, size}, cid) {
	  data = JSON.parse(data.toString());
    data.size = size;
	  return data;
	};
  async getHeader(hash) {
    this.node = await this.ipfs.dag.get(hash);
    return this.node.value;
  }
  async getBlock() {
  }
	async get(multihash) {
		this.node = await this.ipfs.dag.get(multihash);
		this.data = JSON.parse(this.node.value.data.toString());
		this.data.hash = hashFromMultihash(multihash);
    return this.data;
	}
}
const validate$1 = async (previousBlock, block, difficulty, unspent) => {
	if (!isValid('block', block)) throw BlockError('data');
	if (previousBlock.index + 1 !== block.index) throw BlockError('index');
	if (previousBlock.hash !== block.prevHash) throw BlockError('prevhash');
	if (await calculateHash(block) !== block.hash) throw BlockError('hash');
	if (getDifficulty(block.hash) > difficulty) throw BlockError('difficulty');
	return validateTransactions(block.transactions, unspent);
};

const config$1 = {
	get: property => global.ipfs.config.get(property),
	set: (property, value) => global.ipfs.config.set(property, value),
};
const swarm = {
	peers: () => global.ipfs.swarm.peers(),
	connect: addresses => new Promise(async (resolve, reject) => {
		try {
      for (const addr of addresses) {
        await global.ipfs.swarm.connect(addr);
      }
  		resolve();
    } catch (e) {
      reject(e);
    }
	})
};
const pubsub$1 = {
	subscribe: (channel, cb) => global.ipfs.pubsub.subscribe(channel, cb),
	publish: (channel, cb) => global.ipfs.pubsub.publish(channel, cb)
};
const id = () => global.ipfs.id();
var ipfs$1 = {
	id,
	swarm,
	config: config$1,
	pubsub: pubsub$1
};

const { promisify } = require('util');
let conRuns = 0;
const _connect = async addresses =>
  new Promise(async (resolve, reject) => {
    try {
      conRuns++;
      await ipfs$1.swarm.connect(addresses);
      conRuns = 0;
      resolve();
    } catch (e) {
      if (conRuns === 2) {
        conRuns = 0;
        return resolve();
      }
      fail(e.message);
      debug('trying again');
      return setTimeout(async () => await _connect(addresses).then(() => resolve()), 500);
    }
  });
const connectBootstrap = async addresses => {
  __chunk_1.bus.emit('connecting', true);
  debug('connecting bootstrap peers');
  await _connect(signalServers);
  succes(`connected to ${signalServers.length} bootstrap peer(s)`);
};

const { LFCNode: LFCNode$1, util: util$1 } = ipldLfc__default;
const invalidTransactions = {};
global.chain = global.chain || [
  GENESISBLOCK
];
global.mempool = global.mempool || [];
global.blockHashSet = global.blockHashSet || [];
const chain$1 = (() => global.chain)();
const mempool$1 = (() => global.mempool)();
const blockHashSet$1 = (() => global.blockHashSet)();
const invalidTransaction = data => {
  data = JSON.parse(data.data.toString());
  if (!invalidTransactions[data.tx]) invalidTransactions[data.tx] = 0;
  ++invalidTransactions[data.tx];
  const count = invalidTransactions[data.tx];
  if (count === 3) {
    const memIndex = mempool$1.indexOf(data);
    mempool$1.splice(memIndex, 1);
    delete invalidTransactions[data.tx];
  }
};
const nextBlockTransactions = async () => {
	const unspent = await getUnspent(false);
	return mempool$1.filter(async (transaction) => {
    const multihash = transaction.multihash;
    const value = await leofcoin.transaction.get(multihash);
    console.log({value});
		try {
			await validateTransaction(multihash, value, unspent);
      return transaction
		} catch (e) {
      global.ipfs.pubsub.publish('invalid-transaction', new Buffer.from(JSON.stringify(transaction)));
			console.error(e);
		}
	});
};
const getTransactions = async (withMempool = true, index = 0) => {
  const _chain = [...chain$1];
  _chain.slice(index, chain$1.length);
	let transactions = _chain.reduce((transactions, block) => [ ...transactions, ...block.transactions], []);
	if (withMempool) transactions = transactions.concat(mempool$1);
  let _transactions = [];
  for (const tx of transactions) {
    const {multihash} = tx;
    if (multihash) {
      const {value} = await global.ipfs.dag.get(multihash, {format: LFCNode$1.codec, hashAlg: LFCNode$1.faultHashAlg, version: 1, baseFormat: 'base58btc'});
      _transactions.push(value);
    } else {
      _transactions.push(tx);
    }
  }
  return _transactions
};
const getUnspent = async (withMempool = false, index = 0) => {
	const transactions = await getTransactions(withMempool, index);
	const inputs = transactions.reduce((inputs, tx) => inputs.concat(tx.inputs), []);
	const outputs = transactions.reduce((outputs, tx) =>
		outputs.concat(tx.outputs.map(output => Object.assign({}, output, {tx: tx.id}))), []);
	const unspent = outputs.filter(output =>
		typeof inputs.find(input => input.tx === output.tx && input.index === output.index && input.amount === output.amount) === 'undefined');
	return unspent;
};
const getUnspentForAddress = async (address, index = 0) => {
  const unspent = await getUnspent(true, index);
	return unspent.filter(u => u.address === address);
};
const getBalanceForAddress = async address => {
  debug(`Getting balance for ${address}`);
  const unspent = await getUnspentForAddress(address);
  const amount = unspent.reduce((acc, u) => acc + u.amount , 0);
  debug(`Got ${amount} for ${address}`);
	return amount
};
const getBalanceForAddressAfter = async (address, index) => {
  debug(`Getting balance for ${address} @${index}`);
  const unspent = await getUnspentForAddress(address, index);
  const amount = unspent.reduce((acc, u) => acc + u.amount , 0);
  debug(`Got ${amount} for ${address} @${index}`);
  return amount
};
const difficulty = () => {
	const start = chain$1.length >= 128 ? (chain$1.length - 128) : 0;
	const blocks = chain$1.slice(start, (chain$1.length - 1)).reverse();
	const stamps = [];
	for (var i = 0; i < blocks.length; i++) {
		if (blocks[i + 1]) {
			stamps.push(blocks[i].time - blocks[i + 1].time);
		}
	}
	if (stamps.length === 0) {
		stamps.push(30);
	}
	let blocksMedian = median(stamps) || 30;
  const offset = blocksMedian / 30;
	if (blocksMedian < 30) {
		blocksMedian -= (offset / 2);
	} else if (blocksMedian > 30) {
		blocksMedian += (offset * 2);
	}
  if (blocksMedian < 0) blocksMedian = -blocksMedian;
  console.log(`Average Block Time: ${blocksMedian}`);
  console.log(`Difficulty: ${30 / blocksMedian}`);
	return ((100000 / ((30 / blocksMedian) * 100)) * 3);
};
const timedRequest = (peer, request) => new Promise(async (resolve, reject) => {
  setTimeout(() => {
    reject();
  }, 1000);
  const requested = await peer.request(request);
  resolve(requested);
});
const readyState = (state) => {
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
const connectAfterClose = client => new Promise(async (resolve, reject) => {
  if (readyState(client.readyState) === 'closed') {
    await leofcoin.dial(client.url);
    resolve();
  } else if (readyState(client.readyState) === 'closing') setTimeout(async () => {
    await connectAfterClose(client);
    resolve();
  }, 1000);
});
const longestChain = () => new Promise(async (resolve, reject) => {
  try {
    const peers = await ipfs.swarm.peers();
    const set = [];
    for (const {peer} of peers) {
      const chunks = [];
      try {
        for await (const chunk of ipfs.name.resolve(peer)) {
          chunks.push(chunk);
        }
      } catch (e) {
        console.warn(e);
      }
      if (chunks.length > 0) set.push({peer, path: chunks});
    }
    const _peers = [];
    let _blocks = [];
    for (const {peer, path: path$$1} of set) {
      if (_peers.indexOf(peer) === -1) {
        _peers.push(peer);
        const block = await leofcoin.block.dag.get(path$$1[0] || path$$1);
        _blocks.push({block, path: path$$1[0] || path$$1});
      }
    }
    const localIndex$$1 = await chainStore.get('localIndex');
    const localHash = await chainStore.get('localBlock');
    console.log({localHash});
    _blocks = _blocks.reduce((set, {block, path: path$$1}) => {
      if (set.block.index < block.index) {
        set.block = block;
        set.hash = path$$1.replace('/ipfs/', '');
        set.seen = 1;
      } else if (set.block.index === block.index) {
        set.seen = Number(set.seen) + 1;
      }
      return set
    }, {block: { index: localIndex$$1 }, hash: localHash, seen: 0});
    return resolve({index: _blocks.block.index, hash: _blocks.hash})
  } catch (e) {
    console.warn(e);
    debug(e);
  }
  const promises = [];
  for (const peer of leofcoin.peers) {
    if (peer.client) {
      console.log({address: peer.client.url, protocol: peer.client.protocol, connectionState: readyState(peer.client.readyState)});
      const state = readyState(peer.client.readyState);
      if (state !== 'open' && state !== 'connecting') await connectAfterClose(peer.client.url, peer.client.protocol);
      console.log({address: peer.client.url, protocol: peer.client.protocol, connectionState: readyState(peer.client.readyState)});
    }
    if (peer.request) {
      promises.push(new Promise(async (resolve, reject) => {
        try {
          let hash;
          const height = await timedRequest(peer, {url: 'chainHeight'});
          console.log({height});
          if (height > 1) hash = await timedRequest(peer, {url: 'blockHash', params: String((height - 1))});
          if (hash) resolve({index: (height - 1), hash });
          return resolve({index: 0, hash: genesisCID })
        } catch (e) {
          reject(e);
          console.error(e);
        }
      }));
    }
  }
  let result = await Promise.all(promises);
  result = result.reduce((p, c) => {
    console.log(c);
    if (Number(p.index) < Number(c.index)) {
      p.index = c.index;
      p.hash = c.hash;
      p.seen = 1;
    } else if (Number(p.index) === Number(c.index)) {
      p.seen += 1;
    }
    return p
  }, {index: 0, hash: genesisCID});
  return resolve(result)
});
const lastBlock = () => new Promise(async (resolve, reject) => {
  const result = await longestChain();
  resolve(result);
});
const nextBlock = async address => {
  let transactions;
  let previousBlock;
  try {
    previousBlock = await lastBlock();
    console.log({previousBlock});
    if (previousBlock.index > chain$1.length - 1) {
      await leofcoin.chain.sync();
      previousBlock = await lastBlock();
    }
    if (!previousBlock.index) previousBlock = chain$1[chain$1.length - 1];
    transactions = await nextBlockTransactions();
    console.log(previousBlock);
  } catch (e) {
    console.log(e);
    previousBlock = GENESISBLOCK;
    previousBlock.hash = genesisCID;
    transactions = await nextBlockTransactions();
  } finally {
    return await new DAGBlock(global.ipfs).newBlock({transactions, previousBlock, address});
  }
};
const goodBlock = (block, difficulty) => new Promise(async (resolve, reject) => {
    block.hash = await calculateHash(block);
    if (parseInt(block.hash.substring(0, 8), 16) >= difficulty) {
      block.nonce++;
      block = await goodBlock(block, difficulty);
    }
    resolve(block);
});
const newGenesisDAGNode = async (difficulty = 1, address = Buffer.alloc(32).toString('hex')) => {
  let block = {
    index: 0,
    prevHash: Buffer.alloc(47).toString('hex'),
    time: Math.floor(new Date().getTime() / 1000),
    transactions: [
    ],
    nonce: 0
  };
  block.hash = await calculateHash(block);
  block = await goodBlock(block, difficulty);
  console.log({block});
  const node = new LFCNode$1(block);
  return node;
};

const {util: util$2, LFCNode: LFCNode$2} = ipldLfc__default;
const { decode: decode$1, encode: encode$2 } = bs58__default;
globalThis.states = globalThis.states || {
  ready: false,
  syncing: false,
  connecting: false,
  mining: false
};
class DAGChain extends EventEmitter {
  constructor({genesis: genesis$$1, ipfs}) {
    super();
    this.announceBlock = this.announceBlock.bind(this);
    this.announceTransaction = this.announceTransaction.bind(this);
    this.chain = chain$1;
    this.ipfs = ipfs;
    globalThis.resolveBlocks = this.resolveBlocks;
  }
  async init(genesis$$1) {
    await this.ipfs.pubsub.subscribe('message-added', this.announceMessage);
    await this.ipfs.pubsub.subscribe('block-added', this.announceBlock);
    await this.ipfs.pubsub.subscribe('announce-transaction', this.announceTransaction);
    await this.ipfs.pubsub.subscribe('invalid-transaction', invalidTransaction);
    log(`Running on the ${network} network`);
    if (genesis$$1) {
      log(`Creating genesis block on the ${network} network`);
      await this.newDAGChain();
    }
    try {
      if (!genesis$$1) await this.loadChain();
    } catch (error) {
      debug(error);
      return error
    }
  }
  async resolve(name) {
    return await this.ipfs.name.resolve(name, {recursive: true});
  }
  async get(multihash) {
    const { value, remainderPath } = await this.ipfs.dag.get(multihash, { format: LFCNode$2.codec, hashAlg: LFCNode$2.defaultHashAlg, version: 1, pin: true});
    return value
  }
  async put(DAGNode) {
    return await this.ipfs.object.put(DAGNode);
  }
  async pin(multihash) {
    return await this.ipfs.pin.add(multihash, {recursive: true});
  }
  async syncChain() {
      globalThis.states.syncing = true;
      bus.emit('syncing', true);
      await leofcoin.chain.resync();
      bus.emit('syncing', false);
      globalThis.states.syncing = false;
    return;
  }
  async loadChain() {
    await this.syncChain();
    console.log('synced');
    globalThis.states.ready = true;
    bus.emit('ready', true);
  }
  addBlock(block) {
    return new Promise(async (resolve, reject) => {
      try {
        log(`add block: ${block.index}  ${block.hash}`);
        const multihash = multihashFromHash(block.hash);
        console.log(block);
        await globalThis.ipfs.dag.put(block, {format: util$2.codec, hashAlg: util$2.defaultHashAlg, version: 1, pin: true});
        debug(`multihash: ${multihash}`);
        block.hash = multihash;
        chain$1[block.index] = block;
        leofcoin.hashMap.set(block.index, multihash);
        block.transactions = block.transactions.map(link => link.toJSON());
        const _transactions = [];
        for (const {multihash} of block.transactions) {
          const node = await leofcoin.transaction.dag.get(multihash);
          await leofcoin.transaction.dag.put(node);
          await leofcoin.pin.add(multihash);
          debug(`${multihash} pinned`);
          _transactions.push(node.toJSON());
        }
        chain$1[block.index].transactions = _transactions;
        bus.emit('block-added', block);
        debug(`updating current local block: ${multihash}`);
        await leofcoin.chain.updateLocals(multihash, block.index);
        try {
          debug(`pinning: ${'/ipfs/' + multihash}`);
          await this.pin('/ipfs/' + multihash);
        } catch (e) {
          console.warn(e);
        }
        try {
          debug(`Publishing ${'/ipfs/' + multihash}`);
          await ipfs.name.publish('/ipfs/' + multihash);
        } catch (e) {
          console.warn(e);
        }
        block.transactions.forEach(async tx => {
          const index = mempool.indexOf(tx);
          mempool.splice(index);
        });
      } catch (e) {
        console.error(e);
      }
    });
  }
  writeLocals(cid, index) {
    debug(`writing cid ${cid} to ${localCurrent}`);
    debug(`writing index ${index} to ${localIndex}`);
    return new Promise(async (resolve, reject) => {
      await cryptoIoFs.write(localCurrent, cid);
      await cryptoIoFs.write(localIndex, index);
      resolve();
    });
  }
  async newDAGChain() {
    try {
      const genesisBlock = await newGenesisDAGNode(difficulty());
      const cid = await ipfs.dag.put(genesisBlock, { format: 'leofcoin-block', hashAlg: util$2.defaultHashAlg, version: 1, multibaseName: 'base58btc', pin: true});
      await leofcoin.chain.updateLocals(cid.toBaseEncodedString(), 0);
      succes('genesisBlock created');
      log(`genesisBlock: ${genesisBlock.toString()}`);
      log(`genesisBlock CID: ${cid}`);
      log(`genesis: ${encode$2(genesisBlock.serialize())}`);
      log(`DAGChain link ${cid.toBaseEncodedString()}`);
      return;
    } catch (e) {
      console.error(e);
    }
  }
  async announceTransaction({data, from}) {
    const {multihash, size} = JSON.parse(data.toString());
    mempool.push({multihash, size});
  }
  async resync(block) {
    await leofcoin.chain.resync(block);
  }
  async announceMessage({data, from}) {
    const {multihash} = JSON.parse(data.toString());
    messagePool.add(multihash);
  }
  async announceBlock({data, from}) {
    console.log(data.toString());
      const block = JSON.parse(data.toString());
      if (chain$1[block.index]) {
        bus.emit('invalid-block', block);
        await ipfs.pubsub.publish('invalid-block', Buffer.from(JSON.stringify(block)));
        return
      }
      try {
        await validate$1(chain$1[chain$1.length - 1], block, difficulty(), await getUnspent());
        await this.addBlock(block);
      } catch (error) {
        debug(`Invalid block ${block.hash}`);
        bus.emit('invalid-block', block);
        await ipfs.pubsub.publish('invalid-block', Buffer.from(JSON.stringify(block)));
        await this.resync(block);
        return
      }
    }
}

const { LFCTx: LFCTx$1, util: util$3 } = ipldLfcTx;
const validateTransaction = async (multihash, transaction, unspent) => {
	if (!transaction.reward) delete transaction.reward;
	if (!isValid('transaction', transaction)) throw new TransactionError('Invalid transaction');
	if (multihash !== await transactionHash(transaction)) throw TransactionError('Invalid transaction hash');
	if (transaction.inputs) {
		transaction.inputs.forEach(input => {
	  	const { signature, address } = input;
			const hash = transactionInputHash(input);
	  	let wallet = new MultiWallet(network === 'olivia' ? 'leofcoin:olivia' : 'leofcoin');
	    wallet.fromAddress(address, null, network === 'olivia' ? 'leofcoin:olivia' : 'leofcoin');
			if (!wallet.verify(Buffer.from(signature, 'hex'), Buffer.from(hash, 'hex')))
				throw TransactionError('Invalid input signature');
		});
		transaction.inputs.forEach((input) => {
			if (!unspent.find(out => out.tx === input.tx && out.index === input.index)) { throw TransactionError('Input has been already spent: ' + input.tx); }
		});
	}
	if (transaction.reward === 'mined') {
		if (transaction.outputs.length !== 1) throw TransactionError('Reward transaction must have exactly one output');
		if (transaction.outputs[0].amount !== config.reward) throw TransactionError(`Mining reward must be exactly: ${config.reward}`);
	} else if (transaction.inputs) {
		if (transaction.inputs.reduce((acc, input) => acc + input.amount, 0) !==
      transaction.outputs.reduce((acc, output) => acc + output.amount, 0)) { throw TransactionError('Input and output amounts do not match'); }
	}
	return true;
};
const validateTransactions = async (transactions, unspent) => {
	const _transactions = [];
	for (const {multihash} of transactions) {
		const { value } = await global.ipfs.dag.get(multihash);
		const tx = new LFCTx$1(value);
		_transactions.push({multihash, value: tx.toJSON()});
	}
	for (const {value, multihash} of _transactions) {
		await validateTransaction(multihash, value, unspent);
	}
	if (_transactions.filter(({value}) => value.reward === 'mined').length !== 1)
		throw TransactionError('Transactions cannot have more than one reward')
};
const newTransaction = async (inputs, outputs, reward$$1 = null) => {
	try {
		const tx = new LFCTx$1({
			id: crypto.randomBytes(32).toString('hex'),
			time: Math.floor(new Date().getTime() / 1000),
			reward: reward$$1,
			outputs,
			inputs
		});
		const cid = await util$3.cid(tx.serialize());
		debug(`create transaction: ${tx}`);
		await global.ipfs.dag.put(tx, {format: util$3.codec, hashAlg: util$3.defaultHashAlg, version: 1, baseFormat: 'base58btc'});
		return { multihash: cid.toBaseEncodedString(), size: tx.size};
	} catch (e) {
		throw e
	}
};
const consensusSubsidy = height => {
	const quarterlings = height / consensusSubsidyInterval;
	if (quarterlings >= 256) {
		return 0;
	}
	const minus = quarterlings >= 1 ? (quarterlings * (reward / 256)) : 0;
	return reward - minus;
};
const createRewardTransaction = async (address, height) => {
	return newTransaction([], [{index: 0, amount: consensusSubsidy(height), address}], 'mined');
};
const createInput = (tx, index, amount, wallet) => {
	const input = {
		tx,
		index,
		amount,
		address: wallet.address,
	};
	input.signature = wallet.sign(Buffer.from(transactionInputHash(input), 'hex')).toString('hex');
	return input;
};
const buildTransaction = async (wallet, toAddress, amount) => {
	let inputsAmount = 0;
	const unspent = await getUnspentForAddress(wallet.address);
	const inputsRaw = unspent.filter(i => {
		const more = inputsAmount < amount;
		if (more) inputsAmount += i.amount;
		return more;
	});
	if (inputsAmount < amount) throw TransactionError('Not enough funds');
	const inputs = inputsRaw.map(i => createInput(i.tx, i.index, i.amount, wallet));
	const outputs = [{index: 0, amount, address: toAddress}];
	if (inputsAmount - amount > 0) {
		outputs.push({index: 1, amount: inputsAmount - amount, address: wallet.address});
	}
	return newTransaction(inputs, outputs);
};

const or = (a, b) => a ? a : b;

class Miner extends cryptoStore.StoreHandler {
  get donationAddress() {
    return 'cpc';
  }
  set job(value) {
    this._job = value;
  }
  get job() {
    return this._job;
  }
  constructor(address, intensity, autostart) {
    super();
    this.workerPath = path.join(__dirname, 'miner-worker.js');
    this.address = address;
    this.running = 0;
    if (autostart) {
      this.start();
    }
  }
  onBlockAdded() {
    return new Promise((resolve, reject) => {
      this._onBlockAdded = block => {
        this.mineStop();
        __chunk_1.bus.removeListener('block-added', this._onBlockAdded);
        __chunk_1.bus.removeListener('invalid-block', this._onBlockInvalid);
        resolve(block);
      };
      this._onBlockInvalid = block => {
        this.mineStop();
        __chunk_1.bus.removeListener('block-added', this._onBlockAdded);
        __chunk_1.bus.removeListener('invalid-block', this._onBlockInvalid);
        resolve(null);
      };
      __chunk_1.bus.once('block-added', this._onBlockAdded);
      __chunk_1.bus.once('invalid-block', this._onBlockInvalid);
    });
  }
  async start() {
    this.mining = true;
    if (!this.job) this.job = Math.random().toString(36).slice(-11);
    this.mine(this.job);
  }
  stop() {
    this.mining = false;
    this.mineStop();
  }
  async mine(job, lastValidBlock) {
    const address = this.address || this.donationAddress;
    const start = Date.now();
    const {block, hashes: hashes$$1, index} = await this.mineBlock(difficulty(), address, job);
    if (hashes$$1) {
      const now = Date.now();
      const seconds = (now - start) / 1000;
      const rate = (hashes$$1 / seconds) / 1000;
      __chunk_1.bus.emit('miner.hashrate', {uid: job, hashrate: (Math.round(rate * 100) / 100)});
    }
    if (block) {
      global.ipfs.pubsub.publish('block-added', Buffer.from(JSON.stringify(block)));
      console.log(`${job}::Whooooop mined block ${block.index}`);
      if (this.mining) {
        await this.onBlockAdded();
        this.mine(job, block);
      }
    } else {
      console.log(`${job}::cancelled mining block ${index}`);
      if (this.mining) this.mine(job);
    }
  }
  async mineBlock(difficulty$$1, address, job) {
    const block = await nextBlock(address);
    console.log(`${job}::Started mining block ${block.index}`);
    return this.findBlockHash(block, difficulty$$1);
  }
  findBlockHash (block, difficulty$$1) {
    return new Promise((resolve, reject) => {
      const worker = child_process.fork(this.workerPath);
      this.mineStop = () => {
       removeListeners();
       worker.kill('SIGINT');
       resolve({block: null, hashCount: null, index: block.index});
      };
      const blockAddedListener = b => {
        if (b.index >= block.index) this.mineStop();
      };
      const mineStopListener = b => this.mineStop;
      const removeListeners = () => {
       __chunk_1.bus.removeListener('block-added', blockAddedListener);
       __chunk_1.bus.removeListener('mine-stop', mineStopListener);
      };
      __chunk_1.bus.once('block-added', blockAddedListener);
      __chunk_1.bus.once('mine-stop', mineStopListener);
      worker.on('message', (data) => {
        removeListeners();
        resolve({block: data.block, hashes: data.hashCount});
        worker.kill('SIGINT');
      });
      worker.send({block, difficulty: difficulty$$1});
    });
  }
}

const miners = [];
globalThis.bus = globalThis.bus || __chunk_1.bus;
globalThis.states = globalThis.states || {
  ready: false,
  syncing: false,
  connecting: false,
  mining: false
};
const blockHashSet$2 = globalThis.blockHashSet;
const state = (key, wait) => new Promise(async (resolve, reject) => {
  const state = await globalThis.states[key];
  if (wait && !state || wait && wait === 'event') __chunk_1.bus.once(key, state => resolve(state));
  else resolve(state);
});
const getConfig = async () => await cryptoIoFs.read(configPath, 'json');
const setConfig = async data => await cryptoIoFs.write(configPath, JSON.stringify(data));
const setMinerConfig = async minerConfig => {
  const data = await getConfig();
  data.miner = minerConfig;
  await setConfig(data);
  return;
};
const block$1 = async (height) => {
  await state('ready', true);
  if (!height) return chain[chain.length - 1];
  if (typeof height !== 'string') return chain[height]
  return chain[blockHashSet$2[height]];
};
const blocks = async (number, last) => {
  await state('ready', true);
  console.log(number, last);
  if (!number) return leofcoin.chain.get();
  else if (last) {
    return chain.slice((chain.length - number), chain.length);
  } else return block$1(number);
};
const transactions = async (number, last) => {
  await state('ready', true);
  if (!number) return chain[chain.length - 1].transactions.map(tx => {
    tx.parentHash = chain[chain.length - 1].hash;
    return tx;
  });
  let blocks;
  if (last) blocks = chain.slice((chain.length - number), chain.length);
  else blocks = chain.slice(0, number + 1);
  const tx = blocks.reduce((p, c) => [...p, ...c.transactions.map(tx => {
    tx.parentHash = c.hash;
    return tx;
  })], []);
  if (tx.length < number) {
    return transactions(number + 10, last)
  }
  if (last) return tx.slice((tx.length - number), tx.length)
  else return tx.slice(0, number)
};
const mine = async config => {
  await state('ready', true);
  let { address, intensity, donationAddress, donationAmount } = config;
  if (!intensity) intensity = 1;
  if (intensity && typeof intensity === 'string') intensity = Number(intensity);
  console.log({ address, intensity, donationAddress, donationAmount });
  if (donationAddress && donationAmount === 'undefined') donationAmount = 3;
  const addMiner = count => {
    for (var i = 0; i < count; i++) {
      const miner = new Miner();
      miner.address = address;
      miner.start();
      miners.push(miner);
    }
  };
  if (globalThis.states.mining && miners.length === intensity) {
    miners.forEach(miner => miner.stop());
    globalThis.states.mining = false;
  } else if (!globalThis.states.mining && miners.length === intensity) {
    miners.forEach(miner => miner.start());
    globalThis.states.mining = true;
  } else {
    if (miners.length > 0 && miners.length === intensity) {
      miners.forEach(miner => {
        miner.address = address;
      });
    } else if (miners.length > intensity) {
      const removeCount = miners.length - intensity;
      const removed = miners.slice(0, removeCount);
      removed.forEach(miner => miner.stop());
    } else if (miners.length < intensity && miners.length > 0) {
      const addCount = intensity - miners.length;
      addMiner(addCount);
    } else {
      addMiner(intensity);
    }
    globalThis.states.mining = true;
  }
};
const createWallet = async () => {
  const wallet = await generateWallet();
  console.log(wallet);
  console.log(wallet.mnemonic);
  return wallet;
};
const accounts = async (discoverDepth = 0) => {
  let wallet;
  let accounts = undefined;
  try {
    wallet = await loadWallet();
    await state('ready', true);
    accounts = discoverAccounts(wallet, discoverDepth);
  } catch (e) {
    console.log('readied');
  }
  return accounts;
};
const accountNames = async () => {
  const path$$1 = path.join(APPDATAPATH, 'account');
  let data;
  try {
    data = await cryptoIoFs.read(path$$1);
    data = JSON.parse(data.toString());
  } catch (e) {
    if (e.code === 'ENOENT') {
      data = ['main account'];
      await cryptoIoFs.write(path$$1, JSON.stringify(data));
    }
  }
  return data;
};
const _addresses = ([account], depth = 0) => {
  return [account.external(0).address, account.internal(0).address];
};
const addresses = async () => {
  let _accounts = await accounts();
  const names = await accountNames();
  if (_accounts) return _accounts.map((account, i) => [or(names[i], i), _addresses(account, i)]);
  return undefined;
};
const getMinerConfig = async () => {
  const data = await getConfig();
  if (!data.miner.address) {
    const _ = await addresses();
    data.miner.address = _[0][1][0];
    await setMinerConfig(data.miner);
  }
  return data.miner;
};
const send = async ({from, to, amount, message}, response) => {
  let value;
  try {
    let wallet = loadWallet();
    let _accounts = await accounts();
    const names = await accountNames();
    value = await buildTransaction(_accounts[names.indexOf(from[1])][0].external(0), to, parseInt(amount));
    const tx = await leofcoin.transaction.get(value.multihash);
    globalThis.ipfs.pubsub.publish('announce-transaction', JSON.stringify(value));
    tx.hash = value.multihash;
    value = tx;
  } catch (e) {
    throw e;
  }
  return value;
};
const balance = getBalanceForAddress;
const balanceAfter = getBalanceForAddressAfter;
const on = (ev, cb) => __chunk_1.bus.on(ev, cb);

globalThis.leofcoin = globalThis.leofcoin || {};
const sync = async () => {
  try {
    const localIndex$$1 = await chainStore.get('localIndex');
    const c = await chainStore.get('localBlock');
    await ipfs.name.publish(c);
    const { hash, index } = await longestChain();
    console.log(localIndex$$1, index, c);
    if (index > Number(localIndex$$1)) {
      leofcoin.currentBlockHash = hash || await localDAGMultiaddress();
      leofcoin.currentBlockNode = await leofcoin.block.dag.get(leofcoin.currentBlockHash);
    } else {
      if (index === 0) leofcoin.currentBlockHash = genesisCID;
      else leofcoin.currentBlockHash = c || await localDAGMultiaddress();
      leofcoin.currentBlockNode = await leofcoin.block.dag.get(leofcoin.currentBlockHash);
    }
    log(`current block hash : ${leofcoin.currentBlockHash}`);
    log(`current block size: ${Math.round(Number(leofcoin.currentBlockNode.size) * 1e-6 * 100) / 100} Mb (${leofcoin.currentBlockNode.size} bytes)`);
    return leofcoin.currentBlockHash
  } catch (e) {
    throw e
  }
};
const localBlock = async () => {
  try {
    const multihash = await chainStore.get('localBlock');
    const index = await chainStore.get('localIndex');
    if (index === undefined) {
      debug(`invalid block detected, recovering local chain`);
      await chainStore.put('localBlock', genesisCID);
      await chainStore.put('localIndex', 0);
      return localBlock();
    } else {
      debug(`current local block: ${index} - ${multihash}`);
    }
    return {
      index,
      multihash
    }
  } catch (e) {
    console.log(e);
    await chainStore.put('localBlock', genesisCID);
    await chainStore.put('localIndex', 0);
    return await localBlock();
  }
};
const resolveBlocks = async (node, index) => {
  const cid = await ipldLfc.util.cid(node.serialize());
  chain[node.index] = node.toJSON();
  chain[node.index].hash = cid.toBaseEncodedString();
  leofcoin.hashMap.set(node.index, cid.toBaseEncodedString());
  debug(`loaded block: ${node.index} - ${chain[node.index].hash}`);
  if (node.prevHash !== Buffer.alloc(47).toString('hex')) {
      node = await leofcoin.block.dag.get(node.prevHash);
      if (node.index > index) {
        debug(`added block: ${node.index}`);
      }
    try {
      if (node.prevHash && node.prevHash !== Buffer.alloc(47).toString('hex')) {
        return resolveBlocks(node, index);
      }
      return;
    } catch (e) {
      console.error(e);
    }
  }
  return
};
const updateLocals = async (cid, index) => {
  if (cid.isCid && cid.isCid()) cid = cid.toBaseEncodedString();
  try {
    debug(`updating chainStore to ${index}`);
    await chainStore.put(index, cid);
    debug(`writing cid ${cid} to chainStore`);
    await chainStore.put('localBlock', cid);
    debug(`writing index ${index} to chainStore`);
    await chainStore.put('localIndex', index);
  } catch (error) {
    throw error
  }
};
const resync = async (block) => {
  try {
    console.log('syncing');
    if (!block) {
      await leofcoin.chain.sync();
    } else {
      leofcoin.currentBlockNode = new ipldLfc.LFCNode(block);
      leofcoin.currentBlockHash = leofcoin.currentBlockNode.hash;
    }
    debug(leofcoin.currentBlockNode.toString());
    if (leofcoin.currentBlockNode) {
      const { index, multihash } = await localBlock();
      debug(`local block index: ${index}`);
      const height = leofcoin.currentBlockNode.index;
      let syncCount = height - index;
      debug(`local chain height: ${index}`);
      debug(`network chain height: ${height}`);
      debug(`syncing ${syncCount > 0 ? syncCount : 0} block(s)`);
      const start = Date.now();
      if (index > height) {
        const value = await leofcoin.block.dag.get(multihash);
        await resolveBlocks(value, index);
      }
      else await resolveBlocks(leofcoin.currentBlockNode, index);
      const end = Date.now();
      const time = end - start;
      debug(time / 1000);
      if (syncCount > 0) {
        await updateLocals(chain[leofcoin.currentBlockNode.index].hash, height);
      }
    } else {
      chain[0] = GENESISBLOCK;
      chain[0].index = 0;
      chain[0].hash = genesisCID;
    }
  } catch (e) {
    chain[0] = GENESISBLOCK;
    chain[0].index = 0;
    chain[0].hash = genesisCID;
    await updateLocals(genesisCID, 0);
    console.error('syncChain', e);
  }
  return;
};
class GlobalScope {
  constructor(params$$1, api) {
    globalThis.api = api;
    return this._init(params$$1)
  }
  async _init({discoClientMap, ipfs, peerId, discoServer}) {
    this.discoServer = discoServer;
    globalThis.peerId = peerId;
    globalThis.ipfs = ipfs;
    globalThis.getTx = async multihash => ipfs.dag.get(multihash, { format: ipldLfcTx.LFCTx.codec, hashAlg: ipldLfcTx.LFCTx.defaultHashAlg, vesion: 1, baseFormat: 'base58btc' });
    leofcoin.sync = sync;
    leofcoin.dial = async (addr, protocol = 'disco') => {
      console.log(addr);
      await SocketClient(addr, protocol);
      console.log(leofcoin.peers);
      console.log(leofcoin.peerMap);
      console.log(leofcoin.discoClientMap);
    };
    console.log(discoServer);
    leofcoin.peers = this.discoServer.connections;
    leofcoin.peerMap = this.discoServer.peerMap;
    leofcoin.discoClientMap = discoClientMap;
    leofcoin.request = async (url, params$$1) => {
      const requests = [];
      for (const connection of leofcoin.peers.values()) {
        if (connection.request) {
          requests.push(connection.request({url, params: params$$1}));
        }
      }
      return Promise.race(requests)
    };
    leofcoin.block = {
      get: async multihash => {
        const node = await leofcoin.block.dag.get(multihash);
        return node.toJSON()
      },
      dag: {
        get: async multihash => {
          try {
            const { value, remainderPath } = await ipfs.dag.get(multihash, { format: ipldLfc.LFCNode.codec, hashAlg: ipldLfc.LFCNode.defaultHashAlg, vesion: 1, baseFormat: 'base58btc'});
            value.transactions = [...value.transactions];
            return new ipldLfc.LFCNode({...value})
          } catch (e) {
            throw e
          }
        }
      }
    };
    leofcoin.message = {
      get: async multihash => {
        const node = await leofcoin.block.dag.get(multihash);
        return node.toJSON()
      },
      dag: {
        get: async multihash => {
          const { value, remainderPath } = await ipfs.dag.get(multihash, { format: ipldLfc.LFCNode.codec, hashAlg: ipldLfc.LFCNode.defaultHashAlg, vesion: 1, baseFormat: 'base58btc'});
          value.transactions = [...value.transactions];
          return new ipldLfc.LFCNode({...value})
        }
      }
    };
    leofcoin.pin = {
      add: async hash => await ipfs.pin.add(hash),
      rm: async hash => await ipfs.pin.rm(hash)
    };
    leofcoin.transaction = {
      get: async multihash => {
        const node = await leofcoin.transaction.dag.get(multihash);
        return node.toJSON()
      },
      dag: {
        get: async multihash => {
          const {value} = await ipfs.dag.get(multihash, { format: ipldLfcTx.LFCTx.codec, hashAlg: ipldLfcTx.LFCTx.defaultHashAlg, vesion: 1, baseFormat: 'base58btc' });
          return new ipldLfcTx.LFCTx(value)
        },
        put: async node => {
          await ipfs.dag.put(node, { format: 'leofcoin-tx', hashAlg: 'keccak-256', version: 1});
          return
        }
      }
    };
    leofcoin.hashMap = new Map();
    leofcoin.chain = {
      sync: sync,
      resync: resync,
      updateLocals:  updateLocals,
      get: async hash => {
        if (!hash) {
          const blocks = [];
          for (const [index, multihash] of leofcoin.hashMap.entries()) {
            const block = await leofcoin.block.dag.get(multihash);
            const _transactions = [];
            for (const {multihash} of block.transactions) {
              const transaction = await leofcoin.transaction.get(multihash);
              _transactions.push(transaction);
            }
            block.transactions = _transactions;
            blocks[index] = block;
          }
          return blocks
        }
        if (!isNaN(hash)) hash = await leofcoin.hashMap.get(hash);
        return leofcoin.block.get(hash)
      },
      dag: {
        get: async hash => {
          if (!hash) {
            const blocks = [];
            for (const [index, multihash] of leofcoin.hashMap.entries()) {
              const block = await leofcoin.block.dag.get(multihash);
              blocks[index] = block;
            }
            return blocks
          }
          if (!isNaN(hash)) hash = await leofcoin.hashMap.get(hash);
          return leofcoin.block.dag.get(hash)
        }
      }
    };
    leofcoin.pubsub = {
      publish: async (topic, value) => {
        for (const connection of this.discoServer.connections.values()) {
          if (connection.pubsub) {
            await connection.pubsub.publish(topic, value);
          }
        }
        return
      },
      subscribe: async (topic, handler) => {
        for (const connection of this.discoServer.connections.values()) {
          if (connection.pubsub) {
            await connection.pubsub.subscribe(topic, handler);
          }
        }
        return
      },
      unsubscribe: async (topic, handler) => {
        for (const connection of this.discoServer.connections.values()) {
          if (connection.pubsub) {
            await connection.pubsub.unsubscribe(topic, handler);
          }
        }
        return
      }
    };
  }
  get api() {
    return {
      chainHeight: () => (globalThis.chain.length - 1),
      blockHash: ({value}) => {
        return globalThis.chain[value].hash
      },
      lastBlock: () => {
        const index = (globalThis.chain.length - 1);
        return globalThis.chain[index]
      }
    }
  }
}

globalThis.bus = globalThis.bus || __chunk_1.bus;
globalThis.peerMap = globalThis.peerMap || new Map();
const exec = os.platform() === 'win32' ? './ipfs.exe' : './ipfs';
var core = async (config$$1 = {}) => {
  if (config$$1.debug) process.env.DEBUG = true;
	try {
    const now = Date.now();
    const config$$1 = await getUserConfig();
    __chunk_1.bus.emit('stage-one');
    debug('starting ipfs');
    const api = await new LfcApi({ init: true, start: true, bootstrap: 'lfc', forceJS: true });
    console.log(api);
    console.log('ap');
    try {
      await new GlobalScope(api);
    } catch (e) {
      console.log({e});
    } finally {
    }
    const ipfsd_now = Date.now();
    await connectBootstrap();
    const bootstrap_now = Date.now();
    globalThis.getPeers = () => disco.peers || [];
    const signal_now = Date.now();
    process.on('exit', async () => {
      console.log('exit');
        try {
          await ipfs.pubsub.unsubscribe('block-added');
          await ipfs.pubsub.unsubscribe('announce-transaction');
          await ipfs.pubsub.unsubscribe('invalid-transaction');
        } catch (e) {
          console.log(e);
        }
    });
    process.on('close', () => {
      console.log('close');
    });
    process.on('SIGINT', async () => {
      console.log("Caught interrupt signal");
      setTimeout(async () => {
        process.exit();
      }, 50);
    });
    const connection_now = Date.now();
    __chunk_1.bus.emit('stage-two');
    groupCollapsed('Initialize', () => {
      log(`ipfs daemon startup took: ${(ipfsd_now - now) / 1000} seconds`);
      log(`connecting with bootstrap took: ${(bootstrap_now - ipfsd_now) / 1000} seconds`);
      log(`signal server startup took: ${(signal_now - bootstrap_now) / 1000} seconds`);
      log(`peer connection took: ${(connection_now - ipfsd_now) / 1000} seconds`);
      log(`total load prep took ${(Date.now() - now) / 1000} seconds`);
    });
    await cryptoIoFs.write(configPath, JSON.stringify(config$$1, null, '\t'));
    const chain = new DAGChain({ genesis, network, ipfs: api.ipfs });
    await chain.init(genesis);
    return chain;
	} catch (e) {
    if (e.code === 'ECONNREFUSED' || e.message && e.message.includes('cannot acquire lock')) {
      console.log('retrying');
    }
		console.error(`load-error::${e}`);
	}
};

const userDataDir = path.join(os.homedir(), '.leofcoin');
const busPath = path.join(__dirname, 'bus.js');
(async () => {
  const app = await carlo.launch({
    bgcolor: '#fff',
    width: 1400,
    height: 840,
    userDataDir,
    title: 'leofcoin',
    domain: 'leofcoin.org',
    ignoreDefaultArgs: ['--disable-extensions']
  });
  console.log('before');
  await core();
  app.serveFolder(path.join(__dirname , 'www'));
  const bus = await rpc.rpc_process.spawn(busPath);
  app.on('exit', () => {
    process.exit();
  });
  app.on('window', window => {
    window.load('index.html', rpc.rpc.handle(app), bus);
  });
  await app.exposeFunction('accountNames', accountNames);
  await app.exposeFunction('balance', balance);
  await app.exposeFunction('balanceAfter', balanceAfter);
  await app.exposeFunction('accounts', accounts);
  await app.exposeFunction('addresses', addresses);
  await app.exposeFunction('state', state);
  await app.load('index.html', rpc.rpc.handle(app), bus);
  await app.exposeFunction('cores', () => cores);
  await app.exposeFunction('createWallet', createWallet);
  await app.exposeFunction('send', send);
  await app.exposeFunction('mine', mine);
  await app.exposeFunction('setMinerConfig', setMinerConfig);
  await app.exposeFunction('getMinerConfig', getMinerConfig);
  await app.exposeFunction('peers', () => ipfs.swarm.peers());
  await app.exposeFunction('peerMap', () => leofcoin.peerMap);
  await app.exposeFunction('discoClientMap', () => leofcoin.discoClientMap);
  await app.exposeFunction('subscribe', (event, fn) => {
    pubsub.subscribe(event, fn);
  });
  await app.exposeFunction('blocks', async (number = 0, last) => {
    const _blocks = await blocks(number, last);
    const __blocks = [];
    for (const block of _blocks) {
      const _transactions = [];
      console.log(block.transactions, block.index);
      for (const { multihash } of block.transactions) {
        if (multihash) {
          console.log(multihash);
          const tx = await leofcoin.transaction.get(multihash);
          _transactions.push(tx);
        }
      }
      block.transactions = _transactions;
      __blocks.push(block);
    }
    console.log({__blocks});
    return __blocks
  });
  await app.exposeFunction('block', block$1);
  await app.exposeFunction('transaction', async multihash => leofcoin.transaction.get(multihash));
  await app.exposeFunction('transactions', async (number = 0, last) => {
    const _transactions = await transactions(number, last);
    const __transactions = [];
    for (const { multihash } of _transactions) {
        const tx = await leofcoin.transaction.get(multihash);
        __transactions.push(tx);
    }
    return __transactions
  });
  await app.exposeFunction('blockHashSet', () => {
    return blockHashSet
  });
  on('miner.hashrate', data => bus.emit('miner.hashrate', data));
  on('block-added', data => bus.emit('block-added', data));
  on('peer:connect', data => {
    console.log({data});
     bus.emit('peer:connect', data);
  });
})();
