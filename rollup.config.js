import cleanup from 'rollup-plugin-cleanup';
import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import todo from 'rollup-plugin-todo';
import modify from 'rollup-plugin-modify';
import { spawn } from 'child_process';
import del from 'del';

del.sync('www/chunk-*')
del.sync('chunk-*')
// spawn('cp', ['node_modules/rpc-bus/dist/index.js', 'www/rpc-bus.js'])
export default [{
  input: ['src/leofcoin.js', 'src/bus.js'],
  output: {
    dir: './',
    format: 'cjs',
    intro: 'let LeofcoinStorage;\nlet QRCode;\nlet Ipfs;'
  },
	experimentalCodeSplitting: true,
  treeshake: true,
  plugins: [
    json(),
    todo(),
		modify({
	    STORAGE_IMPORT: `new Promise((resolve, reject) => {
	      if (!LeofcoinStorage) LeofcoinStorage = require('lfc-storage');
	      resolve()
	    });`,				
      QRCODE_IMPORT: `if (!QRCode) QRCode = require('qrcode');`,
      IPFS_IMPORT: `new Promise((resolve, reject) => {
        if (!Ipfs) Ipfs = require('ipfs');
        resolve()
      })`
		}),
    // cjs(),
    // resolve(),
    cleanup()
  ]
}, {
  input: ['src/www/leofcoin-shell.js', 'src/www/sections/wallet/wallet.js',
          'src/www/sections/miner/miner.js', 'src/www/sections/explorer/explorer.js',
          'src/www/sections/explorer/explorer-block.js',
          'src/www/sections/explorer/explorer-transaction.js',
          'src/www/sections/statistics.js',
          'src/www/iconset.js', 'src/www/splash-screen.js'
          ],
  output: {
    dir: 'www',
    format: 'es'
  },
	experimentalCodeSplitting: true,
  treeshake: true,
	plugins: [
    json(),
    todo(),
    cjs(),
    resolve()
  ]
}]
