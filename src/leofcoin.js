import { launch } from 'carlo';
import { homedir } from 'os';
import { join } from 'path';
import { rpc, rpc_process } from 'carlo/rpc';
import { addresses, state, createWallet, accounts, accountNames, balance, balanceAfter, send, getMinerConfig, setMinerConfig, block, blocks, transactions, mine, chain, on } from './../../../leofcoin-core/src/api';
import core from './../../../leofcoin-core/src/core.js';
import cores from 'physical-cpu-count';

const userDataDir = join(homedir(), '.leofcoin');

const busPath = join(__dirname, 'bus.js');

(async () => {

  const app = await launch({
    bgcolor: '#fff',
    width: 1400,
    height: 840,
    userDataDir,
    title: 'leofcoin',
    domain: 'leofcoin.org',
    // channel: ['stable', 'canary', 'chromium'],
    ignoreDefaultArgs: ['--disable-extensions']
  });
  console.log('before');
  core();
  app.serveFolder(join(__dirname , 'www'));

  const bus = await rpc_process.spawn(busPath);


  app.on('exit', () => {
    process.exit()
  });

  app.on('window', window => {
    window.load('index.html', rpc.handle(app), bus)
  });

  await app.exposeFunction('accountNames', accountNames);

  await app.exposeFunction('balance', balance);
  await app.exposeFunction('balanceAfter', balanceAfter);
  await app.exposeFunction('accounts', accounts);
  await app.exposeFunction('addresses', addresses);
  await app.exposeFunction('state', state);
  await app.load('index.html', rpc.handle(app), bus);
  await app.exposeFunction('cores', () => cores);
  await app.exposeFunction('createWallet', createWallet);
  await app.exposeFunction('send', send);
  await app.exposeFunction('mine', mine);
  await app.exposeFunction('setMinerConfig', setMinerConfig);
  await app.exposeFunction('getMinerConfig', getMinerConfig);
  await app.exposeFunction('blocks', blocks);
  await app.exposeFunction('block', block);
  await app.exposeFunction('transactions', transactions);
  await app.exposeFunction('blockHashSet', () => {
    return blockHashSet
  });
  on('miner.hashrate', data => bus.emit('miner.hashrate', data))
  on('block-added', data => bus.emit('block-added', data))
})();
