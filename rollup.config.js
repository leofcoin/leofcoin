import cleanup from 'rollup-plugin-cleanup';
import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

import del from 'del';

del.sync('www/chunk-*')
export default [{
  input: ['src/leofcoin.js', 'src/bus.js'],
  output: {
    dir: './',
    format: 'cjs'
  },
	experimentalCodeSplitting: true,
  treeshake: true,
  plugins: [
    json(),
    // cjs(),
    // resolve(),
    cleanup()
  ]
}, {
  input: ['src/www/leofcoin-shell.js', 'src/www/sections/wallet/wallet.js',
          'src/www/sections/miner.js', 'src/www/sections/explorer/explorer.js',
          'src/www/sections/explorer/explorer-block.js', 'src/www/sections/explorer/explorer-transaction.js'
          ],
  output: {
    dir: 'www',
    format: 'es'
  },
	experimentalCodeSplitting: true,
  treeshake: true,
	plugins: [
    json(),
    cjs(),
    resolve()
  ]
}]
