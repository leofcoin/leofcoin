import swarm from 'discovery-swarm'
import getPort from 'get-port'

export default class UTPTCPTransport {
  constructor(peerId, addresses, port= 1000) {
    this._onConnection = this._onConnection.bind(this)
    this._onData = this._onData.bind(this)
    this._onPeer = this._onPeer.bind(this)
    this._onPeerBanned = this._onPeerBanned.bind(this)
    this._onConnectionClosed = this._onConnectionClosed.bind(this)
    
    this.discoveryMap = new Map()
    this.connectionMap = new Map()
    
    this.listen(peerId, port)
  }
  
  async listen(peerId, port) {
    port = await getPort({port})
    
    
    this.swarm = swarm({
      id: peerId,
      utp: true,
      tcp: true
    })
    
    this.swarm.listen(port)
    this.swarm.join('/v0/peernet')
    this.swarm.on('connection', this._onConnection)
    this.swarm.on('connection-closed', this._onConnectionClosed)
    this.swarm.on('peer-banned', this._onPeerBanned)
    this.swarm.on('peer', this._onPeer)
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
    })
    // peer.host // remote address
    // peer.port // remote port
    // peer.id // peerId
    // peer.retries // the number of times tried to connect to this peer
  }
  
  _onConnection(connection, info) {
    console.log(info.id.toString());
    console.log('connected to peer' + info)
    this.connectionMap.set(info.id, connection)
    connection.write('hello')
    connection.on('data', this._onData)
  }
  
  _onConnectionClosed(connection, info) {
    
  }
  
  _onData(data) {
    console.log(data.toString());
  }
}