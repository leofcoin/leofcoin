/* leofcoin-core version 0.1.2 */
'use strict';

const ENVIRONMENT = {version: '0.1.2', production: true};

var ipldDagPb = require('ipld-dag-pb');
require('cids');

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
}

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
	for (let i = hashrates.length; i-- > 0;) {
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
  		block.nonce++;
  		block.hash = await calculateHash(block);
  		hashCount = hashCount + Number(hashes(block.nonce));
  	}
  	process.send({ block, hashCount });
	});

})();

module.exports = minerWorker;
/* follow Leofcoin on Twitter! @leofcoin */
