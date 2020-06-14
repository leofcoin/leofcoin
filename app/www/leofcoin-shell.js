import { a as SelectMixin, b as RenderMixin, c as CSSMixin, d as define } from './chunk-30a2cd27.js';
import './chunk-b1de7dde.js';

/**
 * @extends HTMLElement
 */
class CustomPages extends SelectMixin(HTMLElement) {
  constructor() {
    super();
    this.slotchange = this.slotchange.bind(this);
    this.attachShadow({mode: 'open'});
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          flex: 1;
          position: relative;
          --primary-background-color: #ECEFF1;
          overflow: hidden;
        }
        ::slotted(*) {
          display: flex;
          position: absolute;
          opacity: 0;
          pointer-events: none;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          transition: transform ease-out 160ms, opacity ease-out 60ms;
          /*transform: scale(0.5);*/
          transform-origin: left;
        }
        ::slotted(.animate-up) {
          transform: translateY(-120%);
        }
        ::slotted(.animate-down) {
          transform: translateY(120%);
        }
        ::slotted(.custom-selected) {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
          transition: transform ease-in 160ms, opacity ease-in 320ms;
          max-height: 100%;
          max-width: 100%;
        }
      </style>
      <!-- TODO: scale animation, ace doesn't resize that well ... -->
      <div class="wrapper">
        <slot></slot>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.shadowRoot.querySelector('slot').addEventListener('slotchange', this.slotchange);
  }

  isEvenNumber(number) {
    return Boolean(number % 2 === 0)
  }

  /**
   * set animation class when slot changes
   */
  slotchange() {
    let call = 0;
    for (const child of this.slotted.assignedNodes()) {
      if (child && child.nodeType === 1) {
        child.style.zIndex = 99 - call;
        if (this.isEvenNumber(call++)) {
          child.classList.add('animate-down');
        } else {
          child.classList.add('animate-up');
        }
        this.dispatchEvent(new CustomEvent('child-change', {detail: child}));
      }
    }
  }
}customElements.define('custom-pages', CustomPages);

var customSvgIcon = (function () {

var customSvgIcon = ((base = HTMLElement) => {
  customElements.define('custom-svg-icon', class CustomSvgIcon extends base {
    static get observedAttributes() {
      return ['icon'];
    }
    get iconset() {
      return window.svgIconset;
    }
    set iconset(value) {
      window.iconset = value;
    }
    set icon(value) {
      if (this.icon !== value) {
        this._icon = value;
        this.__iconChanged__({ value: value });
      }
    }
    get icon() {
      return this._icon;
    }
    get template() {
      return `
        <style>
          :host {
            width: var(--svg-icon-size, 24px);
            height: var(--svg-icon-size, 24px);
            display: inline-flex;
            display: -ms-inline-flexbox;
            display: -webkit-inline-flex;
            display: inline-flex;
            -ms-flex-align: center;
            -webkit-align-items: center;
            align-items: center;
            -ms-flex-pack: center;
            -webkit-justify-content: center;
            justify-content: center;
            position: relative;
            vertical-align: middle;
            fill: var(--svg-icon-color, #111);
            stroke: var(--svg-icon-stroke, none);
          }
        </style>
      `;
    }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._onIconsetReady = this._onIconsetReady.bind(this);
    }
    render() {
      this.shadowRoot.innerHTML = this.template;
    }
    connectedCallback() {
      this.icon = this.getAttribute('icon') || null;
      if (!super.render) this.render();
    }
    _onIconsetReady() {
      window.removeEventListener('svg-iconset-added', this._onIconsetReady);
      this.__iconChanged__({ value: this.icon });
    }
    __iconChanged__(change) {
      if (!this.iconset) {
        window.addEventListener('svg-iconset-added', this._onIconsetReady);
        return;
      }
      if (change.value && this.iconset) {
        let parts = change.value.split('::');
        if (parts.length === 1) {
          this.iconset['icons'].host.applyIcon(this, change.value);
        } else if (this.iconset[parts[0]]) {
          this.iconset[parts[0]].host.applyIcon(this, parts[1]);
        }
      } else if (!change.value && this.iconset && this._icon) {
        let parts = this._icon.split('::');
        if (parts.length === 1) {
          this.iconset['icons'].host.removeIcon(this);
        } else {
          this.iconset[parts[0]].host.removeIcon(this);
        }
      }
      this.iconset = this.iconset;
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) this[name] = newValue;
    }
  });
})();

return customSvgIcon;

}());

window.loaded = {};
window.store = {
  contacts: []
};

window.showNotification = async (title, body = null) => {
    new Notification(title, {icon: '/assets/leofcoin_96.png', badge: '/assets/leofcoin_96.png', body});
};



window.sliceHash = (hash) => {
  console.log(hash);
  const length = hash.length;
  return hash.slice((length - 7), length);
};

var leofcoinShell = define(class leofcoinShell extends CSSMixin(RenderMixin(HTMLElement)) {
  get pages() {
    return this.shadowRoot.querySelector('custom-pages')
  }

  get selector() {
    return this.shadowRoot.querySelector('nav-bar')
  }

  constructor () {
    super();
    this.attachShadow({mode: `open`});
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
      const _transactions = [];
      for (const {multihash} of block.transactions) {
        const tx = await leofcoin.transaction.get(multihash);
        _transactions.push(tx);
      }
      for (const {inputs, outputs, reward} of _transactions) {
        const slicedHash = window.sliceHash(block.hash);
        let amountOut = 0;
        let amountIn = 0;

        for (const tx of inputs) {
          if (tx.address === address) {
            amountOut += tx.amount;
          }
        }

        for (const tx of outputs) {
          if (tx.address === address) {
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
    const load = await import(name);
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

export default leofcoinShell;
