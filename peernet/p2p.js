'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var swarm = _interopDefault(require('discovery-swarm'));
var getPort = _interopDefault(require('get-port'));
var server = _interopDefault(require('socket-request-server'));
var socket = _interopDefault(require('socket-request-client'));
require('public-ip');
var addressBook = require('./address-book-f08255b2.js');

class UTPTCPTransport {
  constructor(peerId, addresses, port= 1000) {
    this._onConnection = this._onConnection.bind(this);
    this._onData = this._onData.bind(this);
    this._onPeer = this._onPeer.bind(this);
    this._onPeerBanned = this._onPeerBanned.bind(this);
    this._onConnectionClosed = this._onConnectionClosed.bind(this);
    
    this.discoveryMap = new Map();
    this.connectionMap = new Map();
    
    this.listen(peerId, port);
  }
  
  async listen(peerId, port) {
    port = await getPort({port});
    
    
    this.swarm = swarm({
      id: peerId,
      utp: true,
      tcp: true
    });
    
    this.swarm.listen(port);
    this.swarm.join('/v0/peernet');
    this.swarm.on('connection', this._onConnection);
    this.swarm.on('connection-closed', this._onConnectionClosed);
    this.swarm.on('peer-banned', this._onPeerBanned);
    this.swarm.on('peer', this._onPeer);
  }
  
  _onPeerBanned(peer, info) {
    
    console.log(`banned ${peer}, ${info}`);
    //this.discoveryMap.remove(peer.id)
  }
  /**
   * Fired whenever a peer is discovered
   *
   *
   */
  _onPeer(peer) {
    this.discoveryMap.set(peer.id, {
      port: peer.port,
      address: peer.host,
      connected: false
    });
    // peer.host // remote address
    // peer.port // remote port
    // peer.id // peerId
    // peer.retries // the number of times tried to connect to this peer
  }
  
  _onConnection(connection, info) {
    console.log(info.id.toString());
    console.log('connected to peer' + info);
    this.connectionMap.set(info.id, connection);
    connection.write('hello');
    connection.on('data', this._onData);
  }
  
  _onConnectionClosed(connection, info) {
    
  }
  
  _onData(data) {
    console.log(data.toString());
  }
}

class WsTransport {
  constructor(peerId, addresses) {
    this.connections = new Map();
    this.listen(peerId, addresses);
    
    process.on('exit', async () => {
    console.log('leaving');
      await this.client.peernet.leave(peerId);
    });
  }
  
  async dial(address) {
    try {
      const connection = await socket(address, 'disco');
      connection.pubsub.subscribe('peernet:message', (msg) => {
        console.log({msg}); 
      });
      this.connections.set(address, {connection, latency: 0});
      return
    } catch (e) {
      console.warn(e);
    }
  }
  
  async listen(peerId, addresses, garbageCleanupTimeout = 10000) {
    let port;
    
    for (const addr of addresses) {
      if (addr.includes('/ws/'))
      port = addr.split('/')[2];
    }
    console.log(port);
    this.server = await server({ port, protocol: 'disco' }, {});
    await this.dial('wss://star.leofcoin.org/disco');
    
    setTimeout(async () => {
      for (const {connection} of this.connections.values()) {
        const peers = await connection.peernet.join({peerId, address: addresses});
        for (const addr of peers) {
          await peernet.dial(addr);
        }
        connection.pubsub.publish('peernet:join', peerId);
        connection.pubsub.subscribe('peernet:join', async peer => {
          console.log(peer + ' joined');
          // const peerInfo = await new PeerInfo(peer)
          // peerInfo.multiaddrs.add('/p2p/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs/p2p-circuit')
          // peerInfo.protocols.add('/ipfs/kad/1.0.0')
          // this.ipfs.libp2p.emit('peer:discover', peerInfo)
          // if (peerInfo.id !== this.peerId) await this.ipfs.swarm.connect(`/p2p/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs/p2p-circuit/p2p/${peerInfo.id}`)
        });
        connection.pubsub.publish('peernet:message', `hi from ${peerId}`);
      }
    }, 5000);
    
    this.cleanup = () => setTimeout(async () => {
      try {
        if (this.connections.size === 0) await this.dial('wss://star.leofcoin.org/disco');
        const entries = this.connections.entries();
        for (const [address, _connection] of entries) {
          const { connection } = _connection;
          console.log(address);
          try {
            const ping = await connection.server.ping();  
            this.connections.set(address, { connection, latency: ping });
            console.log({ping});
          } catch (e) {
            this.connections.delete(address);
            console.warn(e);
            return this.cleanup()
          }
        }
      } catch (e) {
        return this.cleanup()  
      }
      return this.cleanup()
    }, garbageCleanupTimeout);
    
    this.cleanup();
    
    
  }
}

class Peernet {
  get connections() {
    for (const [name, value] of this.transports.entries()) {
      console.log(value.connections);
    }
  }
  
  async _dial(address) {
    if (address.includes('/ws/'))
      try {
        const transport = this.transports.get(WsTransport.name);
        address = address.split('/');
        await transport.dial(`${address[1]}://${address[3].replace(/:/g, '-')}.sslip.io:${address[2]}`);
        // const connection = await socket(`wss://${address[2]}:${address[1]}`, 'disco')
        // connection.pubsub.subscribe('peernet:message', (msg) => {
        //   console.log({msg});
        // })
        // this.transports[WsTransport.name].connections.set(address[address.length - 1], {connection, latency: 0})
        return
      } catch (e) {
        console.warn(e);
      }
    else if (address.includes('/disco-swarm')) {
      return
    }
  }
  async dial(address) {
    if (Array.isArray(address)) {
      for (const addr of address) {
        await this._dial(addr);
      }
    } else {
      return this._dial(address)
    }
  }
  
  constructor(id) {
    
    this.dial = this.dial.bind(this);
    this.transports = new Map();
    
    this._init(id);    
    
    globalThis.peernet = {};
    globalThis.peernet.dial = this.dial;
    
  }
  
  async _init(id) {
    this.addressBook = await new addressBook.AddressBook(id, [{
      name: 'utp-tcp',
      port: 1000
    }, {
      name: 'ws',
      port: 4000
    }]);
    // this.addressBook = new AddressBook(['utp', 'tcp', 'ws'])
    this.transports.set(UTPTCPTransport.name, new UTPTCPTransport(id, this.addressBook.addresses));
    this.transports.set(WsTransport.name, new WsTransport(id, this.addressBook.addresses));
  }
  
}

module.exports = Peernet;
