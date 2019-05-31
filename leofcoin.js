'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var carlo = require('carlo');
var leofcoinHash = require('leofcoin-hash');
var __chunk_1 = require('./chunk-fe199f6b.js');
var cryptoJs = require('crypto-js');
var cryptoChainValidator = require('crypto-chain-validator');
require('cids');
var ipldDagPb = require('ipld-dag-pb');
var crypto = require('crypto');
var cryptoStore = require('crypto-store');
var child_process = require('child_process');
var MultiWallet = _interopDefault(require('multi-wallet'));
var Repo = require('ipfs-repo');
var IPFSFactory = require('ipfsd-ctl');
var path = require('path');
var fs = require('fs');
var os = require('os');
var chalk = _interopDefault(require('chalk'));
var repoConfigs = require('repo-configs');
var del = _interopDefault(require('del'));
var normalizeNewline = _interopDefault(require('normalize-newline'));
var multiaddr = _interopDefault(require('multiaddr'));
var fs$1 = require('crypto-io-fs');
var bs58 = require('bs58');
var Channel = _interopDefault(require('ipfs-pubsub-1on1'));
var PeerMonitor = _interopDefault(require('ipfs-pubsub-peer-monitor'));
var cores = _interopDefault(require('physical-cpu-count'));
var EventEmitter = _interopDefault(require('events'));
var rpc = require('carlo/rpc');

const argv = process.argv;
const networks = {
	'leofcoin': path.join(os.homedir(), '.leofcoin'),
	'olivia': path.join(os.homedir(), '.leofcoin/olivia')
};
const network = (() => {
  const index = argv.indexOf('--network');
  return process.env.NETWORK || (index > -1) ? argv[index + 1] : 'leofcoin';
})();
const genesis = (() => {
	if (argv.indexOf('genesis') !== -1) return true;
	if (argv.indexOf('init') !== -1) return true;
  return false;
})();
const verbose = Boolean([
  argv.indexOf('-v'),
  argv.indexOf('--verbose'),
  process.env.VERBOSE ? 1 : -1
].reduce((p, c) => {
  if (c > p) return c;
  return Number(p)
}, -1) >= 0);
if (verbose) {
  process.env.DEBUG = true;
}
const olivia = process.argv.includes('olivia') || process.argv.includes('testnet');
const AppData = path.join(os.homedir(), 'AppData', 'Roaming', olivia ? 'Leofcoin/olivia' : 'Leofcoin');
const netHash = net => bs58.encode(leofcoinHash.keccak(Buffer.from(`${net}-`), 256)).slice(0, 24);
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
const walletPath = path.join(APPDATAPATH, 'wallet.dat');
const mainNethash = netHash('leofcoin');
const subnetHash = net => {
  const prefix = mainNethash.slice(0, 4);
  const hash = netHash(net);
  return `${prefix}${hash.slice(4, hash.length)}`
};
const testNethash = subnetHash('olivia');
const netPrefix = (() => network === 'leofcoin' ? mainNethash : testNethash)();
const signalServers = (() => {
  if (network === 'olivia') return [
    '/ip4/162.208.10.171/tcp/4002/ipfs/QmVDtTRCoYyYu5JFdtrtBMS4ekPn8f9NndymoHdWuuJ7N2'
  ]
  else return [
    '/ip4/162.208.10.171/tcp/4002/ipfs/QmXWTPiAg52FH87p7nVMcJVmMUzmLVLRDpT1yh1apb9xKr'
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
const genesisCID = '12200000033624b02b66ada5eaa1c8d2cf91be556ef3851781166f395ae8fbbcc19a';
const GENESISBS58 = 'cQeU4erNtZim35iksuW8ZuD6TLjhw887XNBCq2sCWt4RBZRyhj2ZRJXnPFM36XKTDXLKTMi4yYPejfbsxhKPvngd5YVcLPotKXNBN';
const GENESISBLOCK = (() => {
	const block = JSON.parse(Buffer.from(bs58.decode(GENESISBS58)).toString());
	block.hash = genesisCID.substring(4);
	return block;
})();
const localDAGMultiaddress = async () => {
  try {
    const address = await fs$1.read(localDAGAddress, 'string');
    return address;
  } catch (e) {
    console.warn(`initial run::${e}`);
  }
};

const writeWallet = async multiWIF => await fs$1.write(walletPath, JSON.stringify(multiWIF));
const readWallet = async () => await fs$1.read(walletPath, 'json');
const generateWallet = async () => {
	console.log(`Generating wallet for network ${network}`);
  const config = await fs$1.read(networkConfigPath, 'json');
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
const _discoverAccounts = (account, depth = 0) => {
  const accounts = [];
  const discover = (account, depth) => {
    const external = account.external(depth);
    console.log(external);
    const internal = account.internal(depth);
    const tx = [];
    accounts.push(account);
    global.chain.forEach(({ transactions }) => {
      if (accounts[external.address] || accounts[internal.address]) return;
      transactions.forEach(({inputs, outputs}) => {
        if (tx[internal.address] || tx[external.address]) return;
        if (inputs) inputs.forEach((i) => {
          if (i.address === internal.address) return tx.push(internal.address);
          if (i.address === external.address) return tx.push(external.address);
        });
        if (outputs) outputs.forEach((o) => {
          if (o.address === internal.address) return tx.push(internal.address);
          if (o.address === external.address) return tx.push(external.address);
        });
      });
    });
    if (tx.length > 0) return discover(account, depth + 1);
    return accounts;
  };
  return discover(account, 0);
};
const discoverAccounts = (root) => {
  let accounts = [];
  const discover = depth => {
    const account = root.account(depth);
    const _accounts = _discoverAccounts(account);
    console.log(_accounts);
    accounts = [...accounts, _accounts];
		if (_accounts.length > 1) return discover(depth + 1);
    return accounts;
  };
  return discover(0);
};
const loadWallet = async () => {
  try {
    const saved = await readWallet();
    const root = new MultiWallet(network === 'olivia' ? 'leofcoin:olivia' : 'leofcoin');
    console.log(saved);
    root.import(saved.multiWIF);
    console.log(root.account(0));
    return root;
  } catch (e) {
    throw e;
  }
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
	if (process.env.DEBUG) {
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
const multihashFromHex = hex => {
  return bs58.encode(Buffer.from(`1220${hex}`, 'hex'));
};
const getUserConfig = new Promise(resolve => {
	fs$1.read(configPath, 'json')
    .then(config => resolve(config))
		.catch(async error => {
			if (error.code !== 'ENOENT') {
				console.error(error);
			}
			resolve(await defaultConfig());
			debug('new config file created');
		});
});

const invalid = (name, text) => new Error(`Invalid ${name}: ${text}`);
const BlockError = text => invalid('block', text);
const TransactionError = text =>	invalid('transaction', text);

const _SHA256 = (object) => {
	return cryptoJs.SHA256(JSON.stringify(object)).toString();
};
const transactionHash = (transaction) => {
	const {id, type, inputs, outputs} = transaction;
	return _SHA256({id, type, inputs, outputs});
};
const transactionInputHash = (transactionInput) => {
	const {tx, index, amount, address} = transactionInput;
	return _SHA256({tx, index, amount, address});
};

var createDAGNode = async ({prevHash, time, transactions, reward, nonce}) => {
	return new Promise((resolve, reject) => {
		ipldDagPb.DAGNode.create(JSON.stringify({
			prevHash,
			time,
      transactions,
      reward,
			nonce
		}), [], (error, dagNode) => {
			if (error) {
				return reject(error);
			}
      ipldDagPb.util.cid(dagNode, {
        version: 1,
        hashAlg: 'sha3-256'
      }, (err, cid) => {
        dagNode.multihash = cid.multihash;
		    return resolve(dagNode);
      });
		});
	});
};

var calculateHash = async block => {
  block = await createDAGNode(block);
  return block.multihash.toString('hex').substring(4);
};

class DAGBlock {
	constructor(ipfs, options) {
    if (!ipfs) return console.warn('options and ipfs expected');
		this.ipfs = ipfs;
	}
	async newBlock({transactions, previousBlock, address}) {
		transactions.push(createRewardTransaction(address, previousBlock.index + 1));
		this.data = {
			index: previousBlock.index + 1,
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
	async get(hash) {
		this.node = await this.ipfs.dag.get(hash);
    return JSON.parse(this.node.value.data.toString(), hash)
	}
	async put(block) {
		this.node = await createDAGNode(block || this.data);
		return await this.ipfs.object.put(this.node);
	}
}
const validate = async (previousBlock, block, difficulty, unspent) => {
    console.log(block);
	if (!cryptoChainValidator.isValid('block', block)) throw BlockError('data');
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
const pubsub = {
	subscribe: (channel, cb) => global.ipfs.pubsub.subscribe(channel, cb),
	publish: (channel, cb) => global.ipfs.pubsub.publish(channel, cb)
};
const id = () => global.ipfs.id();
var ipfs = {
	id,
	swarm,
	config: config$1,
	pubsub
};

const { promisify } = require('util');
const getPeerId = address => String(address).split('/ipfs/')[1];
let done = false;
let runs = 0;
const resolvePeers = () => new Promise(resolve => {
  if (runs === 2) {
    debug('searched for peers but none found, returning empty array');
    runs = 0;
    return resolve([]);
  }
  const resolves = peers => {
    done = true;
    runs = 0;
    resolve(peers);
  };
  ipfs.swarm.peers().then(peers => resolves(peers));
  runs++;
  if (!done) setTimeout(() => resolvePeers().then(peers => resolves(peers)), 500);
});
const resolveAddresses = async () => {
  const peers = await resolvePeers();
  return peers.map(({addr, peer}) => `${addr.toString()}/ipfs/${peer.toB58String()}`);
};
const getPeerAddresses = async peers => {
  const id$$1 = global.id;
  const set = [];
  if (global.peerset.size === 0) peers = await resolveAddresses();
  else peers = [...global.peerset.values()];
  for (var i = 0; i < peers.length; i++) {
    if (!peers[i].includes(id$$1) && signalServers.indexOf(peers[i]) === -1) set.push(peers[i]);
  }
  return set;
};
let conRuns = 0;
const _connect = async addresses =>
  new Promise(async (resolve, reject) => {
    try {
      conRuns++;
      await ipfs.swarm.connect(addresses);
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
  console.log(data.data.toString());
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
const nextBlockTransactions = () => {
	const unspent = getUnspent(false);
	return mempool$1.filter(async (transaction) => {
		try {
			return validateTransaction(transaction, unspent);
		} catch (e) {
      global.ipfs.pubsub.publish('invalid-transaction', new Buffer.from(JSON.stringify(transaction)));
			console.error(e);
		}
	});
};
const getTransactions = (withMempool = true, index = 0) => {
  const _chain = [...chain$1];
  _chain.slice(index, chain$1.length);
	let transactions = _chain.reduce((transactions, block) => transactions.concat(block.transactions), []);
	if (withMempool) transactions = transactions.concat(mempool$1);
	return transactions;
};
const getUnspent = (withMempool = false, index = 0) => {
	const transactions = getTransactions(withMempool, index);
	const inputs = transactions.reduce((inputs, tx) => inputs.concat(tx.inputs), []);
	const outputs = transactions.reduce((outputs, tx) =>
		outputs.concat(tx.outputs.map(output => Object.assign({}, output, {tx: tx.id}))), []);
	const unspent = outputs.filter(output =>
		typeof inputs.find(input => input.tx === output.tx && input.index === output.index && input.amount === output.amount) === 'undefined');
	return unspent;
};
const getUnspentForAddress = (address, index = 0) => {
	return getUnspent(true, index).filter(u => u.address === address);
};
const getBalanceForAddress = address => {
	return getUnspentForAddress(address).reduce((acc, u) => acc + u.amount , 0);
};
const getBalanceForAddressAfter = (address, index) => {
  return getUnspentForAddress(address, index).reduce((acc, u) => acc + u.amount , 0);
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
		stamps.push(10);
	}
	let blocksMedian = median(stamps) || 10;
  const offset = blocksMedian / 10;
	if (blocksMedian < 9) {
		blocksMedian -= offset;
	} else if (blocksMedian > 11) {
		blocksMedian += offset;
	}
  console.log(`Average Block Time: ${blocksMedian}`);
  console.log(`Difficulty: ${10 / blocksMedian}`);
	return 10000 / (10 / blocksMedian);
};
const longestChain = () => new Promise(async (resolve, reject) => {
  try {
    const addresses = await getPeerAddresses();
    const stats = [];
    for (const addr of addresses) {
      const id = getPeerId(addr);
      try {
        await global.ipfs.swarm.connect(addr);
        const ref = await global.ipfs.name.resolve(id);
        const hash = ref.replace('/ipfs/', '');
        const stat = await global.ipfs.object.stat(hash);
        stats.push({height: stat.NumLinks - 1, hash: stat.Hash});
      } catch (e) {
        if (e.code === 'ECONNREFUSED') {
          reject(e);
        }
        console.log(`Ignoring ${id}`);
      }
    }
    const stat = stats.reduce((p, c) => {
      if (c.height > p.height || c.height === p.height) return c;
      else return p;
    }, {height: 0, hash: null});
    resolve(stat);
  } catch (e) {
    reject(e);
  }
});
const nextBlock = async address => {
  let transactions;
  let previousBlock;
  try {
    previousBlock = chain$1[chain$1.length - 1];
    transactions = await nextBlockTransactions();
  } catch (e) {
    transactions = [];
  } finally {
    console.log(transactions, previousBlock, address);
    return await new DAGBlock(global.ipfs).newBlock({transactions, previousBlock, address});
  }
};
const newGenesisDAGNode = async (difficulty = 1, address = Buffer.alloc(32).toString('hex')) => {
  let dagnode;
  dagnode = await createDAGNode(tx);
  tx.hash = dagnode.multihash.toString('hex').substring(4);
  while (parseInt(block.hash.substring(0, 8), 16) >= difficulty) {
    tx.nonce++;
    dagnode = await createDAGNode(tx);
    tx.hash = dagnode.multihash.toString('hex').substring(4);
  }
  return dagnode;
};

class DAGChain extends EventEmitter {
  get link() {
    return this.name.replace('/ipfs/', '')
  }
  get links() {
    return this.node ? this.node.links : [];
  }
  get index() {
    const links = [];
    this.links.forEach(link => {
      links[link.name] = link;
    });
    return links.length > 0 ? links : [];
  }
  constructor({genesis: genesis$$1, ipfs}) {
    super();
    this.announceBlock = this.announceBlock.bind(this);
    this.chain = chain$1;
    this.ipfs = ipfs;
  }
  init() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.ipfs.pubsub.subscribe('block-added', this.announceBlock);
        await this.ipfs.pubsub.subscribe('invalid-transaction', invalidTransaction);
        log(`Running on the ${network} network`);
        await this.loadChain();
      } catch (error) {
        if (genesis) {
          log(`Creating genesis block on the ${network} network`);
          await this.newDAGChain();
        } else {
          reject(error);
        }
      }
    });
  }
  async resolve(name) {
    return await this.ipfs.name.resolve(name, {recursive: true});
  }
  async get(multihash) {
    const { value, remainderPath } = await this.ipfs.dag.get(multihash);
    return value
  }
  async put(DAGNode) {
    return await this.ipfs.object.put(DAGNode);
  }
  async pin(multihash) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.ipfs.pin.add(multihash, {recursive: true});
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
  async addLink(multihash, link) {
    const newDAGChain = await this.ipfs.object.patch.addLink(multihash, link);
    this.name = `/ipfs/${bs58.encode(newDAGChain.multihash)}`;
    this.node = await this.get(this.link);
    const published = await this.publish(bs58.encode(newDAGChain.multihash));
    return published;
  }
  async lastLink() {
    try {
      await this.sync();
      const height = Number(this.links.length) - 1;
      for (const link of this.links) {
        if (Number(link.name) === height) {
          return link.multihash;
        }
      }
    } catch (e) {
      console.error('Sync Error::', e);
    }
  }
  async sync() {
    const { hash } = await longestChain();
    this.name = hash || await localDAGMultiaddress();
    this.node = await this.get(this.link);
    log(`chain name: ${this.name}`);
    log(`chain size: ${Math.round(Number(this.node.size) * 1e-6 * 100) / 100} Mb`);
    return this.link;
  }
  async publish(multihash) {
    const published = await this.ipfs.name.publish(multihash);
    await this.pin(published['value']);
    return published['name']
  }
  async resolveBlocks(multihash, index) {
    try {
      const dagBlock = new DAGBlock(this.ipfs, bs58.encode(multihash));
      const block = await dagBlock.get(bs58.encode(multihash));
      const hash = multihash.slice(2);
      if (block.index > index) {
        await this.pin(bs58.encode(multihash));
        console.log(`added block: ${block.index}  ${hash.toString('hex')}`);
      }
      block.hash = hash.toString('hex');
      chain$1[block.index] = block;
      debug(`loaded block: ${block.index}  ${hash.toString('hex')}`);
      if (block.prevHash && block.prevHash.length > 3) {
        return this.resolveBlocks(Buffer.from(`1220${block.prevHash}`, 'hex'), index);
      }
      return;
    } catch (e) {
      console.error(e);
    }
  }
  async syncChain() {
    try {
      global.states.syncing = true;
      __chunk_1.bus.emit('syncing', true);
      if (this.index) {
        const { index } = await this.localBlock();
        const sync = await this.sync();
        const height = this.index.length - 1;
        const multihash = this.index[height].cid.multihash;
        let syncCount = height - index;
        debug(`local chain height: ${index}`);
        debug(`network chain height: ${height}`);
        debug(`syncing ${syncCount} block(s)`);
        const start = Date.now();
        await this.resolveBlocks(multihash, index);
        const end = Date.now();
        const time = end - start;
        console.log(time / 1000);
        if (syncCount > 0) {
          await this.updateLocals(multihash.toString('hex'), height, this.link);
        }
        await this.publish(this.link);
      }
      global.states.syncing = false;
      __chunk_1.bus.emit('syncing', false);
      return
    } catch (e) {
      console.error('syncChain', e);
    }
  }
  async localBlock() {
    try {
      const multihash = await fs$1.read(localCurrent, 'string');
      const current = await this.get(multihash);
      const { index } = JSON.parse(current.data.toString());      debug(`current local dag: ${multihash}`);
      return {
        index,
        multihash
      }
    } catch (e) {
      await fs$1.write(localCurrent, bs58.encode(Buffer.from(genesisCID, 'hex')));
      return await this.localBlock();
    }
  }
  async loadChain() {
    await this.syncChain();
    global.states.ready = true;
    __chunk_1.bus.emit('ready', true);
  }
  addBlock(block) {
    return new Promise(async (resolve, reject) => {
      log(`add block: ${block.index}  ${block.hash}`);
      await this.updateLocalChain(block);
      chain$1[block.index] = block;
      __chunk_1.bus.emit('block-added', block);
      await this.pin(multihashFromHex(block.hash));
      await this.updateLocals(`1220${block.hash}`, block.index, this.link);
      try {
      } catch (e) {
        console.warn(e);
      }
      block.transactions.forEach(transaction => {
        const index = mempool.indexOf(transaction);
        mempool.splice(index);
      });
    });
  }
  writeLocals(CID, DAGAdress) {
    CID = bs58.encode(Buffer.from(CID, 'hex'));
    debug(`writing CID ${CID} to ${localCurrent}`);
    debug(`writing DAGAdress ${DAGAdress} to ${localDAGAddress}`);
    return new Promise(async (resolve, reject) => {
      await fs$1.write(localCurrent, CID);
      await fs$1.write(localDAGAddress, DAGAdress);
      resolve();
    });
  }
  updateLocals(CID, height, DAGAdress) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.writeLocals(CID, DAGAdress);
      } catch (error) {
        await this.writeLocals(CID, DAGAdress);
      }
      resolve();
    });
  }
  async newDAGChain() {
    try {
      const genesisDAGNode = await newGenesisDAGNode(difficulty());
      const block = await this.put(genesisDAGNode);
      const chainDAG = await this.ipfs.object.new('unixfs-dir');
      const height = JSON.parse(genesisDAGNode.data.toString()).index;
      const newDAGChain = await this.ipfs.object.patch.addLink(chainDAG.multihash, {name: height, size: block.size, multihash: block.multihash});
      const CID = block.multihash.toString('hex');
      await this.updateLocals(CID, 0, bs58.encode(newDAGChain.multihash));
      succes('genesisBlock created');
      log(`genesisBlock: ${block.data.toString()}`);
      log(`genesis: ${bs58.encode(block.data)}\nCID:\t${CID}`);
      log(`DAGChain name ${bs58.encode(newDAGChain.multihash)}`);
      return;
    } catch (e) {
      console.error(e);
    }
  }
  async updateLocalChain(block) {
    const dagnode = new DAGBlock(global.ipfs);
    const cid = await dagnode.put(block);
    await this.addLink(this.link, {name: block.index, size: dagnode.node.size, cid});
    return;
  }
  async announceBlock({data, from}) {
      const block = JSON.parse(data.toString());
      try {
        await validate(chain$1[chain$1.length - 1], block, difficulty(), getUnspent());
        this.addBlock(block);
      } catch (error) {
        this.ipfs.pubsub.publish('invalid-block', new Buffer.from(JSON.stringify(block)));
        __chunk_1.bus.emit('invalid-block', block);
        return console.error(error);
      }
    }
}

const validateTransaction = (transaction, unspent) => {
	if (transaction.hash !== transactionHash(transaction)) throw TransactionError('Invalid transaction hash');
	transaction.inputs.forEach(input => {
  	const { signature, address } = input;
		const hash = transactionInputHash(input);
  	let wallet = new MultiWallet(network === 'olivia' ? 'leofcoin:olivia' : 'leofcoin');
    wallet.fromAddress(address, null, network === 'olivia' ? 'leofcoin:olivia' : 'leofcoin');
    console.log(wallet);
		if (!wallet.verify(signature, Buffer.from(hash, 'hex')))
			throw TransactionError('Invalid input signature');
	});
	transaction.inputs.forEach((input) => {
		if (! unspent.find(out => out.tx === input.tx && out.index === input.index)) { throw TransactionError('Input has been already spent: ' + input.tx); }
	});
	if (transaction.reward) {
		if (transaction.outputs.length !== 1) throw TransactionError('Reward transaction must have exactly one output');
		if (transaction.outputs[0].amount !== config.reward) throw TransactionError(`Mining reward must be exactly: ${config.reward}`);
	} else {
		if (transaction.inputs.reduce((acc, input) => acc + input.amount, 0) !==
      transaction.outputs.reduce((acc, output) => acc + output.amount, 0)) { throw TransactionError('Input and output amounts do not match'); }
	}
	return true;
};
const validateTransactions = (transactions, unspent) => {
	for (const transaction of transactions) {
		validateTransaction(transaction, unspent);
		if (transactions.filter(transaction => transaction.reward).length !== 1)
			throw TransactionError('Transactions cannot have more than one reward');
	}
};
const newTransaction = (inputs, outputs, reward$$1 = false) => {
	const tx = {
		id: crypto.randomBytes(32).toString('hex'),
		time: Math.floor(new Date().getTime() / 1000),
		reward: reward$$1,
		inputs,
		outputs,
	};
  console.log(tx);
	tx.hash = transactionHash(tx);
	return tx;
};
const consensusSubsidy = height => {
	const quarterlings = height / consensusSubsidyInterval;
	if (quarterlings >= 256) {
		return 0;
	}
	const minus = quarterlings >= 1 ? (quarterlings * (reward / 256)) : 0;
	return reward - minus;
};
const createRewardTransaction = (address, height) => {
	return newTransaction([], [{index: 0, amount: consensusSubsidy(height), address}], true);
};
const createInput = (tx, index, amount, wallet) => {
	const input = {
		tx,
		index,
		amount,
		address: wallet.address,
	};
	input.signature = wallet.sign(Buffer.from(transactionInputHash(input), 'hex'));
	return input;
};
const buildTransaction  = (wallet, toAddress, amount) => {
	let inputsAmount = 0;
	const unspent = getUnspentForAddress(wallet.address);
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
        __chunk_1.bus.removeListener('block-added', this._onBlockAdded);
        __chunk_1.bus.removeListener('invalid-block', this._onBlockInvalid);
        this.mineStop();
        resolve(block);
      };
      this._onBlockInvalid = block => {
        __chunk_1.bus.removeListener('block-added', this._onBlockAdded);
        __chunk_1.bus.removeListener('invalid-block', this._onBlockInvalid);
        this.mineStop();
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
const blockHashSet$2 = global.blockHashSet;
const state = (key, wait) => new Promise(async (resolve, reject) => {
  const state = await global.states[key];
  if (wait && !state || wait && wait === 'event') __chunk_1.bus.once(key, state => resolve(state));
  else resolve(state);
});
const getConfig = async () => await fs$1.read(configPath, 'json');
const setConfig = async data => await fs$1.write(configPath, JSON.stringify(data));
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
const blocks = async (number = 0, last) => {
  await state('ready', true);
  if (!number) return chain;
  else if (last) {
    return chain.slice((chain.length - number), chain.length );
  } else return block$1(number);
};
const transactions = async (number, last) => {
  await state('ready', true);
  if (!number) return chain[chain.length - 1].transactions.map(tx => {
    tx.parenHash = chain[chain.length - 1].hash;
    return tx;
  });
  let blocks;
  if (last) blocks = chain.slice((chain.length - number), chain.length);
  else blocks = chain.slice(0, number + 1);
  const tx = blocks.reduce((p, c) => [...p, ...c.transactions.map(tx => {
    tx.parenHash = c.hash;
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
  if (global.states.mining && miners.length === intensity) {
    miners.forEach(miner => miner.stop());
    global.states.mining = false;
  } else if (!global.states.mining && miners.length === intensity) {
    miners.forEach(miner => miner.start());
    global.states.mining = true;
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
    global.states.mining = true;
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
    global.states.ready = true;
    console.log('readied');
  }
  return accounts;
};
const accountNames = async () => {
  const path$$1 = path.join(APPDATAPATH, 'account');
  let data;
  try {
    data = await fs$1.read(path$$1);
    data = JSON.parse(data.toString());
  } catch (e) {
    if (e.code === 'ENOENT') {
      data = ['main account'];
      await fs$1.write(path$$1, JSON.stringify(data));
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
  console.log(_accounts);
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
  let tx;
  try {
    let wallet = loadWallet();
    let _accounts = await accounts();
    const names = await accountNames();
    tx = buildTransaction(_accounts[names.indexOf(from[1])][0].external(0), to, parseInt(amount));
    mempool$1.push(tx);
  } catch (e) {
    throw e;
  }
  return tx;
};
const balance = async address => getBalanceForAddress(address);
const balanceAfter = async (address, index) => getBalanceForAddressAfter(address, index);
const on = (ev, cb) => __chunk_1.bus.on(ev, cb);

const { exists, write, read } = fs$1;
const factory = IPFSFactory.create({type: 'go'});
if (process.platform === 'win32') {
  const readLine = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  readLine.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}const spawn = options => new Promise((resolve, reject) => {
  factory.spawn(options, (error, ipfsd) => {
    if (error) reject(error);
    resolve(ipfsd);
  });
});
const start = (ipfsd, flags) => new Promise(async (resolve, reject) => {
  ipfsd.start(flags, error => {
    if (error) reject(error);
    if (ipfsd.api) {
      ipfsd.api.id().then(({id, addresses}) => {
        console.group(chalk.green('ipfs daemon started and listening on'));
        addresses.forEach(address => console.log(chalk.cyan(address)));
        console.groupEnd();
        resolve({id, addresses});
      }).catch(error => reject(error));
    } else {
      return start(ipfsd, flags)
    }
  });
});
const cleanRepo = async repoPath => {
  console.log(`cleaning repo`);
  try {
    const arr = [
      path.join(repoPath, 'api'),
      path.join(repoPath, 'repo.lock')
    ];
    let count = 0;
    for (const path$$1 of arr) {
      count++;
      const fileExists = await exists(path$$1);
      if (fileExists) fs.unlinkSync(path$$1);
      if (count === arr.length) {
        return;
      }
    }
  } catch (error) {
    throw Error(error)
  }
};
const defaultOptions = {
  repoPath: path.join(process.cwd(), 'repo'),
  force: false,
  cleanup: false,
  sharding: true,
  filestore: true,
  relayHop: true,
  autoNAT: true,
  autoRelay: true,
  streamMounting: false
};
class Node {
  constructor(options = {}) {
    return (async () => {
      this.options = { ...defaultOptions, ...options };
      this.repo = new Repo(this.options.repoPath);
      const fileExists = await exists(path.join(this.options.repoPath, 'config'));
      if (fileExists && !this.options.force) {
        this.config = await read(path.join(this.options.repoPath, 'config'), 'string');
        this.config = JSON.parse(this.config);
        this.config.Swarm.EnableAutoNATService = this.options.autoNAT;
        this.config.Swarm.EnableAutoRelay = this.options.autoRelay;
        this.config.Swarm.EnableRelayHop = this.options.relayHop;
        this.config.Experimental.ShardingEnabled = this.options.sharding;
        this.config.Experimental.FilestoreEnabled = this.options.filestore;
        this.config.Experimental.Libp2pStreamMounting = this.options.streamMounting;
        if (this.options.ports) {
          if (this.options.ports.api) this.config.Addresses.API = (() => {
            const multi = multiaddr(this.config.Addresses.API);
            const addr = multi.nodeAddress();
            const proto = multi.protoNames()[1];
            addr.port = this.options.ports.api;
            return multiaddr.fromNodeAddress({address: addr.address, port: addr.port}, proto).toString()
          })();
          if (this.options.ports.swarm) this.config.Addresses.Swarm = this.config.Addresses.Swarm.map(addr => {
            const multi = multiaddr(addr);
            if (addr.includes('ws')) {
              return addr.replace(multi.nodeAddress().port, this.options.ports.swarm + 3)
            }
            if (multi.nodeAddress().address.includes('::')) return addr.replace(multi.nodeAddress().port, this.options.ports.swarm);
            addr = multi.nodeAddress();
            const proto = multi.protoNames()[1];
            addr.port = this.options.ports.swarm;
            return multiaddr.fromNodeAddress({address: addr.address, port: addr.port}, proto).toString();
          });
          if (this.options.ports.gateway) this.config.Addresses.Gateway = this.config.Addresses.Gateway = (() => {
            const multi = multiaddr(this.config.Addresses.Gateway);
            const addr = multi.nodeAddress();
            const proto = multi.protoNames()[1];
            addr.port = this.options.ports.gateway;
            return multiaddr.fromNodeAddress({address: addr.address, port: addr.port}, proto).toString()
          })();
        }
        write(path.join(this.options.repoPath, 'config'), JSON.stringify(this.config, null, '\t'));
      }      if (!fileExists || this.options.force) await this.init();
      else await this.prepareRepo();
      this.ipfsd = await spawn({start: false, init: false, repoPath: this.options.repoPath, exec: this.options.exec, disposable: false});
      return this;
    })()
  }
  async start() {
    const ipfstStartTime = Date.now();
    try {
     const { id, addresses } = await start(this.ipfsd, this.options.flags);
     console.log(`Daemon startup time: ${(Date.now() - ipfstStartTime) / 1000}s`);
     return { ipfs: this.ipfsd.api, id, addresses };
    } catch (error) {
     if (error.message.includes('cannot acquire lock') ||
         error.code === 'ECONNREFUSED') {
       await cleanRepo(this.options.repoPath);
     }
     return this.start(this.ipfsd, this.options);
    }
  }
  async stop() {
    await this.ipfsd.stop();
    if (this.options.cleanup) await del(this.options.repoPath);
  }
  async init() {
    const { repo, spec, netkey } = await repoConfigs.config(this.options);
    const dataSpecPath = path.join(this.options.repoPath, 'datastore_spec');
    this.repo.init(repo, async error => {
      if (error) throw Error(error);
      await write(dataSpecPath, JSON.stringify(spec));
      if (netkey) {
        const netkeyPath = path.join(this.options.repoPath, 'swarm.key');
        await write(netkeyPath, normalizeNewline(netkey));
      }
      return;
    });
  }
  prepareRepo() {
    return new Promise((resolve, reject) => {
      this.repo.exists(async (error, exists) => {
        if (error) reject(error);
        else if (exists) resolve();
        else await this.init();
        resolve();
      });
    });
  }
}
var ipfsdNode = options => new Node(options);

global.peerset = new Map();

const handleDefaultBootstrapAddresses$1 = async addresses => {
  try {
    let bootstrap = await ipfs.config.get('Bootstrap');
    for (const peer of addresses) {
      for (const address of bootstrap) {
        if (addresses.indexOf(address) === -1) {
          const index = bootstrap.indexOf(address);
          bootstrap = bootstrap.slice(index, 0);
        }
      }
      for (const address of addresses) {
        if (bootstrap.indexOf(address) === -1) {
          bootstrap.push(address);
        }
      }
    }
    global.bootstrap = bootstrap;
    await ipfs.config.set('Bootstrap', bootstrap);
    return 0;
  } catch (error) {
    return 1;
  }
};
class SignalRoom extends PeerMonitor {
  constructor(ipfs$$1, topic) {
    super(ipfs$$1.pubsub, topic);
    this.ipfs = ipfs$$1;
    ipfs$$1.pubsub.subscribe(topic, (message) => {
      message.data = message.data.toString();
      super.emit('message', message);
    }, (err, res) => {});
    this.topic = topic;
    this.peers = [];
    (async () => {
      await handleDefaultBootstrapAddresses$1(signalServers);
      this._peerJoined = this._peerJoined.bind(this);
      this._peerLeft = this._peerLeft.bind(this);
      this._subscribed = this._subscribed.bind(this);
      this.on('join', this._peerJoined);
      this.on('leave', this._peerLeft);
      this.on('error', error => console.error(error));
      this.on('subscribed', this._subscribed);
    })();
  }
  async broadcast(data) {
    await this.ipfs.pubsub.publish(this.topic, Buffer.from(data));
  }
  _subscribed() {
    this.subscribed = true;
  }
  _peerJoined(peer) {
    console.log(peer);
    if (this.peers.indexOf(peer) === -1) this.peers.push(peer);
  }
  _peerLeft(peer) {
    this.peers.slice(this.peers.indexOf(peer), 1);
  }
  async whisper(peerID) {
    const channel = await Channel.open(ipfs, peerID);
    await channel.connect();
    channel.on('message', (message) => {
      console.log("Message from", message.from, message);
    });
    channel.emit('message', 'hello there');
  }
}

global.states = {
  ready: false,
  syncing: false,
  connecting: false,
  mining: false
};
const core = async () => {
	try {
    const now = Date.now();
    const config$$1 = await getUserConfig;
    __chunk_1.bus.emit('stage-one');
    const ipfsd = await ipfsdNode({
      exec: 'ipfs.exe',
      bootstrap: network,
      network: network,
      sharding: true,
      relayHop: true,
      flags: ['--enable-namesys-pubsub', '--enable-pubsub-experiment'],
      repoPath: networkPath,
      cleanup: false
    });
    console.log('starting ipfs');
    const { ipfs, addresses, id } = await ipfsd.start();
    global.id = id;
    global.ipfs = ipfs;
    const ipfsd_now = Date.now();
    await connectBootstrap();
    const bootstrap_now = Date.now();
    new SignalRoom(ipfs, `${netPrefix}-signal`);
    const signal_now = Date.now();
    process.on('SIGINT', async () => {
      console.log("Caught interrupt signal");
      await ipfsd.stop();
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
    await fs$1.write(configPath, JSON.stringify(config$$1, null, '\t'));
    const chain = new DAGChain({ genesis: true, network, ipfs });
    await chain.init();
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
    channel: ['stable', 'canary', 'chromium'],
    ignoreDefaultArgs: ['--disable-extensions']
  });
  core();
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
  await app.exposeFunction('blocks', blocks);
  await app.exposeFunction('block', block$1);
  await app.exposeFunction('transactions', transactions);
  await app.exposeFunction('blockHashSet', () => {
    return blockHashSet
  });
  on('miner.hashrate', data => bus.emit('miner.hashrate', data));
  on('block-added', data => bus.emit('block-added', data));
})();
