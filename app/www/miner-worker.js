/* @leofcoin/core version 0.5.2 */
'use strict';

const ENVIRONMENT = {version: '0.5.2', production: true};

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ipldLfc = _interopDefault(require('ipld-lfc'));
var CID = _interopDefault(require('cids'));

var hashFromMultihash = multihash => {
  const cid = new CID(multihash.replace('/ipfs/', ''));
  return cid.multihash.slice(cid.prefix.length - 3).toString('hex')
};

const { LFCNode, util } = ipldLfc;
var calculateHash = async block => {
  block = await new LFCNode(block);
  const cid = await util.cid(block.serialize());
  return hashFromMultihash(cid.toBaseEncodedString());
};

/**
 * Get hash difficulty
 *
 * @param hash
 * @return {Number}
 */
var getDifficulty = hash => {
	return parseInt(hash.substring(0, 8), 16);
};

const hashes = nonce => {
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
  	while (getDifficulty(block.hash) >= difficulty) {
  		block.nonce = Math.floor(Math.random() * 1000000001);
  		block.hash = await calculateHash(block);
  		hashCount = hashCount + Number(hashes(block.nonce));
  	}
  	process.send({ block, hashCount });
	});

})();

module.exports = minerWorker;
/* follow Leofcoin on Twitter! @leofcoin */
