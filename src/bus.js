import bus from './../../../leofcoin-core/src/lib/bus.js';
import { rpc, rpc_process } from 'carlo/rpc';

rpc_process.init(() => rpc.handle(bus));
