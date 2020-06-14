'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var LfcApi = _interopDefault(require('lfc-api'));
var coinTicker = _interopDefault(require('coin-ticker'));
var chalk = _interopDefault(require('chalk'));
var fs = require('fs');
var util = require('util');
var joi = require('@hapi/joi');
var cryptoJs = _interopDefault(require('crypto-js'));
var EventEmitter = _interopDefault(require('events'));
var CID = _interopDefault(require('cids'));
var crypto = require('crypto');
var MultiWallet = _interopDefault(require('@leofcoin/multi-wallet'));
var ipldLfcTx = require('ipld-lfc-tx');
var ipldLfcTx__default = _interopDefault(ipldLfcTx);
var bs58 = require('bs58');
var bs58__default = _interopDefault(bs58);
var ipldLfc = require('ipld-lfc');
var ipldLfc__default = _interopDefault(ipldLfc);
var os = require('os');
var child_process = require('child_process');
var path = require('path');
var Koa = _interopDefault(require('koa'));
var Router = _interopDefault(require('@koa/router'));
require('physical-cpu-count');

const hour = hour => hour * 3.6e+6;

const argv = process.argv;

const networks = {
	'leofcoin': path.join(os.homedir(), '.leofcoin'),
	'olivia': path.join(os.homedir(), '.leofcoin/olivia')
};

const network = (() => {
  const index = argv.indexOf('--network');
  return process.env.NETWORK || (index > -1) ? argv[index + 1] : 'leofcoin';
})();

const fixIndex = argv.indexOf('fixIndex') !== -1 ? true : false;

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
// const netHash = net => encode(keccak(Buffer.from(`${net}-`), 256)).slice(0, 24);
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


// export const netPrefix = (async () => await dapnets('leofcoin').netPrefix)()

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
const genesisCID = 'zsNS6wZiHSc2QPHmjV8TMNn798b4Kp9jpjsBNeUkPhaJTza3GosWUgE72Jy3X9jKMrFCcDni7Pq4yXogQN4TcAfrPmTXFt';
const GENESISBLOCK = {
	index: 0,
  prevHash: Buffer.alloc(47).toString('hex'),
  time: 1590240964,
  transactions: [],
  nonce: 1077701
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
	(async () => await getPairValue(['BTC_EUR', 'LTC_EUR', 'ETH_EUR']))();
	setInterval(async () => {
		const values = await getPairValue(['BTC_EUR', 'LTC_EUR', 'ETH_EUR']);
		// stable.pairs.set('BTC', getValueFor('BTC'))
	}, hour(1));
}

const read = util.promisify(fs.readFile);
const write = util.promisify(fs.writeFile);

const hashFromMultihash = multihash => {
  let hash = multihash.replace('/ipfs/', '');
  const cid = new CID(hash);
  const prefix = cid.prefix;
  return cid.multihash.slice(prefix.length - 3).toString('hex');
};

const multihashFromHash = hash => {
  const cid = new CID(1, 'leofcoin-block', Buffer.from(`1d40${hash}`, 'hex'), 'base58btc');
  // const hash = multihash.replace('/ipfs/', '');
  // console.log(cid.toBaseEncodedString());
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
}
const debug = (text) => {
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

const groupCollapsed = (text, cb) => {
  console.groupCollapsed(chalk.gray.bold(text));
  cb();
  console.groupEnd();
};
/**
 * Get hash difficulty
 *
 * @param hash
 * @return {Number}
 */
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

var bus$1 = new Emitter();

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
	reward: joi.string(),
	script: joi.string(),
	inputs: joi.array().items(joi.object().keys({
		tx: joi.string().hex().length(64),
		index: joi.number(),
		amount: joi.number(),
		address: joi.string(),
		signature: joi.string().hex()
	})),
	outputs: joi.array().items(joi.object().keys({
		index: joi.number(),
		amount: joi.number(),
		address: joi.string()
	})),
});

const schemas = {
	block,
	transaction,
};

const validate = (schema, data) =>  schemas[schema].validate(data);

const isValid = (schema, data) => {
	console.log(validate(schema, data).error);
	return Boolean(!validate(schema, data).error)
};

const invalid = (name, text) => new Error(`Invalid ${name}: ${text}`);
// TODO: show notification
const BlockError = text => invalid('block', text);

const TransactionError = text =>	invalid('transaction', text);

const {SHA256} = cryptoJs;
const _SHA256 = (object) => {
	return SHA256(JSON.stringify(object)).toString();
};

/**
 * Generate transaction hash
 *
 * @param {object} transaction {id, type, inputs, outputs}
 */
const transactionHash = async transaction => {
	const tx = new ipldLfcTx__default.LFCTx(transaction);
	const cid = await ipldLfcTx__default.util.cid(tx.serialize());
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

var hashFromMultihash$1 = multihash => {
  const cid = new CID(multihash.replace('/ipfs/', ''));
  return cid.multihash.slice(cid.prefix.length / 2).toString('hex')
};

const { LFCNode, util: util$1 } = ipldLfc__default;
var calculateHash = async block => {
  block = await new LFCNode(block);
  const cid = await util$1.cid(block.serialize());
  return hashFromMultihash$1(cid.toBaseEncodedString());
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
	}
}

/**
 * validate block
 *
 * @param {object} previousBlock
 * @param {object} block
 * @param {number} difficulty
 * @param {number} unspent
 */
const validate$1 = async (previousBlock, block, difficulty, unspent) => {
	console.log(previousBlock.hash, block.prevHash);
	console.log(previousBlock, block);
	// console.log(await calculateHash(), block.hash);
	console.log(isValid('block', block));
	if (!isValid('block', block)) throw BlockError('data');
	// console.log(block, previousBlock);
	if (previousBlock.index + 1 !== block.index) throw BlockError('index');
	if (previousBlock.hash !== block.prevHash) throw BlockError('prevhash');
	if (await calculateHash(block) !== block.hash) throw BlockError('hash');
	if (getDifficulty(block.hash) > difficulty) throw BlockError('difficulty');
	return validateTransactions(block.transactions, unspent);
};

const {util: util$2, LFCNode: LFCNode$1} = ipldLfc__default;
const { encode: encode$2 } = bs58__default;
globalThis.states = globalThis.states || {
  ready: false,
  syncing: false,
  connecting: false,
  mining: false
};
// const blockHashSet = []

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
        // TODO: finishe the genesis module
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
    const { value, remainderPath } = await this.ipfs.dag.get(multihash, { format: LFCNode$1.codec, hashAlg: LFCNode$1.defaultHashAlg, version: 1, pin: true});
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
        console.log({block});
        // await globalThis.ipfs.dag.get(multihash, {format: util.codec, hashAlg: util.defaultHashAlg, version: 1, pin: true})
        block.hash = multihash;
        chain$1[block.index] = block;
        leofcoin.hashMap.set(block.index, multihash);
        // TODO: blockHashSet
        block.transactions = block.transactions.map(link => link.toJSON());
        const _transactions = [];
        for (const {multihash} of block.transactions) {
          const node = await leofcoin.transaction.dag.get(multihash);
          await leofcoin.transaction.dag.put(node);
          
          try {
            debug(`pinning: ${multihash}`);
            await leofcoin.pin.add(multihash);
            // await this.publish(multihash);
          } catch (e) {
            console.warn(e);
          }
          
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
          // await this.publish(multihash);
        } catch (e) {
          console.warn(e);
        }
        
        try {
          debug(`Publishing ${'/ipfs/' + multihash}`);
          await ipfs.name.publish('/ipfs/' + multihash);
          // await this.publish(multihash);
        } catch (e) {
          console.warn(e);
        }
        block.transactions.forEach(async tx => {
          // const {value} = await globalThis.ipfs.dag.get(multihash, { format: LFCTx.codec, hashAlg: defaultHashAlg})
          const index = mempool.indexOf(tx);
          mempool.splice(index);
        });
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * Initialize a new chain on the IPFS network
   * Creates creates & saves the genesisBlock to IPFS, blocks are pinned so they aren't removeable on the local side.
   *
   * @param {object} block The genesis block to write
   * @setup PART of Easy setup your own blockchain, more info URL...
   */
   // TODO: switch to itx
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
    // const { value } = await getTx(multihash)
    // value.hash = multihash
    // console.log(value);
    mempool.push({multihash, size});
  }
  
  async resync(block) {
    await leofcoin.chain.resync(block);
  }
  
  async announceMessage({data, from}) {
    const {multihash} = JSON.parse(data.toString());
    
    messagePool.add(multihash);
  }

  // TODO: go with previous block instead off lastBlock
  // TODO: validate on sync ...
  async announceBlock({data, from}) {
    console.log(data.toString());
      const block = JSON.parse(data.toString());
      if (chain$1[block.index]) {
        bus.emit('invalid-block', block);
        await ipfs.pubsub.publish('invalid-block', Buffer.from(JSON.stringify(block)));
        return
      }
      if (block.index > chain$1[chain$1.length - 1].index + 1) await leofcoin.chain.resync(block);
      try {
        // const previousBlock = await lastBlock(); // test
        await validate$1(chain$1[chain$1.length - 1], block, difficulty(), await getUnspent());
        await this.addBlock(block); // add to chai
        
      } catch (error) {
        // TODO: remove publish invalid-block
        debug(`Invalid block ${block.hash}`);
        bus.emit('invalid-block', block);
        
        await ipfs.pubsub.publish('invalid-block', Buffer.from(JSON.stringify(block)));
        console.log('invalid', error);
        // await this.resync(block)
        return
      }
    }
}

const { LFCTx: LFCTx$1, util: util$3 } = ipldLfcTx;
/**
 * validate transaction
 *
 * @param transaction
 * @param unspent
 */
const validateTransaction = async (multihash, transaction, unspent) => {
	if (!transaction.reward) delete transaction.reward;
	const outputs = transaction.outputs.map(o => {
		// TODO: fix script
		if (!o.script) delete o.script;
		return o
	});
	transaction.outputs = outputs;
	if (!transaction.script) delete transaction.script;
	if (!isValid('transaction', transaction)) throw new TransactionError('Invalid transaction');
	if (multihash !== await transactionHash(transaction)) throw TransactionError('Invalid transaction hash');
	// TODO: versions should be handled here...
	// Verify each input signature
	
	if (transaction.inputs) {
		transaction.inputs.forEach(input => {
	  	const { signature, address } = input;
			const hash = transactionInputHash(input);

	  	let wallet = new MultiWallet(network);
	    wallet.fromAddress(address, null, network);
			
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
 * validate transactions list for current block
 *
 * @param {array} transactions
 * @param unspent
 */
const validateTransactions = async (transactions, unspent) => {
	const _transactions = [];
	for (const {multihash} of transactions) {
		const { value } = await global.ipfs.dag.get(multihash);
		const tx = new LFCTx$1(value);
		_transactions.push({multihash, value: tx.toJSON()});
		
	}
	for (const {value, multihash} of _transactions) {
		// TODO: fix value.scrip
		await validateTransaction(multihash, value, unspent);
	}
	
	if (_transactions.filter(({value}) => value.reward === 'mined').length !== 1)
		throw TransactionError('Transactions cannot have more than one reward')	
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

const { LFCNode: LFCNode$2, util: util$4 } = ipldLfc__default;

const invalidTransactions = {};

global.chain = global.chain || [
  GENESISBLOCK
];
global.mempool = global.mempool || [];
global.blockHashSet = global.blockHashSet || [];

const chain$1 = (() => global.chain)();

const mempool$1 = (() => global.mempool)();

const blockHashSet = (() => global.blockHashSet)();

// TODO: needs 3 nodes running
const invalidTransaction = data => {
  // console.log(data.data.toString());
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

/**
 * Get the transactions for the next Block
 *
 * @return {object} transactions
 */
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
      const {value} = await global.ipfs.dag.get(multihash, {format: LFCNode$2.codec, hashAlg: LFCNode$2.faultHashAlg, version: 1, baseFormat: 'base58btc'});
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
		stamps.push(10);
	}
	let blocksMedian = median(stamps) || 10;
  const offset = blocksMedian / 10;
   // offset for quick recovery
	if (blocksMedian < 10) {
		blocksMedian -= (offset / 2);
	} else if (blocksMedian > 10) {
		blocksMedian += (offset * 2);
	}
  if (blocksMedian < 0) blocksMedian = -blocksMedian;
  console.log(`Average Block Time: ${blocksMedian}`);
  console.log(`Difficulty: ${10 / blocksMedian}`);
	return (10000000 / ((10 / blocksMedian) * 1000)); // should result in a block every 10 seconds
};//10000

const filterPeers = (peers, localPeer) => {
  const set = [];
  return peers.reduce((p, c) => {
    if (set.indexOf(c.peer) === -1 && c.peer !== localPeer) {
      set.push(c.peer);
      p.push(c);
    }
    return p
  }, [])
};

// TODO: global peerlist
const longestChain = () => new Promise(async (resolve, reject) => {
  
  try {
    let peers = await ipfs.swarm.peers();
    console.log(peers);
    peers = await filterPeers(peers, globalThis.peerId);
    console.log(peers);
    // if (peers.length < 2) return setTimeout(async () => {
    //   const res = await longestChain()
    //   resolve(res)
    // }, 100);
    
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
    const history = {};
    _blocks = _blocks.reduce((set, {block, path: path$$1}) => {
      if (set.block.index < block.index) {
        history[set.block.index] = set;
        set.block = block;
        set.hash = path$$1.replace('/ipfs/', '');
        set.seen = 1;
      } else if (set.block.index === block.index) {
        set.seen = Number(set.seen) + 1;
      }
      return set
    }, {block: { index: localIndex$$1 }, hash: localHash, seen: 0});
    // temp 
    // if (_blocks.seen < 2) {
    //   _blocks = history[_blocks.block.index - 1]
    // 
    // }
    // const localIndex = await chainStore.get('localIndex')
    // const localHash = await chainStore.get('localBlock')
    return resolve({index: _blocks.block.index, hash: _blocks.hash})
    
  } catch (e) {
    console.warn(e);
    debug(e);
    reject(e);
  }
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
  // setTimeout(async () => {
  //   const hash = leofcoin.hashMap.get(leofcoin.hashMap.size - 1)
  //   console.log(leofcoin.hashMap.get(leofcoin.hashMap.size - 1));
  //   console.log(hash);
  //   const {index} = await leofcoin.block.get(hash)
  //   console.log(index);
  //   resolve({hash, index})
  // }, 1000);
  const result = await longestChain();
  
  resolve(result); // retrieve links
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
    // previousBlock = chain[chain.length - 1]; // TODO: await lastBlock
    transactions = await nextBlockTransactions();
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

const goodBlock = (block, difficulty) => new Promise(async (resolve, reject) => {
  // return setTimeout(async () => {
    block.hash = await calculateHash(block);
    if (parseInt(block.hash.substring(0, 8), 16) >= difficulty) {
      block.nonce++;
      block = await goodBlock(block, difficulty);
    }      
    resolve(block);
  // }, 500);
});

/**
 * Create a new genesis block
 */
const newGenesisDAGNode = async (difficulty = 1, address = Buffer.alloc(32).toString('hex')) => {
  let block = {
    index: 0,
    prevHash: Buffer.alloc(47).toString('hex'),
    time: Math.floor(new Date().getTime() / 1000),
    transactions: [
      // ms.unspent(network, [], wallet.account()).create(index: 0, amount: consensusSubsidy(0), address)
    ],
    nonce: 0
  };
  block.hash = await calculateHash(block);
  block = await goodBlock(block, difficulty);
  console.log({block});
  const node = new LFCNode$2(block);
  return node;
};

globalThis.leofcoin = globalThis.leofcoin || {};

const sync = async () => {
  try {
    console.log(fixIndex);
    if (fixIndex) {
      await chainStore.put(0, genesisCID);
      await chainStore.put('localBlock', genesisCID);
      await chainStore.put('localIndex', 0);
    }
    console.log(await chainStore.get());
    // console.log(await leofcoin.block.dag.get("zsNS6wZiHT3AuWEsd6sE6oPEcCnd2pWcNKPfNUofoEybxx57Y45N4xJKBAdZH1Uh8Wm3e1k2nNhhuSai9z3WAK6pHtpmjg"));
    const { localIndex: localIndex$$1, multihash } = await localBlock();
    // const localIndex = await chainStore.get('localIndex')
    // const c = await chainStore.get('localBlock')
    ipfs.name.publish(multihash);
    const { hash, index } = await longestChain();
    console.log(index, localIndex$$1, multihash);
    if (index > Number(localIndex$$1)) {
      leofcoin.currentBlockHash = hash;  
      leofcoin.currentBlockNode = await leofcoin.block.dag.get(leofcoin.currentBlockHash);
    } else {
      if (index === 0) leofcoin.currentBlockHash = genesisCID;
      else leofcoin.currentBlockHash = multihash || await localDAGMultiaddress();    
        console.log('ge');
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
    // let multihash = await read(localCurrent, 'string'); // read local chain state
    // const { value, remainderPath } = await ipfs.dag.get(multihash, { format: LFCNode.codec, hashAlg: LFCNode.defaultHashAlg, version: 1, pin: true});
    
    // const current = value
    // const node = new LFCNode(current)
    // 
    // probably recovering local chain
    if (index === undefined) {
      debug(`invalid block detected, recovering local chain`);
      await chainStore.put('localBlock', genesisCID);
      await chainStore.put('localIndex', 0);
      return localBlock();
    } else {        
      debug(`current local block: ${index} - ${multihash}`);
    }
    return {
      localIndex: index,
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
  console.log(node.toString());
  const cid = await ipldLfc.util.cid(node.serialize());
  chain[node.index] = node.toJSON();
  chain[node.index].hash = cid.toBaseEncodedString();
  leofcoin.hashMap.set(node.index, cid.toBaseEncodedString());
  debug(`loaded block: ${node.index} - ${chain[node.index].hash}`);
  if (node.prevHash !== Buffer.alloc(47).toString('hex')) {
    debug('loading block');
      node = await leofcoin.block.dag.get(node.prevHash);
      if (node.index > index) {
        await chainStore.put(node.index, leofcoin.hashMap.get(node.index));
        debug(`added block: ${node.index}`);
      }
    // }
    try {
      // store them in memory
      // global.blockHashSet[hash] = block.index;
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
/**
 * last resolved, mined or minted block
 *
 * @param {object} cid - cid instance or baseEncodedString 
 */
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
    // global.states.syncing = true;
    // bus.emit('syncing', true);
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
      // whenever prevHash is undefined & syncCount is zero or lower
      // write latest network chain to locals
      const start = Date.now();
      if (index > height) {
        const value = await leofcoin.block.dag.get(multihash);
        await resolveBlocks(value, index);
      }
      else await resolveBlocks(leofcoin.currentBlockNode, height);
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
  constructor(api) {
    globalThis.api = api;
    return this._init(api)
  }
  
  async _init({discoClientMap, ipfs, peerId, discoServer}) {
    // this.discoServer = discoServer
    // globalThis.pubsubRequest = await new PubsubRequest({ipfs, peerId}, this.api)
    globalThis.peerId = peerId;
    globalThis.ipfs = ipfs;
    globalThis.getTx = async multihash => ipfs.dag.get(multihash, { format: ipldLfcTx.LFCTx.codec, hashAlg: ipldLfcTx.LFCTx.defaultHashAlg, vesion: 1, baseFormat: 'base58btc' });
    leofcoin.sync = sync;
    leofcoin.dial = async (addr, protocol = 'disco') => {
      // peer already connected
      // if () return
      console.log(addr);
      // connect
      // await SocketClient(addr, protocol)
      // blacklist after "amount" attempts
    };
    // leofcoin.peers = this.discoServer.connections
    // leofcoin.peerMap = this.discoServer.peerMap
    // leofcoin.discoClientMap = discoClientMap
    leofcoin.request = async (url, params$$1) => {
      const requests = [];
      for (const connection of leofcoin.peers.values()) {
        if (connection.request) {
          requests.push(connection.request({url, params: params$$1}));
        }
      }
      // get request as soon as possible
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
            const { value } = await ipfs.dag.get(multihash);
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

globalThis.leofcoin = globalThis.leofcoin || {};

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
		if (_accounts.length > 1) return discover(depth + 1);
    return accounts;
  };

  return discover(0);

};

const or = (a, b) => a ? a : b;

/**
 * Get hash difficulty
 *
 * @param hash
 * @return {Number}
 */

class Miner {

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
        bus$1.removeListener('block-added', this._onBlockAdded);
        bus$1.removeListener('invalid-block', this._onBlockInvalid);
        resolve(block);
      };
      this._onBlockInvalid = block => {
        this.mineStop();
        bus$1.removeListener('block-added', this._onBlockAdded);
        bus$1.removeListener('invalid-block', this._onBlockInvalid);
        resolve(null);
      };
      bus$1.once('block-added', this._onBlockAdded);
      bus$1.once('invalid-block', this._onBlockInvalid);
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
      bus$1.emit('miner.hashrate', {uid: job, hashrate: (Math.round(rate * 100) / 100)});
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
       bus$1.removeListener('block-added', blockAddedListener);
       bus$1.removeListener('mine-stop', mineStopListener);
      };
      // If other process found the same block faster, kill current one
      bus$1.once('block-added', blockAddedListener);
      bus$1.once('mine-stop', mineStopListener);
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

globalThis.bus = globalThis.bus || bus$1;

globalThis.states = globalThis.states || {
  ready: false,
  syncing: false,
  connecting: false,
  mining: false
};
const blockHashSet$1 = globalThis.blockHashSet;
/**
* state - get current app state
*
* @param {string} key - event name
* @param {boolean|string} [wait=false|wait='event'] - wait untill next event when asked state is false
* or wait untill next event when set to 'event'
*/
const state = (key, wait) => new Promise(async (resolve, reject) => {
  const state = await globalThis.states[key];
  if (wait && !state || wait && wait === 'event') bus$1.once(key, state => resolve(state));
  else resolve(state);
});

const getConfig = async () => await accountStore.get('config');

const setConfig = async data => await accountStore.put('config', data);

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
  if (!config) {
    config = await accountStore.get('config');
    config = config.miner;
  }
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
  // TODO: add donationAddress
  // TODO: add donation option in ui
  // if (!address) address = donationAddress;

};

const importWallet = async (wif) => {
  // wallet = await generateWallet();
  // console.log(wallet.mnemonic);
  // const account = wallet.derive(`m/0\'/0/0`)
  // return { mnemonic: wallet.mnemonic, accounts: [account.address] }
};

const accounts = async (discoverDepth = 0) => {
  let wallet;
  let accounts = undefined;
  try {
    wallet = leofcoin.wallet;
    await state('ready', true);
    accounts = discoverAccounts(wallet, discoverDepth);
  } catch (e) {
    console.log('readied');
  }
  return accounts;
};

const accountNames = async () => await walletStore.get('accounts');
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
  return data.miner;
};

const send = async ({from, to, amount, message}, response) => {
  // TODO:
  // const service = await mss({globalThis.ipfs, chain: chain.get()})
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
    let wallet = leofcoin.wallet;
    // account ...
    let _accounts = await accounts();
    const names = await accountNames();
    // TODO: cleanup wallet internal/external...
    // something like accounts: [{ name, internal: [internal(0), internal(1), ...]}]
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

const on = (ev, cb) => bus$1.on(ev, cb);

const emit = (ev, data) => bus$1.emit(ev, data);

var api = /*#__PURE__*/Object.freeze({
	blockHashSet: blockHashSet$1,
	state: state,
	getConfig: getConfig,
	setConfig: setConfig,
	setMinerConfig: setMinerConfig,
	block: block$1,
	blocks: blocks,
	transactions: transactions,
	mine: mine,
	importWallet: importWallet,
	accountNames: accountNames,
	send: send,
	balance: balance,
	balanceAfter: balanceAfter,
	network: network,
	on: on,
	emit: emit,
	addresses: addresses,
	getMinerConfig: getMinerConfig,
	accounts: accounts
});

var version = "0.5.3";

var apiServer = () => {
  const client = '@leofcoin/core/http';
  const app = new Koa();
  const router = new Router();
  
  router.get('/api/version/', ctx => {
    ctx.body = {client, version};
  });
  
  router.get('/api/config', ctx => {
    if (ctx.request.query.miner) ctx.body = getMinerConfig();
    else ctx.body = getConfig();
  });
  
  router.put('/api/config', ctx => {
    if (ctx.request.query === 'miner') setMinerConfig(ctx.request.query.miner);
    else setConfig(ctx.request.query.value);
  });
  
  router.put('/api/config/miner', ctx => {
    console.log(ctx.request.query, ctx.request.query.intensity);
    if (ctx.request.query.intensity) setMinerConfig({intensity: ctx.request.query.intensity});
    // else api.setConfig(ctx.request.query.value)
  });
  
  router.get('/api/mine', ctx => {
    mine(getMinerConfig());
  });
  
  app.use(router.routes());
  app.use(router.allowedMethods());
  
  app.listen(5050, () => console.log('api listening on 5050'));
};

globalThis.bus = globalThis.bus || bus$1;
globalThis.peerMap = globalThis.peerMap || new Map();
const core = async (config$$1 = {}) => {
  if (config$$1.debug) process.env.DEBUG = true;
	try {
    const now = Date.now();
    bus$1.emit('stage-one');
    
    debug('starting ipfs');
    const api = await new LfcApi({ init: true, start: true, bootstrap: 'lfc', forceJS: true, star: config$$1.star, network: config$$1.network});
    apiServer();
    try {
      await new GlobalScope(api);
    } catch (e) {
      console.warn(e);
    }
    // globalThis.id = api.peerId;
    // globalThis.ipfs = api.ipfs;
    
    const ipfsd_now = Date.now();
    // await connectBootstrap();

    const bootstrap_now = Date.now();

    // globalThis.getPeers = () => disco.peers || [];
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
    bus$1.emit('stage-two');
    groupCollapsed('Initialize', () => {
      log(`ipfs daemon startup took: ${(ipfsd_now - now) / 1000} seconds`);
      log(`connecting with bootstrap took: ${(bootstrap_now - ipfsd_now) / 1000} seconds`);
      log(`signal server startup took: ${(signal_now - bootstrap_now) / 1000} seconds`);
      log(`peer connection took: ${(connection_now - ipfsd_now) / 1000} seconds`);
      log(`total load prep took ${(Date.now() - now) / 1000} seconds`);
    });
    // await write(configPath, JSON.stringify(config, null, '\t'));
    const chain = new DAGChain({ genesis, network, ipfs: api.ipfs });
    await chain.init(genesis);
    return chain;
	} catch (e) {
    if (e.code === 'ECONNREFUSED' || e.message && e.message.includes('cannot acquire lock')) {
      // await cleanRepo();
      console.log('retrying');
      // return core({ genesis, network });
    }
		console.error(`load-error::${e}`);
    // process.exit()
	}
};

// import {core, api} from './../node_modules/@leofcoin/core/dist/module/core.js';
// api.cores = cores
// const {addresses, state, createWallet, accounts, accountNames, balance, balanceAfter, send, getMinerConfig, setMinerConfig, block, blocks, transactions, mine,  on} = api

var renderer = {core, api};

module.exports = renderer;
