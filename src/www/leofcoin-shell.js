import RenderMixin from './../../node_modules/custom-renderer-mixin/src/render-mixin.js';
import CSSMixin from './../../node_modules/backed/src/mixins/css-mixin.js';
import define from './../../node_modules/backed/src/utils/define.js';
import './../../node_modules/custom-pages/src/custom-pages.js';

// import './splash-screen.js';
import './nav-bar.js';
import './../../node_modules/custom-svg-icon/custom-svg-icon.js'

window.loaded = {};
window.store = {
  contacts: []
};

window.showNotification = async (title, body = null) => {
    new Notification(title, {icon: '/assets/leofcoin_96.png', badge: '/assets/leofcoin_96.png', body})
}



window.sliceHash = (hash) => {
  console.log(hash);
  const length = hash.length;
  return hash.slice((length - 7), length);
}

export default define(class leofcoinShell extends CSSMixin(RenderMixin(HTMLElement)) {
  get pages() {
    return this.shadowRoot.querySelector('custom-pages')
  }

  get selector() {
    return this.shadowRoot.querySelector('nav-bar')
  }

  constructor () {
    super()
    this.attachShadow({mode: `open`})
  }

  selectedChanged() {
    this.selectSection(this.selector.selected);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('wallet-loaded-data', ({detail}) => {
      // window.addresses = detail;
    });



    this.selectSection('wallet');
  }

  stampTransactions(transactions) {
    return transactions.map(({amount, address, index}) => `tx: ${tx ? tx : index}\n\taddress: ${address}\n\tamount: ${amount}\n`).join(' ');
  }

  async _onBlockAdded(block) {
    for (const address of window.store.addresses) {
      const _transactions = []
      for (const {multihash} of block.transactions) {
        const tx = await leofcoin.transaction.get(multihash)
        _transactions.push(tx)
      }
      for (const {inputs, outputs, reward} of _transactions) {
        const slicedHash = window.sliceHash(block.hash);
        const transactionsOut = [];
        const transactionsIn = [];
        let amountOut = 0;
        let amountIn = 0;

        for (const tx of inputs) {
          if (tx.address === address) {
            transactionsOut.push(tx);
            amountOut += tx.amount;
          }
        }

        for (const tx of outputs) {
          if (tx.address === address) {
            transactionsIn.push(tx);
            amountIn += tx.amount;
            if (reward) showNotification(`mined block: ${block.index}`, slicedHash);
          }
        }
      }
    }
    // TODO:
  }

  needsLoad(name) {
    return !Boolean(loaded[name])
  }

  async loadSection(name) {
    console.log(name);
    const load = await import(name)
    loaded[name] = 1;
  }

  async selectSection(name) {
    if (this.needsLoad(name)) await this.loadSection(`./${name}.js`);
    this.pages.selected = name;
    this.selector.selected = name;
    // window.accounts()
  }

  get template() {
    return html`<style>
      :host {
        display:  flex;
        flex-direction: row;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #2b2e3b;
      }
      aside {
        background: #2b2e3b;
        align-items: center;
        padding: 8px 16px;
        box-sizing: border-box;
        /* -webkit-app-region: drag; */
        /* cursor: move; */
      }
      aside, aside nav-bar {
        width: 70px;
        display: flex;
        flex-direction: column;
        height: 100%;
        --svg-icon-color: #ddd;
      }
      ul {
        display: flex;
        height: 48px;
        align-items: center;
        margin: 0;
        padding: 0;
      }
      a {
        text-transform: uppercase;
        text-decoration: none;
        color: #eee;
        font-weight: 700;
        font-size: 14px;
        height: 46px;
        min-width: 112px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      a.selected {
        border-bottom: 2px solid #eee;
        font-size: 16px;
      }
      .column {
        width: 100%;

        mixin(--css-column)
      }

      custom-tab .custom-selected {
        background: #5557618a;
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
    </style>

    <aside>
      <span class="flex"></span>
      <nav-bar class="navigation"
        attr-for-selected="data-route"
        on-selected="selectedChanged"
        items='["wallet:account-balance", "miner:miner", "explorer:explorer", "statistics:stats", "settings:settings"]'>
      </nav-bar>
    </aside>

    <span class="column">
      <custom-pages class="main" attr-for-selected="data-route">
        <wallet-section data-route="wallet"></wallet-section>
        <miner-section data-route="miner" class="hero"></miner-section>
        <explorer-section data-route="explorer"></explorer-section>
        <statistics-section data-route="statistics"></statistics-section>
        <settings-section data-route="settings"></settings-section>
      </custom-pages>

      <span class="no-toast main"></span>
    </span>
    `;
  }
});
