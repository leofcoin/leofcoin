import cleanup from 'rollup-plugin-cleanup';
import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import todo from 'rollup-plugin-todo';
import modify from 'rollup-plugin-modify';
import { spawn } from 'child_process';
import del from 'del';

del.sync('app/www/chunk-*')
del.sync('app/chunk-*')
spawn('cp', ['node_modules/@leofcoin/core/dist/commonjs/miner-worker.js', 'app/www/miner-worker.js'])
// spawn('cp', ['node_modules/rpc-bus/dist/index.js', 'www/rpc-bus.js'])
export default [
  {
    input: 'src/renderer.js',
    output: {
      file: './app/www/renderer.js',
      format: 'cjs'
    },
    plugins: [
      json()
    ]
  },
  {
    input: 'src/gui.js',
    output: {
      file: './app/gui.js',
      format: 'cjs'
    },
    plugins: [
      cjs()
    ]
  },
  {
  
  input: ['src/bus.js'],
  output: {
    dir: './app',
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
          'src/www/sections/miner/miner.js',
          'src/www/sections/explorer/explorer.js',
          'src/www/sections/settings/settings.js',
          'src/www/sections/explorer/explorer-block.js',
          'src/www/sections/explorer/explorer-transaction.js',
          'src/www/sections/statistics.js',
          'src/www/iconset.js', 'src/www/splash-screen.js'
          ],
  output: {
    dir: './app/www',
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
