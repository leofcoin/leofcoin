import UTPTCPTransport from './utp-tcp'
import WsTransport from './ws'
import AddressBook from './address-book'

export default class Peernet {
  get connections() {
    for (const [name, value] of this.transports.entries()) {
      console.log(value.connections);
    }
  }
  
  async _dial(address) {
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
  
  constructor(id) {
    
    this.dial = this.dial.bind(this)
    this.transports = new Map()
    
    this._init(id)    
    
    globalThis.peernet = {}
    globalThis.peernet.dial = this.dial
    
  }
  
  async _init(id) {
    this.addressBook = await new AddressBook(id, [{
      name: 'utp-tcp',
      port: 1000
    }, {
      name: 'ws',
      port: 4000
    }])
    // this.addressBook = new AddressBook(['utp', 'tcp', 'ws'])
    this.transports.set(UTPTCPTransport.name, new UTPTCPTransport(id, this.addressBook.addresses))
    this.transports.set(WsTransport.name, new WsTransport(id, this.addressBook.addresses))
  }
  
}
