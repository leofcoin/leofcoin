export default class WebRTCTransport {
    constructor(peerId) {
      this.connections = new Map()
      globalThis.peer = new peerjs.Peer(peerId)
      peer.on('connection', (conn) => {
        this.connections.set(conn.id, conn)
        conn.on('open', (id) => {
          console.log(id);
          conn.send('hello!');
        });
        conn.on('data', (data) => {
          // Will print 'hi!'
          console.log(data);
        });
      });
    }
  }