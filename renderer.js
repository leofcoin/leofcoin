'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('leofcoin-hash');
var dapnets = _interopDefault(require('@leofcoin/dapnets'));
var coinTicker = _interopDefault(require('coin-ticker'));
var chalk = _interopDefault(require('chalk'));
require('multicodec');
require('crypto-chain-validator');
var cryptoJs = require('crypto-js');
var EventEmitter = _interopDefault(require('events'));
var joi = require('joi');
var cryptoIoFs = require('crypto-io-fs');
var CID = _interopDefault(require('cids'));
var os = require('os');
var ipldLfc = require('ipld-lfc');
var crypto = require('crypto');
require('bs58');
var IPLDLFCTx = require('ipld-lfc-tx');
var IPLDLFCTx__default = _interopDefault(IPLDLFCTx);
var cryptoStore = require('crypto-store');
var child_process = require('child_process');
var path = require('path');
var MultiWallet = _interopDefault(require('multi-wallet'));

// TODO: encrypt
const writeWallet = async multiWIF => await cryptoIoFs.write(walletPath, JSON.stringify(multiWIF));

const readWallet = async () => await cryptoIoFs.read(walletPath, 'json');

const generateWallet = async () => {
	console.log(`Generating wallet for network ${network}`);
  const config$$1 = await cryptoIoFs.read(networkConfigPath, 'json');
  // console.log(config.Identity.PrivKey);
  // console.warn('wallet encrypted using your peer privatKey');
  // TODO: encrypt the wallet
  // TODO: update network param, support <net> & <net>:<purpose> scheme
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
    // discover untill we find no transactions for given address
    if (tx.length > 0) return discover(account, depth + 1);
    return accounts;
  };

  return discover(account, 0);

};

/**
 * @param {object} root Instance of MultiWallet
 */
const discoverAccounts = async (root) => {
  let accounts = [];
  /**
   * @param {number} depth account depth
   */
  const discover = async depth => {
		
			debug('discovering accounts');
    const account = root.account(depth);
    const _accounts = await _discoverAccounts(account);
    accounts = [...accounts, _accounts];
		
		debug('done discovering accounts');
		// const address = account.address
    // global.chain.forEach(({ transactions }) => {
    //   if (accounts[address]) return;
    //   transactions.forEach(({inputs, outputs}) => {
    //     if (accounts[address]) return;
    //     if (inputs) inputs.forEach((i) => {
    //       if (i.address === address) return tx.push(address);
    //     })
    //     if (outputs) outputs.forEach((o) => {
    //       if (o.address === address) return tx.push(address);
    //     })
    //   })
		// })
    // discover untill we find no transactions for given address
		if (_accounts.length > 1) return discover(depth + 1);
    return accounts;
  };

  return discover(0);

};

const loadWallet = async () => {
	debug('loading wallet');
  try {
    const saved = await readWallet();
    // TODO: update network param, support <net> & <net>:<purpose> scheme
    const root = new MultiWallet(network === 'olivia' ? 'leofcoin:olivia' : 'leofcoin');
    // TODO: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#Account_discovery @AndrewVanardennen @vandeurenglenn
    // last account is without tx
    // disallow account creation when previous account has no tx
    root.import(saved.multiWIF);
		debug('done loading wallet');
    return root;
  } catch (e) {
    throw e;
  }
};

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

var bus = new Emitter();

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
		// stable.pairs.set('BTC', getValueFor('BTC'))
	}
	
	for (const key of Object.keys(prices)) {
		priceMap.set(key, median(prices[key]));
	}
	console.log(priceMap.entries());
	// const name = 
};

{
	setInterval(async () => {
		const values = await getPairValue(['BTC_EUR', 'LTC_EUR', 'ETH_EUR']);
		// stable.pairs.set('BTC', getValueFor('BTC'))
	}, 10000);
}

const invalid = (name, text) => new Error(`Invalid ${name}: ${text}`);

const TransactionError = text =>	invalid('transaction', text);

const _SHA256 = (object) => {
	return cryptoJs.SHA256(JSON.stringify(object)).toString();
};

/**
 * Generate transaction hash
 *
 * @param {object} transaction {id, type, inputs, outputs}
 */
const transactionHash = async transaction => {
	const tx = new IPLDLFCTx__default.LFCTx(transaction);
	const cid = await IPLDLFCTx__default.util.cid(tx.serialize());
	return cid.toBaseEncodedString()
};

/**
 * Generate transaction input hash
 *
 * @param {object} transactionInput {transaction, index, amount, address}
 */
const transactionInputHash = (transactionInput) => {
	const {tx, index, amount, address} = transactionInput;
	return _SHA256({tx, index, amount, address});
};

const block = joi.object().keys({
	index: joi.number(),
	prevHash: joi.string().length(94),
	time: joi.number(),
	transactions: joi.array().items(joi.object().keys({
		multihash: joi.string(),
		size: joi.number()
	})),
	nonce: joi.number(),
	hash: joi.string().length(128)
});

const transaction = joi.object().keys({
	id: joi.string().hex().length(64),
	time: joi.number(),
	reward: joi.boolean(),
	inputs: joi.array().items(joi.object().keys({
		tx: joi.string().hex().length(64),
		index: joi.number(),
		amount: joi.number(),
		address: joi.string(),
		signature: joi.string().base64(),
	})),
	outputs: joi.array().items(joi.object().keys({
		index: joi.number(),
		amount: joi.number(),
		address: joi.string(),
	})),
});

var calculateHash = async block => {
  console.log(block);
  block = await new ipldLfc.LFCNode(block);
  const cid = await ipldLfc.util.cid(block.serialize());
  return hashFromMultihash(cid.toBaseEncodedString());
};

class DAGBlock {
	constructor(ipfs, options) {
    if (!ipfs) return console.warn('options and ipfs expected');

		this.ipfs = ipfs;

		// if (typeof options === 'object' && !Buffer.isBuffer(options)) this.newBlock(options);
		// else this.get(options);
	}

	/**
	 * Create new block
	 *
	 * @param transactions {array}
	 * @param previousBlock {object}
	 * @param address {string}
	 * @return {index, prevHash, time, transactions, nonce}
	 */
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
  // TODO: split into header and block
  /**
   * get header only
   */
  async getHeader(hash) {
    this.node = await this.ipfs.dag.get(hash);
    return this.node.value;
  }
  /**
   * get block only
   */
  async getBlock() {

  }

  /**
   * combines getHeader & getBlock
   */
	async get(multihash) {
		this.node = await this.ipfs.dag.get(multihash);
		this.data = JSON.parse(this.node.value.data.toString());
		this.data.hash = hashFromMultihash(multihash);
    return this.data;
    // return new Promise((resolve, reject) => util.cid(this.node.data, {
    //   version: 1,
    //   hashAlg: 'sha2-256'
    // }, async (error, cid) => {
    //   if (error) reject(error);
    //   resolve(this.transformBlock(this.node, cid))
    // }));
	}
}

const { promisify } = require('util');

global.chain = global.chain || [
  GENESISBLOCK
];
global.mempool = global.mempool || [];
global.blockHashSet = global.blockHashSet || [];

const chain$1 = (() => global.chain)();

const mempool$1 = (() => global.mempool)();

const blockHashSet = (() => global.blockHashSet)();

/**
 * Get the transactions for the next Block
 *
 * @return {object} transactions
 */
const nextBlockTransactions = async () => {
	const unspent = await getUnspent(false);
	return mempool$1.filter(async (transaction) => {
    const multihash = transaction.multihash;
    const value = await leofcoin.chain.transaction.get(multihash);
    console.log({value});
		try {
			await validateTransaction(multihash, value, unspent);
      return transaction
		} catch (e) {
      // TODO: push to pubus
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
      const {value} = await global.ipfs.dag.get(multihash, {format: ipldLfc.LFCNode.codec, hashAlg: ipldLfc.LFCNode.faultHashAlg, version: 1, baseFormat: 'base58btc'});
      _transactions.push(value);
    } else {
      _transactions.push(tx);
    }
    
  }
  return _transactions
};

const getUnspent = async (withMempool = false, index = 0) => {
	const transactions = await getTransactions(withMempool, index);
	// Find all inputs with their tx ids
	const inputs = transactions.reduce((inputs, tx) => inputs.concat(tx.inputs), []);

	// Find all outputs with their tx ids
	const outputs = transactions.reduce((outputs, tx) =>
		outputs.concat(tx.outputs.map(output => Object.assign({}, output, {tx: tx.id}))), []);

	// Figure out which outputs are unspent
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
	// TODO: lower difficulty when transactionpool contain more then 500 tx ?
	// TODO: raise difficulty when pool is empty

  // or

  // TODO: implement iTX (instant transaction)
  // iTX is handled by multiple peers, itx is chained together by their hashes
  // by handlng a tx as itx the block well be converted into a iRootBlock
  // this results into smaller chains (tangles, tails) which should improve
  // resolving transactions, wallet amounts etc ...
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
   // offset for quick recovery
	if (blocksMedian < 29) {
		blocksMedian -= offset;
	} else if (blocksMedian > 31) {
		blocksMedian += offset;
	}
  if (blocksMedian < 0) blocksMedian = -blocksMedian;
  console.log(`Average Block Time: ${blocksMedian}`);
  console.log(`Difficulty: ${30 / blocksMedian}`);
	return ((1000000 / ((30 / blocksMedian) * 100)) * 3); // should result in a block every 10 seconds
};//10000

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

// TODO: global peerlist
const longestChain = () => new Promise(async (resolve, reject) => {
  const promises = [];
  for (const peer of leofcoin.peers) {
    console.log(peer);
    if (peer.client) {
      console.log({address: peer.client.url, protocol: peer.client.protocol, connectionState: readyState(peer.client.readyState)});  
      const state = readyState(peer.client.readyState);
      if (state !== 'open' && state !== 'connecting') await connectAfterClose(peer.client.url, peer.client.protocol);
      // TODO: dial
      
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
  // return resolve({index: 0, hash: genesisCID})
  // try {
  //   if (!globalThis.ipfs) return
  //   // console.log(peerMap.entries());
  //   let addresses = await global.ipfs.swarm.peers();
  //   addresses = addresses.map(({peer}) => peer.toB58String());
  //   if (addresses.length < 1) return resolve(setTimeout(async () => {
  //     return await longestChain()
  //   }, 2000));
  //   addresses = addresses.filter((id) => id !== 'QmQRRacFueH9iKgUnHdwYvnC4jCwJLxcPhBmZapq6Xh1rF')
  //   let stat = {
  //     index: 0,
  //     hash: genesisCID
  //   };
  //   for (const addr of addresses) {
  //     await ipfs.swarm.connect(`/p2p-circuit/ipfs/${addr}`)
  //     const value = await globalThis.pubsubRequest.request('chainHeight', addr)
  //     if (stat.index < value) {
  //       stat = {
  //         index: value,
  //         addr
  //       }
  //     }      
  //   }
  //   // reduce to longest chain
  //   // TODO: consider using candidates for validating
  //   // canditates.push({hash, height})
  //   // if c.height > p.height => newCanditatesSet ...
  //   if (stat.addr) {
  //     const hash = await globalThis.pubsubRequest.request('blockHash', stat.addr, stat.index)
  //     return resolve({ index: stat.index, hash });  
  //   }
  //   resolve({index: 0, hash: genesisCID})
  // } catch (e) {
  //   reject(e);
  // }
});

const lastBlock = () => new Promise(async (resolve, reject) => {
  setTimeout(async () => {
    const hash = leofcoin.hashMap.get(leofcoin.hashMap.size);
    console.log(hash);
    const {index} = await leofcoin.block.get(hash);
    console.log(index);
    resolve({hash, index});
  }, 1000);
  const result = await longestChain();
  
  resolve(result); // retrieve links
});

const nextBlock = async address => {
  let transactions;
  let previousBlock;
  try {
    previousBlock = await lastBlock();
    console.log(previousBlock);
    if (previousBlock.index > chain$1.length - 1) {
      await leofcoin.chain.sync();
      previousBlock = await lastBlock();
    }
    if (!previousBlock.index) previousBlock = chain$1[chain$1.length - 1];
    // previousBlock = chain[chain.length - 1]; // TODO: await lastBlock
    transactions = await nextBlockTransactions();
    console.log(previousBlock);
  } catch (e) {
    console.log(e);
    previousBlock = GENESISBLOCK;
    previousBlock.hash = genesisCID;
    transactions = await nextBlockTransactions();
  } finally {
    // console.log(transactions, previousBlock, address);
    return await new DAGBlock(global.ipfs).newBlock({transactions, previousBlock, address});
  }
};

/**
 * validate transaction
 *
 * @param transaction
 * @param unspent
 */
const validateTransaction = async (multihash, transaction, unspent) => {
	if (!transaction.reward) delete transaction.reward;
	// if (!isValid('transaction', transaction)) throw new TransactionError('Invalid transaction');
	if (multihash !== await transactionHash(transaction)) throw TransactionError('Invalid transaction hash');
	// TODO: versions should be handled here...
	// Verify each input signature
	
	if (transaction.inputs) {
		transaction.inputs.forEach(input => {
	  	const { signature, address } = input;
			const hash = transactionInputHash(input);

	  	let wallet = new MultiWallet(network === 'olivia' ? 'leofcoin:olivia' : 'leofcoin');
	    wallet.fromAddress(address, null, network === 'olivia' ? 'leofcoin:olivia' : 'leofcoin');
			
			if (!wallet.verify(Buffer.from(signature, 'hex'), Buffer.from(hash, 'hex')))
				throw TransactionError('Invalid input signature');
		});
	
		// Check if inputs are in unspent list
		transaction.inputs.forEach((input) => {
			if (!unspent.find(out => out.tx === input.tx && out.index === input.index)) { throw TransactionError('Input has been already spent: ' + input.tx); }
		});	
	}
	
	if (transaction.reward === 'mined') {
		// For reward transaction: check if reward output is correct
		if (transaction.outputs.length !== 1) throw TransactionError('Reward transaction must have exactly one output');
		if (transaction.outputs[0].amount !== config.reward) throw TransactionError(`Mining reward must be exactly: ${config.reward}`);
	} else if (transaction.inputs) {
		// For normal transaction: check if total output amount equals input amount
		if (transaction.inputs.reduce((acc, input) => acc + input.amount, 0) !==
      transaction.outputs.reduce((acc, output) => acc + output.amount, 0)) { throw TransactionError('Input and output amounts do not match'); }
	}

	return true;
};

/**
 * Create transaction
 *
 * @param inputs
 * @param outputs
 * @param reward
 * @return {{id: string, reward: boolean, inputs: *, outputs: *, hash: string}}
 */
const newTransaction = async (inputs, outputs, reward$$1 = null) => {
	try {
		const tx = new IPLDLFCTx.LFCTx({
			id: crypto.randomBytes(32).toString('hex'),
			time: Math.floor(new Date().getTime() / 1000),
			reward: reward$$1,
			outputs,
			inputs
		});
		const cid = await IPLDLFCTx.util.cid(tx.serialize());
		debug(`create transaction: ${tx}`);
		await global.ipfs.dag.put(tx, {format: IPLDLFCTx.util.codec, hashAlg: IPLDLFCTx.util.defaultHashAlg, version: 1, baseFormat: 'base58btc'});
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
	//subsidy is lowered by 12.5 %, approx every year
	const minus = quarterlings >= 1 ? (quarterlings * (reward / 256)) : 0;
	return reward - minus;
};

/**
 * Create reward transaction for block mining
 *
 * @param {string} address
 * @return {id: string, reward: boolean, inputs: *, outputs: *, hash: string}
 */
const createRewardTransaction = async (address, height) => {
	return newTransaction([], [{index: 0, amount: consensusSubsidy(height), address}], 'mined');
};

/**
 * Create and sign input
 *
 * @param transaction Based on transaction id
 * @param index Based on transaction output index
 * @param amount
 * @param wallet
 * @return {transaction, index, amount, address}
 */
const createInput = (tx, index, amount, wallet) => {
	const input = {
		tx,
		index,
		amount,
		address: wallet.address,
	};
	// TODO: show notification the tx got signed
	// Sign transactionHash
	input.signature = wallet.sign(Buffer.from(transactionInputHash(input), 'hex')).toString('hex');
	return input;
};

/**
 * Create a transaction
 *
 * @param wallet
 * @param toAddress
 * @param amount
 * @param unspent
 * @return {id, reward, inputs, outputs, hash,}
 */
const buildTransaction = async (wallet, toAddress, amount) => {
	let inputsAmount = 0;
	const unspent = await getUnspentForAddress(wallet.address);
	const inputsRaw = unspent.filter(i => {
		const more = inputsAmount < amount;
		if (more) inputsAmount += i.amount;
		return more;
	});
	if (inputsAmount < amount) throw TransactionError('Not enough funds');
	// TODO: Add multiSigning
	const inputs = inputsRaw.map(i => createInput(i.tx, i.index, i.amount, wallet));
	// Send amount to destination address
	const outputs = [{index: 0, amount, address: toAddress}];
	// Send back change to my wallet
	if (inputsAmount - amount > 0) {
		outputs.push({index: 1, amount: inputsAmount - amount, address: wallet.address});
	}
	return newTransaction(inputs, outputs);
};

const or = (a, b) => a ? a : b;

/**
 * Get hash difficulty
 *
 * @param hash
 * @return {Number}
 */

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
    // TODO: limit intensity when pool is empty
    super();
    this.workerPath = path.join(__dirname, 'miner-worker.js');
    this.address = address;
    this.running = 0;


    if (autostart) {
      this.start();
    }
  }

  /**
   * keep node(s) in sync
   */
  onBlockAdded() {
    return new Promise((resolve, reject) => {
      this._onBlockAdded = block => {
        this.mineStop();
        bus.removeListener('block-added', this._onBlockAdded);
        bus.removeListener('invalid-block', this._onBlockInvalid);
        resolve(block);
      };
      this._onBlockInvalid = block => {
        this.mineStop();
        bus.removeListener('block-added', this._onBlockAdded);
        bus.removeListener('invalid-block', this._onBlockInvalid);
        resolve(null);
      };
      bus.once('block-added', this._onBlockAdded);
      bus.once('invalid-block', this._onBlockInvalid);
    });
  }


  async start() {
    // ipfs.pubsub.subscribe('invalid-block');
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
      bus.emit('miner.hashrate', {uid: job, hashrate: (Math.round(rate * 100) / 100)});
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

  /**
   * Mine a block in separate process
   *
   * @param transactions Transactions list to add to the block
   * @param lastBlock Last block in the blockchain
   * @param difficulty Current difficulty
   * @param address Addres for reward transaction
   * @return {*}
   */
  async mineBlock(difficulty$$1, address, job) {
    const block = await nextBlock(address);
    console.log(`${job}::Started mining block ${block.index}`);

    return this.findBlockHash(block, difficulty$$1);
  }

  /**
   * Find block hash according to difficulty
   *
   * @param block
   * @param difficulty
   * @return {Promise}
   */
  findBlockHash (block, difficulty$$1) {
    return new Promise((resolve, reject) => {
      const worker = child_process.fork(this.workerPath);
      /*
       * Create worker to find hash in separate process
       */


       /*
        * Hadnle events to stop mining when needed
        */
      this.mineStop = () => {
       removeListeners();
       worker.kill('SIGINT');
       resolve({block: null, hashCount: null, index: block.index});
      };

      // Listeners for stopping mining
      const blockAddedListener = b => {
        if (b.index >= block.index) this.mineStop();
      };
      const mineStopListener = b => this.mineStop;
      const removeListeners = () => {
       bus.removeListener('block-added', blockAddedListener);
       bus.removeListener('mine-stop', mineStopListener);
      };
      // If other process found the same block faster, kill current one
      bus.once('block-added', blockAddedListener);
      bus.once('mine-stop', mineStopListener);
      // const result = await minerWorker({block, difficulty})
      worker.on('message', (data) => {
        removeListeners();

        resolve({block: data.block, hashes: data.hashCount});
        worker.kill('SIGINT');
      });
      worker.send({block, difficulty: difficulty$$1});

    });
  }

}

// TODO: multiwallet in browser
const miners = [];

const blockHashSet$1 = global.blockHashSet;
/**
* state - get current app state
*
* @param {string} key - event name
* @param {boolean|string} [wait=false|wait='event'] - wait untill next event when asked state is false
* or wait untill next event when set to 'event'
*/
const state = (key, wait) => new Promise(async (resolve, reject) => {
  const state = await global.states[key];
  if (wait && !state || wait && wait === 'event') bus.once(key, state => resolve(state));
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

/**
 *
 * @param {string|number} height hash or height
 */
const block$1 = async (height) => {
  await state('ready', true);
  if (!height) return chain[chain.length - 1];
  if (typeof height !== 'string') return chain[height]
  return chain[blockHashSet$1[height]];
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
  if (donationAddress && donationAmount === 'undefined') donationAmount = 3; //procent
  const addMiner = count => {
    for (var i = 0; i < count; i++) {
      const miner = new Miner();
      miner.address = address;
      // miner.donationAddress = donationAddress;
      // miner.donationAmount = donationAmount;
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
  // TODO: add donationAddress
  // TODO: add donation option in ui
  // if (!address) address = donationAddress;

};

const createWallet = async () => {
  const wallet = await generateWallet();

  // await setAccountNames()
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
// TODO: whenever a address is used update depth...
// IOW
// external(0).addr => internal(0).addr => external(1).addr => internal(1).addr ...
/**
 * @param {object} account - hdaccount
 * @param {number} depth - account depth
 * @return {array} [external, internal] - addresses
 */
const _addresses = ([account], depth = 0) => {
  // const external = account.external(0);
  // const external = account.external(0);
  // console.log([account.external(0), account.internal(0).address]);
  return [account.external(0).address, account.internal(0).address];
};

const addresses = async () => {
  let _accounts = await accounts();
  const names = await accountNames();
  // TODO: allow account by name (even when there aren't any transactions...)
  // if (_accounts && _accounts.length < names.length) _account = [..._accounts, ...await accounts(names.length)]
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
  // TODO:
  // const service = await mss({global.ipfs, chain: chain.get()})
	// 	const wallet = new MultiWallet('leofcoin:olivia')
	// 	wallet.import(mwif)
	// 	const account = wallet.account(0)
	// 	const change = account.internal(0).address;
	// 	const pub = account.external(0);
  //   const address = pub.address;
  //   const olivia = {
  //   	payments: {
  //       version: 0,
  //       unspent: 0x1fa443d7 // ounsp
  //     }
  //   };
	// 	const buildAndBroadcast = service.build(olivia, { address }, change)
	// 	service.participate(olivia, pub);
	// 	buildAndBroadcast.unspent(to, amount)
  // TODO: implement multi-script-service

  // TODO: validate transaction
  // await state('ready', true)
  let value;
  try {
    let wallet = loadWallet();
    // account ...
    let _accounts = await accounts();
    const names = await accountNames();
    // TODO: cleanup wallet internal/external...
    // something like accounts: [{ name, internal: [internal(0), internal(1), ...]}]
    value = await buildTransaction(_accounts[names.indexOf(from[1])][0].external(0), to, parseInt(amount));

    const tx = await leofcoin.transaction.get(value.multihash);
    
    global.ipfs.pubsub.publish('announce-transaction', JSON.stringify(value));
    tx.hash = value.multihash;
    value = tx;

  } catch (e) {
    throw e;
  }

  return value;
};

const balance = getBalanceForAddress;

const balanceAfter = getBalanceForAddressAfter;

const on = (ev, cb) => bus.on(ev, cb);

exports.addresses = addresses;
exports.state = state;
exports.createWallet = createWallet;
exports.accounts = accounts;
exports.accountNames = accountNames;
exports.balance = balance;
exports.balanceAfter = balanceAfter;
exports.send = send;
exports.getMinerConfig = getMinerConfig;
exports.setMinerConfig = setMinerConfig;
exports.block = block$1;
exports.blocks = blocks;
exports.transactions = transactions;
exports.mine = mine;
exports.on = on;
