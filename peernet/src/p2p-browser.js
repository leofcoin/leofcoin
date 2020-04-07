import WebRTCTransport from './webrtc'
import WsTransport from './ws-browser'
import AddressBook from './address-book'


export default class Peernet {
  get connections() {
    for (const [name, value] of this.transports.entries()) {
      console.log(value.connections);
    }
  }
  
  constructor(id) {
    this.dial = this.dial.bind(this)
    globalThis.peernet = {}
    globalThis.peernet.dial = this.dial
    this.transports = new Map()
    this._init(id)
  }
  
  async _init(id) {    
    this.addressBook = await new AddressBook(id, ['webRTC', 'ws'])
    this.transports.set(WebRTCTransport.name, new WebRTCTransport(id, this.addressBook.addresses))
    this.transports.set(WsTransport.name, new WsTransport(id, this.addressBook.addresses))
  }
  
  async _dial(address) {
    console.log(address);
    if (address.includes('/ws/'))
      try {
        const transport = this.transports.get(WsTransport.name)
        address = address.split('/')
        await transport.dial(`${address[1]}://${address[3].replace(/:/g, '-')}.sslip.io:${address[2]}`)
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
        await this._dial(addr)
      }
    } else {
      return this._dial(address)
    }
  }
}
