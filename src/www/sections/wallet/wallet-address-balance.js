import { define, merge, PropertyMixin } from './../../shared-imports.js';
import '../../animations/busy';

export default define(class WalletAddressBalance extends HTMLElement {

  set address(value) {
    this._address = value;
    (async () => {
      const index = this.getAttribute('chain-index');
      if (index) this.balance = await leofcoin.api.balanceAfter(this.address, index);
      else this.balance = await leofcoin.api.balance(this.address);
    })()
  }

  get address() {
    return this._address;
  }

  set balance(value) {
    this._balance = value;
    (async () => {
      this.innerHTML = String(value);

      const block = await leofcoin.api.block();
      console.log(block);
      this.setAttribute('chain-index', block.index);
    })()
  }

  get balance() {
    return this._balance;
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'})
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
        }
      </style>
      <slot>
        <busy-animation></busy-animation>
      </slot>
    `;
  }


})
