import { d as define, b as RenderMixin, c as CSSMixin } from './chunk-30a2cd27.js';

var explorer = define(class ExplorerSection extends RenderMixin(CSSMixin(HTMLElement)) {
  get pages() {
    return this.shadowRoot.querySelector('custom-pages')
  }
  get navBar() {
    return this.shadowRoot.querySelector('nav-bar')
  }
  get blockExplorer() {
    return this.shadowRoot.querySelector('explorer-block-view')
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});

    this._onBlockAdded = this._onBlockAdded.bind(this);
    this._onShowBlock = this._onShowBlock.bind(this);
    // this.onBlockViewClose = this.onBlockViewClose.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('show-block', this._onShowBlock);
    this.navBar.select('summary');
    (async () => {
      await import("./explorer-dashboard.js");
      await import("./explorer-block-view.js");

    })();
    // document.addEventListener('hashrate', hashrateChange);
    // document.addEventListener('job-cancelled', jobCancelled);
  }

  _onBlockAdded() {

  }

  selectedChanged({detail}) {
    console.log(detail);
    if (detail === 'close') {

      console.log(this.pages._assignedNodes[this.pages._assignedNodes.indexOf(this.pages.currentSelected) + - 1]);
      this.pages.previous();
      this.navBar.setAttribute('items', JSON.stringify(["summary:summary", "transactions:transactions"]));
      this.navBar.select(this.pages.selected.getAttribute('data-route'));
    } else {
      this.pages.select(detail);
    }

  }

  async _onShowBlock({detail}) {
    const next = await leofcoin.api.block((detail.index + 1));
    this.navBar.setAttribute('items', JSON.stringify(['close:close']));
    this.pages.select(this.blockExplorer);
    this.blockExplorer.stamp(detail, next);
  }


  get template() {
    return html`
    <style>
      :host {
        display: flex;
        flex-direction: column !important;
        height: 100% !important;
        width: 100%;
        align-items: normal;
        pointer-events: none;
      }

      custom-pages {
        box-sizing: border-box;
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

      .toolbar {
        display: flex;
        width: 100%;
        box-sizing: border-box;
        padding: 32px;
        background: #2b2e3b;
        color: #eee;
        height: 64px;
        align-items: center;
        --svg-icon-color: #ddd;
      }
      apply(--css-flex)
      apply(--css-row)

    </style>

    <custom-pages attr-for-selected="data-route" selected="summary">
      <explorer-dashboard data-route="summary"></explorer-dashboard>
      <explorer-block-view data-route="block"></explorer-block-view>
    </custom-pages>

    <div class="toolbar">
      <span class="flex"></span>
      <nav-bar
        items='["summary:summary", "transactions:transactions"]'
        attr-for-selected="data-route"
        on-selected="selectedChanged">
      </nav-bar>
      <span class="flex"></span>
    </div>
  </span>
    `;
  }

});

export default explorer;
