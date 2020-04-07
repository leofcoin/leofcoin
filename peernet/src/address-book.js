import ip from 'public-ip'
import getPort from 'get-port'

export default class AddressBook {
  constructor(peerId, transports, protocols = ['peernet']) {
    this.addresses = []
    return this._build(peerId, transports, protocols = ['peernet'])
  }
  
  async _build(peerId, transports, protocols = ['peernet']) {
    try {
      this.ip = await ip.v6()
    } catch (e) {
      this.ip = await ip.v4()
    }
    if (!globalThis.navigator) {
      for (const transport of transports) {
        for (var protocol of protocols) {
          if (transport.name && !globalThis.navigator) {
            transport.port = await getPort(transport.port)
            this.addresses.push(`/${transport.name}/${transport.port}/${this.ip}/${protocol}/${peerId}`)
          } else {
            this.addresses.push(`/${transport}/${this.ip}/${protocol}/${peerId}`)
          }
        }  
      }    
    } else {
      this.addresses.push(`/peernet/${peerId}/disco-swarm`)
    }
    return this
  }
  
}