import { define, merge, RenderMixin, PropertyMixin, CSSMixin } from './../../shared-imports.js';

import './wallet-address';

export default define(class WalletAddresses extends CSSMixin(RenderMixin(PropertyMixin(HTMLElement))) {
  static get properties() {
    return merge(super.properties, {
      value: {
        observer: '__valueChange__'
      }
    })
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'})
  }

  __valueChange__(oldValue, newValue) {
    if (this.value) {
      for (const item of this.value) {
        this.add(item);
      }
      // document.addEventListener('block-added', event => updateAddress(address))
    }
  }

  add(item) {
    const walletAddress = document.createElement('wallet-address')
    walletAddress.appendChild(document.createElement('wallet-address-balance'))
    this.appendChild(walletAddress)
    walletAddress.name = item[0];
    walletAddress.value = item[1];
  }

  async createNewAddress() {
    const nameInput = document.createElement('wallet-name-input');
    nameInput.addEventListener('name-change', async ({detail}) => {
      const response = await fetch(`http://localhost:5005/core/new-address?name=${detail}`);
      const address = await response.json()
      this.add(address);
      this.classList.remove('name-input-open');
      this.shadowRoot.removeChild(nameInput)
    });
    this.classList.add('name-input-open');
    this.shadowRoot.appendChild(nameInput)


  }

  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        pointer-events: none;
      }
      .wrapper {
        display: flex;
        flex-direction: column;
        position: relative;
        height: 100%;
      }
      .container {
        position: absolute;
        top: 48px;
        display: block;
        height: calc(100% - 48px);
        bottom: 0;
        overflow-y: auto;
        width: 100%;
      }
      :host(.name-input-open) .container {
        height: calc(100% - 104px);
        bottom: 56px;
      }
      .toolbar {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        box-sizing: border-box;
        width: 100%;
        height: 48px;
        top: 0;
        position: absolute;
      }
      h2.name {
        width: 78px;
      }
      wallet-name-input {
        position: absolute;
        bottom: 0;
        background: #FFF;
      }
      custom-fab {
        position: fixed;
      }
      .flex {
        flex: 1;
      }
      .flex-3 {
        flex: 3;
      }
    </style>
    <span class="wrapper">
      <span class="toolbar" tabindex="0">
        <h2 class="name">name</h2>
        <span class="flex"></span>
        <h2 style="width: 100%; max-width:300px;">address</h2>
        <span class="flex-3"></span>
        <h2>balance</h2>
      </span>
      <span class="container">
        <slot></slot>
      </span>
    </span>

    `;
  }
});
