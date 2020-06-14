import './chunk-b455c5f0.js';
import { d as define, b as RenderMixin, c as CSSMixin, g as SelectorMixin } from './chunk-30a2cd27.js';

define(class ExplorerListView extends RenderMixin(SelectorMixin(HTMLElement)) {

  get last() {
    return this.getAttribute('last');
  }

  set last(value) {
    this.setAttribute('last', value);
  }

  get type() {
    return this.getAttribute('type')
  }

  set type(value) {
    this.setAttribute('type', value);
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    this._onBlockAdded = this._onBlockAdded.bind(this);
    bus.on('block.added', this._onBlockAdded);
  }

  connectedCallback() {
    super.connectedCallback();
    this.attrForSelected = 'height';
    if (!this.type) this.type = 'block';
    (async () => {
      await import(`./explorer-${this.type}.js`);

      if (this.type === 'block') this.items = await leofcoin.api.blocks(Number(this.last), true);
      if (this.type === 'transaction') this.items = await leofcoin.api.transactions(Number(this.last), true);
      console.log(this.items);
      
      for (var i = 0; i < this.items.length; i++) {
        const el = document.createElement(`explorer-${this.type}`);
        this.appendChild(el);
        el.data = this.items[i];
      }
    })();
    // document.addEventListener('hashrate', hashrateChange);
    // document.addEventListener('job-cancelled', jobCancelled);
  }

  async _onBlockAdded() {
    this.innerHTML = '';
    if (this.type === 'block') this.items = await leofcoin.api.blocks(Number(this.last), true);
    if (this.type === 'transaction') this.items = await leofcoin.api.transactions(Number(this.last), true);
    console.log(this.items);

    for (var i = 0; i < this.items.length; i++) {
      const el = document.createElement(`explorer-${this.type}`);
      this.appendChild(el);
      el.data = this.items[i];
    }
  }

  _updateSelected() {
    const selected = this.querySelector(`[height='${this.selected}']`);
    super._updateSelected(selected);
    console.log(selected.data);
    document.dispatchEvent(new CustomEvent(`show-${this.type}`, { detail: selected.data }));
  }


  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        align-items: normal;
        pointer-events: auto;
        overflow-y: auto;
        padding: 10px 10px 0 10px;
      }

      apply(--css-row)

    </style>

    <span class="row">
    </span>

    <slot></slot>
    `;
  }

});

var explorerDashboard = define(class ExplorerDashboard extends RenderMixin(CSSMixin(HTMLElement)) {

  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    this._onBlockAdded = this._onBlockAdded.bind(this);
    bus.on('block-added', this._onBlockAdded);
  }

  connectedCallback() {
    super.connectedCallback();
  }

  _onBlockAdded(event) {
    console.log(event);
    this.render({ lastBlock: event });
  }


  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        align-items: normal;
        pointer-events: none;
        overflow-y: auto;
        justify-content: space-between;
        align-items: center;
        padding: 24px 48px 48px;
        box-sizing: border-box;
      }

      .container {
        display: flex;
        width: calc(100% - 32px);
        justify-content: space-between;
      }

      explorer-list-view {
        background: #ffffff08;
        color: #ddd;
        border-radius: 10px;
        width: 48%;
        height: 576px;
        box-sizing: border-box;
      }

      ::-webkit-scrollbar-thumb:window-inactive {
        display: none;
         /* Select the thumb when the browser window isn't in focus */
      }
      ::-webkit-scrollbar {
          width: 12px;
      }

      ::-webkit-scrollbar-track {
          -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
          border-radius: 10px;
      }

      ::-webkit-scrollbar-thumb {
          border-radius: 10px;
          -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.5);
      }
      apply(--css-row)

      .last-block, .transaction-rate {
        display: flex;
        height: 64px;
        width: 48%;
        background: #ffffff08;
        color: #ddd;
        border-radius: 10px;
      }

      header {
        width: calc(100% - 32px);
        justify-content: space-between;
        min-height: 74px;
      }

      custom-svg-icon {
        --svg-icon-size: 64px;
      }

      input, .search {
        height: 42px;
        background: transparent;
        width: 320px;
        border: none;
        outline: none;
      }
      .search {
        display: flex;
        padding: 4px;
        border-radius: 10px;
        border: 1px solid #EEF;
      }
    </style>
    <header class="row">
      <span class="search">
        <custom-svg-icon icon="search"></custom-svg-icon>
        <input></input>
      </span>

      <span class="last-block">
        <custom-svg-icon icon="public"></custom-svg-icon>
        <span>${'lastBlock'}</span>
      </span>

      <span class="transaction-rate">
        <custom-svg-icon icon="stats"></custom-svg-icon>
      </span>
    </header>
    <span class="container">
      <!-- checks for latest blocks & adds them with explorer-block -->
      <explorer-list-view data-route="list" type="block" last="10"></explorer-list-view>
      <!-- checks for latest blocks & adds them with explorer-transaction -->
      <explorer-list-view data-route="list" type="transaction" last="20"></explorer-list-view>
    </span>
    `;
  }

});

export default explorerDashboard;
