import { define, RenderMixin, CSSMixin } from './../../shared-imports.js';
import './wallet-address-balance.js';

export default define(class walletAccount extends CSSMixin(RenderMixin(HTMLElement)) {
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
  }

  set address(value) {
    if (value) {
      this._address = value;
    }
  }

  set account(value) {
    this.index = value[0];
    this.setAttribute('data-route', this.index)
    this.name = leofcoin.api.accountNames[this.index];
    if (!this.name) this.name = value[1]
    this.address = value[2][0];
    console.log(value);
    this.title = `external address: ${value[2][0]}\ninternal address: ${value[2][1]}`
    this.updateBalance();
  }

  get address() {
    return this._address;
  }

  get walletAddressBalance() {
    return this.shadowRoot.querySelector('wallet-address-balance')
  }

  async updateBalance() {
    await leofcoin.api.state('ready', true);
    this.walletAddressBalance.address = this.address;
    // this.balance = await balance(this.address);
    // this.balance = String(this.balance);
    this.observer();
  }

  observer() {
    if (this.name) {
      this.render({name: this.name})
    }
  }

  get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: row;
          cursor: pointer;
          /* border: 1px solid rgba(0,0,0, 0.78); */
          box-sizing: border-box;
          width: 100%;
          color: #ddd;
          padding: 12px;
          --svg-icon-color: #ddd;
          --svg-icon-size: 40px;
          align-items: center;
          text-transform: uppercase;
          user-select: none;
          outline: none;
          pointer-events: auto;
        }

        :not(:host) {
          pointer-events: none;
        }

        .column {
          padding-left: 12px;
          width: 100%;
          mixin(--css-column)
        }

        .lfc {
          padding-left: 6px;
        }

        apply(--css-row)
        apply(--css-flex)

        :host(.custom-selected) {
          background: #5557618a;
        }
      </style>

      <custom-svg-icon icon="wallet"></custom-svg-icon>
      <span class="column">
        <span class="address">${'name'}</span>
        <span class="row">
          <wallet-address-balance></wallet-address-balance>
          <strong class="lfc">LFC</strong>
        </span>
      </span>
    `;
  }
})
