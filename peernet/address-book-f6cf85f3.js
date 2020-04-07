'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var getPort = _interopDefault(require('get-port'));
var ip = require('public-ip');
var ip__default = _interopDefault(ip);

class AddressBook {
  constructor(peerId, transports, protocols = ['peernet']) {
    return this._build(peerId, transports, protocols = ['peernet'])
  }
  
  async _build(peerId, transports, protocols = ['peernet']) {
    try {
      this.ip = await ip__default.v6();
    } catch (e) {
      this.ip = await ip__default.v4();
    }
    this.addresses = [];
    for (const transport of transports) {
      for (var protocol of protocols) {
        if (transport.name && !globalThis.navigator) {
          
          transport.port = await getPort(transport.port);
          this.addresses.push(`/${protocol}/${peerId}/${transport.name}/${transport.port}/${this.ip}`);  
        } else {
          this.addresses.push(`/${protocol}/${peerId}/${transport}/${this.ip}`);
        }
        
      }
    }
    return this
  }
  
}

exports.AddressBook = AddressBook;
