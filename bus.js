'use strict';

let LeofcoinStorage;
let QRCode;
let Ipfs;

var __chunk_1 = require('./chunk-8c482a3a.js');
var rpc = require('carlo/rpc');
require('events');

rpc.rpc_process.init(() => rpc.rpc.handle(__chunk_1.bus));
