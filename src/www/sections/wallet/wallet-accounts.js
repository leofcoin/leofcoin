import { define, RenderMixin, CSSMixin } from './../../shared-imports.js';
import CustomSelectorMixin from './../../../../node_modules/custom-select-mixins/src/selector-mixin';
import './wallet-account.js';

export default define(class walletAccounts extends RenderMixin(CSSMixin(CustomSelectorMixin(HTMLElement))) {
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
    this.selected = 0;
    this._onBlockAdded = this._onBlockAdded.bind(this);
    bus.on('block-added', this._onBlockAdded);
  }

  _onBlockAdded() {
    const accounts = this.shadowRoot.querySelector('slot').assignedElements();
    accounts.forEach(acc => acc.updateBalance())
  }

  onSelect() {
    // const index = this.accounts.indexOf(this.selected);
    // this.dispatchEvent('load-wallet', this.accounts[index])
    // this.accounts[index];
  }

  add(account) {
    const el = document.createElement('wallet-account');
    el.account = account;
    this.appendChild(el)
    // this.accounts.push([address, account]);
  }

  get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          pointer-events: none;
        }

        .custom-selected {
          background: #5557618a;
        }

        apply(--css-flex)
      </style>
      <slot></slot>
      <span class="flex"></span>
    `;
  }
})
