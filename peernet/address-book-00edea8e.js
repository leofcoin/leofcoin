'use strict';

class AddressBook {
  constructor( peerId, transports, protocols = ['peernet'], address = '127.0.0.1') {
    this.addresses = [];
    for (const transport of transports) {
      for (var protocol of protocols) {
        this.addresses.push(`/${protocol}/${transport.name}/${peerId}/${address}/${transport.port}`);
      }
    }
  }
}

exports.AddressBook = AddressBook;
