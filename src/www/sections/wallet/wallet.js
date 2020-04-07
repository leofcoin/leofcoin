import { define, merge, RenderMixin, CSSMixin } from './../../shared-imports.js';

// TODO: dynamic imports ...
import loadWallet from './wallet-loader';
// import api from '../../api';
import './wallet-accounts';
import './wallet-transactions';
import './wallet-name-input';
import './wallet-send';
import './wallet-receive';
import '../../nav-bar'
import '../../custom-fab';
// import socketRequestClient from '../../../node_modules/socket-request-client/src/index';

export default define(class WalletSection extends RenderMixin(CSSMixin(HTMLElement)) {

  get _accountsEl() {
    return this.shadowRoot.querySelector('wallet-accounts');
  }

  get pages() {
    return this.shadowRoot.querySelector('custom-pages');
  }

  get fab() {
    return this.shadowRoot.querySelector('custom-fab');
  }

  get _extendedFab() {
    return this.shadowRoot.querySelector('extended-fab')
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    this.addresses = [];
  }

  connectedCallback() {
    super.connectedCallback();
    (async () => {
      try {
        // TODO: await addresses() --> accounts()
        console.log('a');
        console.log(await addresses());
        console.log('z');
        this.accounts = await addresses();
        if (this.accounts) {
          this._extendedFab.label = 'create account';
          this._extendedFab.onclick = () => this.createAccount();
          console.log(this.accounts);
          for (const acc of this.accounts) {
            for (const address of acc[1]) {
              this.addresses.push(address);
            }
          }
          window.store.addresses = this.addresses;

          this.setAccounts();
        } else {
          this._extendedFab.label = 'create wallet';
          this._extendedFab.onclick = () => this.createWallet();
        }
      } catch (e) {
        alert(e)
      }
    })();
  }

  setAccounts() {
    window.store.contacts = [...window.store.contacts, ...this.accounts];
    for (var i = 0; i < this.accounts.length; i++) {
      this._accountsEl.add([i, ...this.accounts[i]])
    }
    this._accountsEl.selected = 1;
    this._accountsEl.selected = 0;
    // window.address = this.accounts[0][1];
    this.accountSelected();
    document.dispatchEvent(new CustomEvent('wallet-loaded-data', {detail: this.accounts}))
  }

  accountSelected() {
    window.address = this.accounts[this._accountsEl.selected][1][0];
    window.account = this.accounts[this._accountsEl.selected];
    this.render({address: window.address})
  }

  async createAccount() {
    const nameInput = document.createElement('wallet-name-input');
    nameInput.addEventListener('name-change', async ({detail}) => {
      createAccount();
      // const response = await fetch(`http://localhost:5005/core/new-address?name=${detail}`);
      // const address = await response.json()
      this.add(address);
      this.classList.remove('name-input-open');
      this.shadowRoot.removeChild(nameInput)
    });
    this.classList.add('name-input-open');
    this.shadowRoot.appendChild(nameInput)
  }

  async createWallet() {
    console.log('w');
    const result = await createWallet();
    console.log(result.mnemonic);
    alert(`Wallet generated\nplease note mnemonic down\nnote, losing results in an unrecoverable wallet\n\n${result.mnemonic}`)
    this.accounts = await accounts();
    this.setAccounts();
  }

  selectedChanged({detail}) {
    this.pages.selected = detail;
  }

  get template() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: row;
          overflow-y: auto;
          position: relative;
          width: 100%;
        }

        wallet-accounts {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: calc(100% - 40px);
        }
        .toolbar {
          display: flex;
          width: 100%;
          height: 48px;
          box-sizing: border-box;
          padding-top: 2px;
          background: #2b2e3b;
          color: #eee;
          height: 64px;
          --svg-icon-color: #ddd;
        }
        .hero {
          display: flex;
          max-width: 600px;
          max-height: 400px;
          height: 100%;
          width: 100%;
          box-shadow: var(--shadow-elevation-6dp);
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 18px;
          background: #ffffff08;
          color: #ddd;
          padding: 24px;
          box-sizing: border-box;
        }
        strong {
          margin: 0;
        }

        .hidden {
          opacity: 0;
          pointer-events: 0;
          z-index: 0;
        }
        .column {
          width: 100%;
          height: 100%;
          mixin(--css-column)
        }

        .column.accounts {
          width: 265px;
          border-right: 1px solid rgba(0,0,0,0.48);
          background: #3f435452;
          padding: 8px 8px 12px 8px;
          font-size: 14px;
          box-sizing: border-box;
        }

        extended-fab {
          color: #eee;
          --svg-icon-color: #eee;
          border-radius: 10px;
          font-size: 14px;
          box-shadow: var(--shadow-elevation-3dp);
        }

        .flex {
          flex: 1;
        }

        nav-bar custom-tab.custom-selected {
          border: 2px solid #eee;
          font-size: 16px;
          border-radius: 18px;
          width: 72px;
        }

        nav-bar {
          background: #3f4354;
          border-radius: 24px;
        }

        .header {
          mixin(--css-row)

          justify-content: center;
          align-items: center;
          color: #EEE;
          height: 64px;
        }
      </style>

      <span class="column accounts">
        <wallet-accounts
          attr-for-selected="data-route"
          on-selected="accountSelected">
        </wallet-accounts>

        <extended-fab label="create wallet" icon="add"></extended-fab>
      </span>

      <span class="column">
        <span class="header"><h3>${'address'}</h3></span>
        <custom-pages class="wallet" attr-for-selected="data-route">

          <wallet-send data-route="send" class="hero"></wallet-send>
          <wallet-receive data-route="receive" class="hero"></wallet-receive>

          <wallet-transactions data-route="transactions" class="hero"></wallet-transactions>
        </custom-pages>

        <div class="wallet-navigation toolbar">
          <span class="flex"></span>
          <nav-bar
            items='["summary:summary", "send:send", "receive:receive", "transactions:transactions"]'
            attr-for-selected="data-route"
            on-selected="selectedChanged">
          </nav-bar>
          <span class="flex"></span>
        </div>
      </span>
    `;
  }
});
