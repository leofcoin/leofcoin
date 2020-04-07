'use strict';

class AddressBook {
  constructor( peerId, transports, protocols = ['peernet'], address = '127.0.0.1') {
    this.addresses = [];
    for (const transport of transports) {
      for (var protocol of protocols) {
        if (transport.name) {
          this.addresses.push(`/${protocol}/${peerId}/${transport.name}/${transport.port}/${address}`);  
        } else {
          this.addresses.push(`/${protocol}/${peerId}/${transport}/${address}`);
        }
        
      }
    }
  }
}

exports.AddressBook = AddressBook;
