'use strict';

class AddressBook {
  constructor( peerId, transports, protocols = ['peernet'], address = '127.0.0.1') {
    this.addresses = [];
    for (const transport of transports) {
      for (var protocol of protocols) {
        if (transport.name) {
          this.addresses.push(`/${protocol}/${transport.name}/${transport.port}/${peerId}/${address}`);  
        } else {
          this.addresses.push(`/${protocol}/${transport}/${peerId}/${address}`);
        }
        
      }
    }
  }
}

exports.AddressBook = AddressBook;
