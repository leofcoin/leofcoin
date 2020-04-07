import socket from 'socket-request-client'
import ip from 'public-ip'

export default class WsTransport {
  constructor(peerId, addresses) {
    this.connections = new Map()
    this.listen(peerId, addresses)
    
    globalThis.addEventListener('beforeunload', async event => {
      const entries = this.connections.entries()
      for (const [address, _connection] of entries) {
        const { connection } = _connection
        console.log(address);
        try {
          await connection.peernet.leave(peerId) 
          console.log('left');
        } catch (e) {
          console.warn(e);
        }
      }
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
  
  async listen(peerId, addresses, port = 4040, garbageCleanupTimeout = 10000) {
    await this.dial('wss://star.leofcoin.org/disco')
    
    setTimeout(async () => {
      for (const {connection} of this.connections.values()) {
        const peers = await connection.peernet.join({peerId, address: addresses})  
        console.log(peers);
        for (const peer of peers) {
          if (peer !== `ws://localhost:${port}`) await peernet.dial(peer)
        }
        connection.pubsub.publish('peernet:message', `hi from ${peerId}`)
        connection.pubsub.publish('peernet:join', peerId)
        connection.pubsub.subscribe('peernet:join', async peer => {
          console.log(peer + ' joined');
          // const peerInfo = await new PeerInfo(peer)
          // peerInfo.multiaddrs.add('/p2p/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs/p2p-circuit')
          // peerInfo.protocols.add('/ipfs/kad/1.0.0')
          // this.ipfs.libp2p.emit('peer:discover', peerInfo)
          // if (peerInfo.id !== this.peerId) await this.ipfs.swarm.connect(`/p2p/QmamkpYGT25cCDYzD3JkQq7x9qBtdDWh4gfi8fCopiXXfs/p2p-circuit/p2p/${peerInfo.id}`)
        })
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