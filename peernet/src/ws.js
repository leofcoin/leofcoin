import server from 'socket-request-server'
import socket from 'socket-request-client'
import getPort from 'get-port'
import {v6} from 'public-ip'

export default class WsTransport {
  constructor(peerId, addresses) {
    this.connections = new Map()
    this.listen(peerId, addresses)
    
    process.on('exit', async () => {
    console.log('leaving');
      await this.client.peernet.leave(peerId)
    })
  }
  
  async dial(address) {
    try {
      const connection = await socket(address, 'disco')
      connection.pubsub.subscribe('peernet:message', (msg) => {
        console.log({msg}); 
      })
      this.connections.set(address, {connection, latency: 0})
      return
    } catch (e) {
      console.warn(e);
    }
  }
  
  async listen(peerId, addresses, garbageCleanupTimeout = 10000) {
    let port
    
    for (const addr of addresses) {
      if (addr.includes('/ws/'))
      port = addr.split('/')[2]
    }
    console.log(port);
    this.server = await server({ port, protocol: 'disco' }, {})
    await this.dial('wss://star.leofcoin.org/disco')
    
    setTimeout(async () => {
      for (const {connection} of this.connections.values()) {
        const peers = await connection.peernet.join({peerId, address: addresses})
        for (const addr of peers) {
          await peernet.dial(addr)
        }
        connection.pubsub.publish('peernet:join', peerId)
        connection.pubsub.subscribe('peernet:join', async peer => {
          console.log(peer + ' joined');
          // const peerInfo = await new PeerInfo(peer)
          // peerInfo.multiaddrs.add('/p2p/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs/p2p-circuit')
          // peerInfo.protocols.add('/ipfs/kad/1.0.0')
          // this.ipfs.libp2p.emit('peer:discover', peerInfo)
          // if (peerInfo.id !== this.peerId) await this.ipfs.swarm.connect(`/p2p/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs/p2p-circuit/p2p/${peerInfo.id}`)
        })
        connection.pubsub.publish('peernet:message', `hi from ${peerId}`)
      }
    }, 5000);
    
    this.cleanup = () => setTimeout(async () => {
      try {
        if (this.connections.size === 0) await this.dial('wss://star.leofcoin.org/disco')
        const entries = this.connections.entries()
        for (const [address, _connection] of entries) {
          const { connection } = _connection
          console.log(address);
          try {
            const ping = await connection.server.ping()  
            this.connections.set(address, { connection, latency: ping })
            console.log({ping});
          } catch (e) {
            this.connections.delete(address)
            console.warn(e);
            return this.cleanup()
          }
        }
      } catch (e) {
        return this.cleanup()  
      }
      return this.cleanup()
    }, garbageCleanupTimeout);
    
    this.cleanup()
    
    
  }
}