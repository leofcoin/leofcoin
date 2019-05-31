import { define, RenderMixin, CSSMixin } from './../../shared-imports.js';
import './explorer-list-view.js';

export default define(class ExplorerDashboard extends RenderMixin(CSSMixin(HTMLElement)) {

  constructor() {
    super()
    this.attachShadow({mode: 'open'});

    this._onBlockAdded = this._onBlockAdded.bind(this);
    bus.on('block-added', rpc.handle(this._onBlockAdded));
  }

  connectedCallback() {
    super.connectedCallback();
  }

  _onBlockAdded(event) {
    console.log(event);
    this.render({ lastBlock: event })
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
